# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

The repo currently holds only `prd.md`, the full spec for a pt-BR True/False quiz about Claude Code (15 questions, 10s timer, global ranking). **`prd.md` is the source of truth**: rules (§2), API contracts (§4.4), SQL schema (§4.5), types and constants (§4.8–4.9), the build order (§5), acceptance criteria (§6) and the 45-question bank (Appendix A). Read the relevant section before implementing. Once the project is scaffolded, update this file with the real commands and any drift from the PRD.

## Language conventions

- UI text: **Portuguese (pt-BR)**.
- Code, identifiers and commit messages: **English**.
- Domain enum values stay in Portuguese, as the PRD defines them: `Difficulty = "facil" | "medio" | "dificil"`, `Category = "fundamentos" | "features" | "boas-praticas"`.

## Stack and commands

Next.js (App Router, `src/` dir) + TypeScript strict, Tailwind, Supabase via `@supabase/supabase-js` (**server only**), Zod, Vitest (unit, `tests/unit/`), Playwright (E2E, `tests/e2e/`). Package manager: **npm**. Deploy: Vercel + Supabase.

Every implementation step must end with these three passing:

```
npm run lint
npm run test
npm run build
```

Single unit test: `npx vitest run tests/unit/<file>.test.ts` (add `-t "<name>"` to filter by test name).

Env vars (`src/server/env.ts`, validated with Zod): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Never prefix them with `NEXT_PUBLIC_`. Keep `.env.example` in sync, and keep `.env*.local` gitignored.

## Architecture: the server is the authority

This invariant shapes the whole codebase:

- `src/data/questions.json` (which holds answers and explanations) may only be imported from `src/server/**` and route handlers. Every module in `src/server/` starts with `import "server-only"`. `src/lib/` is shared client/server code and must never touch secrets or answers.
- The client never receives `answer` or `explanation` before it has answered. Check with `next build`, then grep `.next/static` for a snippet of an explanation; it must not appear.
- The client never sends a score. The server computes correctness and time from its own timestamps: `current_served_at` is set by `/api/game/next`, and elapsed time is measured in `/api/game/answer`. An answer counts as timed out if it is `null` or arrives more than 12s after serving (the 10s limit plus 2s grace). A timeout is wrong and is recorded as 10,000 ms.
- `/api/game/answer` uses a **conditional update** (`WHERE id AND current_index = $index AND status = 'in_progress'`). Zero affected rows returns `409 ALREADY_ANSWERED`. A duplicate `/next` call returns the same question without restarting the timer.
- Session lifecycle: `in_progress → finished → saved`. Saving to the ranking goes through a transactional `save_score` SQL function. `scores.session_id UNIQUE` is the final guard against saving twice. Saving requires `finished_at` to be less than 30 minutes ago.
- Ranking order everywhere: `correct_count DESC, total_time_ms ASC, created_at ASC`. A score's position is the number of strictly better scores plus 1.
- API errors use the shape `{ error: { code, message } }`. All inputs are validated with Zod.
- RLS is enabled with no policies, so only the service role (used from API routes) can reach the tables. Migrations live in `supabase/migrations/`.

The client page `/play` is a state machine: `idle → loading → question → feedback → … → finished → saved`.

## Testability requirements

Write pure logic in `src/server/` and `src/lib/` (`selectQuestions`, `scoreAnswer`, `validateNickname`, `formatTime`) so it can be unit tested without a database. `selectQuestions` takes an injectable `random` function so tests are deterministic. It must work for any bank with at least 5 questions per difficulty: for each difficulty block, it picks 1 question per category plus 2 random ones, then shuffles the block. A unit test validates `questions.json` against a Zod schema.

## Content and UI notes

- Appendix A of the PRD warns that Claude Code changes quickly: check question statements against current official docs before publishing.
- Dark "terminal" theme. Palette tokens are in PRD §3.1. Use Inter for body text and JetBrains Mono for timer, progress and ranking, both via `next/font`.
- Don't use Anthropic logos. The footer must read "Projeto não oficial. Claude Code é um produto da Anthropic."
- Accessibility rules are in PRD §3.3: keyboard shortcuts (V/← for Verdadeiro, F/→ for Falso, Enter to advance), touch targets of at least 44px, a working layout at 360px width, and `prefers-reduced-motion` support. Feedback must not rely on color alone.
