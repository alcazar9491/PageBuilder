import type { ComponentType } from 'react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import type { HeroProps, KnownBlockType, PricingProps, ProductGridProps } from '@/domain/cms';
import { HeroBlock } from '@/components/blocks/HeroBlock';
import { PricingBlock } from '@/components/blocks/PricingBlock';
import { ProductGridBlock } from '@/components/blocks/ProductGridBlock';
import { UnknownBlock, type UnknownBlockProps } from '@/components/blocks/UnknownBlock';
import {
  blockRegistry,
  isKnownBlockType,
  resolveBlock,
  type BlockRegistry,
} from '@/components/blocks/registry';

describe('blockRegistry', () => {
  it('registers exactly the known block types, leaving "slider" out on purpose', () => {
    expect(Object.keys(blockRegistry)).toEqual(['hero', 'pricing', 'productGrid']);
  });
});

describe('isKnownBlockType', () => {
  it.each(['hero', 'pricing', 'productGrid'])('accepts the registered type "%s"', (type) => {
    expect(isKnownBlockType(type)).toBe(true);
  });

  it.each(['slider', '', 'constructor', 'toString', '__proto__', 'Hero'])(
    'rejects "%s"',
    (type) => {
      expect(isKnownBlockType(type)).toBe(false);
    },
  );
});

describe('resolveBlock', () => {
  it.each<[KnownBlockType, unknown]>([
    ['hero', HeroBlock],
    ['pricing', PricingBlock],
    ['productGrid', ProductGridBlock],
  ])('resolves "%s" to its block component', (type, component) => {
    expect(resolveBlock(type)).toBe(component);
  });

  it.each(['slider', '', 'constructor', 'toString', '__proto__'])(
    'falls back to UnknownBlock for "%s"',
    (type) => {
      expect(resolveBlock(type)).toBe(UnknownBlock);
    },
  );
});

// Type-level contract. These assertions are no-ops at runtime; `pnpm typecheck`
// enforces them, and an unused `@ts-expect-error` is itself a compile error.
describe('registry types', () => {
  it('types a known block type with its own props', () => {
    expectTypeOf(resolveBlock('hero')).toEqualTypeOf<ComponentType<HeroProps>>();
    expectTypeOf(resolveBlock('pricing')).toEqualTypeOf<ComponentType<PricingProps>>();
    expectTypeOf(resolveBlock('productGrid')).toEqualTypeOf<ComponentType<ProductGridProps>>();
  });

  it('types an arbitrary string as a known block or the fallback', () => {
    const type: string = 'slider';

    expectTypeOf(resolveBlock(type)).toEqualTypeOf<
      BlockRegistry[KnownBlockType] | ComponentType<UnknownBlockProps>
    >();
  });

  it('narrows a string to KnownBlockType through the guard', () => {
    const type: string = 'hero';

    if (isKnownBlockType(type)) {
      expectTypeOf(type).toEqualTypeOf<KnownBlockType>();
    }
  });

  it('rejects a component whose props do not match its block type', () => {
    const mismatched: BlockRegistry = {
      // @ts-expect-error `hero` needs a component for HeroProps, not PricingProps.
      hero: PricingBlock,
      pricing: PricingBlock,
      productGrid: ProductGridBlock,
    };

    expect(mismatched).toBeDefined();
  });

  it('rejects an unknown block type key', () => {
    const withSlider: BlockRegistry = {
      hero: HeroBlock,
      pricing: PricingBlock,
      productGrid: ProductGridBlock,
      // @ts-expect-error `slider` is not a KnownBlockType.
      slider: UnknownBlock,
    };

    expect(withSlider).toBeDefined();
  });

  it('rejects a registry that misses a known block type', () => {
    // @ts-expect-error `productGrid` is missing.
    const incomplete: BlockRegistry = { hero: HeroBlock, pricing: PricingBlock };

    expect(incomplete).toBeDefined();
  });
});
