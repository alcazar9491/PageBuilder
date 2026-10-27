import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import type { Block, BlockOf, UnknownBlock } from '@/domain/cms';
import { PageBuilder } from '@/components/renderer/PageBuilder';

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

const pricing: BlockOf<'pricing'> = {
  id: 'blk_pricing_01',
  type: 'pricing',
  props: {
    title: 'Simple pricing',
    subtitle: 'Pick the plan that fits your team.',
    currency: 'USD',
    plans: [
      {
        id: 'plan_starter',
        name: 'Starter',
        description: 'For side projects.',
        prices: { monthly: 0, yearly: 0 },
        features: [{ label: '1 project', included: true }],
        cta: { label: 'Start free', href: '/signup?plan=starter', variant: 'secondary' },
        highlighted: false,
      },
    ],
  },
};

const productGrid: BlockOf<'productGrid'> = {
  id: 'blk_products_01',
  type: 'productGrid',
  props: {
    title: 'Featured products',
    products: [
      {
        id: 'prd_headphones',
        name: 'Studio Headphones',
        href: '/products/studio-headphones',
        image: { src: '/images/headphones.jpg', alt: 'Headphones', width: 800, height: 800 },
        price: { amount: 19900, currency: 'USD' },
        specs: [{ label: 'Battery', value: '30 h' }],
        rating: { average: 4.7, count: 1284 },
        stock: { status: 'inStock', quantity: 120 },
      },
    ],
  },
};

const slider: UnknownBlock = {
  id: 'blk_slider_01',
  type: 'unknown',
  originalType: 'slider',
  payload: { autoplay: true },
};

/** Pricing whose `plans` the CMS sent as `null`: `PricingBlock` throws on `plans.map`. */
const corruptedPricing = {
  id: 'blk_pricing_bad',
  type: 'pricing',
  props: { ...pricing.props, plans: null },
} as unknown as BlockOf<'pricing'>;

/** The page's block headings (h1/h2) in document order. */
function blockHeadings(container: HTMLElement): (string | null)[] {
  return Array.from(container.querySelectorAll('h1, h2'), (heading) => heading.textContent);
}

let consoleError: MockInstance<typeof console.error>;

beforeEach(() => {
  // React logs every caught render error; keep the test output clean.
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
});

describe('PageBuilder', () => {
  it('renders an empty container for an empty list', () => {
    const { container } = render(<PageBuilder blocks={[]} />);

    expect(container.childElementCount).toBe(1);
    expect(container.firstElementChild).toBeEmptyDOMElement();
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['an object', { blocks: [hero] }],
    ['a string', 'hero'],
  ])('renders an empty container when blocks is %s', (_label, blocks) => {
    // The cast simulates untyped data reaching the component at runtime.
    const { container } = render(<PageBuilder blocks={blocks as unknown as readonly Block[]} />);

    expect(container.childElementCount).toBe(1);
    expect(container.firstElementChild).toBeEmptyDOMElement();
  });

  it('renders known blocks in the order the CMS sent them', () => {
    const { container } = render(<PageBuilder blocks={[productGrid, hero, pricing]} />);

    expect(blockHeadings(container)).toEqual([
      'Featured products',
      'Build pages without shipping code',
      'Simple pricing',
    ]);
  });

  it('renders the UnknownBlock notice naming an unsupported type', () => {
    render(<PageBuilder blocks={[hero, slider]} />);

    expect(screen.getByRole('status')).toHaveTextContent('Unsupported block type: "slider".');
  });

  it('contains a corrupted known block while its siblings still render', () => {
    const { container } = render(<PageBuilder blocks={[hero, corruptedPricing, productGrid]} />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      /^Block "pricing" \(blk_pricing_bad\) failed to render: .*'map'/,
    );
    expect(blockHeadings(container)).toEqual([
      'Build pages without shipping code',
      'Featured products',
    ]);
    expect(consoleError).toHaveBeenCalledWith(
      'Block "pricing" (blk_pricing_bad) failed to render.',
      expect.any(TypeError),
      expect.stringContaining('PricingBlock'),
    );
  });

  it('tolerates duplicate CMS ids without a React key warning', () => {
    const { container } = render(
      <PageBuilder blocks={[hero, { ...pricing, id: hero.id }, { ...productGrid, id: hero.id }]} />,
    );

    const keyWarnings = consoleError.mock.calls.filter(([message]) =>
      String(message).includes('key'),
    );
    expect(keyWarnings).toEqual([]);
    expect(blockHeadings(container)).toEqual([
      'Build pages without shipping code',
      'Simple pricing',
      'Featured products',
    ]);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a number', 42],
    ['a string', 'hero'],
    ['an entry without an id', { type: 'hero', props: hero.props }],
    ['an entry with a non-string id', { id: 7, type: 'hero', props: hero.props }],
    ['an entry with an empty id', { id: '', type: 'hero', props: hero.props }],
    ['an entry without a type', { id: 'blk_typeless', props: hero.props }],
  ])('skips %s while its valid siblings render', (_label, entry) => {
    // The cast simulates an untyped entry reaching the component at runtime.
    const blocks = [hero, entry, pricing] as unknown as readonly Block[];

    expect(() => render(<PageBuilder blocks={blocks} />)).not.toThrow();
    expect(blockHeadings(document.body)).toEqual([
      'Build pages without shipping code',
      'Simple pricing',
    ]);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('names a raw unregistered type that bypassed parseBlocks', () => {
    // The cast simulates a raw CMS entry that never went through `parseBlocks`.
    const rawSlider = {
      id: 'blk_slider_raw',
      type: 'slider',
      props: { autoplay: true },
    } as unknown as Block;

    expect(() => render(<PageBuilder blocks={[hero, rawSlider, pricing]} />)).not.toThrow();
    expect(screen.getByRole('status')).toHaveTextContent('Unsupported block type: "slider".');
    expect(blockHeadings(document.body)).toEqual([
      'Build pages without shipping code',
      'Simple pricing',
    ]);
  });
});
