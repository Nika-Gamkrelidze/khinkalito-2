import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequestCookies } from "@/lib/auth";

export async function GET(request) {
  const sessionUser = getUserFromRequestCookies(request);
  if (!sessionUser) return NextResponse.json({ authenticated: false }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: sessionUser.id }, select: { id: true, username: true, role: true } });
  if (!user) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, user });
}


