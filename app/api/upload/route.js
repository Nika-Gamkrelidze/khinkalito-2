import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

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
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${timestamp}_${originalName}`;
    
    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "public", "images", "products");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Write file
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Return the public URL
    const publicUrl = `/images/products/${filename}`;
    
    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      filename: filename
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");
    
    if (!filename) {
      return NextResponse.json({ error: "No filename provided" }, { status: 400 });
    }

    // Security check - ensure filename doesn't contain path traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "public", "images", "products", filename);
    
    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Delete file
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
