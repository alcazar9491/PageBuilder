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
| 6 | Claude Code | Add Docker deployment: standalone output, a multi-stage Alpine `Dockerfile`, Compose and `.dockerignore`. | Standalone server verified locally. Later, `docker compose up --build` built a 288 MB image; the container reported `healthy`, ran as `nextjs` and served the hero, pricing and product grid with HTTP 200. | `e4e1b7c` |
| 7 | Claude Code | Write this prompt log. | `PROMPT_LOG.md` | `9071eb2` |
| 8 | Claude Code | Check the project against the assignment. | All four requirements met; three submission gaps found (unbuilt image, summarized prompts, empty `main`). | none |
| 9 | Claude Code | Publish the repository to GitHub. | Public repository, `main` fast-forwarded to the latest work, all branches pushed. | none |
| 10 | Claude Code | Close the open gaps. | Docker image built and run (see row 6), and the full prompt text below. | this commit |

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

### Full prompt text

Each prompt is copied verbatim from the Claude Code session transcripts, typos included. The numbers match the table above. Answers given to Claude's clarifying questions are noted under the prompt they belong to.

#### 1. Project structure and CMS contracts

```text
Act as a Staff Frontend Engineer specializing in Next.js (App Router), TypeScript, and Clean Architecture.

I want to structure a modular project for a "Dynamic Page Renderer" powered by a headless CMS.
I need:
1. A folder structure under `src/` that separates:
- Domain Layer / Types (`domain/`): strict contracts and interfaces for CMS blocks and the props for each block type. 
- Presentation Layer / Components (`components/`):
- `ui/`: composition primitives (Card, Button, Badge). 
- `blocks/`: specific blocks (`Hero`, `Pricing`, `ProductGrid`, `UnknownBlock`) and a registry map (`registry.ts`). 
- `renderer/`: `PageBuilder.tsx` and its corresponding `BlockErrorBoundary.tsx`. 
- Data Layer (`data/`): where `data.json` will reside.
2. A TypeScript types file (`src/domain/cms.ts`) that strictly defines the following array of blocks coming from a headless CMS:
- `hero` block (eyebrow, title, subtitle, backgroundImage, cta). 
- `pricing` block (title, subtitle, currency, plans—including items, prices, features, and highlighted tags). 
- `productGrid` block (title, an array of products—including specs, ratings, and stock levels). 
- A generic/unknown block (e.g., `slider`).
3. A `data.json` file that exports this exact structure.
generate the directory structure and the code for `src/domain/cms.ts`, using Discriminated Unions for each block.
```

#### 2. UI primitives

```text
Following the principles of the Composition Pattern (avoiding "mega-components" and favoring the use of `children` and inversion of control), implement reusable UI primitives using Tailwind CSS in `src/components/ui/`:

1. `Card.tsx`: using a compound component pattern:
- `Card` (a container with an optional border and shadow)
- `Card.Header` (for titles and subtitles)
- `Card.Content` (a flexible body area)
- `Card.Footer` (for actions or tags)
2. `Badge.tsx`: for stock labels, categories, and highlighted (recommended) plans.
3. `Button.tsx`: an accessible button component that supports various styles (primary, outline, ghost) and can function as a link—either via an `asChild` prop or by rendering an `<a>` tag.

Ensure that the appropriate TypeScript types are exported for each subcomponent.
```

#### 3. Blocks and registry

```text
Now, implement the block components and the resolution registry in `src/components/blocks/`:

1. `HeroBlock.tsx`: Consumes `hero` props using visual composition.
2. `PricingBlock.tsx`: Renders plans from the CMS by composing the previously created `Card`, `Badge`, and `Button` primitives.
3. `ProductGridBlock.tsx`: Renders a product grid—displaying price, stock badges, and specifications—using composition.
4. `UnknownBlock.tsx`: A safe visual fallback that:
- In development (`process.env.NODE_ENV !== 'production'`), displays a friendly yellow alert indicating that the block `type` is not supported.
- In production, ensures the application does not break (returns `null` or an accessible, unobtrusive fallback).
5. `registry.ts`:
- A `Record<string, ComponentType<any>>` dictionary mapping only `hero`, `pricing`, and `productGrid`.
- Important note: Do NOT register `slider`, so that the CMS fallback can be tested.
- A `resolveBlock(type: string): ComponentType<any>` function that returns `UnknownBlock` if the type does not exist in the map.
```

Answer to a clarifying question: a `BlockRegistry` mapped over `KnownBlockType` instead of `Record<string, ComponentType<any>>` (see the deviations table).

#### 4. Rendering engine

```text
Implement the rendering engine and error handling in `src/components/renderer/`:

1. `BlockErrorBoundary.tsx`:
- A React class component (`'use client'`) that catches exceptions during the rendering of a corrupted or broken block.
- If a block fails at runtime, it displays a contained error message in development mode—or nothing at all in production—ensuring that the page does not go blank and that other blocks remain unaffected.
2. `PageBuilder.tsx`:
- Receives a list of typed blocks: `blocks: CMSBlock[]`.
- If the array is empty or invalid, it renders a safe, empty container.
- It iterates through the blocks and dynamically renders each component wrapped in its own `BlockErrorBoundary`, passing down props and assigning a unique key by combining `block.id` with the index.
3. Update `src/app/page.tsx` to import `data.json` and pass it to `<PageBuilder blocks={cmsData} />`.
```

