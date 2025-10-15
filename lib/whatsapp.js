import prisma from "@/lib/prisma";

const WHATSAPP_ENABLED = process.env.WHATSAPP_ENABLED === "true";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const WHATSAPP_MANAGER_PHONE = process.env.WHATSAPP_MANAGER_PHONE || ""; // env fallback
const WHATSAPP_TEMPLATE_NAME = process.env.WHATSAPP_TEMPLATE_NAME || "";
const WHATSAPP_TEMPLATE_LANG = process.env.WHATSAPP_TEMPLATE_LANG || "en_US";
const WHATSAPP_TEMPLATE_WITH_BODY = process.env.WHATSAPP_TEMPLATE_WITH_BODY === "true";
const WHATSAPP_GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v22.0";
const WHATSAPP_DEBUG = process.env.WHATSAPP_DEBUG === "true";
const WHATSAPP_FORCE_PLAINTEXT = process.env.WHATSAPP_FORCE_PLAINTEXT === "true";
const WHATSAPP_TEMPLATE_BODY_PARAMS = (process.env.WHATSAPP_TEMPLATE_BODY_PARAMS || "").split(",").map((s) => s.trim()).filter(Boolean);
const WHATSAPP_TEMPLATE_HEADER_PARAM = (process.env.WHATSAPP_TEMPLATE_HEADER_PARAM || "").trim();
const WHATSAPP_CURRENCY = (process.env.WHATSAPP_CURRENCY || "GEL").trim();
const WHATSAPP_SUMMARY_LANG = (process.env.WHATSAPP_SUMMARY_LANG || "en").trim();

function isConfigured() {
  return (
    WHATSAPP_ENABLED &&
    Boolean(WHATSAPP_TOKEN) &&
    Boolean(WHATSAPP_PHONE_NUMBER_ID)
  );
}

function formatOrderText(order) {
  const createdAt = new Date(order.createdAt || Date.now()).toLocaleString("en-GB", { hour12: false });
  const customer = order.customer || {};
  const address = order.address || {};
  const items = Array.isArray(order.items) ? order.items : [];

  const l = WHATSAPP_SUMMARY_LANG === "ka"
    ? {
        newOrder: "შეკვეთა",
        date: "თარიღი",
        customer: "მომხმარებელი",
        phone: "საკონტაქტო ნომერი",
        address: "მისამართი",
        items: "შეკვეთის ჩამონათვალი",
        total: "საბოლოო თანხა გადასახდელად",
        gel: "GEL"
      }
    : {
        newOrder: "Order",
        date: "Date",
        customer: "Customer",
        phone: "Phone",
        address: "Address",
        items: "Items",
        total: "Total",
        gel: "GEL"
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
    const unit = it.unitPrice != null ? `${it.unitPrice} ${l.gel}` : "";
    const ttl = it.lineTotal != null ? `${it.lineTotal} ${l.gel}` : "";
    lines.push(`\n• ${name} ${size} ${qty} @ ${unit} = ${ttl}`.replace(/\s+/g, " ").trim());
  }
  if (typeof order.total === "number") {
    lines.push(`\n${l.total}: ${order.total} ${l.gel}`);
  }
  return lines.join("\n");
}

function normalizeRecipientPhone(value) {
  if (!value) return "";
  const digits = String(value).replace(/\D/g, "");
  // If local Georgian mobile (e.g., 598xxxxxx), prefix with country code 995
  if (digits.length === 9 && digits.startsWith("5")) {
    return "995" + digits;
  }
  // Already includes 995 country code
  if (digits.length === 12 && digits.startsWith("995")) {
    return digits;
  }
  // Default: return digits (Graph expects no plus sign, country code + number)
  return digits;
}

