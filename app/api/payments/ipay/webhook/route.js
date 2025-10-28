import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendManagerOrderNotification } from "@/lib/whatsapp";
// jose is dynamically imported only when verification is enabled to avoid build-time dependency issues

export const runtime = "nodejs";

// GET endpoint to test webhook accessibility
export async function GET(request) {
  console.log("🔍 Webhook accessibility test - GET request received");
  return NextResponse.json({ 
    ok: true, 
    message: "iPay webhook endpoint is accessible",
    timestamp: new Date().toISOString() 
  });
}

// NOTE: Adjust verification according to iPay docs (JWT/HMAC). This is a placeholder.
async function verifyIpaySignature(request, rawBody) {
  // Allow in non-production for easier testing
  if (process.env.NODE_ENV !== "production") return true;
  if (process.env.IPAY_WEBHOOK_INSECURE === "true") return true;

  try {
    // 1) HMAC verification (some BOG setups use HMAC-SHA256 over raw body)
    const hmacSecret = process.env.IPAY_WEBHOOK_HMAC_SECRET || process.env.IPAY_CLIENT_SECRET || process.env.IPAY_SECRET_KEY;
    if (hmacSecret) {
      const sigHeaderNames = [
        "x-signature",
        "ipay-signature",
        "x-bog-signature",
        "x-hmac-signature",
      ];
      let provided = null;
      for (const h of sigHeaderNames) {
        const v = request.headers.get(h);
        if (v) { provided = v.trim(); break; }
      }
      if (provided) {
        const { createHmac, timingSafeEqual } = await import("node:crypto");
        const mac = createHmac("sha256", hmacSecret).update(rawBody).digest();
        // Support hex or base64 in header
        const encHex = Buffer.from(mac).toString("hex");
        const encB64 = Buffer.from(mac).toString("base64");
        const bufProvided = Buffer.from(provided);
        const safeEq = (a, b) => {
          try { return timingSafeEqual(Buffer.from(a), Buffer.from(b)); } catch { return false; }
        };
        if (safeEq(bufProvided, Buffer.from(encHex)) || safeEq(bufProvided, Buffer.from(encB64))) {
          return true;
        }
        // If header labeled as hex/base64 with prefix
        if (provided.toLowerCase().startsWith("sha256=")) {
          const pv = provided.slice(7);
          if (safeEq(Buffer.from(pv), Buffer.from(encHex)) || safeEq(Buffer.from(pv), Buffer.from(encB64))) return true;
        }
        // If HMAC present but mismatch, reject
        return false;
      }
    }

    // 2) JWT verification (some BOG setups sign with JWT in Authorization header)
    const auth = request.headers.get("authorization") || "";
    const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null;
    const jwksUrl = process.env.IPAY_WEBHOOK_JWKS_URL;
    const pem = process.env.IPAY_WEBHOOK_PUBLIC_KEY_PEM;

    if (token && jwksUrl) {
      const { createRemoteJWKSet, jwtVerify } = await import("jose");
      const JWKS = createRemoteJWKSet(new URL(jwksUrl));
      await jwtVerify(token, JWKS);
      return true;
    }
    if (token && pem) {
      const { jwtVerify } = await import("jose");
      // Let jose parse PEM directly via createPublicKey if needed; fall back to subtle only if supported
      const { createPublicKey } = await import("node:crypto");
      const keyObject = createPublicKey(pem);
      await jwtVerify(token, keyObject);
      return true;
    }
  } catch (_) {
    return false;
  }
  return false;
}

