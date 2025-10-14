const WHATSAPP_ENABLED = process.env.WHATSAPP_ENABLED === "true";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const WHATSAPP_MANAGER_PHONE = process.env.WHATSAPP_MANAGER_PHONE || "";
const WHATSAPP_TEMPLATE_NAME = process.env.WHATSAPP_TEMPLATE_NAME || "";
const WHATSAPP_TEMPLATE_LANG = process.env.WHATSAPP_TEMPLATE_LANG || "en_US";
const WHATSAPP_TEMPLATE_WITH_BODY = process.env.WHATSAPP_TEMPLATE_WITH_BODY === "true";
const WHATSAPP_GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v22.0";
const WHATSAPP_DEBUG = process.env.WHATSAPP_DEBUG === "true";
const WHATSAPP_TEMPLATE_BODY_PARAMS = (process.env.WHATSAPP_TEMPLATE_BODY_PARAMS || "").split(",").map((s) => s.trim()).filter(Boolean);
const WHATSAPP_TEMPLATE_HEADER_PARAM = (process.env.WHATSAPP_TEMPLATE_HEADER_PARAM || "").trim();
const WHATSAPP_CURRENCY = (process.env.WHATSAPP_CURRENCY || "GEL").trim();
const WHATSAPP_SUMMARY_LANG = (process.env.WHATSAPP_SUMMARY_LANG || "en").trim();

function isConfigured() {
  return (
    WHATSAPP_ENABLED &&
    Boolean(WHATSAPP_TOKEN) &&
    Boolean(WHATSAPP_PHONE_NUMBER_ID) &&
    Boolean(WHATSAPP_MANAGER_PHONE)
  );
}

function formatOrderText(order) {
  const createdAt = new Date(order.createdAt || Date.now()).toLocaleString("en-GB", { hour12: false });
  const customer = order.customer || {};
  const address = order.address || {};
  const items = Array.isArray(order.items) ? order.items : [];

  const l = WHATSAPP_SUMMARY_LANG === "ka"
    ? {
        newOrder: "ახალი შეკვეთა",
        date: "თარიღი",
        customer: "მომხმარებელი",
        phone: "ტელეფონი",
        address: "მისამართი",
        items: "პროდუქტები",
        total: "ჯამი"
      }
    : {
        newOrder: "New order",
        date: "Date",
        customer: "Customer",
        phone: "Phone",
        address: "Address",
        items: "Items",
        total: "Total"
      };

  const lines = [];
  lines.push(`${l.newOrder}: ${order.id}`);
  lines.push(`${l.date}: ${createdAt}`);
  lines.push(`${l.customer}: ${(customer.firstName || "") + " " + (customer.lastName || "")}`.trim());
  if (customer.phone) lines.push(`${l.phone}: ${customer.phone}`);
  if (address.text) lines.push(`${l.address}: ${address.text}`);
  if (address.location && address.location.lat && address.location.lng) {
    lines.push(`Location: ${address.location.lat}, ${address.location.lng}`);
  }
  lines.push(`${l.items}:`);
  for (const it of items) {
    const name = it.productName || it.productId;
    const size = it.sizeKg != null ? `${it.sizeKg}kg` : "";
    const qty = it.quantity != null ? `x${it.quantity}` : "";
    const unit = it.unitPrice != null ? `${it.unitPrice} ₾` : "";
    const ttl = it.lineTotal != null ? `${it.lineTotal} ₾` : "";
    lines.push(`- ${name} ${size} ${qty} @ ${unit} = ${ttl}`.replace(/\s+/g, " ").trim());
  }
  if (typeof order.total === "number") {
    lines.push(`${l.total}: ${order.total} ₾`);
  }
  return lines.join("\n");
}

function normalizeRecipientPhone(value) {
  if (!value) return "";
  const digits = String(value).replace(/\D/g, "");
  return digits; // Graph expects country code and number, no plus sign
}

function formatItemsMultiline(items) {
  if (!Array.isArray(items) || items.length === 0) return "";
  const lines = [];
  for (const it of items) {
    const name = it.productName || it.productId;
    const size = it.sizeKg != null ? `${it.sizeKg}kg` : "";
    const qty = it.quantity != null ? `x${it.quantity}` : "";
    const unit = it.unitPrice != null ? `${it.unitPrice}` : "";
    const ttl = it.lineTotal != null ? `${it.lineTotal}` : "";
    lines.push(`• ${name} ${size} ${qty} @ ${unit} = ${ttl}`.replace(/\s+/g, " ").trim());
  }
  return lines.join("\n");
}

