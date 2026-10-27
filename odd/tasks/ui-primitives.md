# Feature: UI primitives (Card, Badge, Button)

## Objective

Build reusable, composition-first UI primitives in `src/components/ui/` with Tailwind CSS, so the CMS blocks (`Hero`, `Pricing`, `ProductGrid`) can be assembled from small parts instead of mega-components.

## Problem / Why

The project had no toolchain (no `package.json`, no Tailwind, no test runner). Strict TDD needs a runner, so the toolchain is set up first.

## Scope

- Toolchain: pnpm, Next.js (App Router, `src/`), TypeScript strict, Tailwind v4, Vitest + Testing Library.
- `src/lib/cn.ts`: class merging (`clsx` + `tailwind-merge`).
- `Badge.tsx`, `Button.tsx`, `Card.tsx` (compound) with exported prop types.

Out of scope: blocks, registry, renderer, data parser.

## Constraints

- `ui/` must never import from `domain/`. Mapping domain values (for example `StockLevel`) to badge variants belongs in blocks.
- No `'use client'` in Card: dot-notation compound components break across the RSC client boundary.
- `Button` links work through `asChild` (Radix Slot), so `next/link` keeps client-side navigation. There is no separate `href` mode.
- `Button` defaults to `type="button"` when it renders a `<button>`.
- React 19 refs are passed as props (`ComponentPropsWithRef`), with no `forwardRef`.

## TDD

- Mode: strict, on.
- Source: user global `~/.claude/CLAUDE.md` ("Strict TDD Mode: enabled").
- Runner: Vitest (`pnpm test`), set up in T1.

## Delivery

- Strategy: `ask-on-risk` (default).
- Forecast: about 600 authored lines (config ~100, components ~250, tests ~250). This is over the 400-line budget.
- There is no git remote yet, so PR slicing is deferred until a PR is wanted. The commits are already split by task.
- RDD: unavailable. `gentle-ai` 1.49.0 has no `review` command.

## Tasks

- [x] T1: Scaffold the toolchain and confirm `pnpm test`, `pnpm typecheck` and `pnpm build` run. Route: delegated (writer trigger, install/build execution).
- [x] T2: `cn` utility, test-first. Route: delegated.
- [ ] T3: `Badge`, test-first. Route: delegated.
- [ ] T4: `Button` with variants, sizes and `asChild`, test-first. Route: delegated.
- [ ] T5: `Card` compound (`Header`, `Content`, `Footer`), test-first. Route: delegated.

## Acceptance criteria

- Each primitive exports its props type (and its variant types where it has them).
- All tests pass, `tsc --noEmit` is clean and `next build` succeeds.
- One Conventional Commit per task on `feat/ui-primitives`, with no AI attribution.

## Progress / Evidence

- Baseline: `git init -b main`.
- Engram mirror: pending (the server is disconnected).
- T1: manual setup with `pnpm add` (no `create-next-app`; its templates were read for reference only). Versions: next 16.4.3, react 19.3.1, tailwindcss 4.3.3, vitest 5.0.5, typescript 7.0.2 (Next 16.4 type-checks through the `tsc` CLI by default, so TS 7 works). Added `@testing-library/dom` (required peer of `@testing-library/react` 16). Build scripts: pnpm 11 `allowBuilds` in `pnpm-workspace.yaml` (`sharp: true`). Toolchain smoke test `src/app/page.test.tsx`: RED (`Failed to resolve import "@/app/page"`), GREEN (1 test passed). `pnpm typecheck` clean (`src/domain/cms.ts` needed no change). `pnpm build` compiled, type-checked and prerendered `/`.
- T2: RED (`Failed to resolve import "@/lib/cn"`), GREEN (3 `cn` tests passed, 4 total). `pnpm typecheck` clean.

## Next step

T3.
