/**
 * Supabase client for the SERVER ONLY. Uses the secret (service-role) key,
 * which bypasses Row Level Security. The `server-only` import makes the build
 * fail if this file is ever accidentally imported into browser code.
 */
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !secret) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }
    admin = createClient(url, secret, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return admin;
}
