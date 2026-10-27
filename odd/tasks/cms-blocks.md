# Feature: CMS blocks and resolution registry

## Objective

Implement the block components (`HeroBlock`, `PricingBlock`, `ProductGridBlock`, `UnknownBlock`) by composing the UI primitives, plus a typed `registry.ts` that resolves a block type to its component and falls back to `UnknownBlock`.

## Problem / Why

The domain contracts (`src/domain/cms.ts`) and primitives (`src/components/ui/`) exist, but nothing renders CMS content yet. The registry is the seam the renderer (`PageBuilder`) will use next.

## Scope

- `src/lib/format.ts`: `formatMoney(money: Money)`.
- `src/components/blocks/`: `CtaLink`, `HeroBlock`, `PricingBlock`, `ProductGridBlock`, `stockBadge` (StockLevel to Badge mapping), `UnknownBlock`, `registry.ts`.

Out of scope: `PageBuilder`, `BlockErrorBoundary`, the data parser, and image files under `public/`.

## Decisions

- Typed registry (user choice, 2026-10-27): `blockRegistry: { [K in KnownBlockType]: ComponentType<BlockPropsMap[K]> }` instead of `Record<string, ComponentType<any>>`. A component whose props do not match its block fails to compile.
- `resolveBlock(type: string)` still accepts any string. Unregistered types (for example `slider`) return `UnknownBlock`. Lookups use `Object.hasOwn`, so prototype keys (`constructor`, `toString`, `__proto__`) also fall back.
- `slider` is deliberately not registered, so the fallback can be tested.
- `UnknownBlock` shows a yellow notice outside production and returns `null` in production.
- Domain values map to primitives inside blocks (`CtaVariant` to `ButtonVariant`, `StockLevel` to `BadgeVariant`). `ui/` never imports `domain/`.
- Every block is a Server Component (no `'use client'`).

## TDD

- Mode: strict, on.
- Source: user global `~/.claude/CLAUDE.md`.
- Runner: Vitest (`pnpm test`).
- RED must be a failed assertion against a stub, not a missing-module import error.

## Delivery

- Branch: `feat/cms-blocks`, stacked on `feat/ui-primitives` (no remote yet).
- Strategy: `ask-on-risk` (default).
- Forecast: about 850 authored lines (components ~400, tests ~450). This is over the 400-line budget, so PR slicing is deferred until a remote exists. The commits are split by task.
- RDD: unavailable. `gentle-ai` 1.49.0 has no `review` command.

## Tasks

- [x] T1: `formatMoney` in `src/lib/format.ts`, test-first. Route: delegated (writer trigger, 2+ non-trivial files).
- [x] T2: `CtaLink` and `HeroBlock`, test-first. Route: delegated.
- [x] T3: `PricingBlock`, test-first. Route: delegated.
- [ ] T4: `getStockBadge` and `ProductGridBlock`, test-first. Route: delegated.
- [ ] T5: `UnknownBlock`, with dev and production behavior, test-first. Route: delegated.
- [ ] T6: `registry.ts` (typed map, `resolveBlock`, prototype-key guard, type-level tests). Route: delegated.

## Acceptance criteria

- `resolveBlock('hero' | 'pricing' | 'productGrid')` returns its component. `resolveBlock('slider')` and prototype keys return `UnknownBlock`.
- Registering a mismatched component fails `pnpm typecheck` (proved with `@ts-expect-error`).
- `UnknownBlock` renders a visible notice naming the type when `NODE_ENV !== 'production'`, and nothing in production.
- `pnpm test`, `pnpm typecheck` and `pnpm build` pass.
- One Conventional Commit per task, with no AI attribution.

## Progress / Evidence

- Engram mirror: pending (the server is disconnected).
- Next 16 `next/image` (context7, `/vercel/next.js/v16.2.9`): `priority` is deprecated; the hero uses `preload`.
- T1: RED: 5/5 failed against a stub returning `''` (`expected '' to be '$29.00'`). GREEN: 5/5 pass; `pnpm typecheck` clean.
- T2: RED: 10/10 failed against `null` stubs (`Unable to find an accessible element with the role "heading" and name "Build pages without shipping code"`). GREEN: 10/10 pass; `next/image` and `next/link` render in jsdom without mocks.
- T3: RED: 13/13 failed against stubs (`expected '' to be 'pricing-simple-pricing'`; `Unable to find an accessible element with the role "region" and name "Simple pricing"`). GREEN: 13/13 pass. Added `headingId.ts` (title-derived `aria-labelledby` ids, since blocks cannot call `useId`).

## Next step

T4.
