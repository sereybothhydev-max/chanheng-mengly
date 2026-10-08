/**
 * Admin login / logout.
 *   POST   /api/admin/session  { password }  → sets the session cookie
 *   DELETE /api/admin/session                → logs out
 */
import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  isCorrectPassword,
} from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: unknown };

  if (!isCorrectPassword(password)) {
    // Small delay makes guessing passwords painfully slow.
    await new Promise((r) => setTimeout(r, 900));
    return NextResponse.json({ error: "ពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ។" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createSessionToken(), {
    httpOnly: true, // JavaScript can't read it
    secure: process.env.NODE_ENV === "production", // HTTPS only on the live site
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
