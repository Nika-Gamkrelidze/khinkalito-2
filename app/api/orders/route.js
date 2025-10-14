import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isValidGeorgianMobile } from "@/lib/phone";
import { requireAdmin } from "@/lib/auth";
import { sendManagerOrderNotification } from "@/lib/whatsapp";

export async function GET(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const where = status ? { status } : {};
  const orders = await prisma.order.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json(orders);
}

export async function POST(request) {
  const body = await request.json();
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
    const productName = typeof product.name === "object" ? (product.name.en || product.name.ka || "") : product.name;
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
  // In debug, await for clearer error reporting; otherwise fire-and-forget
  if (process.env.WHATSAPP_DEBUG === "true") {
    try {
      const result = await sendManagerOrderNotification(newOrder);
      if (!result?.ok && process.env.WHATSAPP_DEBUG === "true") {
        console.warn("WhatsApp debug result", result);
      }
    } catch (e) {
      console.error("WhatsApp debug send error", e);
    }
  } else {
    sendManagerOrderNotification(newOrder).catch(() => {});
  }
  return NextResponse.json(newOrder, { status: 201 });
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


