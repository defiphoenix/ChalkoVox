# Step 5 — Deepgram voice

## Speech to text

- `useVoiceRecorder` requests microphone access, records up to 45 seconds with MediaRecorder, then uploads `FormData` to `POST /api/voice/transcribe`.
- Supported recording types: webm (Opus), ogg, mp4 (Safari), plus wav/mp3 uploads on the route.
- The route is authenticated, caps uploads at 12 MB, validates MIME type and forwards the raw audio to Deepgram `nova-3` with punctuation and smart formatting.
- The transcript is inserted into the chat composer for review; it is not sent automatically.
- Empty speech, denied permissions, provider failures and unsupported audio are surfaced as readable errors.

## Text to speech

- `useSpeech` posts text to `POST /api/voice/speak`; the route calls Deepgram Aura (`aura-asteria-en`) and returns `audio/mpeg`.
- One hook instance is shared by the board narration and chat answers, so playback never overlaps. Text is capped at 600 characters (the route limit).
- Per-step Listen buttons toggle to Stop; each tutor message has a Listen action.

## Files

`src/components/voice/useVoiceRecorder.ts`, `src/components/voice/useSpeech.ts`, `src/app/api/voice/transcribe/route.ts`, `src/app/api/voice/speak/route.ts`, `src/lib/deepgram/client.ts`.

## Notes

Mic access requires HTTPS or localhost. No audio is stored. Without `DEEPGRAM_API_KEY`, transcriptions and narration return a 503 with a configuration message while text chat continues to work.

Live provider verification is recorded in [09-live-deepgram.md](09-live-deepgram.md): Aura TTS → Nova STT round trip passed, authenticated voice routes returned 200, and unauthenticated calls returned 401.
