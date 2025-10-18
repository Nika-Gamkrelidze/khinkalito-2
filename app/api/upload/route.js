import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export async function POST(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const buffer = Buffer.from(bytes);

    // Store in DB
    const originalName = (file.name || "upload").replace(/[^a-zA-Z0-9.-]/g, "_");
    const created = await prisma.image.create({
      data: {
        filename: originalName,
        mimeType: file.type,
        size: buffer.length,
        data: buffer,
      },
      select: { id: true },
    });

    // For backward-compatibility also persist file to public dir so existing public URLs continue to work if needed
    // but expose canonical DB URL
    try {
      const uploadDir = path.join(process.cwd(), "public", "images", "products");
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }
      const fallbackName = `${Date.now()}_${originalName}`;
      await writeFile(path.join(uploadDir, fallbackName), buffer);
    } catch {}

    const publicUrl = `/api/images/${created.id}`;
    return NextResponse.json({ success: true, url: publicUrl, id: created.id });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const filename = searchParams.get("filename");

    if (!id && !filename) {
      return NextResponse.json({ error: "Provide id or filename" }, { status: 400 });
    }

    // Prefer DB deletion by id
    if (id) {
      try {
        await prisma.image.delete({ where: { id } });
      } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }

    // Backward-compat: delete a file on disk by filename
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }
    const filePath = path.join(process.cwd(), "public", "images", "products", filename);
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    const { unlink } = await import("fs/promises");
    await unlink(filePath);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
