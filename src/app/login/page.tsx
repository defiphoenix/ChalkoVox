/**
 * Sign-in page. Reads the safe post-login destination from the query string.
 */
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { safeNextPath } from "@/lib/auth/redirects";
import { isSupabaseConfigured } from "@/lib/env/public";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; error?: string | string[] }>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const error = typeof params.error === "string" ? params.error : undefined;

  const initialError =
    error === "auth_callback_failed"
      ? "That confirmation link is invalid or has expired. Request a new one by signing in again."
      : null;

  return (
    <AuthCard
      mode="login"
      configured={isSupabaseConfigured()}
      nextPath={safeNextPath(next)}
      initialError={initialError}
    />
  );
}
