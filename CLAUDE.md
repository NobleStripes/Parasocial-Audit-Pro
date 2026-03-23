# CLAUDE.md — Parasocial Reflection

This file provides guidance for AI assistants working in this codebase.

## Project Overview

**Parasocial Reflection** is a privacy-first, research-oriented web app that helps users reflect on their relationship dynamics with AI assistants. Users paste chat transcripts (and optionally upload screenshots), and the app:

1. Runs **real-time local heuristics** to produce a live radar and detection log
2. Calls the **Google Gemini API** for a deep structured analysis
3. Returns a classification, scored dimensions, a Markdown report, and a wellness plan

The app is intentionally non-clinical and non-judgmental. It frames everything as personal reflection, not diagnosis.

## Repository Structure

```
Parasocial-Reflection/
├── src/
│   ├── App.tsx               # Entire frontend — UI, state, local heuristics, result rendering
│   ├── main.tsx              # React entry point (React 19, StrictMode)
│   ├── index.css             # Tailwind + custom theme variables + component styles
│   ├── constants.ts          # Keyword lists for live pattern detection
│   └── lib/
│       └── utils.ts          # cn() helper (clsx + tailwind-merge)
│   └── services/
│       └── reflectionService.ts  # Gemini API integration + response schema
├── server.ts                 # Express server (dev: Vite middleware, prod: static)
├── index.html                # HTML shell
├── vite.config.ts            # Vite config — aliases, Tailwind plugin, HMR flag, env expose
├── tsconfig.json             # TypeScript config
├── package.json              # Scripts and dependencies
├── .env.example              # Required environment variables
├── metadata.json             # App name/description metadata
└── README.md                 # User-facing documentation
```

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | React | 19.0.0 |
| Build | Vite | 6.2.0 |
| Styling | Tailwind CSS | 4.x |
| Animation | Framer Motion (`motion`) | 12.x |
| AI/ML | Google Gemini 3.1 Pro Preview | via `@google/genai` |
| Backend | Express | 4.x |
| Database | SQLite via `better-sqlite3` | 12.x (installed, not yet wired up) |
| Charts | Recharts | 3.x |
| Icons | Lucide React | 0.5x |
| Markdown | react-markdown | 10.x |
| Language | TypeScript | ~5.8 |

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (Express + Vite middleware on port 3000)
npm run build        # Build production assets to /dist
npm start            # Serve production build
npm run lint         # TypeScript type-check only (tsc --noEmit)
npm run clean        # Clean build output
```

**No test suite is configured.** The only check is `tsc --noEmit` via `npm run lint`.

## Environment Variables

Copy `.env.example` to `.env.local` (or `.env`) and fill in:

```
GEMINI_API_KEY="your-gemini-api-key"
APP_URL="http://localhost:3000"
```

- `GEMINI_API_KEY` is required — the app will fail at API call time without it.
- `DISABLE_HMR=true` can be set to turn off Vite hot module replacement.
- `NODE_ENV` controls dev vs. prod Express mode.

Vite exposes `GEMINI_API_KEY` to the client via `define` in `vite.config.ts`. All `.env*` files (except `.env.example`) are gitignored.

## Architecture Notes

### Frontend: Monolithic App.tsx

All UI, state, and local logic lives in `src/App.tsx` (~1150 lines). There are no sub-components in separate files. This is intentional for simplicity — do not split unless asked.

Key state variables:
- `transcript` — raw user text input
- `images` — array of `{ dataUrl, mimeType, name }` from file uploads
- `isReflecting` — loading flag during Gemini API call
- `result` — `ReflectionResult | null` from the API
- `liveHeuristics` — `RadarDataPoint[]` updated in real time from keyword counts
- `liveDetections` — string log of detected patterns as the user types
- `selectedRecommendations` — user-customized wellness plan set

Auto-reflection triggers after **2.5 seconds of inactivity** in the transcript textarea (debounced via `useRef` timeout).

### Local Heuristics (src/constants.ts)

Six keyword lists drive the live radar and detection log:
- `INTIMACY_WORDS` — signs of emotional attachment
- `LEGACY_WORDS` — nostalgia for older AI versions
- `IDENTITY_WORDS` — self-reference density
- `REALITY_WORDS` — absolutist language
- `ANTHROPOMORPHIC_WORDS` — treating AI as human
- `GASLIGHTING_WORDS` — attempts to manipulate AI behavior

These lists are for **local, real-time use only**. They are not sent to the API.

### Gemini API Integration (src/services/reflectionService.ts)

Single exported function: `reflectOnBehavioralData(transcript, images?)`.

- Model: `gemini-3.1-pro-preview`
- Input: text transcript + optional base64-encoded images (multimodal)
- Output: structured JSON validated against an explicit schema
- System instruction enforces tone (non-clinical, supportive, Markdown report structure)

The response schema defines:
- `classification` — one of: `INSTRUMENT`, `ADVISOR`, `ANCHOR`, `COMPANION`, `HABIT_LOOP`, `FUSION_RISK`
- `confidence` — float 0–1
- `summary` — brief string
- `imagineAnalysis` — 7 dimension scores 0–100 (IMAGINE framework)
- `legacyAttachment` — float 0–100
- `versionMourningTriggered` — boolean
- `connectionPatterns` — array of `{ name, intensity }`
- `heatmap` — array of `{ category, score }`
- `analysisReport` — full Markdown string (5-section structure)
- `wellnessPlan` — `{ title, recommendations[], library[], rationale }`

### IMAGINE Framework (7 Connection Dimensions)

| Code | Dimension | Meaning |
|---|---|---|
| I | Self-Identity | Blurred sense of self tied to AI |
| M | Seeking Approval | Validating self-worth through AI responses |
| A | Emotional Spark | Affective ping-pong / emotional dependency |
| G | Real-World Balance | Neglecting real-life relationships |
| I | Feeling Special | Sense of unique or secret bond |
| N | One-Way Bond | Forgetting AI has no feelings |
| E | Growing Habit | Escalating time investment |

### Classification Levels

From healthiest to most concerning:
1. `INSTRUMENT` — Tool/Assistant
2. `ADVISOR` — Trusted Guide
3. `ANCHOR` — Emotional Support
4. `COMPANION` — Digital Friend
5. `HABIT_LOOP` — Daily Habit (escalation concern)
6. `FUSION_RISK` — Deep Attachment (most concerning)

Color coding: green (`#00CC66`) → blue (`#4488FF`) → red (`#FF4444`)

