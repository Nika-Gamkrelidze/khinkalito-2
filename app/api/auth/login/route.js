import { NextResponse } from "next/server";
import { getUsers } from "@/lib/storage";
import { verifyPassword, createSessionValue, buildSessionCookieHeader } from "@/lib/auth";

export async function POST(request) {
  const { username, password } = await request.json();
  if (!username || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }
  const users = getUsers();
  const user = users.find((u) => u.username.toLowerCase() === String(username).toLowerCase());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }
  const session = createSessionValue(user.id);
  const res = NextResponse.json({ id: user.id, username: user.username, role: user.role });
  res.headers.set("Set-Cookie", buildSessionCookieHeader(session));
  return res;
}


