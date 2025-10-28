// Lightweight iPay client: obtain token, create order, get order status

function getEnv(name, fallback) {
  const v = process.env[name];
  if (v === undefined || v === null || v === "") return fallback;
  return v;
}

const IPAY_API_BASE = getEnv("IPAY_API_BASE", "https://api.bog.ge/payments/v1");
const IPAY_TOKEN_URL = getEnv(
  "IPAY_TOKEN_URL",
  // Common BOG OAuth endpoint (adjust per tenant if needed)
  "https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token"
);

export async function getIpayAccessToken() {
  const clientId = getEnv("IPAY_CLIENT_ID") || getEnv("IPAY_CLIENTID");
  const clientSecret = getEnv("IPAY_CLIENT_SECRET") || getEnv("IPAY_SECRET_KEY");
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  // Preferred: HTTP Basic with only grant_type in the body
  const body = new URLSearchParams({ grant_type: "client_credentials" });

  if (!clientId || !clientSecret) {
    throw new Error("Missing IPAY_CLIENT_ID or IPAY_CLIENT_SECRET in env");
  }

  if (!IPAY_TOKEN_URL) {
    throw new Error("Missing IPAY_TOKEN_URL in env");
  }

  const primary = await fetch(IPAY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Authorization: `Basic ${basic}`,
    },
    body,
    cache: "no-store",
  });
  if (primary.ok) {
    const json = await primary.json();
    if (!json?.access_token) throw new Error("iPay token response missing access_token");
    return json.access_token;
  }

  // Fallback: include client_id/client_secret in the form body
  const fallbackBody = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });
  const fallback = await fetch(IPAY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: fallbackBody,
    cache: "no-store",
  });
  if (!fallback.ok) {
    const text = await fallback.text().catch(() => "");
    throw new Error(`iPay token error (${IPAY_TOKEN_URL}): ${fallback.status} ${text}`);
  }
  const json = await fallback.json();
  if (!json?.access_token) throw new Error("iPay token response missing access_token");
  return json.access_token;
}

