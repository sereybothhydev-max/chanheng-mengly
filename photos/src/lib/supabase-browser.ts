/**
 * Supabase client for the BROWSER. Uses the public (publishable/anon) key,
 * so it can only do what RLS allows: read the gallery + listen for changes.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { STORAGE_BUCKET } from "./config";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — see .env.example",
      );
    }
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

/**
 * Public CDN URL of a file in the bucket.
 * Pass `download` to make the browser save it instead of opening it.
 */
export function publicUrl(path: string, opts?: { download?: string }): string {
  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
  return opts?.download ? `${base}?download=${encodeURIComponent(opts.download)}` : base;
}