export async function POST(request) {
  const contentType = (request.headers.get("content-type") || "").toLowerCase();
  const raw = await request.text();

  // Log incoming webhook for debugging
  const headers = Object.fromEntries(request.headers.entries());
  console.log("📥 iPay Webhook received:", {
    timestamp: new Date().toISOString(),
    contentType,
    userAgent: headers['user-agent'],
    origin: headers['origin'],
    body: raw.substring(0, 500), // First 500 chars
    fullHeaders: headers,
  });

  const ok = await verifyIpaySignature(request, raw);
  if (!ok) {
    console.error("❌ Webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

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

  console.log("📋 Parsed webhook payload:", JSON.stringify(payload, null, 2));

  // BOG sends data in nested "body" object
  // Handle both formats: direct and nested
  const data = payload?.body || payload;

  // Expected fields depend on iPay; commonly: merchant orderId, ipay order id, status, amount
  // Try multiple known field names from BOG variants
  const merchantOrderId =
    data?.external_order_id ||
    data?.externalOrderId ||
    data?.orderId ||
    data?.merchantOrderId ||
    data?.merchantOrderReference ||
    data?.shop_order_id ||
    data?.merchant_order_id ||
    data?.order_id ||
    payload?.external_order_id ||
    payload?.orderId;

  // BOG sends status as object: { key: 'completed', value: 'წარმატებული' }
  const statusObj = data?.order_status || data?.payment_status || data?.status || payload?.status;
  const status = 
    (typeof statusObj === 'object' ? statusObj?.key || statusObj?.value : statusObj) ||
    data?.paymentStatus ||
    payload?.paymentStatus;

  if (!merchantOrderId || !status) {
    console.error("❌ Missing order identifiers in payload:", payload);
    return NextResponse.json({ error: "Missing order identifiers" }, { status: 400 });
  }

  console.log("📋 Processing webhook:", { merchantOrderId, status, payload });

  // Check for refund actions to determine if it's partial or full
  const actions = data?.actions || [];
  const refundActions = actions.filter(a => a.action === "refund" || a.action === "refund_request");
  const hasRefund = refundActions.length > 0;
  
  // Calculate total refunded amount if there are refund actions
  let totalRefundedAmount = 0;
  let isPartialRefund = false;
  
  if (hasRefund) {
    totalRefundedAmount = refundActions.reduce((sum, action) => {
      const amount = parseFloat(action.amount || action.refund_amount || 0);
      return sum + amount;
    }, 0);
    
    // Check if it's a partial refund by comparing with purchase units
    const requestAmount = parseFloat(data?.purchase_units?.request_amount || data?.purchase_units?.total_amount || 0);
    const refundAmount = parseFloat(data?.purchase_units?.refund_amount || totalRefundedAmount);
    
    if (requestAmount > 0 && refundAmount > 0 && refundAmount < requestAmount) {
      isPartialRefund = true;
    }
    
    console.log("💰 Refund detected:", { 
      totalRefundedAmount, 
      requestAmount, 
      refundAmount, 
      isPartial: isPartialRefund 
    });
  }

  // Map gateway status to local status
  const normalizedStatus = (function mapStatus(s) {
    const v = String(s).toLowerCase();
    if (
      v.includes("success") ||
      v.includes("succeed") ||
      v.includes("complete") ||  // BOG sends "completed"
      v === "paid" ||
      v === "approved" ||
      v === "captured" ||
      v === "ok"
    ) return "paid";
    if (
      v.includes("reject") || 
      v.includes("fail") || 
      v === "declined" || 
      v === "canceled" || 
      v === "cancelled" ||
      v.includes("reject")
    ) return "failed";
    // Check for refunded statuses - BOG sends these explicitly
    if (v === "refunded_partially" || v.includes("partial") && v.includes("refund")) {
      return "refunded_partially";
    }
    if (v === "refunded" || v.includes("refund") && !v.includes("pending")) {
      // If BOG sends "refunded", check if it's actually partial based on amounts
      return isPartialRefund ? "refunded_partially" : "refunded";
    }
    return "pending";
  })(status);

  console.log(`🔄 Status mapping: "${status}" → "${normalizedStatus}"`);

  try {
    const order = await prisma.order.findUnique({ 
      where: { id: String(merchantOrderId) },
      include: { payments: true }
    });
    
    if (!order) {
      console.error("❌ Order not found:", merchantOrderId);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    console.log("✅ Order found:", { orderId: order.id, currentStatus: order.status, newStatus: normalizedStatus });

    // Find or create the payment record
    let payment = order.payments.find(p => p.gateway === "ipay" && p.status !== "completed");
    
    // Determine payment status (completed for paid, preserve refunded statuses)
    const paymentStatus = normalizedStatus === "paid" ? "completed" : normalizedStatus;
    
    if (!payment) {
      // Create new payment record if none exists
      payment = await prisma.payment.create({
        data: {
          orderId: order.id,
          gateway: "ipay",
          gatewayOrderId: data?.order_id || null,
          gatewayTransactionId: data?.payment_detail?.transaction_id || null,
          amount: order.total,
          currency: "GEL",
          status: paymentStatus,
          paymentMethod: data?.payment_detail?.payment_option || data?.payment_detail?.transfer_method?.key || null,
          payerIdentifier: data?.payment_detail?.payer_identifier || null,
          cardType: data?.payment_detail?.card_type || null,
          completedAt: normalizedStatus === "paid" ? new Date() : null,
          webhookReceivedAt: new Date(),
          webhookPayload: payload,
          metadata: hasRefund ? {
            refundActions,
            totalRefundedAmount,
            isPartialRefund,
          } : null,
        },
      });
    } else {
      // Update existing payment record
      payment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentStatus,
          gatewayTransactionId: data?.payment_detail?.transaction_id || payment.gatewayTransactionId,
          paymentMethod: data?.payment_detail?.payment_option || data?.payment_detail?.transfer_method?.key || payment.paymentMethod,
          payerIdentifier: data?.payment_detail?.payer_identifier || payment.payerIdentifier,
          cardType: data?.payment_detail?.card_type || payment.cardType,
          completedAt: normalizedStatus === "paid" ? new Date() : payment.completedAt,
          webhookReceivedAt: new Date(),
          webhookPayload: payload,
          metadata: hasRefund ? {
            ...(payment.metadata || {}),
            refundActions,
            totalRefundedAmount,
            isPartialRefund,
            refundedAt: new Date().toISOString(),
          } : payment.metadata,
        },
      });
    }

    // Update order status
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: normalizedStatus },
    });

    console.log("✅ Payment and order updated:", { 
      orderId: updated.id, 
      orderStatus: updated.status,
      paymentId: payment.id,
      paymentStatus: payment.status 
    });

    // Send WhatsApp only once when payment is marked paid
    if (normalizedStatus === "paid" && !payment.metadata?.whatsappSent) {
      try {
        await sendManagerOrderNotification(updated);
        await prisma.payment.update({
          where: { id: payment.id },
          data: { 
            metadata: { 
              ...(payment.metadata || {}),
              whatsappSent: true,
              whatsappSentAt: new Date().toISOString()
            } 
          },
        });
      } catch (e) {
        console.error("❌ WhatsApp notification failed:", e);
      }
    }

    console.log("✅ Webhook processed successfully");
    return NextResponse.json({ ok: true, orderId: updated.id, paymentId: payment.id });
  } catch (e) {
    console.error("❌ Webhook processing failed:", e);
    return NextResponse.json({ error: "Update failed", details: String(e?.message || e) }, { status: 500 });
  }
}


