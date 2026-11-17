# Step 11 — File-based request logging

## Is file logging possible in Next.js?

Yes, when the app runs on the Node.js runtime (`next dev`, `next start`, Docker, a VPS). It is not possible on a read-only serverless filesystem (for example Vercel Functions); there, write to stdout and let the platform log drain capture it.

This project logs:

- **Page requests** from `src/middleware.ts`, which uses the stable Node.js middleware runtime (`runtime: "nodejs"`, Next.js 15.5).
- **API and auth requests** from `withRequestLogging`, which wraps every route handler.

Static assets (`/_next/static`, images, fonts, `robots.txt`) are excluded to keep signal high.

## Output

One JSON object per line in `logs/app-YYYY-MM-DD.log`:

```json
{"ts":"2026-11-17T01:09:34.211Z","level":"warn","event":"request","requestId":"b2990ebc-…","kind":"api","method":"POST","path":"/api/lesson","route":"/api/lesson","status":401,"durationMs":8,"errorCode":"UNAUTHENTICATED"}
{"ts":"2026-11-17T01:09:32.045Z","level":"info","event":"request","requestId":"d42072a9-…","kind":"page","method":"GET","path":"/","status":200,"durationMs":1}
```

- Daily files rotate at UTC midnight; `LOG_MAX_FILES` (default 14) prunes older files on the first write of a new day.
- `level` follows status: `info` for <400, `warn` for 4xx, `error` for 5xx.
- API entries include the application error code read from `{ error: { code } }`.
- Thrown route errors are logged as `request.unhandled` and returned as a safe `500 INTERNAL_ERROR`.
- `x-request-id` is echoed on responses. A valid incoming id is reused; anything else is replaced with a UUID.
- Writes are queued to prevent interleaved lines and never throw into a request. On a read-only filesystem the logger warns once and falls back to stderr.

## Privacy

The logger records only method, pathname, status, duration, route, request id, and error code. It never records query strings, headers, cookies, request bodies, or response bodies. Key names matching `authorization|cookie|token|secret|password|api-key` are masked as defence in depth. This keeps `/auth/callback?code=…` and bearer tokens out of the log.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `LOG_TO_FILE` | `true` | Set `false` on read-only serverless hosts |
| `LOG_DIR` | `logs` | Directory, absolute or relative to the working directory |
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error` |
| `LOG_MAX_FILES` | `14` | Daily files retained |
| `LOG_CONSOLE` | `false` | Mirror lines to stdout |

`logs/` is gitignored. Tests run with `LOG_TO_FILE=false` and opt into a temp directory only where logging is asserted.

## Files

`src/lib/logging/logger.ts` (sinks, rotation, redaction), `src/lib/logging/request.ts` (route wrapper), `src/middleware.ts` (page logging), `tests/logging.test.ts`.

## Verification

- `npm test` — 7 files, 52 tests pass, including JSONL output, warn/error levels, error-code capture, thrown-error handling, redaction, and request-id sanitising.
- `npm run build` passes with Node middleware.
- Live dev check: `GET /` produced a `kind:"page"` record; `POST /api/lesson` produced `kind:"api"`, `status:401`, `errorCode:"UNAUTHENTICATED"`; a custom `x-request-id` was echoed and appeared in the record.
- Log file: `logs/app-2026-11-17.log`.

## Limitations

- Page entries log the middleware/auth result, not the final render status. A page that throws after middleware still appears as `200` in this file; Next.js prints the render error to its own console. API status and duration are exact.
- Full HTTP access logging (bytes sent, client IP, upstream timing) belongs in a reverse proxy or custom Node server.
- On serverless platforms, use the provider's log drain instead of `LOG_TO_FILE`.
