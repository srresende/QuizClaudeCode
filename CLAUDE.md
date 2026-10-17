# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

A pt-BR True/False quiz about Claude Code (15 questions, 10s timer, global ranking). **`prd.md` is the source of truth**: rules (§2), API contracts (§4.4), SQL schema (§4.5), types and constants (§4.8–4.9), the build order (§5), acceptance criteria (§6) and the 45-question bank (Appendix A). Read the relevant section before changing behavior.

Deliberate deviations from the PRD: `/api/game/result` returns `{ correct, total }` per difficulty/category instead of bare counts; the nickname blocklist matches whole words (digits stripped), not substrings, so "computador" isn't rejected.

## Language conventions

- UI text: **Portuguese (pt-BR)**.
- Code, identifiers and commit messages: **English**.
- Domain enum values stay in Portuguese, as the PRD defines them: `Difficulty = "facil" | "medio" | "dificil"`, `Category = "fundamentos" | "features" | "boas-praticas"`.

## Stack and commands

Next.js 16 (App Router, Turbopack, `src/` dir) + React 19 + TypeScript strict, Tailwind v4, Supabase via `@supabase/supabase-js` (**server only**), Zod 4, Vitest 5 (unit, `tests/unit/`), Playwright (E2E, `tests/e2e/`). Package manager: **npm**. Deploy: Vercel + Supabase.

Every change must end with these three passing:

```
npm run lint
npm run test
npm run build
```

- Single unit test: `npx vitest run tests/unit/<file>.test.ts` (add `-t "<name>"` to filter by test name).
- `npm run check:bundle` (after `build`): fails if any question explanation appears in `.next/static`.
- `npm run smoke:api [-- <baseUrl>] [-- --slow]`: plays a full game against a running server (`npm run dev` or `start`) and checks 409s, double save, highlighting; `--slow` also checks the server-side 12s timeout. Needs a real Supabase.
- On this Windows machine Node may be missing from the Bash tool's PATH: prefix commands with `export PATH="/c/Program Files/nodejs:$PATH";`.

Env vars (`src/server/env.ts`, validated lazily with Zod on first use so `next build` works without secrets): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, in `.env.local`. Never prefix them with `NEXT_PUBLIC_`. `.gitignore` ignores `.env*` except `.env.example`. The schema lives in `supabase/migrations/0001_init.sql` (applied manually in the Supabase SQL Editor).

## Next.js 16 specifics

Read `AGENTS.md`: this Next.js differs from older versions; consult `node_modules/next/dist/docs/` before using an API. In this project:

- **Cache Components is on** (`next.config.ts`). `export const dynamic`/`revalidate` don't exist. Pages that read the DB or `searchParams` do it in an async child wrapped in `<Suspense>`, calling `await connection()` first (see `src/app/ranking/page.tsx`). Nothing uses `"use cache"`, so DB reads are always fresh and no `revalidatePath` is needed.
- `withErrorHandling` (`src/server/http.ts`) calls `unstable_rethrow` first; any new try/catch around request-time APIs must do the same, or prerendering breaks.
- The React Compiler lint forbids building JSX inside `try/catch` and setting state synchronously in effects; handle errors on the promise (`.catch`) and derive state instead.
- `PageProps<"/route">` / `LayoutProps` are generated route types: run `next build` (or `dev`) after adding a route before `tsc` will accept them.

## Architecture: the server is the authority

This invariant shapes the whole codebase:

- `src/data/questions.json` (which holds answers and explanations) may only be imported from `src/server/**` and route handlers. Every module in `src/server/` starts with `import "server-only"` (stubbed in Vitest via an alias in `vitest.config.mts`). `src/lib/` is shared client/server code and must never touch secrets or answers.
- The client never receives `answer` or `explanation` before it has answered (`npm run check:bundle` verifies the bundle).
- The client never sends a score. The server computes correctness and time from its own timestamps: `current_served_at` is set by `/api/game/next`, and elapsed time is measured in `/api/game/answer`. An answer counts as timed out if it is `null` or arrives more than 12s after serving (the 10s limit plus 2s grace). A timeout is wrong and is recorded as 10,000 ms.
- `/api/game/answer` uses a **conditional update** (`WHERE id AND current_index = $index AND status = 'in_progress'`). Zero affected rows returns `409 ALREADY_ANSWERED`. A duplicate `/next` call returns the same question without restarting the timer.
- Session lifecycle: `in_progress → finished → saved`. Saving to the ranking goes through a transactional `save_score` SQL function. `scores.session_id UNIQUE` is the final guard against saving twice. Saving requires `finished_at` to be less than 30 minutes ago.
- Ranking order everywhere: `correct_count DESC, total_time_ms ASC, created_at ASC`. A score's position is the number of strictly better scores plus 1.
- API errors use the shape `{ error: { code, message } }`. All inputs are validated with Zod.
- RLS is enabled with no policies, so only the service role (used from API routes) can reach the tables. Migrations live in `supabase/migrations/`.

Layering: route handlers in `src/app/api/**` are thin (Zod-parse, call a service, return JSON); logic lives in `src/server/gameService.ts` and `rankingService.ts`. Server time comes from Node (`new Date()`) for both `current_served_at` and elapsed. Pages call services directly rather than fetching their own API.

The client page `/play` (`src/components/GameScreen.tsx` + `src/hooks/useGameMachine.ts`) is a reducer state machine: `idle → loading → question → feedback → … → finished → saved` (+ `error`). `src/lib/apiClient.ts` is the typed client; response types are in `src/lib/api-types.ts`.

## Testability requirements

Write pure logic in `src/server/` and `src/lib/` (`selectQuestions`, `scoreAnswer`, `validateNickname`, `formatTime`) so it can be unit tested without a database. `selectQuestions` takes an injectable `random` function so tests are deterministic. It must work for any bank with at least 5 questions per difficulty: for each difficulty block, it picks 1 question per category plus 2 random ones, then shuffles the block. A unit test validates `questions.json` against a Zod schema.

## Content and UI notes

- Appendix A of the PRD warns that Claude Code changes quickly: check question statements against current official docs before publishing.
- Dark "terminal" theme. Palette tokens are in PRD §3.1. Use Inter for body text and JetBrains Mono for timer, progress and ranking, both via `next/font`.
- Don't use Anthropic logos. The footer must read "Projeto não oficial. Claude Code é um produto da Anthropic."
- Accessibility rules are in PRD §3.3: keyboard shortcuts (V/← for Verdadeiro, F/→ for Falso, Enter to advance), touch targets of at least 44px, a working layout at 360px width, and `prefers-reduced-motion` support. Feedback must not rely on color alone.
