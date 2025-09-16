import { NextResponse } from "next/server";
import { getUsers, saveUsers } from "@/lib/storage";
import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";

export async function GET(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const users = getUsers().map(({ id, username, role, createdAt }) => ({ id, username, role, createdAt }));
  return NextResponse.json(users);
}

export async function POST(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { username, password, role } = await request.json();
  if (!username || !password) return NextResponse.json({ error: "Missing username or password" }, { status: 400 });
  const users = getUsers();
  if (users.some((u) => u.username.toLowerCase() === String(username).toLowerCase())) {
    return NextResponse.json({ error: "Username already exists" }, { status: 409 });
  }
  const newUser = {
    id: crypto.randomUUID(),
    username: String(username),
    passwordHash: hashPassword(String(password)),
    role: role === "admin" ? "admin" : "admin",
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  saveUsers(users);
  return NextResponse.json({ id: newUser.id, username: newUser.username, role: newUser.role, createdAt: newUser.createdAt }, { status: 201 });
}

export async function PUT(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, username, password, role } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (username) {
    if (users.some((u) => u.username.toLowerCase() === String(username).toLowerCase() && u.id !== id)) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 });
    }
    users[idx].username = String(username);
  }
  if (password) {
    users[idx].passwordHash = hashPassword(String(password));
  }
  if (role) {
    users[idx].role = role === "admin" ? "admin" : users[idx].role;
  }
  saveUsers(users);
  const { passwordHash, ...safe } = users[idx];
  return NextResponse.json(safe);
}

export async function DELETE(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const users = getUsers();
  const next = users.filter((u) => u.id !== id);
  if (next.length === users.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  saveUsers(next);
  return NextResponse.json({ ok: true });
}


