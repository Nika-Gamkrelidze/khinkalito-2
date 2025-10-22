import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendManagerOrderNotification } from "@/lib/whatsapp";

// NOTE: Adjust verification according to iPay docs (JWT/HMAC). This is a placeholder.
async function verifyIpaySignature(request, rawBody) {
  // Implement real verification: e.g., read Authorization: Bearer <jwt> and verify with BOG public key
  // or validate X-Signature header using a shared secret if applicable.
  // For now, allow in non-production to enable local testing.
  if (process.env.NODE_ENV !== "production") return true;
  return false;
}

export async function POST(request) {
  const contentType = (request.headers.get("content-type") || "").toLowerCase();
  const raw = await request.text();

  const ok = await verifyIpaySignature(request, raw);
  if (!ok) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  let payload;
  try {
    if (contentType.includes("application/json")) {
      payload = JSON.parse(raw);
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const params = new URLSearchParams(raw);
      payload = Object.fromEntries(params.entries());
    } else {
      // Attempt JSON first, fallback to urlencoded
      try {
        payload = JSON.parse(raw);
      } catch {
        const params = new URLSearchParams(raw);
        payload = Object.fromEntries(params.entries());
      }
    }
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Expected fields depend on iPay; commonly: merchant orderId, ipay order id, status, amount
  const merchantOrderId = payload?.orderId || payload?.merchantOrderId || payload?.merchantOrderReference;
  const status = payload?.status || payload?.paymentStatus;

  if (!merchantOrderId || !status) {
    return NextResponse.json({ error: "Missing order identifiers" }, { status: 400 });
  }

  // Map gateway status to local status
  const normalizedStatus = (function mapStatus(s) {
    const v = String(s).toLowerCase();
    if (v.includes("success") || v === "paid" || v === "approved") return "paid";
    if (v.includes("fail") || v === "declined" || v === "canceled") return "failed";
    return "pending";
  })(status);

  try {
    const order = await prisma.order.findUnique({ where: { id: String(merchantOrderId) } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Idempotent update
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: normalizedStatus,
        payment: {
          ...(order.payment || {}),
          lastCallbackAt: new Date().toISOString(),
          lastCallbackPayload: payload,
        },
      },
    });

    // Send WhatsApp only once when payment is marked paid
    if (normalizedStatus === "paid") {
      try {
        await sendManagerOrderNotification(updated);
        await prisma.order.update({
          where: { id: updated.id },
          data: { payment: { ...(updated.payment || {}), whatsappSent: true } },
        });
      } catch {
        // ignore
      }
    }

    return NextResponse.json({ ok: true, orderId: updated.id });
  } catch (e) {
    return NextResponse.json({ error: "Update failed", details: String(e?.message || e) }, { status: 500 });
  }
}


