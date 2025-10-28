import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isValidGeorgianMobile } from "@/lib/phone";
import { requireAdmin } from "@/lib/auth";
import { createIpayOrder } from "@/lib/ipay";
import { randomUUID } from "crypto";

export async function GET(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const where = status ? { status } : {};
  const orders = await prisma.order.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json(orders);
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body. Set 'Content-Type: application/json' and send valid JSON." }, { status: 400 });
  }
  const { firstName, lastName, phone, addressText, location, items } = body;

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }
  if (!isValidGeorgianMobile(phone || "")) {
    return NextResponse.json({ error: "Invalid Georgian mobile" }, { status: 400 });
  }
  if ((!addressText || addressText.trim() === "") && !(location && location.lat && location.lng)) {
    return NextResponse.json({ error: "Provide address text or map location" }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "No items" }, { status: 400 });
  }

  const productIds = Array.from(new Set(items.map((it) => it.productId)));
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { sizes: true },
  });
  const detailedItems = items.map((it) => {
    const product = products.find((p) => p.id === it.productId);
    if (!product) throw new Error("Product not found");
    const size = product.sizes.find((s) => s.sizeKg === Number(it.sizeKg));
    if (!size) throw new Error("Size not found");
    const quantity = Math.max(1, Number(it.quantity || 1));
    const price = size.price * quantity;
    // Prefer Georgian product name when available, fallback to English
    const productName = typeof product.name === "object" ? (product.name.ka || product.name.en || "") : product.name;
    return {
      productId: product.id,
      productName,
      sizeKg: size.sizeKg,
      unitPrice: size.price,
      quantity,
      lineTotal: price,
    };
  });

  const total = detailedItems.reduce((sum, i) => sum + i.lineTotal, 0);

  const newOrder = await prisma.order.create({
    data: {
      status: "pending",
      customer: {
        firstName: String(firstName),
        lastName: String(lastName),
        phone,
      },
      address: {
        text: addressText || "",
        location: location || null,
      },
      items: detailedItems,
      total,
    },
  });

  // Initiate payment with Bank of Georgia immediately after order creation
  try {
    const currency = process.env.WHATSAPP_CURRENCY || "GEL";
    const payload = {
      callback_url: process.env.IPAY_CALLBACK_URL,
      external_order_id: newOrder.id,
      purchase_units: {
        currency: currency,
        // Our prices are already in GEL integer/decimal units; do not divide
        total_amount: Number(newOrder.total),
        basket: detailedItems.map((it) => ({
          product_id: String(it.productId),
          description: String(it.productName || `Order ${newOrder.id}`),
          quantity: Number(it.quantity || 1),
          unit_price: Number(it.unitPrice),
        })),
      },
      redirect_urls: {
        success: process.env.IPAY_RETURN_URL,
        fail: process.env.IPAY_RETURN_URL,
      },
      buyer: {
        full_name: `${firstName} ${lastName}`.trim(),
        phone_number: phone,
      },
      merchant: {
        id: process.env.IPAY_MERCHANT_ID || undefined,
        terminal_id: process.env.IPAY_TERMINAL_ID || undefined,
        name: process.env.IPAY_MERCHANT_NAME || undefined,
        inn: process.env.IPAY_CLIENT_INN || undefined,
      },
    };

    console.log("📤 Sending payment request to BOG:", {
      callback_url: payload.callback_url,
      external_order_id: payload.external_order_id,
      total_amount: payload.purchase_units.total_amount,
    });

    const gateway = await createIpayOrder(payload, {
      idempotencyKey: randomUUID(),
      acceptLanguage: "en",
    });

    console.log("📥 BOG Response:", JSON.stringify(gateway, null, 2));

    const redirectUrl = gateway?.redirect_url || gateway?._links?.redirect?.href || gateway?.paymentUrl || gateway?.redirectUrl || gateway?.url;

    if (!redirectUrl) {
      return NextResponse.json({ order: newOrder, error: "Payment URL not provided by gateway" }, { status: 502 });
    }

    // Create Payment record
    await prisma.payment.create({
      data: {
        orderId: newOrder.id,
        gateway: "ipay",
        gatewayOrderId: gateway?.id || null,
        amount: newOrder.total,
        currency: currency,
        status: "pending",
        gatewayRequest: payload,
        gatewayResponse: gateway,
      },
    });

    return NextResponse.json({ order: newOrder, redirectUrl }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ order: newOrder, error: "Payment initiation failed", details: String(e?.message || e) }, { status: 500 });
  }
}

export async function PUT(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { id, status } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    const updated = await prisma.order.update({ where: { id }, data: { status } });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}


