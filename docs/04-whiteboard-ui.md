# Step 4 — Whiteboard tutor UI

## Layout

Three columns inside a 70px app header:

1. **Sidebar** — Home, five subject shortcuts, generated lesson map, progress ring and “New lesson”.
2. **Board card** — breadcrumb, previous/next/fullscreen tools, step kicker, title, animated SVG, narration with Listen, optional quick check, progress dots and Practice/Next.
3. **AI Tutor** — live transcript, streaming typing state, three suggestion pills, voice input, send/stop, per-answer Listen.

The lesson form replaces the board column until generation completes. A completion card summarises the lesson and offers review or a new topic.

## Whiteboard rendering

`src/components/whiteboard/Whiteboard.tsx` is a pure SVG renderer with a 1000×600 viewBox. Strokes use `pathLength=1` and a CSS dash animation; text uses `foreignObject` with estimated wrapping. A shared `--order` custom property staggers elements. No client hooks are needed, so the landing preview reuses it.

## State ownership

`TutorWorkspace` owns lesson, current step, completion set, quiz visibility, generation state and narration playback. `useTutorChat` owns the transcript/stream. `LessonBoard`, `LessonSidebar`, `StepQuiz`, `CompletionCard` and `ChatPanel` receive props; only `ChatPanel` and `LessonBoard` hold local UI state (input, expansion, quiz answer).

## Design adherence

- White surfaces, `#EAECF0` hairlines, violet accents and lavender chat bubbles.
- Rounded 22px cards, pill subject nav and suggestion chips.
- Reference-style board header with breadcrumb and icon tools.
- Responsive: sidebar hides below 900px; board and chat stack; nav collapses to icons.
- `prefers-reduced-motion` disables draw animations.

## Verification

Headless Edge screenshots at 1440×1000: `docs/screenshots/landing.png`, `login.png`, `studio.png`. Visual issues found and fixed: headline orphan, auth back-link placement, duplicated board titles, quiz scroll target.
