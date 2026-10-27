# Feature: Page renderer and block error isolation

## Objective

Render a CMS page from `data.json`. `PageBuilder` resolves each block through the registry, and each block gets its own `BlockErrorBoundary`, so one broken block never blanks the page.

## Problem / Why

Blocks and the registry exist, but nothing composes them into a page. CMS data is untrusted. Unknown types must hit the fallback, and a corrupted block must be contained.

## Scope

- `src/domain/blockTypes.ts`: `isKnownBlockType`, a pure and exhaustive guard. The registry reuses it.
- `src/data/parseBlocks.ts`: raw CMS JSON to `Block[]`.
- `src/components/renderer/BlockErrorBoundary.tsx` (client class component).
- `src/components/renderer/PageBuilder.tsx` (server component).
- `src/app/page.tsx`: wiring.

Out of scope: Zod or deep prop validation, image assets under `public/`, and the `useId` heading-id fix.

## Decisions

- `data.json` cannot go straight into `PageBuilder`:
  - A JSON import widens `"type": "hero"` to `string`, so it does not type-check as `Block[]` without a cast.
  - `slider` must become `{ type: 'unknown', originalType: 'slider' }`, or `UnknownBlock` cannot name the type.
  - So `page.tsx` passes `parseBlocks(cmsData.blocks)`. This is the single trust boundary.
- `parseBlocks` validates only the envelope (`id`, `type`, object `props`). It does not validate the shape of the props. A known block with corrupted props reaches render, and `BlockErrorBoundary` contains it, as the user's design intends.
- The data layer must not import presentation code. The known-type guard therefore lives in `domain/`, not in `components/blocks/registry.ts`.
- The prop type is `blocks: readonly Block[]`. `Block` is the existing domain name for the user's `CMSBlock`.
- Keys are `${block.id}-${index}`, per the user's spec. This tolerates duplicate CMS ids. Moving a block remounts it, which is harmless for static CMS content.
- The boundary shows a contained `role="alert"` outside production, and renders nothing in production.

## TDD

- Mode: strict, on.
- Source: user global `~/.claude/CLAUDE.md`.
- Runner: Vitest (`pnpm test`).
- RED must be a failed assertion against a stub.

## Delivery

- Branch: `feat/page-renderer`, stacked on `feat/cms-blocks` (no remote yet).
- Strategy: `ask-on-risk` (default).
- Forecast: about 550 authored lines. This is over the 400-line budget, so PR slicing is deferred until a remote exists.
- RDD: unavailable. `gentle-ai` 1.49.0 has no `review` command.

## Tasks

- [x] T1: `isKnownBlockType` in `domain/`, with the registry reusing it, and `parseBlocks`. Test-first. Route: delegated (writer trigger, 2+ non-trivial files).
- [x] T2: `BlockErrorBoundary`, test-first. Route: delegated.
- [x] T3: `PageBuilder`, test-first. Route: delegated.
- [x] T4: `page.tsx` wiring, an updated page test, and a real Next.js check that a broken block is contained during SSR and in the browser. Route: delegated. The browser half was not checked in a real browser (see Progress).

## Acceptance criteria

- `parseBlocks`:
  - non-array input returns `[]`;
  - invalid envelopes are dropped;
  - `slider` becomes `UnknownBlock` data;
  - prototype keys are treated as unknown.
- A block that throws while rendering shows a contained alert outside production and nothing in production. Its siblings still render.
- Empty or invalid `blocks` render an empty container.
- In the real app, the home page renders hero, pricing and products, plus the dev notice for `slider`.
- `pnpm test`, `pnpm typecheck` and `pnpm build` pass.
- One Conventional Commit per task, with no AI attribution.

## Progress / Evidence

