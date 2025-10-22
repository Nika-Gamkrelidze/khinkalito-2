"use client";

import { useEffect } from "react";

export default function IpayReturnPage() {
  useEffect(() => {
    try {
      window.parent?.postMessage({ type: "ipay:returned" }, "*");
    } catch (_) {}
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Processing your payment...</h1>
      <p>
        If this page does not update, please return to your order and refresh the status. You will
        receive confirmation once the bank finalizes the transaction.
      </p>
    </div>
  );
}


