// @vitest-environment node
import type { ReactElement } from 'react';
import { renderToReadableStream } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import type { BlockOf } from '@/domain/cms';
import { PageBuilder } from '@/components/renderer/PageBuilder';

// Error boundaries do not run during server rendering: React's server
// renderer contains a throw only at the nearest <Suspense>, and without one
// the whole render fails. That is what turned a single corrupted block into
// an HTTP 500 with an empty body under `next dev` and `next start`.

const hero: BlockOf<'hero'> = {
  id: 'blk_hero_01',
  type: 'hero',
  props: {
    title: 'Build pages without shipping code',
    subtitle: 'Compose landing pages from reusable blocks.',
    backgroundImage: { src: '/images/hero.jpg', alt: 'Gradient', width: 1920, height: 1080 },
    cta: { label: 'Get started', href: '/signup', variant: 'primary' },
  },
};

const productGrid: BlockOf<'productGrid'> = {
  id: 'blk_products_01',
  type: 'productGrid',
  props: { title: 'Featured products', products: [] },
};

const pricing: BlockOf<'pricing'> = {
  id: 'blk_pricing_01',
  type: 'pricing',
  props: { title: 'Simple pricing', subtitle: 'Pick a plan.', currency: 'USD', plans: [] },
};

/** Pricing whose `plans` the CMS sent as `null`: `PricingBlock` throws on `plans.map`. */
const corruptedPricing = {
  ...pricing,
  props: { ...pricing.props, plans: null },
} as unknown as BlockOf<'pricing'>;

let serverErrors: unknown[];

async function renderToHtml(element: ReactElement): Promise<string> {
  const stream = await renderToReadableStream(element, {
    onError: (error) => {
      serverErrors.push(error);
    },
  });
  await stream.allReady;
  return new Response(stream).text();
}

let consoleError: MockInstance<typeof console.error>;

beforeEach(() => {
  serverErrors = [];
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
});

describe('PageBuilder server rendering', () => {
  it('server-renders every valid block', async () => {
    const html = await renderToHtml(<PageBuilder blocks={[hero, pricing, productGrid]} />);

    expect(html).toContain('Build pages without shipping code');
    expect(html).toContain('Simple pricing');
    expect(html).toContain('Featured products');
    expect(serverErrors).toEqual([]);
  });

  it('keeps the siblings of a corrupted block in the server HTML', async () => {
    const html = renderToHtml(<PageBuilder blocks={[hero, corruptedPricing, productGrid]} />);

    await expect(html).resolves.toContain('Build pages without shipping code');
    await expect(html).resolves.toContain('Featured products');
    await expect(html).resolves.not.toContain('Simple pricing');
    expect(serverErrors).toEqual([expect.any(TypeError)]);
  });
});
