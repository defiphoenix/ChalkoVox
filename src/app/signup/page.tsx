/**
 * Sign-up page. Email confirmation redirects back through /auth/callback.
 */
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { safeNextPath } from "@/lib/auth/redirects";
import { isSupabaseConfigured } from "@/lib/env/public";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;

  return <AuthCard mode="signup" configured={isSupabaseConfigured()} nextPath={safeNextPath(next)} />;
}
