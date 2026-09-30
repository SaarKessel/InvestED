import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// The publishable key is public by design (row-level security protects the data).
const URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "https://yltbcsmkpjosyovsvtmn.supabase.co";
const KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ?? "sb_publishable_mmnIVK2ZxZ79gcqSrER-Aw_UxV5WF9q";

let client: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient {
  client ??= createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  return client;
}