#### 5. PageBuilder test suite

```text
Generate a comprehensive unit test suite using Vitest and `@testing-library/react` for `PageBuilder.tsx`, located at `src/components/renderer/PageBuilder.test.tsx`.

The suite must cover the following:
1. Resilience to unknown component types: Pass an array containing a `slider` block (or another unregistered type) and verify that:
- The application does NOT throw any exceptions (`expect(...).not.toThrow()`).
- The `UnknownBlock` fallback component renders correctly, identifying the missing type.
- Valid blocks appearing before and after the unknown one (e.g., `hero`, `pricing`, `productGrid`) continue to render in the DOM, unaffected.
2. "Happy path" for valid blocks: Verify that `hero`, `pricing`, and `productGrid` render their key content (titles, prices, cards).
3. Edge cases: Verify behavior when provided with an empty array `[]` or malformed elements.
4. Block Error Boundary: Simulate a registered component that throws an error during rendering, and verify that the remaining blocks do not fail.

Include the necessary configuration in `vitest.config.ts` and the required scripts in `package.json`.
```

#### 6. Docker deployment

```text
Create the Docker deployment configuration for this Next.js (App Router) application:

1. `next.config.js`: add `output: 'standalone'`.
2. `Dockerfile`: an optimized multi-stage build using Node.js Alpine:
- Stage 1: `deps` (install dependencies using `frozen-lockfile`). 
- Stage 2: `builder` (build the application). 
- Stage 3: `runner` (minimal production image, non-root user, exposes port 3000).
3. `docker-compose.yml`: to launch the container locally using `docker compose up --build`, mapping port `3000:3000`.
4. `.dockerignore`: to exclude `node_modules`, `.next`, `.git`, coverage, and tests.
```

#### 7. Prompt log

```text
Generate the content for the `PROMPT_LOG.md` file, ready for inclusion in the GitHub repository, with professional documentation covering:
1. A summary table of the prompts used, the tool employed (Cursor/Claude/Gemini), and the objective of each.
2. An explanation of design decisions:
- Use of Clean Architecture and the Registry Pattern to adhere to the Open/Closed Principle.
- Use of the composition pattern for UI primitives (`Card`, `Badge`).
- Resilience against failures (`UnknownBlock` + `BlockErrorBoundary`).
```

#### 8. Assignment check

The assignment text was pasted after the question.

```text
este proyecto cumple con

Instruction: You are explicitly REQUIRED to use Cursor, Claude, Gemini or ChatGPT to complete this assignment. You must submit your code AND a 'Prompt Log' showing how you directed the AI.

The Task: Build a Dynamic Page Renderer using Next.js/Vue/React (App Router).

1. The Data: Create a hardcoded data.json
file that mimics a Headless CMS response. It should contain an array of objects, e.g.,
[{ type: "hero", props: {...}}, { type: "pricing", props: {...}}]

2. The Logic: Build a PageBuilder component that iterates through this array and renders the correct component.

3. The AI Twist: Use AI to generate a unit test suite for your PageBuilder that tests for an "Unknown Component Type" (e.g., if the JSON asks for a slider but you don't have that component, the app should not crash).

Deploy your project in Docker:
- Add your dockerfile/docker compose to the project.

 ?
```

#### 9. Publish to GitHub

```text
sube el repoa git
```

Answers to clarifying questions: create a new public repository, and amend the uncommitted `PROMPT_LOG.md` edit into the prompt-log commit before the first push.

#### 10. Close the open gaps

```text
hazlo
```

#### Discarded first attempt

An earlier session started the project with Zod schemas, an `example.json` file and a `<Product>` compound component. Its output was discarded before the first commit, so none of it is in the history. Its prompts are kept here for completeness:

```text
create a Nextjs app using typescript and tailwind
```

```text
add vitest for testing
```

```text
Create src/data/data.json that mimics a Headless CMS page response: a top-level array of blocks shaped { "id": string, "type": string, "props": {...} }. Include, in this order: a "hero" block, a "pricing" block with 3 tiers, a "productGrid" block whose props.products reuse the 3 products from src/data/example.json, and a "slider" block that we will intentionally NOT implement.
```

```text
In types/blocks.ts define Zod schemas for each block's props: HeroProps, PricingProps, and ProductGridProps (reuse ProductSchema from types/cms.ts). Also define a loose BlockEnvelopeSchema { id: string, type: string, props: unknown }. Do NOT use a discriminated union over all block types: unknown types must pass the envelope validation so the page can skip them instead of failing. Never call .parse at module level; always use safeParse, you have to based in data/example.json
```

```text
Create presentational components pageBuilder/blocks/: Hero.tsx, Pricing.tsx and ProductGrid.tsx. ProductGrid must reuse the existing compound <Product> component. Each component receives only its typed props, does no data loading, and is styled with Tailwind.
```

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
