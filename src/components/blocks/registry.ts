import type { ComponentType } from 'react';
import { isKnownBlockType } from '@/domain/blockTypes';
import type { BlockPropsMap, KnownBlockType } from '@/domain/cms';
import { HeroBlock } from '@/components/blocks/HeroBlock';
import { PricingBlock } from '@/components/blocks/PricingBlock';
import { ProductGridBlock } from '@/components/blocks/ProductGridBlock';
import { UnknownBlock, type UnknownBlockProps } from '@/components/blocks/UnknownBlock';

/**
 * One component per known block type, each typed with that block's props.
 * Registering a component whose props do not match its block, adding an
 * unknown key, or missing a known one fails to compile.
 */
export type BlockRegistry = {
  readonly [K in KnownBlockType]: ComponentType<BlockPropsMap[K]>;
};

// A type annotation, not `satisfies`: it rejects missing and extra keys and
// keeps the mapped type, so the renderer can index it generically.
// `slider` is left out on purpose, to exercise the UnknownBlock fallback.
export const blockRegistry: BlockRegistry = {
  hero: HeroBlock,
  pricing: PricingBlock,
  productGrid: ProductGridBlock,
};

/**
 * The guard lives in `domain/` so the data layer can use it without importing
 * components. Re-exported to keep the registry's public API unchanged. The
 * `BlockRegistry` annotation lists every `KnownBlockType`, so a type the guard
 * accepts always has a registered component.
 */
export { isKnownBlockType };

/** Returns the component registered for a known block type, typed with its props. */
export function resolveBlock<K extends KnownBlockType>(type: K): BlockRegistry[K];
/** Returns the registered component for any CMS type, or `UnknownBlock` when none is registered. */
export function resolveBlock(
  type: string,
): BlockRegistry[KnownBlockType] | ComponentType<UnknownBlockProps>;
export function resolveBlock(
  type: string,
): BlockRegistry[KnownBlockType] | ComponentType<UnknownBlockProps> {
  return isKnownBlockType(type) ? blockRegistry[type] : UnknownBlock;
}
