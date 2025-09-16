import { NextResponse } from "next/server";
import { getSettings, saveSettings, ensureSeedData } from "@/lib/storage";

export async function GET() {
  ensureSeedData();
  const settings = getSettings();
  return NextResponse.json(settings);
}

export async function PUT(request) {
  const body = await request.json();
  const current = getSettings();
  const next = { ...current, ...body };
  saveSettings(next);
  return NextResponse.json(next);
}