### Styling Conventions

- **Tailwind CSS v4** with custom theme variables in `src/index.css`
- Custom CSS variables: `--color-reflection-bg`, `--color-reflection-ink`, `--color-simp-red`, `--color-casual-blue`, `--color-tool-green`
- Fonts: Inter (sans), JetBrains Mono (mono), Cormorant Garamond (serif)
- Glass-morphism: `backdrop-blur` with semi-transparent backgrounds
- `cn()` from `src/lib/utils.ts` for conditional class merging
- Custom classes: `.supportive-report` (Markdown report styling), `.data-grid`, `.data-cell`
- Mobile-first responsive design

### Path Aliases

`@/` resolves to the project root (configured in both `vite.config.ts` and `tsconfig.json`).

```ts
import { cn } from "@/lib/utils";
```

### Server (server.ts)

- Port: **3000**, binds to `0.0.0.0`
- Dev mode: Vite in middleware mode (HMR, hot reload)
- Prod mode: serves `/dist` as static files
- CORS enabled for all origins
- Health check: `GET /api/health` → `{ status: "ok" }`

## Key Conventions

1. **No tests** — TypeScript type-checking is the only CI gate. Ensure `npm run lint` passes after changes.
2. **Single-component architecture** — keep all UI in `App.tsx` unless explicitly asked to refactor.
3. **Privacy-first** — no user data is persisted to a database. The SQLite dependency is installed but not wired up. Do not add persistence without explicit instruction.
4. **Non-judgmental tone** — all copy, report text, and classification labels must remain supportive. Never use clinical or pathologizing language.
5. **Gemini-only AI** — the Gemini API is the sole AI backend. Other SDKs (`@anthropic-ai/sdk`, `openai`) are installed as dependencies but not used in the app.
6. **Keyword lists in constants.ts** — when adding new pattern detection, add keywords there, not inline in App.tsx.
7. **Structured schema** — any changes to `ReflectionResult` must be reflected in both the TypeScript interface and the Gemini response schema in `reflectionService.ts`.
8. **Environment variables** — only `GEMINI_API_KEY` and `APP_URL` are expected. Do not add secrets to source files.

## Common Tasks

### Add a new keyword pattern category
1. Add the word list to `src/constants.ts`
2. Import and use it in the `liveHeuristics` computation in `App.tsx`
3. Optionally add a matching dimension to the IMAGINE radar if the category maps to one

### Change the AI model
Edit the model string in `src/services/reflectionService.ts`:
```ts
const model = genai.getGenerativeModel({ model: "gemini-3.1-pro-preview" });
```

### Add a new result field
1. Add the field to the `ReflectionResult` interface in `reflectionService.ts`
2. Add it to the Gemini response schema (`responseSchema`) in the same file
3. Add rendering logic in `App.tsx`

### Update the wellness plan library
The recommendation library is returned by the Gemini API, not hardcoded. To change the pool of suggestions, update the system instruction in `reflectionService.ts`.

### Run type-checking
```bash
npm run lint
```

This runs `tsc --noEmit` — no test runner is configured.
