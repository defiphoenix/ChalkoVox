/**
 * Browser Supabase client.
 * A single instance is reused so auth state is shared across components.
 */
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/env/public";

let browserClient: SupabaseClient | null = null;

/** Creates (or reuses) the Supabase browser client. Throws if env is missing. */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const config = getSupabasePublicConfig();
  if (!config) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  browserClient = createBrowserClient(config.url, config.anonKey);
  return browserClient;
}
