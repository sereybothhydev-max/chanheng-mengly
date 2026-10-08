/**
 * Tiny, dependency-free admin login.
 *
 * - The couple types ADMIN_PASSWORD on /admin.
 * - We set an httpOnly cookie containing "<expiry>.<signature>".
 * - The signature is an HMAC keyed by the password + the Supabase secret key,
 *   so the cookie can't be forged, and changing ADMIN_PASSWORD instantly logs
 *   out every existing session.
 */
import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "wedding_admin_session";
const SESSION_DAYS = 14;
export const SESSION_MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60;

function signingKey(): Buffer {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!password || !secret) {
    throw new Error("ADMIN_PASSWORD and SUPABASE_SERVICE_ROLE_KEY must both be set");
  }
  return createHash("sha256").update(`${password}::${secret}`).digest();
}

function sign(value: string): string {
  return createHmac("sha256", signingKey()).update(value).digest("base64url");
}

/** Constant-time string comparison (prevents timing attacks). */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function isCorrectPassword(input: unknown): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || typeof input !== "string") return false;
  return safeEqual(input, password);
}

export function createSessionToken(): string {
  const expires = String(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  return `${expires}.${sign(expires)}`;
}

export function isValidSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature) return false;
  if (!(Number(expires) > Date.now())) return false;
  try {
    return safeEqual(signature, sign(expires));
  } catch {
    return false;
  }
}

/** Use in server components and API routes: `if (!(await isAdmin())) …` */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return isValidSessionToken(store.get(ADMIN_COOKIE)?.value);
}
