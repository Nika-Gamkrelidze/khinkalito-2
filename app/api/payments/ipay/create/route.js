import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createIpayOrder } from "@/lib/ipay";
import { randomUUID } from "crypto";

export async function POST(request) {
  try {
    const { orderId } = await request.json();
    if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    const order = await prisma.order.findUnique({ where: { id: String(orderId) } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.status !== "pending") {
      return NextResponse.json({ error: "Order is not payable" }, { status: 400 });
    }

    const currency = process.env.WHATSAPP_CURRENCY || "GEL";
    const description = `Order ${order.id}`;

    // Map to BOG Payments API order shape
    const payload = {
      callback_url: process.env.IPAY_CALLBACK_URL,
      external_order_id: order.id,
      purchase_units: {
        currency: currency,
        total_amount: Number(order.total) / 100, // convert integer minor units to decimal GEL
        basket: order.items.map((it) => ({
          product_id: String(it.productId),
          description: String(it.productName || description || `Order ${order.id}`),
          quantity: Number(it.quantity || 1),
          unit_price: Number(it.unitPrice) / 100,
        })),
      },
      redirect_urls: {
        success: process.env.IPAY_RETURN_URL,
        fail: process.env.IPAY_RETURN_URL,
      },
      buyer: {
        full_name:
          (order.customer && typeof order.customer === "object" && `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim()) ||
          "",
        phone_number: (order.customer && typeof order.customer === "object" && order.customer.phone) || "",
      },
      // Optional merchant fields (include if required by your tenant)
      merchant: {
        id: process.env.IPAY_MERCHANT_ID || undefined,
        terminal_id: process.env.IPAY_TERMINAL_ID || undefined,
        name: process.env.IPAY_MERCHANT_NAME || undefined,
        inn: process.env.IPAY_CLIENT_INN || undefined,
      },
    };

    const gateway = await createIpayOrder(payload, {
      idempotencyKey: randomUUID(),
      acceptLanguage: "en",
    });

    // Persist payment metadata for auditing and later reconciliation
    await prisma.order.update({
      where: { id: order.id },
      data: {
        payment: {
          // storing minimal necessary info; extend as needed
          gateway: "ipay",
          createdAt: new Date().toISOString(),
          request: payload,
          response: gateway,
        },
      },
    });

    const redirectUrl = gateway?.redirect_url || gateway?._links?.redirect?.href || gateway?.paymentUrl || gateway?.redirectUrl || gateway?.url;
    if (!redirectUrl) {
      return NextResponse.json({ error: "Payment URL not provided by gateway" }, { status: 502 });
    }

    return NextResponse.json({ redirectUrl });
  } catch (e) {
    return NextResponse.json({ error: "Create payment failed", details: String(e?.message || e) }, { status: 500 });
  }
}


