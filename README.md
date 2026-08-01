# Gym Progress Tracker

A fully offline-first PWA for tracking workouts, personal records, muscle-specific volume goals, and body measurements. All data lives in your browser via IndexedDB (Dexie) — no account, no server, no tracking.

## Features

- **Workout logging** — log exercises with sets, reps, and weight; workouts auto-timed; edit or delete any workout
- **Personal records** — PRs detected automatically per exercise (by weight, reps, and volume), never duplicated, cascade-deleted with their workout
- **Statistics & insights** — lifetime totals (workouts, hours, sets, volume, streaks), a 12-week frequency chart, and rule-based weekly insights that surface muscle groups needing attention (no AI)
- **Muscle recovery** — each muscle group gets a recovery estimate (DOMS-style) from its last training, shown as ready / recovering / inactive with a dedicated recovery engine
- **Interactive muscle map** — tap any muscle on the anatomy chart to see its exercises and progress; heat coloring shows frequency
- **Premium workout history** — sessions grouped by day with expandable set-by-set detail on muscle and exercise pages
- **Weekly goals** — set weekly set targets per muscle group and track progress
- **Body measurements** — track weight and body metrics with charts
- **Dashboard** — greeting, today's focus card, weekly progress, activity heatmap, recent workouts
- **Custom cards** — pin your favorite stats to the home screen with sparklines
- **Search** — search exercises with muscle-group and difficulty filters; rename, duplicate, or delete
- **Icon system** — every exercise and muscle maps to a Lucide icon (barbell, cable, bodyweight, etc.)
- **Units** — kg ↔ lbs conversion; weights are stored canonically in kg and converted for display
- **Theme** — dark / light / system with a custom brand accent
- **Backup** — export/import the full database as a JSON file with atomic, validated restore
- **PWA** — installable, works fully offline, auto-updating service worker

## Tech Stack

- **React 19** + **TypeScript** (strict, `noUnusedLocals`) + **Vite 8**
- **Tailwind CSS 4**
- **Dexie 4** + dexie-react-hooks for IndexedDB persistence (schema v3)
- **react-router-dom** with route-level code splitting
- **Zustand** for UI state, **recharts** for graphs, **framer-motion** for animations, **lucide-react** for icons
- **vite-plugin-pwa** for the offline service worker

## Getting Started

```bash
npm install
npm run dev      # start dev server
```

## Scripts

| Command             | Description                       |
| ------------------- | --------------------------------- |
| `npm run dev`       | Start the Vite dev server         |
| `npm run build`     | Typecheck + production build      |
| `npm run preview`   | Preview the production build      |
| `npm test`          | Run the unit test suite (Vitest)  |
| `npm run test:e2e`  | Run the Playwright e2e suite      |
| `npm run lint`      | Run ESLint                        |

## Testing

- **Unit (Vitest + Testing Library)** — 134 tests across 23 files against an in-browser IndexedDB mock (`fake-indexeddb`). Coverage includes PR detection/upsert, workout store transactions (order, duration, cascade deletes), backup export/import, the recovery engine, weekly insights scoring, exercise/muscle icon mapping, and timeline grouping.
- **E2E (Playwright)** — 26 tests across 5 suites running against the production build in system Chrome on mobile, tablet, and desktop viewports. Covers the launch/splash flow, all routes rendering without runtime errors, exercise-list menu delete flows, workout delete confirmations, keyboard accessibility, and the workout-mode stats bar.

## Deployment

- **Vercel** — `vercel.json` configures the Vite framework with an SPA fallback rewrite; deploy with `vercel --prod`.
- **GitHub Pages** — a `docs`-based workflow (`deploy.yml`) builds with `GH_PAGES=true` for a `/Tracker/` base path.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs `npm ci`, lint, typecheck, unit tests, e2e tests, and the production build on Node 22 for every push and PR.

## Security Notes

`npm audit` reports two high-severity advisories. Both are non-exploitable in this application's context and were left unresolved deliberately:

- **GHSA-qwww-vcr4-c8h2 (react-router CSRF)** — only affects apps using React Router's *unstable RSC APIs*. This is a client-only SPA (`BrowserRouter`, no server, no loaders/actions), so the vulnerable code path is never exercised. The only clean fix is the major 8.x upgrade; npm's suggested "fix" is a downgrade to 7.11.0.
- **GHSA-mh99-v99m-4gvg (brace-expansion DoS)** — a build-time-only chain (`workbox-build → ejs → jake → filelist → minimatch → brace-expansion`) used to generate the PWA service worker during `vite build`. It is not present in the shipped `dist/` bundle, never receives user input, and has an EPSS exploit probability of 0.34%. The only automated fix is a breaking downgrade of `vite-plugin-pwa`.

Revisit when `vite-plugin-pwa`/`workbox-build` publishes a patched dependency chain, or if the app ever moves to React Router framework mode (RSC).
