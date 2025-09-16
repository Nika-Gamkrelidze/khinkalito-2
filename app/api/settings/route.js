import { NextResponse } from "next/server";
import { getSettings, saveSettings, ensureSeedData } from "@/lib/storage";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  ensureSeedData();
  const settings = getSettings();
  return NextResponse.json(settings);
}

export async function PUT(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const current = getSettings();
  const next = { ...current, ...body };
  saveSettings(next);
  return NextResponse.json(next);
}


