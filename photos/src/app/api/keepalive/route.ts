/**
 * Keep-alive ping. Supabase's free plan pauses a project after a week with no
 * activity — then the gallery can't load. Vercel calls this once a day
 * (see vercel.json "crons"), which counts as activity and keeps it awake.
 */
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const { count, error } = await getSupabaseAdmin()
    .from("media")
    .select("id", { count: "exact", head: true });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 503 });
  return NextResponse.json({ ok: true, count });
}
