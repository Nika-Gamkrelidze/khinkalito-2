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

export async function getIpayOrder(ipayOrderIdOrMerchantOrderId) {
  const token = await getIpayAccessToken();
  const id = encodeURIComponent(ipayOrderIdOrMerchantOrderId);
  // BOG Payments API path
  const res = await fetch(`${IPAY_API_BASE}/orders/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`iPay get order error: ${res.status} ${text}`);
  }
  return res.json();
}


