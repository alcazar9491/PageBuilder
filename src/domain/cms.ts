/**
 * CMS domain contracts.
 *
 * These types describe the normalized page model consumed by the renderer.
 * Raw CMS payloads are untrusted: validate and map them in the data layer
 * before they reach any component.
 */

// ---------------------------------------------------------------------------
// Shared value objects
// ---------------------------------------------------------------------------

/** ISO 4217 codes supported by the storefront. */
export type CurrencyCode = 'USD' | 'EUR' | 'GBP';

/** Amounts are in minor units (e.g. cents) to avoid floating-point errors. */
export interface Money {
  amount: number;
  currency: CurrencyCode;
}

export interface ImageAsset {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export type CtaVariant = 'primary' | 'secondary';

export interface CallToAction {
  label: string;
  href: string;
  variant: CtaVariant;
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export interface HeroProps {
  eyebrow?: string;
  title: string;
  subtitle: string;
  backgroundImage: ImageAsset;
  cta: CallToAction;
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

export type BillingPeriod = 'monthly' | 'yearly';

export interface PlanFeature {
  label: string;
  included: boolean;
}

/** A highlighted plan must carry a tag; a regular plan cannot have one. */
export type PlanHighlight =
  | { highlighted: true; tag: string }
  | { highlighted: false; tag?: never };

interface PricingPlanBase {
  id: string;
  name: string;
  description: string;
  /** Minor units, expressed in the parent block's currency. */
  prices: Readonly<Record<BillingPeriod, number>>;
  features: readonly PlanFeature[];
  cta: CallToAction;
}

export type PricingPlan = PricingPlanBase & PlanHighlight;

export interface PricingProps {
  title: string;
  subtitle: string;
  currency: CurrencyCode;
  plans: readonly PricingPlan[];
}

// ---------------------------------------------------------------------------
// Product grid
// ---------------------------------------------------------------------------

export type StockLevel =
  | { status: 'inStock'; quantity: number }
  | { status: 'lowStock'; quantity: number }
  | { status: 'outOfStock' };

export interface ProductRating {
  /** Average score from 0 to 5. */
  average: number;
  count: number;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  href: string;
  image: ImageAsset;
  price: Money;
  specs: readonly ProductSpec[];
  rating: ProductRating;
  stock: StockLevel;
}

export interface ProductGridProps {
  title: string;
  products: readonly Product[];
}

// ---------------------------------------------------------------------------
// Blocks
// ---------------------------------------------------------------------------

/**
 * Single source of truth mapping each block type to its props.
 * Adding a block starts here; `KnownBlock` and any registry typed
 * against `KnownBlockType` pick it up automatically.
 */
export interface BlockPropsMap {
  hero: HeroProps;
  pricing: PricingProps;
  productGrid: ProductGridProps;
}

export type KnownBlockType = keyof BlockPropsMap;

export interface BlockOf<TType extends KnownBlockType> {
  id: string;
  type: TType;
  props: BlockPropsMap[TType];
}

export type HeroBlock = BlockOf<'hero'>;
export type PricingBlock = BlockOf<'pricing'>;
export type ProductGridBlock = BlockOf<'productGrid'>;

/** Resolves to `HeroBlock | PricingBlock | ProductGridBlock`. */
export type KnownBlock = { [K in KnownBlockType]: BlockOf<K> }[KnownBlockType];

/**
 * Any block the renderer does not support (e.g. "slider").
 * The data layer maps unrecognized types here instead of keeping
 * `type: string`, which would overlap every literal and break narrowing.
 */
export interface UnknownBlock {
  id: string;
  type: 'unknown';
  /** The type the CMS actually sent. */
  originalType: string;
  /** Untrusted payload, kept for diagnostics only. */
  payload: unknown;
}

export type Block = KnownBlock | UnknownBlock;

export interface Page {
  slug: string;
  title: string;
  blocks: readonly Block[];
}
