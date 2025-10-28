"use client";

import { useEffect, useRef, useState } from "react";

export default function IpayReturnPage() {
  const [note, setNote] = useState("Processing your payment...");
  const [checkCount, setCheckCount] = useState(0);
  const [isManualChecking, setIsManualChecking] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    try {
      window.parent?.postMessage({ type: "ipay:returned" }, "*");
      const lastOrderId = localStorage.getItem("lastOrderId");
      if (lastOrderId) {
        window.opener?.postMessage({ type: "ipay:return-status", orderId: lastOrderId }, "*");
      }
    } catch (_) {}
  }, []);

  const manualCheck = async () => {
    const lastOrderId = localStorage.getItem("lastOrderId");
    if (!lastOrderId) return;

    setIsManualChecking(true);
    setNote("Checking webhook status...");
    
    try {
      const r = await fetch("/api/payments/ipay/check-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: lastOrderId }),
      });
      
      const data = await r.json();
      console.log("Check status response:", data);
      
      if (data.error) {
        // Show helpful message about webhook issue
        setNote(
          "⚠️ Payment verification requires webhook notification from the bank. " +
          "If you completed payment and were charged, please contact support with your Order ID below."
        );
      } else if (data.status === "paid") {
        try { localStorage.removeItem("lastOrderId"); } catch {}
        setNote("Payment completed! Redirecting...");
        const parts = window.location.pathname.split("/");
        const locale = parts[1] || "ka";
        setTimeout(() => { window.location.href = `/${locale}`; }, 800);
        return;
      }
    } catch (e) {
      console.error("Manual check failed:", e);
      setNote("Unable to verify payment status automatically. If you were charged, contact support with your Order ID below.");
    } finally {
      setIsManualChecking(false);
    }
  };

  useEffect(() => {
    const lastOrderId = typeof window !== "undefined" ? localStorage.getItem("lastOrderId") : null;
    if (!lastOrderId) return;

    let stopped = false;
    let pollCount = 0;
    
    async function poll() {
      if (stopped) return;
      pollCount++;
      setCheckCount(pollCount);
      
      try {
        const r = await fetch(`/api/orders/status?id=${encodeURIComponent(lastOrderId)}`, { cache: "no-store" });
        if (r.ok && (r.headers.get("content-type") || "").includes("application/json")) {
          const j = await r.json();
          if (j?.status === "paid") {
            try { localStorage.removeItem("lastOrderId"); } catch {}
            setNote("Payment completed. Redirecting...");
            const parts = window.location.pathname.split("/");
            const locale = parts[1] || "ka";
            setTimeout(() => { window.location.href = `/${locale}`; }, 800);
            return;
          }
          if (j?.status === "failed") {
            setNote("Payment failed or cancelled. You can try again from the cart.");
            return;
          }
        }
      } catch (_) {}
      
      // After 15 attempts (30 seconds), check webhook status
      if (pollCount === 15) {
        console.log("⚠️ Payment verification taking longer than expected...");
        setNote("Payment verification delayed. Please wait or contact support if you were charged.");
      }
      
      // After 25 attempts (50 seconds), give up and show instructions
      if (pollCount === 25) {
        setNote("Unable to verify payment automatically. If you were charged, contact support with your Order ID.");
      }
      
      timerRef.current = setTimeout(poll, 2000);
    }
    poll();
    return () => { stopped = true; if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const lastOrderId = typeof window !== "undefined" ? localStorage.getItem("lastOrderId") : null;

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: "0 auto" }}>
      <h1>{note}</h1>
      <p>
        If this page does not update, please return to your order and refresh the status. You will
        receive confirmation once the bank finalizes the transaction.
      </p>
      
      {lastOrderId && (
        <div style={{ marginTop: 20, padding: 12, backgroundColor: "#f9f9f9", borderRadius: 4, fontSize: 13 }}>
          <strong>Order ID:</strong>{" "}
          <code style={{ backgroundColor: "#e0e0e0", padding: "2px 6px", borderRadius: 3 }}>
            {lastOrderId}
          </code>
        </div>
      )}
      
      {checkCount > 5 && (
        <div style={{ marginTop: 20, padding: 16, backgroundColor: "#fff3cd", border: "1px solid #ffc107", borderRadius: 8 }}>
          <p style={{ margin: "0 0 10px 0", fontSize: 14 }}>
            <strong>⚠️ Payment verification is taking longer than usual</strong>
          </p>
          <button
            onClick={manualCheck}
            disabled={isManualChecking}
            style={{
              padding: "10px 20px",
              backgroundColor: isManualChecking ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: isManualChecking ? "not-allowed" : "pointer",
              fontSize: 14,
              marginBottom: 10,
            }}
          >
            {isManualChecking ? "Checking..." : "Check Webhook Status"}
          </button>
          <p style={{ margin: "10px 0 0 0", fontSize: 12, color: "#666" }}>
            This checks if the bank sent a payment notification. If you completed payment and were charged, 
            please save your Order ID and contact support.
          </p>
        </div>
      )}
      
      {checkCount > 20 && (
        <div style={{ marginTop: 20, padding: 16, backgroundColor: "#f8d7da", border: "1px solid #dc3545", borderRadius: 8 }}>
          <p style={{ margin: "0 0 10px 0", fontSize: 14 }}>
            <strong>❌ Automatic verification failed</strong>
          </p>
          <p style={{ margin: "0 0 10px 0", fontSize: 13 }}>
            If you completed the payment and were charged:
          </p>
          <ol style={{ margin: "0 0 10px 20px", fontSize: 13, lineHeight: 1.6 }}>
            <li>Save your Order ID: <strong>{lastOrderId}</strong></li>
            <li>Check your bank statement to confirm the charge</li>
            <li>Contact support to manually verify your payment</li>
          </ol>
          <p style={{ margin: "10px 0 0 0", fontSize: 12, color: "#721c24" }}>
            Don't worry - if you were charged, your order will be processed once verified.
          </p>
        </div>
      )}
      
      <div style={{ marginTop: 20, fontSize: 12, color: "#999" }}>
        {checkCount > 0 && `Checking... (${checkCount})`}
      </div>
    </div>
  );
}


