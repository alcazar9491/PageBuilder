# Feature: PageBuilder test suite

## Objective

Make `src/components/renderer/PageBuilder.test.tsx` a complete suite covering four areas: resilience to unknown types, the happy path, edge cases, and error-boundary isolation. Add a coverage script.

## Problem / Why

The current file has 9 tests. They do not cover:
- `not.toThrow()`;
- unknown blocks placed between valid ones;
- the raw CMS path through `parseBlocks`;
- happy-path content (prices, cards);
- malformed elements;
- an explicitly throwing registered component.

Two real gaps exist in `PageBuilder` itself:
- A `null` (or non-object) entry crashes the whole page. `block.id` and `block.type` are read in `PageBuilder`'s own `map`, outside any boundary.
- A raw unregistered type that bypasses `parseBlocks` (for example `{ type: 'slider' }`) falls back through `resolveBlock`. It renders `Unsupported block type: ""` because no `type` prop reaches `UnknownBlock`.

## Scope

- `PageBuilder.tsx` hardening:
  - skip entries that are not objects with a string `id` and a string `type`;
  - name unregistered raw types in `UnknownBlock`.
- Expanded `PageBuilder.test.tsx`.
- `@vitest/coverage-v8` and a `test:coverage` script.

Out of scope:
- renaming `vitest.config.mts` (it is already the Vitest config; `.mts` forces ESM);
- `AGENTS.md` (decision pending with the user);
- the `useId` fix.

## TDD

- Mode: strict, on.
- Source: user global `~/.claude/CLAUDE.md`.
- Runner: Vitest (`pnpm test`).
- New behavior: RED is a failed assertion against the current `PageBuilder`.
- Characterization tests (behavior that already exists): prove each can fail by temporarily breaking the implementation (mutation check), then restore it.

## Delivery

- Branch: `test/page-builder-suite`, stacked on `feat/page-renderer` (no remote yet).
- Strategy: `ask-on-risk` (default).
- Forecast: about 350 authored lines, mostly tests.
- RDD: unavailable. `gentle-ai` 1.49.0 has no `review` command.

## Tasks

- [x] T1: Harden `PageBuilder` against malformed entries and raw unregistered types, test-first. Route: delegated (test/build execution).
- [x] T2: Reorganize and expand `PageBuilder.test.tsx` into the four sections, with mutation checks. Route: delegated.
- [ ] T3: Coverage provider and `test:coverage` script. Route: delegated.

## Acceptance criteria

- **Unknown types:**
  - `render` does not throw;
  - `UnknownBlock` names `slider`, both for normalized data and for raw JSON through `parseBlocks`;
  - valid blocks before and after it render.
- **Happy path:** the hero `<h1>`, subtitle and CTA; pricing plan cards with formatted prices and the highlighted tag; product cards with price, stock badge and specs.
- **Edge cases:**
  - `[]` and non-array input render an empty container;
  - `null`, primitive and id-less entries are skipped while siblings render;
  - a raw unregistered type is named;
  - duplicate ids produce no key warning.
- **Boundary:**
  - a mocked registered component that throws, and a block with corrupted props, are each contained;
  - siblings render;
  - in production there is no alert and no notice.
- `pnpm test`, `pnpm typecheck` and `pnpm build` pass. `pnpm test:coverage` reports `PageBuilder.tsx`.

## Progress / Evidence

- Engram mirror: pending (the server is disconnected).

### T1: Harden `PageBuilder`

- Change:
  - `src/domain/blockTypes.ts` gains `BlockEnvelope` and `isBlockEnvelope`: a non-null, non-array object with a non-empty string `id` and `type`.
  - `parseBlocks` reuses it (behavior unchanged; its suite passes untouched).
  - `PageBuilder` skips entries that fail it, and renders `UnknownBlock` for any type the registry guard rejects, naming the raw type in both the notice and the boundary's `blockType`.
