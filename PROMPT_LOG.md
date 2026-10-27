# Prompt Log

This file records the AI prompts that built this CMS-driven page renderer, the tool used for each one, and the design decisions behind the code. It lets a reviewer check what was asked, what was delivered, and where the result deliberately differs from the prompt.

## How to verify

```bash
pnpm install --frozen-lockfile
pnpm test            # 212 tests in 19 files
pnpm typecheck       # tsc --noEmit
pnpm test:coverage   # PageBuilder.tsx at 100%
pnpm build           # standalone output
docker compose up --build   # stop any local `next dev` first: both use port 3000
```

Then open `http://localhost:3000`. You should see the hero, the pricing plans and the product grid. Outside production, an amber notice also appears for the unregistered `slider` block.

## Prompts

All prompts ran in **Claude Code** with **Claude Opus 5.5**, from 2026-10-26 to 2026-10-27. If you use Cursor or Gemini on later work, add a row for each prompt.

| # | Tool | Objective | Outcome | Commits |
|---|------|-----------|---------|---------|
| 1 | Claude Code | Define the `src/` layer structure, strict CMS contracts with discriminated unions (`src/domain/cms.ts`), and sample data (`src/data/data.json`). | Domain types plus a sample page with hero, pricing, productGrid and an unsupported `slider`. | `767050b` |
| 2 | Claude Code | Build composition-first UI primitives: a compound `Card`, `Badge`, and an accessible `Button` with `asChild`. | Toolchain set up (Next.js 16, Tailwind v4, Vitest), then `cn`, `Badge`, `Button` and `Card`, each written test-first. | `4874f9c`…`9685ac7` |
| 3 | Claude Code | Build the `HeroBlock`, `PricingBlock`, `ProductGridBlock` and `UnknownBlock` components and a resolution registry. | Blocks composed from the primitives, plus a typed registry with an `UnknownBlock` fallback. `slider` is left unregistered on purpose. | `59a5a8b`…`38f9d7b` |
| 4 | Claude Code | Add a rendering engine (`PageBuilder`) with a per-block `BlockErrorBoundary`, and wire `src/app/page.tsx`. | `parseBlocks` as the single point where CMS data is validated, a per-block boundary plus `Suspense`, and the home page rendered from `data.json`. | `8f1ee45`…`1428714` |
| 5 | Claude Code | Write a full Vitest + Testing Library suite for `PageBuilder`. | 36 `PageBuilder` tests in four sections, two renderer bugs fixed, and v8 coverage. | `5408523`…`839ee6b` |
| 6 | Claude Code | Add Docker deployment: standalone output, a multi-stage Alpine `Dockerfile`, Compose and `.dockerignore`. | Standalone server verified locally. The container image is not verified yet. | `e4e1b7c` |
| 7 | Claude Code | Write this prompt log. | `PROMPT_LOG.md` | this commit |

### Where the result differs from the prompt

The deviations below are intentional and were discussed during the session. Each one keeps type safety or correctness that the literal prompt would have lost.

| Prompt | Asked for | Delivered | Why |
|--------|-----------|-----------|-----|
| 1 | A generic/unknown block such as `slider` | `UnknownBlock` with `type: 'unknown'` and `originalType: 'slider'` | A `type: string` member overlaps every literal type and breaks narrowing on `block.type`. |
| 3 | `Record<string, ComponentType<any>>` | `BlockRegistry` mapped over `KnownBlockType` (chosen by the user) | `any` turns off prop checking: `<PricingBlock {...heroProps} />` would compile. |
| 4 | Pass `data.json` straight to `PageBuilder` | `parseBlocks(cmsData.blocks)` | A JSON import widens `"hero"` to `string`, and `slider` must become `UnknownBlock` data. |
| 4 | An error boundary per block | Boundary **plus** `<Suspense>` per block | Error boundaries do not run during server rendering (details below). |
| 5 | Configuration in `vitest.config.ts` | `vitest.config.mts`, already present | It is the same config file; `.mts` forces Node to load it as an ES module. |
| 6 | `next.config.js` | `next.config.ts` | This is a TypeScript project, and Next 16 reads the `.ts` file directly with its `NextConfig` type. |

