# Step 6 — Tests

## Result

`npm test` — **7 files, 52 tests, all passing** (Vitest 3, Node environment).

| File | Coverage |
| --- | --- |
| `tests/schemas.test.ts` | Demo lesson validity, canvas bounds, path character guard, step count, request defaults, chat length limits, speech limit, open-redirect safety |
| `tests/openrouter.test.ts` | JSON extraction (plain/fenced/invalid), SSE token joining across chunk boundaries, malformed events, minimal request body, 429 and network error mapping, missing key |
| `tests/deepgram.test.ts` | MIME parsing with codec suffix, Nova request and auth header, empty-transcript 422, provider failure, Aura request and bytes |
| `tests/lesson-route.test.ts` | 401, topic validation, malformed JSON, success shape, provider 429, service 502 |
| `tests/chat-route.test.ts` | 401, empty history, streamed plain text, context-grounded system prompt, 429 |
| `tests/voice-routes.test.ts` | Auth for both routes, missing/unsupported audio, transcript success, empty speech 422, invalid speech input, MP3 response, provider failure |
| `tests/logging.test.ts` | JSONL file output, status levels, error-code capture, thrown-error handling, query/header redaction, request-id sanitising |

## Approach

- Provider modules are tested against mocked `fetch`, so no live credits or keys are consumed.
- Route handlers are imported directly and invoked with real `Request`/`FormData` objects; Supabase and provider services are mocked with `vi.mock`.
- Tests assert both status codes and payload/headers, plus that invalid input never reaches the model.
- `vitest.config.ts` mirrors the `@/*` alias and runs in Node.
- Route tests run with file logging disabled (`LOG_TO_FILE=false`); logging tests opt into a temporary directory.

## Gaps

There is no browser E2E suite. Supabase's hosted auth service is not called in tests; the auth flow is covered by unit tests of redirect safety and by the server-side route guard tests. Adding Playwright with a dedicated Supabase test project is the next step for full login E2E.
