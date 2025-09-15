import { NextResponse } from "next/server";
import { getProducts, saveProducts, ensureSeedData } from "@/lib/storage";

export async function GET() {
  ensureSeedData();
  const products = getProducts();
  return NextResponse.json(products);
}

export async function POST(request) {
  const body = await request.json();
  const products = getProducts();
  const newProduct = {
    id: crypto.randomUUID(),
    name: body.name?.toString() || "Untitled",
    description: body.description?.toString() || "",
    image: body.image || null,
    sizes: Array.isArray(body.sizes) ? body.sizes : [],
    active: body.active !== false
  };
  products.push(newProduct);
  saveProducts(products);
  return NextResponse.json(newProduct, { status: 201 });
}

export async function PUT(request) {
  const body = await request.json();
  const { id, ...rest } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const products = getProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  products[idx] = { ...products[idx], ...rest };
  saveProducts(products);
  return NextResponse.json(products[idx]);
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const products = getProducts();
  const next = products.filter((p) => p.id !== id);
  saveProducts(next);
  return NextResponse.json({ ok: true });
}


