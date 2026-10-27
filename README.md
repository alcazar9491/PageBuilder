# PageBuilder

A dynamic page renderer for a headless CMS, built with Next.js (App Router), TypeScript, Tailwind CSS and Vitest.

## Demo

[![Watch the demo video on Loom (3:45)](https://cdn.loom.com/sessions/thumbnails/983db2e91ff149f5b352fb58f9e68627-4807380d5d76ae96.gif)](https://www.loom.com/share/983db2e91ff149f5b352fb58f9e68627)

[Watch the demo on Loom](https://www.loom.com/share/983db2e91ff149f5b352fb58f9e68627)

## How it works

- [`src/data/data.json`](src/data/data.json) mimics a CMS response: a `hero`, a `pricing` and a `productGrid` block, plus a `slider` block that has no component.
- [`PageBuilder`](src/components/renderer/PageBuilder.tsx) resolves each block through a typed registry. An unregistered type renders `UnknownBlock` instead of crashing the page, and every block sits in its own `BlockErrorBoundary`.
- [`PageBuilder.test.tsx`](src/components/renderer/PageBuilder.test.tsx) covers unknown component types, the happy path, edge cases and error isolation.

## Run it

```bash
pnpm install
pnpm dev                     # http://localhost:3000
pnpm test                    # unit tests
docker compose up --build    # production image on http://localhost:3000
```

## Prompt log

[`PROMPT_LOG.md`](PROMPT_LOG.md) lists every prompt used to build the project, verbatim, with the design decisions behind the code.
