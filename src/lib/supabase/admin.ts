import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Secret-key client for storage only. Every database read and write goes
 * through the signed-in user's client so RLS and quotas still apply.
 */
export function createStorageAdmin() {
  const key = process.env.SNIPPETS_SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SNIPPETS_SUPABASE_SECRET_KEY is not set");
  return createClient(process.env.NEXT_PUBLIC_SNIPPETS_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).storage;
}
