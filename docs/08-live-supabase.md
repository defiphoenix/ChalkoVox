# Step 8 — Live Supabase integration

**Status:** Done
**Project:** `chalkline` — `lpmzaqadgkoehafzfxtw`
**Dashboard:** https://supabase.com/dashboard/project/lpmzaqadgkoehafzfxtw
**Region:** South Asia (Mumbai) · `ap-south-1`
**Organization:** VizzApps (`cpetbscxeibgkvxkcisp`)

## What changed

- Created a live Supabase project and linked it to this repository with `supabase link`.
- Added `supabase/config.toml`, pulled from the hosted project, so auth URL settings are versioned.
- Configured Auth:
  - Site URL: `http://localhost:3000`
  - Additional redirect URLs:
    - `http://localhost:3000/auth/callback`
    - `http://127.0.0.1:3000/auth/callback`
  - Email/password sign-in remains enabled; email confirmation remains required.
- Added `.env.local` with the project URL and the **publishable** key under
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Legacy anon keys remain supported; the env helper
  also accepts `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Ignored local Supabase secrets and CLI state in `.gitignore`.

## Configuration commands

Run from the repository root:

```bash
npx supabase@latest link --project-ref lpmzaqadgkoehafzfxtw
npx supabase@latest config diff      # preview hosted vs local auth config
npx supabase@latest config push --yes
```

Change `supabase/config.toml` first, review with `config diff`, then push. Add the
production origin and `https://YOUR_DOMAIN/auth/callback` to both `site_url` and
`additional_redirect_urls` before deploying.

`.env.local` is intentionally untracked. The database password created during
provisioning is stored in `.supabase-db-password` (also untracked); move it to a
password manager and delete the file once recorded.

## Verification performed

| Check | Result |
| --- | --- |
| Project status | `ACTIVE_HEALTHY` |
| GoTrue settings reachable with publishable key | 200 |
| Hosted/local auth config diff | no differences |
| Valid email/password sign-in | reached `/tutor`, email rendered in header |
| Invalid password | friendly `Email or password is incorrect.` message |
| Session persistence | `/tutor` reload returned 200 |
| Cookie refresh middleware | unauth `/tutor` redirected to `/login?next=/tutor` |
| Sign-out | `POST /auth/signout` → 303 → `/login`; `/tutor` redirected again |
| Callback URL allow-list | `http://localhost:3000/auth/callback` accepted |

A temporary confirmed user was created through the Auth admin API for the
end-to-end check, then deleted (`lookup_after_delete = 404`). No test credentials
or service keys remain in the repository.

## Still required

OpenRouter and Deepgram keys are not present. Lesson generation, chat, and voice
will return `503 AI_NOT_CONFIGURED` until those values are added to `.env.local`.
Supabase authentication itself is live.
