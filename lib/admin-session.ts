import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_SESSION_COOKIE = "valorant_admin_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function getSecret() {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error("Missing ADMIN_PASSWORD");
  }
  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createAdminSessionToken() {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${expiresAt}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifyAdminSessionToken(token: string | undefined | null) {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  let expected: Buffer;
  let actual: Buffer;
  try {
    expected = Buffer.from(sign(payload));
    actual = Buffer.from(signature);
  } catch {
    return false;
  }
  if (expected.length !== actual.length) return false;
  if (!timingSafeEqual(expected, actual)) return false;

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  return true;
}
