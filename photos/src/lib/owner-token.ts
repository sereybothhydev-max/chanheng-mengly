/**
 * "Owner keys" let a guest delete ONLY what they uploaded — no accounts needed.
 *
 * When an upload finishes, the server hands the guest's phone one key per
 * photo: an HMAC signature of the photo's id, made with a server-only secret.
 * The phone keeps those keys in its own storage. To delete, the phone sends
 * the id + key back; we re-sign the id and only delete if it matches.
 *
 * Nobody else can produce a valid key without the server secret, so guests
 * can't delete each other's photos. Nothing extra is stored in the database.
 */
import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

function key(): Buffer {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createHash("sha256").update(`media-owner::${secret}`).digest();
}

export function ownerToken(mediaId: string): string {
  return createHmac("sha256", key()).update(mediaId).digest("base64url");
}

export function isValidOwnerToken(mediaId: string, token: unknown): boolean {
  if (typeof token !== "string" || token.length > 100) return false;
  const expected = createHash("sha256").update(ownerToken(mediaId)).digest();
  const given = createHash("sha256").update(token).digest();
  return timingSafeEqual(expected, given);
}