- Engram mirror: pending (the server is disconnected).
- T1 RED→GREEN: against stubs (`isKnownBlockType` always false, `parseBlocks` always `[]`), 12 of 38 new tests failed on `AssertionError` (e.g. `expected [] to deeply equal [ { id: 'blk_hero', …(2) } ]`); after implementing, 150/150 pass and `pnpm typecheck` is clean. The registry now re-exports the domain guard; its existing tests pass unchanged. `parseBlocks` holds the one documented `as KnownBlock` assertion, from an envelope annotated with `props: object` (a `Record<string, unknown>` source is not comparable to the props interfaces, TS2352).
- T2 RED→GREEN: against a stub that rendered an empty `role="alert"` and logged nothing, 5 of 7 tests failed on jest-dom/`AssertionError` matchers (`toHaveTextContent`, `toBeEmptyDOMElement`, `toHaveBeenCalledWith`; React's own log was the only `console.error` call); after implementing, 157/157 pass and typecheck is clean. State is `{ hasError: false } | { hasError: true; error: unknown }` instead of `{ error: unknown | null }`, so a thrown `null` still shows the fallback (covered by a test).
- T3 RED→GREEN: against a stub that rendered `<div key={block.id}>` placeholders, 4 of 9 jsdom tests failed (`expected [] to deeply equal [ 'Featured products', …(2) ]`, the key test's `expected [ [ …(2) ], [ …(2) ] ] to deeply equal []` from real duplicate-key warnings, and two RTL `getByRole` misses); the 5 empty-container cases passed against the stub's guard. GREEN at 166/166. No casts: one widening annotation, `const Component: ComponentType<BlockPropsMap[K]>`, because JSX cannot resolve `LibraryManagedAttributes` on the deferred `BlockRegistry[K]` (TS2769).
- T3 SSR containment (real app, scratch route `/containment-check` with pricing `plans: null`, deleted afterwards):
  - Before Suspense: `next dev` returned HTTP 500 with `<html id="__next_error__">` and an empty `<body><div hidden=""><!--$--><!--/$--></div></body>`; the siblings existed only in the RSC payload. `next build` failed with `Error occurred prerendering page "/containment-check"` and `Export encountered an error ... exiting the build`. With the route forced dynamic, `next start` also returned HTTP 500 with an empty body.
  - Fix: a per-block `<Suspense fallback={null}>` inside the boundary. React's docs say server errors are contained only at the nearest `<Suspense>`, never by error boundaries. RED: a new Node-environment test (`PageBuilder.server.test.tsx`, `renderToReadableStream`) failed with `AssertionError: promise rejected "TypeError: Cannot read properties of null…" instead of resolving`. GREEN at 168/168.
  - After Suspense: `next dev` returned HTTP 200 with hero, products and the slider notice in the HTML, and the pricing slot as `<!--$!--><template data-dgst="4239901915" data-msg="Switched to client rendering because the server rendering errored: ...">`. The dynamic route under `next start` returned HTTP 200 with hero and products, and the pricing slot as `<!--$!--><template data-dgst="2466371693"></template><!--/$-->` (no message leaked).
  - Still failing by design: `next build` fails on the corrupted static route even with Suspense. Next 16.4.3 (`next/dist/server/app-render/app-render.js`, around line 1644) rethrows the first Server Component error during build-time prerender: "Build failures still throw, even if recovery produced a usable response." So bad bundled CMS data stops the build rather than shipping; containment applies to request-time renders.
- T4 RED→GREEN: the new page test (4 cases) failed 4/4 against the placeholder page on RTL `getByRole` misses (`Unable to find an accessible element with the role "heading" and name "Build pages without shipping code"`); after wiring `parseBlocks(cmsData.blocks)` into `PageBuilder`, 171/171 pass and typecheck is clean.
- T4 real app:
  - `pnpm build`: exit 0, `○ /` prerendered as static.
  - `next dev`: `GET /` returned HTTP 200 with the hero `<h1>Build pages without shipping code</h1>`, the plans (`Starter`, `Most popular`), the products (`Studio Headphones`, `4K Monitor`) and `<div role="status" ...>Unsupported block type: <code ...>&quot;<!-- -->slider<!-- -->&quot;</code>`; no `role="alert"`, no `__next_error__`. The check ran against the user's own `next dev` on port 3000; Next refuses a second dev server for the same directory, and that process was not stopped.
  - `next start`: `GET /` returned HTTP 200 with the hero, plans and products, and no slider notice (production hides `UnknownBlock`).
  - `/images/hero.jpg` returns 404: the images are not in `public/`, which is out of scope.
  - The corrupted-block check is recorded under T3. It ran against the final `PageBuilder`, which T4 did not change.
  - Not checked: a real browser. Client-side containment (the boundary catching the retried block after hydration) is covered by the jsdom tests only, and the SSR markers show the client-render hand-off.

## Next step

T1.
