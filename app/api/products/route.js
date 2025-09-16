import { NextResponse } from "next/server";
import { getProducts, saveProducts, ensureSeedData } from "@/lib/storage";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  ensureSeedData();
  const products = getProducts();
  return NextResponse.json(products);
}

export async function POST(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const products = getProducts();
  // Support bilingual names: body may include name (string/object) or nameEn/nameKa
  const providedName = body.name;
  const nameEn = body.nameEn;
  const nameKa = body.nameKa;
  let normalizedName;
  if (providedName && typeof providedName === "object") {
    normalizedName = {
      en: providedName.en?.toString?.() || "",
      ka: providedName.ka?.toString?.() || ""
    };
  } else if (nameEn !== undefined || nameKa !== undefined) {
    normalizedName = {
      en: (nameEn ?? providedName ?? "Untitled").toString(),
      ka: (nameKa ?? "").toString()
    };
  } else {
    // Backward-compatible: keep as simple string
    normalizedName = body.name?.toString() || "Untitled";
  }

  // Support bilingual descriptions: description (string/object) or descriptionEn/descriptionKa
  const providedDescription = body.description;
  const descriptionEn = body.descriptionEn;
  const descriptionKa = body.descriptionKa;
  let normalizedDescription;
  if (providedDescription && typeof providedDescription === "object") {
    normalizedDescription = {
      en: providedDescription.en?.toString?.() || "",
      ka: providedDescription.ka?.toString?.() || ""
    };
  } else if (descriptionEn !== undefined || descriptionKa !== undefined) {
    normalizedDescription = {
      en: (descriptionEn ?? providedDescription ?? "").toString(),
      ka: (descriptionKa ?? "").toString()
    };
  } else {
    normalizedDescription = body.description?.toString() || "";
  }

  const newProduct = {
    id: crypto.randomUUID(),
    name: normalizedName,
    description: normalizedDescription,
    image: body.image || null,
    sizes: Array.isArray(body.sizes) ? body.sizes : [],
    active: body.active !== false
  };
  products.push(newProduct);
  saveProducts(products);
  return NextResponse.json(newProduct, { status: 201 });
}

export async function PUT(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { id, nameEn, nameKa, descriptionEn, descriptionKa, ...rest } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const products = getProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const current = products[idx];
  const next = { ...current, ...rest };

  // Normalize bilingual name updates
  const hasNameUpdate = nameEn !== undefined || nameKa !== undefined || (typeof rest.name === "object");
  if (hasNameUpdate) {
    let baseName;
    if (typeof current.name === "object") {
      baseName = { en: current.name.en || "", ka: current.name.ka || "" };
    } else {
      baseName = { en: (current.name || "").toString(), ka: "" };
    }
    if (typeof rest.name === "object") {
      baseName = {
        en: rest.name.en?.toString?.() || baseName.en,
        ka: rest.name.ka?.toString?.() || baseName.ka
      };
      delete next.name; // will set below
    }
    const updatedName = {
      en: nameEn !== undefined ? nameEn.toString() : baseName.en,
      ka: nameKa !== undefined ? nameKa.toString() : baseName.ka
    };
    next.name = updatedName;
  }

  // Normalize bilingual description updates
  const hasDescriptionUpdate = descriptionEn !== undefined || descriptionKa !== undefined || (typeof rest.description === "object");
  if (hasDescriptionUpdate) {
    let baseDescription;
    if (typeof current.description === "object") {
      baseDescription = { en: current.description.en || "", ka: current.description.ka || "" };
    } else {
      baseDescription = { en: (current.description || "").toString(), ka: "" };
    }
    if (typeof rest.description === "object") {
      baseDescription = {
        en: rest.description.en?.toString?.() || baseDescription.en,
        ka: rest.description.ka?.toString?.() || baseDescription.ka
      };
      delete next.description; // will set below
    }
    const updatedDescription = {
      en: descriptionEn !== undefined ? descriptionEn.toString() : baseDescription.en,
      ka: descriptionKa !== undefined ? descriptionKa.toString() : baseDescription.ka
    };
    next.description = updatedDescription;
  }

  // Ensure no stray fields remain
  delete next.nameEn;
  delete next.nameKa;
  delete next.descriptionEn;
  delete next.descriptionKa;

  products[idx] = next;
  saveProducts(products);
  return NextResponse.json(products[idx]);
}

export async function DELETE(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const products = getProducts();
  const next = products.filter((p) => p.id !== id);
  saveProducts(next);
  return NextResponse.json({ ok: true });
}


