# Gym Progress Tracker

A fully offline-first PWA for tracking workouts, personal records, muscle-specific volume goals, and body measurements. All data lives in your browser via IndexedDB (Dexie) — no account, no server, no tracking.

## Features

- **Workout logging** — log exercises with sets, reps, and weight; workouts auto-timed; edit or delete any workout
- **Personal records** — PRs detected automatically per exercise (by weight and by estimated 1RM), never duplicated, cascade-deleted with their workout
- **Interactive muscle map** — tap any muscle on the anatomy chart to see its exercises and progress; heat coloring shows frequency
- **Weekly goals** — set weekly set targets per muscle group and track progress
- **Body measurements** — track weight and body metrics with charts
- **Dashboard** — today's stats, streak counter, progress graphs, recent workouts
- **Custom cards** — pin your favorite stats to the home screen with sparklines
- **Units** — kg ↔ lbs conversion; weights are stored canonically in kg and converted for display
- **Backup** — export/import the full database as a JSON file with atomic, validated restore
- **PWA** — installable, works fully offline, auto-updating service worker

## Tech Stack

- **React 19** + **TypeScript** (strict, `noUnusedLocals`) + **Vite 8**
- **Tailwind CSS 4**
- **Dexie 4** + dexie-react-hooks for IndexedDB persistence (schema v3)
- **react-router-dom** with route-level code splitting
- **Zustand** for UI state, **recharts** for graphs, **framer-motion** for animations
- **vite-plugin-pwa** for the offline service worker

## Getting Started

```bash
npm install
npm run dev      # start dev server
```

## Scripts

| Command         | Description                       |
| --------------- | --------------------------------- |
| `npm run dev`   | Start the Vite dev server         |
| `npm run build` | Typecheck + production build      |
| `npm run preview` | Preview the production build   |
| `npm test`      | Run the test suite (Vitest)       |
| `npm run lint`  | Run ESLint                        |

## Testing

Vitest + Testing Library against an in-browser IndexedDB mock (`fake-indexeddb`). Tests cover the data-critical logic: PR detection/upsert, workout store transactions (order, duration, cascade deletes), backup export/import, and the toast UI. The data layer tests previously caught a real bug (missing `workoutId` index on PR records) which is fixed in schema v3.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs `npm ci`, lint, typecheck, tests, and the production build on Node 22 for every push and PR.

## Security Notes

`npm audit` reports two high-severity advisories. Both are non-exploitable in this application's context and were left unresolved deliberately:

- **GHSA-qwww-vcr4-c8h2 (react-router CSRF)** — only affects apps using React Router's *unstable RSC APIs*. This is a client-only SPA (`BrowserRouter`, no server, no loaders/actions), so the vulnerable code path is never exercised. The only clean fix is the major 8.x upgrade; npm's suggested "fix" is a downgrade to 7.11.0.
- **GHSA-mh99-v99m-4gvg (brace-expansion DoS)** — a build-time-only chain (`workbox-build → ejs → jake → filelist → minimatch → brace-expansion`) used to generate the PWA service worker during `vite build`. It is not present in the shipped `dist/` bundle, never receives user input, and has an EPSS exploit probability of 0.34%. The only automated fix is a breaking downgrade of `vite-plugin-pwa`.

Revisit when `vite-plugin-pwa`/`workbox-build` publishes a patched dependency chain, or if the app ever moves to React Router framework mode (RSC).