function getParamValue(token, order, createdAtStr) {
  const customer = order.customer || {};
  const address = order.address || {};
  const loc = address.location || {};
  switch (token) {
    case "orderId":
      return String(order.id || "");
    case "date":
      return createdAtStr;
    case "customerName":
      return `${customer.firstName || ""} ${customer.lastName || ""}`.trim();
    case "customerFirstName":
      return String(customer.firstName || "");
    case "customerLastName":
      return String(customer.lastName || "");
    case "customerPhone":
      return String(customer.phone || "");
    case "addressText":
      return String(address.text || "");
    case "locationLat":
      return loc && typeof loc.lat === "number" ? String(loc.lat) : "";
    case "locationLng":
      return loc && typeof loc.lng === "number" ? String(loc.lng) : "";
    case "locationUrl":
      if (loc && typeof loc.lat === "number" && typeof loc.lng === "number") {
        return `https://maps.google.com/?q=${loc.lat},${loc.lng}`;
      }
      return "";
    case "items":
      return formatItemsMultiline(Array.isArray(order.items) ? order.items : []);
    case "itemsCount":
      return String((Array.isArray(order.items) ? order.items : []).length);
    case "total":
      return typeof order.total === "number" ? String(order.total) : "";
    case "currency":
      return WHATSAPP_CURRENCY;
    case "summary":
    default:
      return formatOrderText(order);
  }
}

export async function sendManagerOrderNotification(order) {
  if (!isConfigured()) {
    if (WHATSAPP_DEBUG) console.warn("WhatsApp not configured", whatsappConfigStatus());
    return { skipped: true, reason: "not_configured" };
  }

  const url = `https://graph.facebook.com/${WHATSAPP_GRAPH_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const text = formatOrderText(order);
  if (WHATSAPP_DEBUG) {
    console.log("WhatsApp preparing send", {
      to: normalizeRecipientPhone(WHATSAPP_MANAGER_PHONE),
      template: Boolean(WHATSAPP_TEMPLATE_NAME),
      textPreview: text.slice(0, 140)
    });
  }
  const body = WHATSAPP_TEMPLATE_NAME
    ? (() => {
        const createdAtStr = new Date(order.createdAt || Date.now()).toLocaleString("en-GB", { hour12: false });
        const components = [];
        if (WHATSAPP_TEMPLATE_HEADER_PARAM) {
          components.push({
            type: "header",
            parameters: [
              { type: "text", text: getParamValue(WHATSAPP_TEMPLATE_HEADER_PARAM, order, createdAtStr) }
            ]
          });
        }
        if (WHATSAPP_TEMPLATE_WITH_BODY) {
          if (WHATSAPP_TEMPLATE_BODY_PARAMS.length > 0) {
            components.push({
              type: "body",
              parameters: WHATSAPP_TEMPLATE_BODY_PARAMS.map((token) => ({
                type: "text",
                text: getParamValue(token, order, createdAtStr)
              }))
            });
          } else {
            components.push({
              type: "body",
              parameters: [{ type: "text", text }]
            });
          }
        }
        return {
          messaging_product: "whatsapp",
          to: normalizeRecipientPhone(WHATSAPP_MANAGER_PHONE),
          type: "template",
          template: {
            name: WHATSAPP_TEMPLATE_NAME,
            language: { code: WHATSAPP_TEMPLATE_LANG },
            ...(components.length > 0 ? { components } : {})
          }
        };
      })()
    : {
        messaging_product: "whatsapp",
        to: normalizeRecipientPhone(WHATSAPP_MANAGER_PHONE),
        type: "text",
        text: { body: text }
      };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      console.error("WhatsApp send failed", res.status, errorText);
      return { ok: false, status: res.status };
    }
    const data = await res.json().catch(() => ({}));
    if (WHATSAPP_DEBUG) console.log("WhatsApp send ok", data);
    return { ok: true, data };
  } catch (err) {
    console.error("WhatsApp send error", err);
    return { ok: false, error: String(err) };
  }
}

export function whatsappConfigStatus() {
  return {
    enabled: WHATSAPP_ENABLED,
    hasToken: Boolean(WHATSAPP_TOKEN),
    hasPhoneNumberId: Boolean(WHATSAPP_PHONE_NUMBER_ID),
    hasManagerPhone: Boolean(WHATSAPP_MANAGER_PHONE)
  };
}


