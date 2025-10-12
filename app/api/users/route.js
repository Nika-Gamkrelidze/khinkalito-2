import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";

export async function GET(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const users = await prisma.user.findMany({ select: { id: true, username: true, role: true, createdAt: true } });
  return NextResponse.json(users);
}

export async function POST(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { username, password, role } = await request.json();
  if (!username || !password) return NextResponse.json({ error: "Missing username or password" }, { status: 400 });
  const exists = await prisma.user.findUnique({ where: { username: String(username) } });
  if (exists) return NextResponse.json({ error: "Username already exists" }, { status: 409 });
  const created = await prisma.user.create({
    data: {
      username: String(username),
      passwordHash: hashPassword(String(password)),
      role: role === "admin" ? "admin" : "admin",
    },
    select: { id: true, username: true, role: true, createdAt: true },
  });
  return NextResponse.json(created, { status: 201 });
}

export async function PUT(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, username, password, role } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  if (username) {
    const conflict = await prisma.user.findFirst({ where: { username: String(username), NOT: { id } } });
    if (conflict) return NextResponse.json({ error: "Username already exists" }, { status: 409 });
  }

  const data = {};
  if (username) data.username = String(username);
  if (password) data.passwordHash = hashPassword(String(password));
  if (role) data.role = role === "admin" ? "admin" : undefined;

  try {
    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, role: true, createdAt: true },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}


