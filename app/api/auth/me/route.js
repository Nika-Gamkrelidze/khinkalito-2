import { NextResponse } from "next/server";
import { getUsers } from "@/lib/storage";
import { getUserFromRequestCookies } from "@/lib/auth";

export async function GET(request) {
  const sessionUser = getUserFromRequestCookies(request);
  if (!sessionUser) return NextResponse.json({ authenticated: false }, { status: 401 });
  const users = getUsers();
  const user = users.find((u) => u.id === sessionUser.id);
  if (!user) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, user: { id: user.id, username: user.username, role: user.role } });
}


