# Step 3 — OpenRouter lesson generation and tutor chat

## Lesson generation

`POST /api/lesson` is authenticated, validates `{ topic, level }` with Zod, then calls `generateLesson`:

1. Build a constrained prompt (`src/lib/ai/prompts.ts`) asking for 3–5 steps, 3–8 board elements each, at least two checks, and fixed canvas coordinates.
2. Send the minimal chat-completions request — `{ model, messages }` — to `${OPENROUTER_BASE_URL}/chat/completions`. The default base is `https://openrouter.ai/api/v1`; proxies such as `https://api.apinex.bond/v1` are supported. No temperature, token cap, or response-format fields are sent.
3. Parse the content defensively (handles fenced JSON and stray prose).
4. Validate with `lessonSchema`. On failure, retry once with a repair instruction and the first validation issue.
5. Return `{ lesson }`.

The board contract supports only `text`, `line`, `arrow`, `circle`, `rect`, `dot`, and `path`, with bounded coordinates, colours and path characters. This keeps the renderer safe and deterministic. The prompt forbids repeating the step title on the canvas because the UI renders it above the board.

## Chat

`POST /api/chat` accepts 1–12 messages plus optional lesson context and step index. The system prompt is grounded in the lesson title, summary, current step title and narration. OpenRouter is called with `stream: true`; its SSE deltas are converted by `createContentStream` into a plain UTF-8 stream returned to the browser.

The client `useTutorChat` hook:
- appends the learner turn optimistically and a pending tutor bubble,
- reads the response with `getReader()`,
- updates the pending bubble per chunk,
- supports stop, error handling and reset on a new lesson.

## Error model

| Condition | HTTP |
| --- | --- |
| No session | 401 |
| Invalid input | 400 |
| Provider rate limit | 429 |
| Provider balance exhausted | 402 (`AI_PAYMENT_REQUIRED`) |
| Missing server key | 503 |
| Provider/invalid model output | 502 |

## Files

`src/lib/lesson/schema.ts`, `src/lib/ai/openrouter.ts`, `src/lib/ai/prompts.ts`, `src/lib/lesson/service.ts`, `src/app/api/lesson/route.ts`, `src/app/api/chat/route.ts`, `src/components/chat/useTutorChat.ts`.

## Notes

Lessons are session-only by design. No lesson or chat content is persisted; Supabase is used for identity only.
