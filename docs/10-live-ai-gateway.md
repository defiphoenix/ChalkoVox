# Step 10 — Live AI gateway configuration

**Status:** Configured; live generation blocked by provider balance
**Gateway:** `https://api.apinex.bond/v1`
**Model:** `free/gemini-4-hydrogen`

## What changed

- Added `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL` and `OPENROUTER_MODEL` to `.env.local`.
- Made the AI base URL configurable. The default remains
  `https://openrouter.ai/api/v1`; a trailing slash is normalised.
- Kept provider-specific behaviour inside `src/lib/ai/openrouter.ts`; routes and
  lesson services are unchanged.
- Added a dedicated `AI_PAYMENT_REQUIRED` error, returned as HTTP 402, so a
  balance problem is distinguishable from a malformed model response.

## Endpoint discovery

- `GET /v1/models` returned 200 with 45 models.
- The previous default `google/gemini-2.5-flash` is not offered by this gateway.
- Selected `free/gemini-4-hydrogen`, which is present in the catalogue. The free tier still returns 402 until the account makes a one-off $5 top-up.

## Verification performed

| Check | Result |
| --- | --- |
| Gateway reachable with supplied key | 200 |
| Paid model JSON completion | 402 — insufficient balance |
| Free model completion | 402 — $5 top-up required to unlock free tier |
| App client through configured base URL | reached gateway, surfaced 402 |
| Authenticated `POST /api/lesson` | 402, `AI_PAYMENT_REQUIRED`, clear message |
| Unit/API tests | 52/52 pass |

Live JSON-mode lesson output and SSE chat streaming could not be verified because
every completion is rejected before inference.

## Next step

Add credit at https://apinex.bond/billing (or provide a funded key/endpoint), then
restart the dev server and retry `/api/lesson`. If a different model is needed,
set `OPENROUTER_MODEL` to an ID from `GET /v1/models`.

## Security note

The API key was supplied in chat. Rotate it at the gateway after testing, update
`.env.local`, restart the server, and revoke the old key. Only the publishable
Supabase key is exposed to the browser; this AI key remains server-side.
