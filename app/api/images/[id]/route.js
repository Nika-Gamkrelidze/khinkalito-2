import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req, context) {
  const { params } = await context;
  const id = params?.id;
  if (!id) return new NextResponse("Bad Request", { status: 400 });
  const image = await prisma.image.findUnique({ where: { id }, select: { data: true, mimeType: true, filename: true } });
  if (!image) return new NextResponse("Not Found", { status: 404 });
  return new NextResponse(image.data, {
    status: 200,
    headers: {
      "Content-Type": image.mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(image.filename)}"`,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}