- Decision: the shared guard requires *non-empty* strings, so the renderer also skips `id: ''` and `type: ''`. That keeps one definition of a block across the trust boundary and the renderer.
- Finding: `Array.isArray(blocks)` narrowed `readonly Block[]` to `any[]`, so `block` inside the `map` was silently `any`. A local `isList` guard (`value is readonly unknown[]`) keeps the list typed as `readonly Block[]`.
- RED (`pnpm vitest run` on `PageBuilder.test.tsx` and `blockTypes.test.ts`, against the unchanged code): 23 failed, 20 passed.
  - `null` and `undefined` entries: `render` threw `TypeError: Cannot read properties of null (reading 'id')` (and `undefined`).
  - A number, a string, an entry without a type: an extra `Unsupported block type: ""` notice rendered (`queryByRole('status')` was found).
  - An entry without an id, with a numeric id, with an empty id: a second hero rendered (3 headings instead of 2).
  - A raw `slider` that bypassed `parseBlocks`: the notice read `Unsupported block type: "". Register it in ...`.
  - `isBlockEnvelope` (14 tests): `TypeError: isBlockEnvelope is not a function`.
- GREEN: `pnpm test` 19 files, 194 tests passed. `pnpm typecheck` and `pnpm build` passed.

### T2: Four-section suite

- `PageBuilder.test.tsx` holds 36 tests (9 before T1, 18 after it), in four `describe` sections: resilience to unknown block types (5), happy path (11), edge cases (16), block error boundary (4). Every earlier test is kept.
- `HeroBlock` is mocked with `vi.mock` + `vi.hoisted`. A flag makes it throw `new Error('Hero exploded')`; otherwise it delegates to the real component through `importOriginal`. `afterEach` resets the flag and calls `vi.unstubAllEnvs()`.
- Mutation checks: each mutation was applied alone, the file was run with `pnpm vitest run src/components/renderer/PageBuilder.test.tsx`, then the source was restored with `git checkout`. No mutation was committed.

| Section | Mutation | Tests that failed |
| --- | --- | --- |
| Resilience | `<UnknownBlock type="" />` | 4/36: the slider notice, the real `data.json` path, `testimonials`, plus the raw-slider edge case |
| Resilience | throw for an unknown type in the `map`, outside the boundary | 7/36: all 5 resilience tests, the raw slider, production |
| Happy path | render `null` instead of `KnownBlockView` | 29/36, including all 11 happy-path tests |
| Happy path | `PricingBlock` shows the yearly amount as the monthly price | 1: formatted prices |
| Happy path | `PricingBlock` shows the tag on every plan | 1: tags only the highlighted plan |
| Happy path | `ProductGridBlock` ignores each product's stock level | 2: the Mechanical Keyboard and 4K Monitor badges |
| Happy path | `ProductGridBlock` renders the spec label as its value | 1: spec terms and values |
| Happy path | `CtaLink` ignores `cta.href` | 3: the hero CTA, the Starter and Pro plan links |
| Edge cases | drop the `isList` (`Array.isArray`) guard | 4: null, undefined, object and string inputs |
| Edge cases | guard returns `null` instead of the empty container | 5: the empty list and the 4 non-array inputs |
| Edge cases | drop the per-entry `isBlockEnvelope` guard | 8: all malformed entries |
| Edge cases | key `block.id` without the index | 1: duplicate ids (key warning) |
| Boundary | remove the `BlockErrorBoundary` wrapper | 5: missing props, throwing hero, corrupted pricing, two crashes, production |
| Boundary | `BlockErrorBoundary` ignores production | 1: production |
| Boundary | `UnknownBlock` ignores production | 1: production |
| Boundary | `componentDidCatch` logs without the block context | 2: throwing hero, corrupted pricing |
| Isolation | `afterEach` does not reset the hero flag | 1: corrupted pricing (runs right after the throwing hero) |

- GREEN after restoring: `pnpm test` 19 files, 212 tests passed. `pnpm typecheck` passed.

## Next step

T3.
