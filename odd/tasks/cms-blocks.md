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
- [x] T4: `getStockBadge` and `ProductGridBlock`, test-first. Route: delegated.
- [x] T5: `UnknownBlock`, with dev and production behavior, test-first. Route: delegated.
- [x] T6: `registry.ts` (typed map, `resolveBlock`, prototype-key guard, type-level tests). Route: delegated.

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
- T4: RED: 17/17 failed against stubs (`expected { variant: 'neutral', label: '' } to deeply equal { variant: 'success', …(1) }`; `Unable to find an accessible element with the role "region" and name "Featured products"`). GREEN: 17/17 pass; `pnpm typecheck` clean.
- T5: RED: 3/3 failed against a stub rendering an empty `role="status"` (`toHaveTextContent()` received empty text; `toBeEmptyDOMElement()` failed in production). GREEN: 3/3 pass (`development`, `test`, `production` via `vi.stubEnv`).
- T6: RED (runtime): 11/24 failed against a loose stub (`expected [Function Placeholder] to be [Function HeroBlock]`; `expected false to be true`); the other 13 are rejection cases, the keys check and type-only cases. RED (types): `pnpm typecheck` failed with 4 × TS2344 on `expectTypeOf` and 3 × TS2578 `Unused '@ts-expect-error' directive`. GREEN: 24/24 pass and `pnpm typecheck` is clean; TS 7 accepts the `resolveBlock` overloads as specified.
- Full checks after T6: `pnpm test` 112 passed (14 files); `pnpm typecheck` clean; `pnpm build` compiled and prerendered `/` and `/_not-found`.
- Size: 1,035 authored lines under `src/` (components 437, tests 598), against the 850 forecast. Tests grew most. PR slicing is still deferred until a remote exists.

### Commits

| Task | Commit | Message |
| --- | --- | --- |
| T1 | `59a5a8b` | `feat(blocks): add formatMoney helper` |
| T2 | `083ab8b` | `feat(blocks): add HeroBlock and CtaLink` |
| T3 | `36bc6db` | `feat(blocks): add PricingBlock` |
| T4 | `f427f2f` | `feat(blocks): add ProductGridBlock with stock badges` |
| T5 | `650a895` | `feat(blocks): add UnknownBlock fallback` |
| T6 | `8d324f6` | `feat(blocks): add typed block registry with UnknownBlock fallback` |

### Accepted changes beyond the brief

- `headingId.ts`: `toHeadingId(prefix, title)` derives the `aria-labelledby` ids, because hook-free blocks cannot call `useId`. Two blocks with the same prefix and title on one page would share an id. If that becomes possible, the renderer should pass the CMS block id.
- `DISPLAY_LOCALE` is exported from `format.ts`, so `ProductGridBlock` formats ratings and review counts with the same fixed locale.
- Pricing plans render as a `<ul>` of cards, which follows the "lists use `<ul>`/`<li>`" rule. The "/month" suffix is `aria-hidden`, with `sr-only` "per month" for screen readers.
- `CtaLink.test.tsx` covers the `CtaVariant` to `ButtonVariant` mapping directly.

## Next step

Feature `page-builder-renderer`: `PageBuilder` renders `page.blocks` through `resolveBlock`, maps `UnknownBlock` domain entries (`originalType`) to the fallback, and wraps each block in `BlockErrorBoundary`. Then wire `src/app/page.tsx` to the data layer. Sync the Engram mirror `odd/cms-blocks/tasks` when the server is reachable.
