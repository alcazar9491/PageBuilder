import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import type { Block, BlockOf, HeroProps, UnknownBlock } from '@/domain/cms';
import cmsData from '@/data/data.json';
import { parseBlocks } from '@/data/parseBlocks';
import { PageBuilder } from '@/components/renderer/PageBuilder';

/**
 * Lets the "block error boundary" section make the registered `HeroBlock`
 * throw. The flag is off by default and reset after every test, so all other
 * tests render the real hero.
 */
const heroMock = vi.hoisted(() => ({ shouldThrow: false }));

vi.mock('@/components/blocks/HeroBlock', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/components/blocks/HeroBlock')>();
  const { createElement } = await import('react');

  return {
    ...original,
    // Same name as the real component, so React's component stack names it.
    HeroBlock(props: HeroProps) {
      if (heroMock.shouldThrow) {
        throw new Error('Hero exploded');
      }
      return createElement(original.HeroBlock, props);
    },
  };
});

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
      {
        id: 'plan_pro',
        name: 'Pro',
        description: 'For growing teams.',
        prices: { monthly: 2900, yearly: 29000 },
        features: [{ label: 'Unlimited projects', included: true }],
        cta: { label: 'Go Pro', href: '/signup?plan=pro', variant: 'primary' },
        highlighted: true,
        tag: 'Most popular',
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
        specs: [
          { label: 'Battery', value: '30 h' },
          { label: 'Weight', value: '250 g' },
        ],
        rating: { average: 4.7, count: 1284 },
        stock: { status: 'inStock', quantity: 120 },
      },
      {
        id: 'prd_keyboard',
        name: 'Mechanical Keyboard',
        href: '/products/mechanical-keyboard',
        image: { src: '/images/keyboard.jpg', alt: 'Keyboard', width: 800, height: 800 },
        price: { amount: 12900, currency: 'USD' },
        specs: [{ label: 'Layout', value: '75%' }],
        rating: { average: 4.5, count: 642 },
        stock: { status: 'lowStock', quantity: 4 },
      },
      {
        id: 'prd_monitor',
        name: '4K Monitor',
        href: '/products/4k-monitor',
        image: { src: '/images/monitor.jpg', alt: 'Monitor', width: 800, height: 800 },
        price: { amount: 44900, currency: 'USD' },
        specs: [{ label: 'Refresh rate', value: '144 Hz' }],
        rating: { average: 4.8, count: 317 },
        stock: { status: 'outOfStock' },
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

const testimonials: UnknownBlock = {
  id: 'blk_testimonials_01',
  type: 'unknown',
  originalType: 'testimonials',
  payload: { quotes: [] },
};

/** Pricing whose `plans` the CMS sent as `null`: `PricingBlock` throws on `plans.map`. */
const corruptedPricing = {
  id: 'blk_pricing_bad',
  type: 'pricing',
  props: { ...pricing.props, plans: null },
} as unknown as BlockOf<'pricing'>;

const heroTitle = hero.props.title;

/** The page's block headings (h1/h2) in document order. */
function blockHeadings(root: HTMLElement = document.body): (string | null)[] {
  return Array.from(root.querySelectorAll('h1, h2'), (heading) => heading.textContent);
}

/** The closest ancestor matching `selector`; throws so a missing one fails the test loudly. */
function closestTo(element: HTMLElement, selector: string): HTMLElement {
  const match = element.closest<HTMLElement>(selector);
  if (!match) {
    throw new Error(`No "${selector}" wraps ${element.outerHTML}`);
  }
  return match;
}

/** The card (list item) inside `region` whose `<h3>` has this name. */
function cardIn(region: HTMLElement, name: string): HTMLElement {
  return closestTo(within(region).getByRole('heading', { level: 3, name }), 'li');
}

let consoleError: MockInstance<typeof console.error>;

beforeEach(() => {
  // React logs every caught render error; keep the test output clean.
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
  heroMock.shouldThrow = false;
  vi.unstubAllEnvs();
});

describe('PageBuilder', () => {
  describe('resilience to unknown block types', () => {
    it('does not throw when an unknown block sits among known ones', () => {
      expect(() =>
        render(<PageBuilder blocks={[hero, slider, pricing, productGrid]} />),
      ).not.toThrow();
    });

    it('names the unknown type in the UnknownBlock notice', () => {
      render(<PageBuilder blocks={[hero, slider, pricing, productGrid]} />);

      expect(screen.getByRole('status')).toHaveTextContent('Unsupported block type: "slider".');
    });

    it('renders the known blocks before and after it, in order', () => {
      const { container } = render(<PageBuilder blocks={[hero, slider, pricing, productGrid]} />);

      expect(blockHeadings(container)).toEqual([heroTitle, 'Simple pricing', 'Featured products']);
    });

    it('renders the real CMS data through parseBlocks, naming its "slider" block', () => {
      // `data.json` sends a "slider" block that no component is registered for.
      const blocks = parseBlocks(cmsData.blocks);

      expect(() => render(<PageBuilder blocks={blocks} />)).not.toThrow();
      expect(screen.getByRole('status')).toHaveTextContent('Unsupported block type: "slider".');
      expect(screen.getByRole('heading', { level: 1, name: heroTitle })).toBeInTheDocument();
      const plans = screen.getByRole('region', { name: 'Simple pricing' });
      expect(within(plans).getAllByRole('heading', { level: 3 })).toHaveLength(3);
      const products = screen.getByRole('region', { name: 'Featured products' });
      expect(within(products).getAllByRole('heading', { level: 3 })).toHaveLength(3);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('handles another unregistered type the same way', () => {
      expect(() =>
        render(<PageBuilder blocks={[productGrid, testimonials, hero]} />),
      ).not.toThrow();
      expect(screen.getByRole('status')).toHaveTextContent(
        'Unsupported block type: "testimonials".',
      );
      expect(blockHeadings()).toEqual(['Featured products', heroTitle]);
    });
  });

  describe('happy path', () => {
    it('renders known blocks in the order the CMS sent them', () => {
      const { container } = render(<PageBuilder blocks={[productGrid, hero, pricing]} />);

      expect(blockHeadings(container)).toEqual(['Featured products', heroTitle, 'Simple pricing']);
    });

    it('renders the hero heading, subtitle and call to action', () => {
      render(<PageBuilder blocks={[hero, pricing, productGrid]} />);

      const heading = screen.getByRole('heading', { level: 1, name: heroTitle });
      const heroSection = within(closestTo(heading, 'section'));
      expect(heroSection.getByText(hero.props.subtitle)).toBeInTheDocument();
      expect(heroSection.getByRole('link', { name: 'Get started' })).toHaveAttribute(
        'href',
        '/signup',
      );
    });

    it('renders one pricing card per plan, with formatted prices', () => {
      render(<PageBuilder blocks={[hero, pricing, productGrid]} />);

      const region = screen.getByRole('region', { name: 'Simple pricing' });
      const planNames = within(region)
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent);
      expect(planNames).toEqual(['Starter', 'Pro']);

      const pro = within(cardIn(region, 'Pro'));
      expect(pro.getByText('$29.00')).toBeInTheDocument();
      expect(pro.getByText('$290.00 billed yearly')).toBeInTheDocument();
      expect(within(cardIn(region, 'Starter')).getByText('$0.00')).toBeInTheDocument();
    });

    it('tags only the highlighted plan', () => {
      render(<PageBuilder blocks={[hero, pricing, productGrid]} />);

      const region = screen.getByRole('region', { name: 'Simple pricing' });
      expect(within(cardIn(region, 'Pro')).getByText('Most popular')).toBeInTheDocument();
      expect(within(cardIn(region, 'Starter')).queryByText('Most popular')).not.toBeInTheDocument();
    });

    it.each([
      ['Starter', 'Start free', '/signup?plan=starter'],
      ['Pro', 'Go Pro', '/signup?plan=pro'],
    ])('links the %s plan to its call to action', (plan, label, href) => {
      render(<PageBuilder blocks={[hero, pricing, productGrid]} />);

      const region = screen.getByRole('region', { name: 'Simple pricing' });
      expect(within(cardIn(region, plan)).getByRole('link', { name: label })).toHaveAttribute(
        'href',
        href,
      );
    });

    it('renders one list item per product', () => {
      render(<PageBuilder blocks={[hero, pricing, productGrid]} />);

      const region = screen.getByRole('region', { name: 'Featured products' });
      const productNames = within(region)
        .getAllByRole('listitem')
        .map((item) => within(item).getByRole('heading', { level: 3 }).textContent);
      expect(productNames).toEqual(['Studio Headphones', 'Mechanical Keyboard', '4K Monitor']);
    });

    it.each([
      ['Studio Headphones', '$199.00', 'In stock'],
      ['Mechanical Keyboard', '$129.00', 'Only 4 left'],
      ['4K Monitor', '$449.00', 'Out of stock'],
    ])('shows the formatted price and stock badge of %s', (product, price, badge) => {
      render(<PageBuilder blocks={[hero, pricing, productGrid]} />);

      const region = screen.getByRole('region', { name: 'Featured products' });
      const card = within(cardIn(region, product));
      expect(card.getByText(price)).toBeInTheDocument();
      expect(card.getByText(badge)).toBeInTheDocument();
    });

    it('lists the spec terms and values of a product', () => {
      render(<PageBuilder blocks={[hero, pricing, productGrid]} />);

      const region = screen.getByRole('region', { name: 'Featured products' });
      const card = within(cardIn(region, 'Studio Headphones'));
      expect(card.getAllByRole('term').map((term) => term.textContent)).toEqual([
        'Battery',
        'Weight',
      ]);
      expect(card.getAllByRole('definition').map((value) => value.textContent)).toEqual([
        '30 h',
        '250 g',
      ]);
    });
  });

  describe('edge cases', () => {
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
      expect(blockHeadings()).toEqual([heroTitle, 'Simple pricing']);
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
      expect(blockHeadings()).toEqual([heroTitle, 'Simple pricing']);
    });

    it('tolerates duplicate CMS ids without a React key warning', () => {
      const { container } = render(
        <PageBuilder blocks={[hero, { ...pricing, id: hero.id }, { ...productGrid, id: hero.id }]} />,
      );

      const keyWarnings = consoleError.mock.calls.filter(([message]) =>
        String(message).includes('key'),
      );
      expect(keyWarnings).toEqual([]);
      expect(blockHeadings(container)).toEqual([heroTitle, 'Simple pricing', 'Featured products']);
    });

    it('contains a known block whose props are missing', () => {
      // The cast simulates a raw CMS entry that bypassed `parseBlocks` without `props`.
      const bareProducts = { id: 'blk_products_bare', type: 'productGrid' } as unknown as Block;

      expect(() => render(<PageBuilder blocks={[hero, bareProducts, pricing]} />)).not.toThrow();
      expect(screen.getByRole('alert')).toHaveTextContent(
        /^Block "productGrid" \(blk_products_bare\) failed to render: /,
      );
      expect(blockHeadings()).toEqual([heroTitle, 'Simple pricing']);
    });
  });

  describe('block error boundary', () => {
    it('contains a registered block that throws while its siblings render', () => {
      heroMock.shouldThrow = true;

      expect(() =>
        render(<PageBuilder blocks={[hero, pricing, productGrid]} />),
      ).not.toThrow();
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Block "hero" (blk_hero_01) failed to render: Hero exploded',
      );
      expect(blockHeadings()).toEqual(['Simple pricing', 'Featured products']);
      expect(consoleError).toHaveBeenCalledWith(
        'Block "hero" (blk_hero_01) failed to render.',
        expect.objectContaining({ message: 'Hero exploded' }),
        expect.stringContaining('HeroBlock'),
      );
    });

    it('contains a corrupted known block while its siblings still render', () => {
      const { container } = render(<PageBuilder blocks={[hero, corruptedPricing, productGrid]} />);

      expect(screen.getByRole('alert')).toHaveTextContent(
        /^Block "pricing" \(blk_pricing_bad\) failed to render: .*'map'/,
      );
      expect(blockHeadings(container)).toEqual([heroTitle, 'Featured products']);
      expect(consoleError).toHaveBeenCalledWith(
        'Block "pricing" (blk_pricing_bad) failed to render.',
        expect.any(TypeError),
        expect.stringContaining('PricingBlock'),
      );
    });

    it('gives each crashing block its own alert and renders the valid blocks between them', () => {
      heroMock.shouldThrow = true;

      render(<PageBuilder blocks={[hero, pricing, productGrid, corruptedPricing]} />);

      expect(screen.getAllByRole('alert').map((alert) => alert.textContent)).toEqual([
        'Block "hero" (blk_hero_01) failed to render: Hero exploded',
        expect.stringMatching(/^Block "pricing" \(blk_pricing_bad\) failed to render: /),
      ]);
      expect(blockHeadings()).toEqual(['Simple pricing', 'Featured products']);
    });

    it('renders nothing for a crashed or unknown block in production, keeping the siblings', () => {
      vi.stubEnv('NODE_ENV', 'production');
      heroMock.shouldThrow = true;

      expect(() =>
        render(<PageBuilder blocks={[hero, slider, pricing, productGrid]} />),
      ).not.toThrow();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(blockHeadings()).toEqual(['Simple pricing', 'Featured products']);
    });
  });
});
