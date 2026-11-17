# Step 2 — Supabase authentication

## Flow

1. `/login` or `/signup` renders the client `AuthForm` with credentials from `NEXT_PUBLIC_SUPABASE_*`.
2. Supabase browser client signs in with email/password. Sign-up requests a confirmation redirect to `/auth/callback`.
3. `src/middleware.ts` runs on `/tutor`, `/login`, `/signup`: refreshes cookies, redirects unauthenticated visitors to `/login?next=…`, and signed-in visitors away from auth pages.
4. `/auth/callback` exchanges a PKCE code or verifies an email OTP, then redirects to a sanitised internal path.
5. `/auth/signout` clears cookies via the server client and returns to `/login`.
6. The tutor page performs an additional server-side `getUser` check before rendering.

## Files

| File | Role |
| --- | --- |
| `src/lib/supabase/client.ts` | Singleton browser client |
| `src/lib/supabase/server.ts` | Cookie-bound server client + `getServerUser` |
| `src/lib/supabase/middleware.ts` | Session refresh and route redirects |
| `src/middleware.ts` | Matcher |
| `src/lib/auth/redirects.ts` | Open-redirect-safe `next` path |
| `src/components/auth/AuthForm.tsx` | Credential form and friendly errors |
| `src/app/login`, `src/app/signup` | Auth pages |
| `src/app/auth/callback`, `src/app/auth/signout` | Callback and logout routes |

## Behaviour details

- Missing configuration is shown as an explicit setup alert; the form is disabled rather than throwing.
- Email-confirmation projects show “check your inbox” instead of a false success.
- Errors such as invalid credentials, unconfirmed email and rate limits are translated into actionable copy.
- Redirect targets are rejected unless they are internal absolute paths; `//host` and `/\host` are blocked.

## Verification

Typecheck and production build pass. Redirect safety is covered by unit tests. A live Supabase sign-in could not be exercised because this environment has no project URL/key and no Docker/Supabase CLI; follow the README to attach a project.
