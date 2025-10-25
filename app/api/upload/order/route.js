import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import sharp from "sharp";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const originalBuffer = Buffer.from(bytes);
    let buffer = originalBuffer;
    let outMime = file.type;
    try {
      const image = sharp(originalBuffer, { failOn: "none" });
      const metadata = await image.metadata();
      const width = metadata.width || 0;
      const targetWidth = Math.min(1920, Math.max(0, width));
      const converted = image
        .resize(targetWidth, null, { withoutEnlargement: true })
        .webp({ quality: 82, effort: 5 });
      buffer = await converted.toBuffer();
      outMime = "image/webp";
    } catch (_e) {
      buffer = originalBuffer;
      outMime = file.type;
    }

    const originalName = (file.name || "upload").replace(/[^a-zA-Z0-9.-]/g, "_");
    const created = await prisma.image.create({
      data: {
        filename: originalName,
        mimeType: outMime,
        size: buffer.length,
        data: buffer,
      },
      select: { id: true },
    });
    return NextResponse.json({ success: true, url: `/api/images/${created.id}`, id: created.id });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}


