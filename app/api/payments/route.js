import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// GET /api/payments - List all payments with filtering
export async function GET(request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const gateway = searchParams.get("gateway");
    const orderId = searchParams.get("orderId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where = {};
    if (status) where.status = status;
    if (gateway) where.gateway = gateway;
    if (orderId) where.orderId = orderId;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              status: true,
              customer: true,
              total: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.payment.count({ where }),
    ]);

    return NextResponse.json({
      payments,
      total,
      limit,
      offset,
      hasMore: offset + payments.length < total,
    });
  } catch (error) {
    console.error("Failed to fetch payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments", details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/payments/[id] - Get single payment
export async function GET_SINGLE(request, { params }) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        order: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Failed to fetch payment:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment", details: error.message },
      { status: 500 }
    );
  }
}

