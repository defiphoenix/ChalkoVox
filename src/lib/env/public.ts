/**
 * Client-safe environment helpers.
 * Only NEXT_PUBLIC_* values are referenced here, so this module can be
 * imported from browser components without leaking server secrets.
 */

export interface SupabasePublicConfig {
  url: string;
  anonKey: string;
}

/** Returns Supabase browser credentials, or null when the app is not configured yet. */
export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  // Accept the current publishable key while keeping legacy anon-key setups working.
  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();

  if (!url || !anonKey) return null;
  if (!/^https?:\/\//.test(url) || anonKey.length < 20) return null;

  return { url, anonKey };
}

/** True when Supabase auth can be used in this environment. */
export function isSupabaseConfigured(): boolean {
  return getSupabasePublicConfig() !== null;
}
