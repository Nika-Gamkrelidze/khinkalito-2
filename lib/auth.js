import { createHmac, randomBytes } from "crypto";

const SESSION_COOKIE_NAME = "admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

function getSecret() {
  return process.env.ADMIN_SECRET || "change-me-in-env";
}

export function hashPassword(plain) {
  const salt = randomBytes(16).toString("hex");
  const h = createHmac("sha256", salt).update(String(plain)).digest("hex");
  return `${salt}:${h}`;
}

export function verifyPassword(plain, stored) {
  if (!stored || typeof stored !== "string" || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const h = createHmac("sha256", salt).update(String(plain)).digest("hex");
  return h === hash;
}

function sign(message) {
  return createHmac("sha256", getSecret()).update(message).digest("hex");
}

export function createSessionValue(userId) {
  const payload = { uid: userId, iat: Date.now(), exp: Date.now() + SESSION_TTL_MS };
  const base = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = sign(base);
  return `${base}.${sig}`;
}

export function parseSessionValue(value) {
  if (!value || typeof value !== "string" || !value.includes(".")) return null;
  const [base, sig] = value.split(".");
  if (sign(base) !== sig) return null;
  try {
    const payload = JSON.parse(Buffer.from(base, "base64url").toString("utf8"));
    if (!payload || typeof payload !== "object") return null;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function buildSessionCookieHeader(value) {
  // HttpOnly, Lax to allow same-site navigation
  const parts = [
    `${SESSION_COOKIE_NAME}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  // 12h expiry
  const expires = new Date(Date.now() + SESSION_TTL_MS).toUTCString();
  parts.push(`Expires=${expires}`);
  return parts.join("; ");
}

export function buildClearSessionCookieHeader() {
  const parts = [
    `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
  ];
  if (process.env.NODE_ENV === "production") parts[0] += "; Secure";
  return parts[0];
}

export function getUserFromRequestCookies(request) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.split(/;\s*/).find((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));
  if (!match) return null;
  const value = match.split("=")[1];
  const payload = parseSessionValue(value);
  if (!payload) return null;
  return { id: payload.uid };
}

export function requireAdmin(request) {
  const user = getUserFromRequestCookies(request);
  if (!user) return null;
  return user;
}