## Design decisions

### 1. Clean Architecture and the Registry Pattern (Open/Closed Principle)

**Decision:** dependencies point inward, toward `domain/`. The renderer resolves blocks through a registry, so supporting a new block type extends the system without modifying `PageBuilder`.

| Layer | Path | Depends on | Responsibility |
|-------|------|------------|----------------|
| Domain | `src/domain/` | nothing | CMS contracts (`cms.ts`) and pure type guards (`blockTypes.ts`) |
| Data | `src/data/` | domain | `data.json`, and `parseBlocks`, where untrusted CMS data is validated |
| UI primitives | `src/components/ui/` | `src/lib/` only | `Card`, `Badge`, `Button`, with no knowledge of the CMS |
| Blocks | `src/components/blocks/` | domain, ui | Block components, the registry, and mappings from domain values to UI variants |
| Renderer | `src/components/renderer/` | domain, blocks | `PageBuilder`, `BlockErrorBoundary` |
| App | `src/app/` | data, renderer | Route wiring |

Two rules keep the layers honest:

- `ui/` never imports `domain/`. `Badge` does not know what a `StockLevel` is.
- `data/` never imports `components/`. The known-type guard lives in `domain/`, so the data layer and the registry share it.

**The registry is typed against the domain, not against `any`.** One map is the single source of truth, `BlockPropsMap` in `src/domain/cms.ts`:

```ts
// src/components/blocks/registry.ts
export type BlockRegistry = {
  readonly [K in KnownBlockType]: ComponentType<BlockPropsMap[K]>;
};

export const blockRegistry: BlockRegistry = {
  hero: HeroBlock,
  pricing: PricingBlock,
  productGrid: ProductGridBlock,
  // `slider` is left out on purpose, to exercise the UnknownBlock fallback.
};
```

The compiler rejects:
- a component whose props do not match its block;
- a missing block type;
- an extra key.

Type-level tests prove each rejection with `@ts-expect-error`. Lookups use `Object.hasOwn`, so a CMS type such as `"constructor"` or `"__proto__"` falls back to `UnknownBlock` instead of returning a built-in function.

**Adding a block type** touches only extension points. The compiler flags each step you miss.

- [ ] Add its props interface and an entry in `BlockPropsMap` (`src/domain/cms.ts`).
- [ ] Add the type to `knownBlockTypes` (`src/domain/blockTypes.ts`).
- [ ] Create the component in `src/components/blocks/`.
- [ ] Register it in `blockRegistry` (`src/components/blocks/registry.ts`).

`PageBuilder`, `parseBlocks` and `BlockErrorBoundary` stay unchanged. That is the Open/Closed Principle applied to the renderer.

**Discriminated unions make illegal states unrepresentable:**

| Union | Prevents |
|-------|----------|
| `Block = KnownBlock \| UnknownBlock` | An unsupported block hiding behind `type: string` |
| `PlanHighlight` | A highlighted plan without a tag, or a regular plan with one |
| `StockLevel` | An `outOfStock` product carrying a `quantity` |

Prices are stored in minor units (cents) to avoid floating-point rounding errors.

### 2. Composition for UI primitives

**Decision:** primitives own style and accessibility, and consumers own content. Components receive `children` instead of a growing list of props, which is inversion of control.

