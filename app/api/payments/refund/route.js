import { NextResponse } from "next/server";
import { refundIpayOrder } from "@/lib/ipay";
import { getUserFromRequestCookies, verifyPassword } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function POST(request) {
  // Check if user is authenticated as admin
  const sessionUser = getUserFromRequestCookies(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { orderId, amount, adminPassword } = body;

  // Validate required fields
  if (!orderId) {
    return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
  }

  if (!adminPassword) {
    return NextResponse.json({ error: "Admin password is required for refund authorization" }, { status: 400 });
  }

  try {
    // Get the admin user from database
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Verify admin password using the custom HMAC-based verification
    const passwordMatch = verifyPassword(adminPassword, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Incorrect admin password" }, { status: 403 });
    }

    // Get order from database with payments
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.payments || order.payments.length === 0) {
      return NextResponse.json({ error: "No payment found for this order" }, { status: 400 });
    }

    const latestPayment = order.payments[order.payments.length - 1];

    // Check if payment is already refunded
    if (latestPayment.status === "refunded" || latestPayment.status === "refunded_partially") {
      return NextResponse.json({ 
        error: "This payment has already been refunded",
        details: `Current status: ${latestPayment.status}`
      }, { status: 400 });
    }

    // Check if payment was successful
    if (order.status !== "paid" && order.status !== "completed") {
      return NextResponse.json({ 
        error: "Only paid orders can be refunded",
        details: `Current order status: ${order.status}`
      }, { status: 400 });
    }

    // Check 1-week time limit
    const paymentDate = new Date(latestPayment.createdAt);
    const now = new Date();
    const daysDiff = (now - paymentDate) / (1000 * 60 * 60 * 24);
    
    if (daysDiff > 7) {
      return NextResponse.json({ 
        error: "Refund not allowed",
        details: "Refunds can only be processed within 7 days of payment. This payment is too old.",
        paymentDate: paymentDate.toISOString(),
        daysAgo: Math.floor(daysDiff)
      }, { status: 400 });
    }

    // Validate refund amount if partial refund
    if (amount !== null && amount !== undefined) {
      const refundAmount = Number(amount);
      if (isNaN(refundAmount) || refundAmount <= 0) {
        return NextResponse.json({ error: "Invalid refund amount" }, { status: 400 });
      }
      if (refundAmount > order.total) {
        return NextResponse.json({ 
          error: "Refund amount cannot exceed order total",
          orderTotal: order.total,
          requestedAmount: refundAmount
        }, { status: 400 });
      }
    }

    const gatewayOrderId = latestPayment.gatewayOrderId;
    if (!gatewayOrderId) {
      return NextResponse.json({ 
        error: "Gateway order ID not found",
        details: "Cannot process refund without gateway order ID"
      }, { status: 400 });
    }

    // Try to call BOG refund API
    console.log(`💰 Processing refund for order ${orderId}, gateway ID: ${gatewayOrderId}, amount: ${amount || "FULL"}`);
    
    let refundResult = null;
    let useManualMode = false;
    
    try {
      refundResult = await refundIpayOrder(
        gatewayOrderId,  // BOG's gateway order ID
        orderId,         // Our external order ID
        amount,          // Amount to refund (null for full)
        {
          idempotencyKey: randomUUID(), // Prevent duplicate refunds
        }
      );
      console.log(`✅ Refund successful via API:`, refundResult);
    } catch (apiError) {
      // If API refund fails, fall back to manual mode
      console.log(`⚠️ API refund failed, using manual mode:`, apiError.message);
      useManualMode = true;
      
      // Create a manual refund record
      refundResult = {
        manual: true,
        status: "pending_manual_processing",
        message: "Refund marked for manual processing in BOG Business Manager",
        gateway_order_id: gatewayOrderId,
        external_order_id: orderId,
        requested_at: new Date().toISOString(),
        requested_by: user.username,
        amount: amount || order.total,
      };
    }

    // Determine new status based on manual or automatic mode
    const isPartialRefund = amount !== null && amount !== undefined && Number(amount) < order.total;
    
    let newStatus;
    if (useManualMode) {
      // Manual mode: mark as pending until admin processes in Business Manager
      newStatus = isPartialRefund ? "refund_pending_partial" : "refund_pending";
    } else {
      // API mode: mark as refunded immediately
      newStatus = isPartialRefund ? "refunded_partially" : "refunded";
    }

    // Calculate refund details for storage
    const refundDetails = {
      refundResult,
      refundedAt: new Date().toISOString(),
      refundedBy: user.username,
      manualMode: useManualMode,
      isPartialRefund,
      refundAmount: isPartialRefund ? amount : order.total,
      originalAmount: order.total,
      remainingAmount: isPartialRefund ? order.total - amount : 0,
    };

    // Update payment record
    await prisma.payment.update({
      where: { id: latestPayment.id },
      data: {
        status: newStatus,
        gatewayResponse: {
          ...(latestPayment.gatewayResponse || {}),
          refund: refundDetails,
        },
      },
    });

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    // Construct response message
    let message;
    if (useManualMode) {
      const amountText = isPartialRefund ? `${amount} GEL` : `${order.total} GEL`;
      message = `⚠️ Manual Refund Required\n\n` +
                `Amount: ${amountText}\n` +
                `Gateway Order ID: ${gatewayOrderId}\n\n` +
                `Next Steps:\n` +
                `1. Login to Business Manager: https://businessmanager.bog.ge\n` +
                `2. Find transaction with Gateway ID above\n` +
                `3. Process ${isPartialRefund ? 'partial' : 'full'} refund\n` +
                `4. Customer will receive refund in 3-5 business days\n\n` +
                `Note: Order marked as "${newStatus}" in your system.`;
    } else {
      message = isPartialRefund 
        ? `✅ Partial refund of ${amount} GEL processed successfully via BOG API` 
        : "✅ Full refund processed successfully via BOG API";
    }

    return NextResponse.json({
      success: true,
      manualMode: useManualMode,
      message,
      refundResult,
      newStatus,
      actionId: refundResult.action_id || null,
      gatewayOrderId: useManualMode ? gatewayOrderId : undefined,
      businessManagerUrl: useManualMode ? "https://businessmanager.bog.ge" : undefined,
    });

  } catch (error) {
    console.error("❌ Refund error:", error);
    
    return NextResponse.json({
      error: "Refund failed",
      details: error.message || String(error),
    }, { status: 500 });
  }
}

