import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const products = await prisma.product.findMany({ include: { sizes: true } });
  const shaped = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    image: p.image,
    sizes: p.sizes.map((s) => ({ sizeKg: s.sizeKg, price: s.price })),
    active: p.active,
  }));
  return NextResponse.json(shaped);
}

export async function POST(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();

  const providedName = body.name;
  const nameEn = body.nameEn;
  const nameKa = body.nameKa;
  let normalizedName;
  if (providedName && typeof providedName === "object") {
    normalizedName = {
      en: providedName.en?.toString?.() || "",
      ka: providedName.ka?.toString?.() || "",
    };
  } else if (nameEn !== undefined || nameKa !== undefined) {
    normalizedName = {
      en: (nameEn ?? providedName ?? "Untitled").toString(),
      ka: (nameKa ?? "").toString(),
    };
  } else {
    normalizedName = body.name?.toString() || "Untitled";
  }

  const providedDescription = body.description;
  const descriptionEn = body.descriptionEn;
  const descriptionKa = body.descriptionKa;
  let normalizedDescription;
  if (providedDescription && typeof providedDescription === "object") {
    normalizedDescription = {
      en: providedDescription.en?.toString?.() || "",
      ka: providedDescription.ka?.toString?.() || "",
    };
  } else if (descriptionEn !== undefined || descriptionKa !== undefined) {
    normalizedDescription = {
      en: (descriptionEn ?? providedDescription ?? "").toString(),
      ka: (descriptionKa ?? "").toString(),
    };
  } else {
    normalizedDescription = body.description?.toString() || "";
  }

  const sizes = Array.isArray(body.sizes) ? body.sizes : [];

  const created = await prisma.product.create({
    data: {
      name: normalizedName,
      description: normalizedDescription,
      image: body.image || null,
      active: body.active !== false,
      sizes: {
        create: sizes.map((s) => ({ sizeKg: Number(s.sizeKg), price: Number(s.price) })),
      },
    },
    include: { sizes: true },
  });

  const shaped = {
    id: created.id,
    name: created.name,
    description: created.description,
    image: created.image,
    sizes: created.sizes.map((s) => ({ sizeKg: s.sizeKg, price: s.price })),
    active: created.active,
  };
  return NextResponse.json(shaped, { status: 201 });
}

export async function PUT(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { id, nameEn, nameKa, descriptionEn, descriptionKa, ...rest } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const current = await prisma.product.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const nextData = { ...rest };

  const hasNameUpdate = nameEn !== undefined || nameKa !== undefined || (typeof rest.name === "object");
  if (hasNameUpdate) {
    let baseName;
    if (typeof current.name === "object") {
      baseName = { en: current.name?.en || "", ka: current.name?.ka || "" };
    } else {
      baseName = { en: (current.name || "").toString(), ka: "" };
    }
    if (typeof rest.name === "object") {
      baseName = {
        en: rest.name.en?.toString?.() || baseName.en,
        ka: rest.name.ka?.toString?.() || baseName.ka,
      };
      delete nextData.name;
    }
    nextData.name = {
      en: nameEn !== undefined ? nameEn.toString() : baseName.en,
      ka: nameKa !== undefined ? nameKa.toString() : baseName.ka,
    };
  }

  const hasDescriptionUpdate = descriptionEn !== undefined || descriptionKa !== undefined || (typeof rest.description === "object");
  if (hasDescriptionUpdate) {
    let baseDescription;
    if (typeof current.description === "object") {
      baseDescription = { en: current.description?.en || "", ka: current.description?.ka || "" };
    } else {
      baseDescription = { en: (current.description || "").toString(), ka: "" };
    }
    if (typeof rest.description === "object") {
      baseDescription = {
        en: rest.description.en?.toString?.() || baseDescription.en,
        ka: rest.description.ka?.toString?.() || baseDescription.ka,
      };
      delete nextData.description;
    }
    nextData.description = {
      en: descriptionEn !== undefined ? descriptionEn.toString() : baseDescription.en,
      ka: descriptionKa !== undefined ? descriptionKa.toString() : baseDescription.ka,
    };
  }

  delete nextData.nameEn;
  delete nextData.nameKa;
  delete nextData.descriptionEn;
  delete nextData.descriptionKa;

  const updated = await prisma.product.update({ where: { id }, data: nextData, include: { sizes: true } });
  const shaped = {
    id: updated.id,
    name: updated.name,
    description: updated.description,
    image: updated.image,
    sizes: updated.sizes.map((s) => ({ sizeKg: s.sizeKg, price: s.price })),
    active: updated.active,
  };
  return NextResponse.json(shaped);
}

export async function DELETE(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}


