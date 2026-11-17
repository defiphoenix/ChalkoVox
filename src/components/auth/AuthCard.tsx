/**
 * Shared auth page frame.
 * Server-rendered shell around the client credential form.
 */
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Wordmark } from "@/components/brand/Wordmark";

interface AuthCardProps {
  mode: "login" | "signup";
  configured: boolean;
  nextPath: string;
  initialError?: string | null;
}

export function AuthCard({ mode, configured, nextPath, initialError }: AuthCardProps) {
  const isSignup = mode === "signup";

  return (
    <div className="auth-page">
      <main className="auth-card">
        <Wordmark />
        <Link className="auth-back" href="/">
          <ArrowLeft size={13} /> Back to home
        </Link>

        <h1>{isSignup ? "Create your studio" : "Welcome back"}</h1>
        <p className="auth-sub">
          {isSignup
            ? "One account for lessons, whiteboards and voice. Start with any topic you want to understand."
            : "Sign in to open your whiteboard studio and continue learning."}
        </p>

        {initialError ? (
          <div className="alert alert-error" role="alert" style={{ marginBottom: 16 }}>
            {initialError}
          </div>
        ) : null}

        <AuthForm mode={mode} configured={configured} nextPath={nextPath} />

        <p className="auth-tip">
          {isSignup
            ? "If email confirmation is enabled in Supabase, confirm your address before your first lesson."
            : "Sessions are stored in secure cookies and refreshed by middleware on every visit."}
        </p>
      </main>
    </div>
  );
}