function formatItemsMultiline(items) {
  if (!Array.isArray(items) || items.length === 0) return "";
  const lines = [];
  for (const it of items) {
    const name = it.productName || it.productId;
    const size = it.sizeKg != null ? `${it.sizeKg}kg` : "";
    const qty = it.quantity != null ? `x${it.quantity}` : "";
    const unit = it.unitPrice != null ? `${it.unitPrice} GEL` : "";
    const ttl = it.lineTotal != null ? `${it.lineTotal} GEL` : "";
    lines.push(`\n• ${name} ${size} ${qty} @ ${unit} = ${ttl}`.replace(/\s+/g, " ").trim());
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

function sanitizeParamText(value) {
  // WhatsApp template params cannot contain newlines/tabs or >4 spaces in a row
  // We remove newlines/tabs and collapse whitespace to single spaces, then trim and cap length
  const s = String(value ?? "");
  const noNewlines = s.replace(/[\r\n\t]+/g, " ");
  const collapsed = noNewlines.replace(/\s+/g, " ");
  return collapsed.trim().slice(0, 1024);
}

export async function sendManagerOrderNotification(order) {
  if (!isConfigured()) {
    if (WHATSAPP_DEBUG) console.warn("WhatsApp not configured", whatsappConfigStatus());
    return { skipped: true, reason: "not_configured" };
  }

  // Resolve recipients from DB settings with env and legacy fallbacks
  let recipients = [];
  try {
    const rows = await prisma.setting.findMany({ where: { key: { in: ["whatsappManagerPhones", "whatsappManagerPhone"] } } });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const phonesValue = map.whatsappManagerPhones;
    if (Array.isArray(phonesValue)) {
      for (const v of phonesValue) {
        if (typeof v === "string" && v.trim()) recipients.push(v.trim());
        else if (v && typeof v === "object" && v.phone) recipients.push(String(v.phone));
      }
    }
    const singleValue = map.whatsappManagerPhone;
    if (typeof singleValue === "string" && singleValue.trim()) recipients.push(singleValue.trim());
    else if (singleValue && typeof singleValue === "object" && singleValue.phone) recipients.push(String(singleValue.phone));
  } catch {}
  if (WHATSAPP_MANAGER_PHONE) recipients.push(WHATSAPP_MANAGER_PHONE);

  // Normalize and dedupe
  const normalized = Array.from(new Set(recipients
    .map((p) => normalizeRecipientPhone(p))
    .filter((p) => Boolean(p))
  ));

  if (normalized.length === 0) {
    if (WHATSAPP_DEBUG) console.warn("WhatsApp recipient phones missing (settings/env)" );
    return { skipped: true, reason: "no_recipient" };
  }

  const url = `https://graph.facebook.com/${WHATSAPP_GRAPH_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const text = formatOrderText(order);
  if (WHATSAPP_DEBUG) {
    console.log("WhatsApp preparing send", {
      to: normalized,
      template: Boolean(WHATSAPP_TEMPLATE_NAME),
      textPreview: text.slice(0, 140)
    });
  }

  const createdAtStr = new Date(order.createdAt || Date.now()).toLocaleString("en-GB", { hour12: false });
  const components = [];
  if (WHATSAPP_TEMPLATE_HEADER_PARAM) {
    components.push({
      type: "header",
      parameters: [
        { type: "text", text: sanitizeParamText(getParamValue(WHATSAPP_TEMPLATE_HEADER_PARAM, order, createdAtStr)) }
      ]
    });
  }
  if (WHATSAPP_TEMPLATE_WITH_BODY) {
    if (WHATSAPP_TEMPLATE_BODY_PARAMS.length > 0) {
      components.push({
        type: "body",
        parameters: WHATSAPP_TEMPLATE_BODY_PARAMS.map((token) => ({
          type: "text",
          text: sanitizeParamText(getParamValue(token, order, createdAtStr))
        }))
      });
    } else {
      components.push({ type: "body", parameters: [{ type: "text", text: sanitizeParamText(text) }] });
    }
  }

  const makeBody = (to) => (
    (WHATSAPP_TEMPLATE_NAME && !WHATSAPP_FORCE_PLAINTEXT)
      ? {
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: WHATSAPP_TEMPLATE_NAME,
            language: { code: WHATSAPP_TEMPLATE_LANG },
            ...(components.length > 0 ? { components } : {})
          }
        }
      : {
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: text }
        }
  );

  try {
    const sendOne = async (to) => {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(makeBody(to))
      });
      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        if (WHATSAPP_DEBUG) console.error("WhatsApp send failed", to, res.status, errorText);
        return { ok: false, status: res.status };
      }
      const data = await res.json().catch(() => ({}));
      if (WHATSAPP_DEBUG) console.log("WhatsApp send ok", to, data);
      // If a template was used (and not forcing plaintext), follow up with a plain-text list of items with newlines
      if (WHATSAPP_TEMPLATE_NAME && !WHATSAPP_FORCE_PLAINTEXT) {
        const itemsHeader = WHATSAPP_SUMMARY_LANG === "ka" ? "შეკვეთის ჩამონათვალი:" : "Items:";
        const items = Array.isArray(order.items) ? order.items : [];
        const lines = [itemsHeader];
        for (const it of items) {
          const name = it.productName || it.productId;
          const size = it.sizeKg != null ? `${it.sizeKg}kg` : "";
          const qty = it.quantity != null ? `x${it.quantity}` : "";
          const unit = it.unitPrice != null ? `${it.unitPrice} GEL` : "";
          const ttl = it.lineTotal != null ? `${it.lineTotal} GEL` : "";
          lines.push(`• ${name} ${size} ${qty} @ ${unit} = ${ttl}`.replace(/\s+/g, " ").trim());
        }
        const itemsText = lines.join("\n");
        const res2 = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${WHATSAPP_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { body: itemsText }
          })
        });
        if (!res2.ok && WHATSAPP_DEBUG) {
          const errorText2 = await res2.text().catch(() => "");
          console.error("WhatsApp items follow-up failed", to, res2.status, errorText2);
        }
      }
      return { ok: true, data };
    };

    const results = await Promise.allSettled(normalized.map((to) => sendOne(to)));
    const flattened = results.map((r) => (r.status === "fulfilled" ? r.value : { ok: false, error: String(r.reason) }));
    const allOk = flattened.every((r) => r.ok);
    return { ok: allOk, results: flattened };
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


