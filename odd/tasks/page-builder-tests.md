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
- [ ] T2: Reorganize and expand `PageBuilder.test.tsx` into the four sections, with mutation checks. Route: delegated.
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

## Next step

T2.
