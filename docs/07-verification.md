# Step 7 — Verification and delivery

## Checks run

| Check | Command | Result |
| --- | --- | --- |
| TypeScript | `npx tsc --noEmit` | Pass |
| Unit/API tests | `npm test` | 52/52 pass |
| Production build | `npm run build` | Pass (Next 15.5.29) |
| Request logging | `curl` against the dev server | Page + API JSONL entries in `logs/`; 401 captured with `errorCode`; `x-request-id` echoed |
| Route protection | `curl` against production server | `/api/lesson`, `/api/chat`, both voice routes return 401; `/tutor` redirects to `/login?next=/tutor` |
| Visual QA | Headless Edge, 1440×1000 | Landing, login, studio captured in `docs/screenshots/` |

## What was visually reviewed

- Landing hierarchy, hero line breaks, preview board and feature cards.
- Auth card, configuration alert, form states, back-link layout.
- Studio: sidebar map/progress, breadcrumb, animated board, narration, chat, voice/send controls, footer actions.
- Duplicated board titles, the headline orphan and the auth link placement were fixed after review.

## Verification limits

At the time of step 7 this workspace had no Supabase credentials, so the hosted login round-trip was not executed. **Step 8 superseded that gap:** a live project was created, linked, and the hosted sign-in, invalid-credential, session, route-guard and sign-out paths were verified. See [08-live-supabase.md](08-live-supabase.md).

Deepgram was added in step 9 and verified live (Aura TTS → Nova STT, authenticated routes, 401 guards). An OpenAI-compatible AI gateway was configured in step 10, but its account has no balance, so live lesson/chat inference is still blocked with 402. The mocked tests cover malformed output, rate limits, payment errors and provider failures.

## Required environment

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=google/gemini-2.5-flash
DEEPGRAM_API_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Supabase URL configuration must include `http://localhost:3000/auth/callback` as an allowed redirect URL. No database tables are required.