export async function createIpayOrder(params, options = {}) {
  // Try common BOG endpoints in order until one succeeds
  const token = await getIpayAccessToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (options.idempotencyKey) headers["Idempotency-Key"] = String(options.idempotencyKey);
  if (options.acceptLanguage) headers["Accept-Language"] = String(options.acceptLanguage);

  const candidatePaths = [
    "/ecommerce/orders",
    "/checkout/orders",
    "/orders",
  ];

  let lastErrorText = "";
  for (const path of candidatePaths) {
    try {
      const res = await fetch(`${IPAY_API_BASE}${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(params),
        cache: "no-store",
      });
      if (res.ok) return res.json();
      // Continue to next path on 404
      const text = await res.text().catch(() => "");
      lastErrorText = `${res.status} ${text}`;
      if (res.status !== 404) {
        throw new Error(`iPay create order error (${path}): ${lastErrorText}`);
      }
    } catch (e) {
      // Only break on non-404
      if (!String(lastErrorText).startsWith("404")) {
        throw e;
      }
    }
  }
  throw new Error(`iPay create order error: 404 Not Found on all known endpoints (${candidatePaths.join(", ")}). Last: ${lastErrorText}`);
}

export async function getIpayOrder(ipayOrderIdOrMerchantOrderId, options = {}) {
  const token = await getIpayAccessToken();
  const id = encodeURIComponent(ipayOrderIdOrMerchantOrderId);
  
  // BOG may have different endpoints for querying orders
  // Try multiple endpoint variations
  const candidateEndpoints = [
    `/orders/${id}`,
    `/ecommerce/orders/${id}`,
    `/checkout/orders/${id}`,
    `/orders/status/${id}`,
    `/payments/${id}`,
    `/orders/external/${id}`, // Some gateways use this for external_order_id
  ];

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };

  let lastError = null;
  let lastErrorText = "";

  for (const endpoint of candidateEndpoints) {
    try {
      console.log(`🔍 Trying BOG endpoint: ${IPAY_API_BASE}${endpoint}`);
      
      const res = await fetch(`${IPAY_API_BASE}${endpoint}`, {
        method: "GET",
        headers,
        cache: "no-store",
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log(`✅ Success! Order found at endpoint: ${endpoint}`);
        return data;
      }
      
      const text = await res.text().catch(() => "");
      lastErrorText = `${res.status} ${text}`;
      lastError = new Error(`iPay get order error: ${lastErrorText}`);
      
      // If not 404, this is a real error, stop trying
      if (res.status !== 404) {
        throw lastError;
      }
      
      console.log(`⚠️  404 at ${endpoint}, trying next...`);
    } catch (e) {
      // Only continue on 404, otherwise rethrow
      if (!String(e.message).includes("404")) {
        throw e;
      }
      lastError = e;
    }
  }
  
  // If we got here, all endpoints returned 404
  throw new Error(
    `iPay order not found with ID "${ipayOrderIdOrMerchantOrderId}". ` +
    `Tried all endpoints: ${candidateEndpoints.join(", ")}. ` +
    `Last error: ${lastErrorText}`
  );
}

export async function refundIpayOrder(gatewayOrderId, externalOrderId = null, amount = null, options = {}) {
  const token = await getIpayAccessToken();
  const gatewayId = encodeURIComponent(gatewayOrderId);
  const externalId = externalOrderId ? encodeURIComponent(externalOrderId) : gatewayId;
  
  const body = amount !== null && amount !== undefined ? { amount: Number(amount) } : {};
  
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  
  // Add idempotency key to prevent duplicate refunds
  if (options.idempotencyKey) {
    headers["Idempotency-Key"] = String(options.idempotencyKey);
  }
  
  // Try refund endpoint paths
  // Documentation shows: POST /payments/v1/payment/refund/:order_id
  const candidatePaths = [
    // CORRECT PATH from documentation (singular "payment")
    `/payment/refund/${gatewayId}`,
    `/payment/refund/${externalId}`,
    // Also try ecommerce/checkout variations of correct path
    `/ecommerce/payment/refund/${gatewayId}`,
    `/ecommerce/payment/refund/${externalId}`,
    `/checkout/payment/refund/${gatewayId}`,
    `/checkout/payment/refund/${externalId}`,
    // Legacy paths (plural "orders") - in case old API still works
    `/orders/${gatewayId}/refund`,
    `/ecommerce/orders/${gatewayId}/refund`,
    `/checkout/orders/${gatewayId}/refund`,
    `/orders/${externalId}/refund`,
  ];
  
  let lastErrorText = "";
  let lastError = null;
  
  for (const path of candidatePaths) {
    try {
      console.log(`💰 Trying refund endpoint: ${IPAY_API_BASE}${path}`);
      
      const res = await fetch(`${IPAY_API_BASE}${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        cache: "no-store",
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log(`✅ Refund successful at: ${path}`);
        return data;
      }
      
      const text = await res.text().catch(() => "");
      lastErrorText = `${res.status} ${text}`;
      lastError = new Error(`iPay refund error (${path}): ${lastErrorText}`);
      
      // Continue to next path on 404 or 405 (method not allowed)
      if (res.status !== 404 && res.status !== 405) {
        throw lastError;
      }
      
      console.log(`⚠️  ${res.status} at ${path}, trying next...`);
    } catch (e) {
      // Only continue on 404/405, otherwise rethrow
      if (!String(e.message).includes("404") && !String(e.message).includes("405")) {
        throw e;
      }
      lastError = e;
    }
  }
  
  throw new Error(
    `iPay refund failed: Could not find refund endpoint. ` +
    `Gateway ID: ${gatewayOrderId}, External ID: ${externalOrderId || 'N/A'}. ` +
    `Tried ${candidatePaths.length} endpoints. Last error: ${lastErrorText}`
  );
}


