# Build plan — Chalkovox

**Goal:** an AI-powered interactive whiteboard tutor. The learner names a topic, receives a short visual lesson (3–5 animated boards), listens to narration, takes quick checks, and asks follow-up questions by text or voice.

**Constraints:** TypeScript, Next.js App Router, Supabase Auth, OpenRouter for AI, Deepgram for voice, modular code, tests for every API feature, documentation per completed step.

## Architecture

| Layer | Location | Responsibility |
| --- | --- | --- |
| Pages | `src/app` | Landing, auth, protected studio; server-side session checks |
| UI modules | `src/components` | Brand, auth, whiteboard, tutor, chat, quiz, voice hooks |
| AI contracts | `src/lib/lesson` | Zod schema, prompts, generation service, demo lesson |
| Providers | `src/lib/ai`, `src/lib/deepgram` | OpenRouter and Deepgram clients, isolated from UI |
| Auth | `src/lib/supabase`, `src/middleware.ts` | Browser/server clients, middleware refresh, route gating |
| Logging | `src/lib/logging`, `src/middleware.ts` | JSONL request logs, redaction, daily rotation |
| API | `src/app/api` | Lesson, chat stream, transcription, speech |
| Tests | `tests` | Schema, provider, route and logging tests (52 cases) |

## Steps and completion documents

| # | Step | Status | Document |
| --- | --- | --- | --- |
| 1 | Scaffold Next.js, design system, env contract | Done | [01-scaffold.md](01-scaffold.md) |
| 2 | Supabase login, signup, callback, middleware | Done | [02-authentication.md](02-authentication.md) |
| 3 | OpenRouter lesson + streaming chat | Done | [03-ai-backend.md](03-ai-backend.md) |
| 4 | Whiteboard tutor UI, checks, progress | Done | [04-whiteboard-ui.md](04-whiteboard-ui.md) |
| 5 | Deepgram speech-to-text and text-to-speech | Done | [05-voice.md](05-voice.md) |
| 6 | API and provider tests, validated | Done | [06-tests.md](06-tests.md) |
| 7 | Typecheck, build, visual QA, docs | Done | [07-verification.md](07-verification.md) |
| 8 | Live Supabase project, auth URLs, live login test | Done | [08-live-supabase.md](08-live-supabase.md) |
| 9 | Live Deepgram voice key, TTS/STT route check | Done | [09-live-deepgram.md](09-live-deepgram.md) |
| 10 | Configurable AI gateway, live billing check | Configured; blocked by balance | [10-live-ai-gateway.md](10-live-ai-gateway.md) |
| 11 | JSONL request logging to file | Done | [11-request-logging.md](11-request-logging.md) |

## Key decisions

- **Stateless lessons.** Generated lessons live in client state for the session; no database or RLS setup is required. Supabase is used strictly for authentication.
- **Validated AI output.** The model returns JSON that is parsed by Zod before it reaches the renderer. One repair attempt is made when validation fails.
- **Bounded whiteboard language.** Only seven primitive element types on a fixed 1000×600 canvas; no arbitrary SVG or HTML from the model.
- **One speaker.** A single `useSpeech` instance per workspace prevents overlapping narration and chat audio.
- **Streaming answers.** Chat uses OpenRouter SSE converted to a plain-text stream, so the UI renders tokens live without a custom protocol.
- **Server-only secrets.** Only `NEXT_PUBLIC_SUPABASE_*` reaches the browser; provider keys are read in server modules only.
- **Metadata-only logs.** Request logs record method, pathname, status, duration and error code — never headers, cookies, query strings or bodies.

## Non-goals

Lesson persistence, social features, billing, multi-language narration, and drawing tools with freehand input are intentionally out of scope. The board is generated and navigated, not hand-drawn by the learner.
