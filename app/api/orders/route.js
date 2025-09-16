import { NextResponse } from "next/server";
import { getOrders, saveOrders, getProducts, ensureSeedData } from "@/lib/storage";
import { isValidGeorgianMobile } from "@/lib/phone";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const orders = getOrders();
  const filtered = status ? orders.filter((o) => o.status === status) : orders;
  return NextResponse.json(filtered);
}

export async function POST(request) {
  ensureSeedData();
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

  const products = getProducts();
  const detailedItems = items.map((it) => {
    const product = products.find((p) => p.id === it.productId);
    if (!product) throw new Error("Product not found");
    const size = product.sizes.find((s) => s.sizeKg === it.sizeKg);
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
      lineTotal: price
    };
  });

  const total = detailedItems.reduce((sum, i) => sum + i.lineTotal, 0);

  const orders = getOrders();
  const newOrder = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: "pending",
    customer: {
      firstName: String(firstName),
      lastName: String(lastName),
      phone,
    },
    address: {
      text: addressText || "",
      location: location || null
    },
    items: detailedItems,
    total
  };
  orders.push(newOrder);
  saveOrders(orders);
  return NextResponse.json(newOrder, { status: 201 });
}

export async function PUT(request) {
  const body = await request.json();
  const { id, status } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (status) orders[idx].status = status;
  saveOrders(orders);
  return NextResponse.json(orders[idx]);
}


