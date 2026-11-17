# Step 9 — Live Deepgram voice integration

**Status:** Done
**Provider:** Deepgram Nova-3 (speech-to-text) and Aura (`aura-asteria-en`, text-to-speech)

## What changed

- Added `DEEPGRAM_API_KEY` to `.env.local` (untracked). It is read only by
  `src/lib/env/server.ts` and is never exposed through `NEXT_PUBLIC_*`.
- No client or API contract changed. The existing routes now have a working provider key.

## Verification performed

| Check | Result |
| --- | --- |
| Key authorization (`GET /v1/projects`) | 200 |
| Live client TTS → STT round trip | passed in 2.8s |
| `POST /api/voice/speak` with a signed-in session | 200, `audio/mpeg`, 16,614 bytes |
| `POST /api/voice/transcribe` with that audio | 200, transcript returned |
| Unauthenticated `POST /api/voice/speak` | 401 |
| Unauthenticated `POST /api/voice/transcribe` | 401 |
| Temporary test user | deleted; project has 0 users |

The synthesized sentence was transcribed as “Shockline voice route check. The
whiteboard is ready.” — Aura’s pronunciation of “Chalkline” is imperfect, but the
round trip, audio type, route authentication and transcript parsing all work.

## Remaining provider

OpenRouter is still unconfigured. Lesson generation and chat return
`503 AI_NOT_CONFIGURED` until `OPENROUTER_API_KEY` is added to `.env.local`.

## Security note

The Deepgram key was supplied in chat. Consider rotating it in the Deepgram
console after local testing. Rotate by creating a new key, updating `.env.local`,
restarting the dev server, then deleting the old key.
