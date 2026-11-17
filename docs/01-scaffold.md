# Step 1 — Scaffold and design system

## What was built

- Next.js 15.5 App Router with React 19 and strict TypeScript.
- Global design system in `src/app/globals.css`: light canvas, violet accent, 22px cards, responsive three-column studio.
- Root layout and metadata in `src/app/layout.tsx`.
- Environment contract:
  - `src/lib/env/public.ts` — browser-safe Supabase values.
  - `src/lib/env/server.ts` — OpenRouter, Deepgram, site URL; never imported by client code.
- `.env.example`, `.gitignore`, path alias `@/*`, npm scripts.

## Design reference

The UI follows the supplied reference: graduated-cap wordmark, Learn/Practice/Explore tabs, subject sidebar with progress ring, breadcrumb board card, and an AI Tutor panel with suggestion pills and a voice compose bar. The palette is white/`#FAFAFC` with `#6C4CF1` violet and lavender surfaces.

## Verification

`npx tsc --noEmit` passed. The landing page was rendered in headless Edge at 1440px; the headline and preview were adjusted for line balance. Screenshots live in `docs/screenshots/`.

## Notes

No Tailwind dependency: the design system is hand-written CSS, keeping the bundle and class surface small. Icons come from `lucide-react`.
