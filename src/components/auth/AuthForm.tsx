/**
 * Email + password auth form powered by Supabase.
 * Handles sign-in, sign-up, email confirmation messaging and safe redirects.
 */
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface AuthFormProps {
  mode: "login" | "signup";
  configured: boolean;
  nextPath: string;
}

/** Translates common Supabase auth errors into learner-friendly copy. */
function friendlyAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return "Email or password is incorrect.";
  if (/email not confirmed/i.test(message)) return "Confirm your email first — check your inbox for the link.";
  if (/user already registered/i.test(message)) return "An account with this email already exists. Sign in instead.";
  if (/password should be at least/i.test(message)) return "Use a password with at least 6 characters.";
  if (/rate limit/i.test(message)) return "Too many attempts. Wait a minute and try again.";
  return message;
}

export function AuthForm({ mode, configured, nextPath }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";

  /** Submits credentials and routes the learner into the studio. */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured) {
      setError("Supabase is not configured. Add the two NEXT_PUBLIC_SUPABASE values to .env.local.");
      return;
    }
    if (password.length < 6) {
      setError("Use a password with at least 6 characters.");
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const supabase = getSupabaseBrowserClient();

      if (isSignup) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
          },
        });

        if (signUpError) {
          setError(friendlyAuthError(signUpError.message));
          return;
        }

        if (data.session) {
          router.replace(nextPath);
          router.refresh();
          return;
        }

        setNotice("Check your inbox to confirm your email, then return here to sign in.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(friendlyAuthError(signInError.message));
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign-in failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const switchHref = `${isSignup ? "/login" : "/signup"}?next=${encodeURIComponent(nextPath)}`;

  return (
    <>
      {!configured ? (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          Supabase auth is not configured. Copy <code>.env.example</code> to <code>.env.local</code> and add your
          project URL and anon key.
        </div>
      ) : null}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={busy}
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            placeholder={isSignup ? "At least 6 characters" : "Your password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            disabled={busy}
          />
        </div>

        {error ? <div className="alert alert-error" role="alert">{error}</div> : null}
        {notice ? <div className="alert alert-info" role="status">{notice}</div> : null}

        <button className="btn btn-primary" type="submit" disabled={busy || !configured}>
          {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
        </button>
      </form>

      <p className="auth-switch">
        {isSignup ? "Already have an account? " : "New to Chalkovox? "}
        <Link href={switchHref}>{isSignup ? "Sign in" : "Create one"}</Link>
      </p>
    </>
  );
}
