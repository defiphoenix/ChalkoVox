/**
 * Server-side Supabase access for Server Components, Route Handlers and
 * Server Actions. Cookies are the source of truth for the session.
 */
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/env/public";

/**
 * Builds a Supabase server client bound to the current request cookies.
 * Returns null when Supabase env vars are absent so pages can render a
 * setup notice instead of crashing during local development.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient | null> {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  const cookieStore = await cookies();

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. Middleware refreshes the
          // session instead, so this is safe to ignore.
        }
      },
    },
  });
}

/** Resolves the signed-in user, or null when unauthenticated/unconfigured. */
export async function getServerUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}
