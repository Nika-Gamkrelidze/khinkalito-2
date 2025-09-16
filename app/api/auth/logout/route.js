import { NextResponse } from "next/server";
import { buildClearSessionCookieHeader } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", buildClearSessionCookieHeader());
  return res;
}


