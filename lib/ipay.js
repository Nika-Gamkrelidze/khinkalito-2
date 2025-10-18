// Lightweight iPay client: obtain token, create order, get order status

function getEnv(name, fallback) {
  const v = process.env[name];
  if (v === undefined || v === null || v === "") return fallback;
  return v;
}

const IPAY_API_BASE = getEnv("IPAY_API_BASE", "https://ipay.ge/opay/api/v1");
const IPAY_TOKEN_URL = getEnv("IPAY_TOKEN_URL", "https://ipay.ge/opay/oauth2/token");

export async function getIpayAccessToken() {
  const clientId = getEnv("IPAY_CLIENT_ID");
  const clientSecret = getEnv("IPAY_CLIENT_SECRET");
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  // Preferred: HTTP Basic with only grant_type in the body
  const body = new URLSearchParams({ grant_type: "client_credentials" });

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
    throw new Error(`iPay token error: ${fallback.status} ${text}`);
  }
  const json = await fallback.json();
  if (!json?.access_token) throw new Error("iPay token response missing access_token");
  return json.access_token;
}

export async function createIpayOrder(params) {
  // params: { amount, currency, orderId, description, returnUrl, callbackUrl, customer?, merchant? }
  const token = await getIpayAccessToken();
  const res = await fetch(`${IPAY_API_BASE}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(params),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`iPay create order error: ${res.status} ${text}`);
  }
  return res.json();
}

export async function getIpayOrder(ipayOrderIdOrMerchantOrderId) {
  const token = await getIpayAccessToken();
  const id = encodeURIComponent(ipayOrderIdOrMerchantOrderId);
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


