import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getIpayOrder } from "@/lib/ipay";
import { requireAdmin } from "@/lib/auth";

export async function POST(request) {
  if (!requireAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Fetch all orders with payments
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ["pending", "paid", "failed"] },
        payments: { some: {} }, // Has at least one payment
      },
      include: {
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    let synced = 0;
    for (const order of orders) {
      try {
        // Get the latest payment for this order
        const latestPayment = order.payments[order.payments.length - 1];
        if (!latestPayment) continue;

        const gatewayOrderId = latestPayment.gatewayOrderId || order.id;
        const gatewayData = await getIpayOrder(gatewayOrderId);
        
        // Map gateway status
        const gatewayStatus = gatewayData?.order_status || gatewayData?.status || gatewayData?.payment_status;
        const normalized = (function (s) {
          const v = String(s).toLowerCase();
          if (v.includes("success") || v.includes("complete") || v === "paid" || v === "approved" || v === "captured" || v === "ok") return "paid";
          if (v.includes("reject") || v.includes("fail") || v === "declined" || v === "canceled" || v === "cancelled") return "failed";
          return "pending";
        })(gatewayStatus);

        // Update order status if it differs
        if (order.status !== normalized) {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: normalized },
          });
          synced++;
        }

        // Update payment with latest gateway data
        await prisma.payment.update({
          where: { id: latestPayment.id },
          data: {
            lastSyncAt: new Date(),
            gatewayResponse: gatewayData,
          },
        });
      } catch (e) {
        // Skip orders that can't be synced
        console.error(`Sync failed for order ${order.id}:`, e.message);
      }
    }

    return NextResponse.json({ ok: true, synced });
  } catch (e) {
    return NextResponse.json({ error: "Sync failed", details: String(e?.message || e) }, { status: 500 });
  }
}

