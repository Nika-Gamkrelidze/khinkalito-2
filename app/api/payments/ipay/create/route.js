import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createIpayOrder } from "@/lib/ipay";

export async function POST(request) {
  try {
    const { orderId } = await request.json();
    if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    const order = await prisma.order.findUnique({ where: { id: String(orderId) } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.status !== "pending") {
      return NextResponse.json({ error: "Order is not payable" }, { status: 400 });
    }

    const currency = process.env.WHATSAPP_CURRENCY || "GEL";
    const description = `Order ${order.id}`;

    const payload = {
      amount: Number(order.total),
      currency,
      orderId: order.id, // merchant reference in iPay
      description,
      returnUrl: process.env.IPAY_RETURN_URL,
      callbackUrl: process.env.IPAY_CALLBACK_URL,
      customer: {
        // Best-effort mapping from stored JSON
        name:
          (order.customer && typeof order.customer === "object" && `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim()) ||
          "",
        phone: (order.customer && typeof order.customer === "object" && order.customer.phone) || "",
      },
      merchant: {
        id: process.env.IPAY_MERCHANT_ID || undefined,
        terminalId: process.env.IPAY_TERMINAL_ID || undefined,
        name: process.env.IPAY_MERCHANT_NAME || undefined,
        inn: process.env.IPAY_CLIENT_INN || undefined,
      },
    };

    const gateway = await createIpayOrder(payload);

    // Persist payment metadata for auditing and later reconciliation
    await prisma.order.update({
      where: { id: order.id },
      data: {
        payment: {
          // storing minimal necessary info; extend as needed
          gateway: "ipay",
          createdAt: new Date().toISOString(),
          request: payload,
          response: gateway,
        },
      },
    });

    const redirectUrl = gateway.paymentUrl || gateway.redirectUrl || gateway.url;
    if (!redirectUrl) {
      return NextResponse.json({ error: "Payment URL not provided by gateway" }, { status: 502 });
    }

    return NextResponse.json({ redirectUrl });
  } catch (e) {
    return NextResponse.json({ error: "Create payment failed", details: String(e?.message || e) }, { status: 500 });
  }
}