| Primitive | Pattern | Key choices |
|-----------|---------|-------------|
| `Card` | Compound component: `Card.Header`, `Card.Content`, `Card.Footer`, also exported by name | `Content` uses `flex-1`, so footers line up across equal-height pricing cards. There is no `'use client'`, because dot-notation subcomponents do not survive the boundary between server and client components. |
| `Badge` | One semantic variant prop: `neutral`, `success`, `warning`, `danger` or `accent` | It knows nothing about stock or plans. `getStockBadge` in `blocks/` maps `StockLevel` to a variant and a label. |
| `Button` | `asChild` through Radix `Slot` | `<Button asChild><Link href="…" /></Button>` keeps `next/link` client-side navigation. There is no separate `href` mode. It defaults to `type="button"`, so a button never submits a form by accident. |

Blocks are built by composing these primitives. Simplified from `PricingBlock.tsx`:

```tsx
<Card shadow={plan.highlighted}>
  <Card.Header>
    <h3>{plan.name}</h3>
    {plan.highlighted && <Badge variant="accent">{plan.tag}</Badge>}
  </Card.Header>
  <Card.Content>{/* price and features */}</Card.Content>
  <Card.Footer>
    <CtaLink cta={plan.cta} />
  </Card.Footer>
</Card>
```

All primitives and blocks are Server Components. Only `BlockErrorBoundary` ships to the client.

### 3. Resilience: `UnknownBlock` and `BlockErrorBoundary`

**Decision:** CMS data is untrusted, so several defenses stack. A single bad block degrades only its own slot, never the page.

| Layer | Failure | Behavior |
|-------|---------|----------|
| `parseBlocks` | Not an array, or an entry without a valid `id`, `type` and `props` | Returns `[]`, or drops the entry |
| `parseBlocks` | Unregistered type (`slider`) | Becomes `UnknownBlock` data that keeps `originalType` |
| `PageBuilder` | Empty, non-array or malformed entries | Renders an empty container, or skips the entry |
| `UnknownBlock` | Unsupported type | Outside production: an amber `role="status"` notice naming the type. In production: `null` |
| `BlockErrorBoundary` + `Suspense` | A block throws while rendering | Outside production: a contained `role="alert"` with the block type, id and message. In production: nothing. Sibling blocks always render. |
| Registry | Prototype keys (`constructor`, `__proto__`) | `UnknownBlock` |

**Why a `Suspense` per block.** React does not run error boundaries during server rendering. On the server, only a `<Suspense>` contains a thrown error: React emits the fallback there and retries that block in the browser, where the boundary catches it. The team checked this against a real Next.js server with a deliberately corrupted pricing block (`plans: null`):

| Render | Boundary only | Boundary + `Suspense` |
|--------|---------------|-----------------------|
| `next dev` | HTTP 500, empty body | HTTP 200, other blocks rendered |
| `next start` (page rendered per request) | HTTP 500, empty body | HTTP 200, no error text leaked |
| `next build` (page pre-built) | Build fails | Build fails (Next.js design, see below) |

During build-time prerendering, Next.js 16 rethrows any Server Component error even when the render recovered. Bad CMS data bundled with the app therefore stops the deploy instead of shipping. Per-block containment applies when pages render at request time.

**How the tests prove it.** `PageBuilder.test.tsx` covers four areas:
- resilience to unknown types;
- the happy path;
- edge cases;
- the error boundary.

In the error-boundary tests, a `vi.mock`-ed `HeroBlock` throws on demand. Each section was also run against 16 deliberate code changes that broke the behavior, such as removing the boundary or dropping a guard. Every change made at least one test fail. Coverage for `PageBuilder.tsx` is 100%.

## Process

- **Test-driven:** every behavior was written test-first (a failing test, then the code, then a refactor). Each first failure was a failed assertion against a placeholder, not a missing-file error.
- **Small commits:** one Conventional Commit per task, with tests in the same commit as the code. Each prompt's work is on its own branch, and each branch starts from the previous one.
- **Task records:** each feature has a task list with evidence in `odd/tasks/`.
- **Delegation:** Claude Code coordinated the work and handed each feature's implementation to a sub-agent with a written spec. The orchestrator checked the commits and the key files before reporting.
