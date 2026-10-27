import type { KnownBlockType } from '@/domain/cms';

/**
 * Every block type the renderer supports. The `Record` over `KnownBlockType`
 * makes adding a type to `BlockPropsMap` a compile error until it is listed
 * here too, so the guard below can never fall behind the domain model.
 */
const knownBlockTypes: Readonly<Record<KnownBlockType, true>> = {
  hero: true,
  pricing: true,
  productGrid: true,
};

/**
 * Narrows a CMS type string to a supported block type. `Object.hasOwn`
 * ignores inherited keys such as `constructor`, `toString` and `__proto__`.
 */
export function isKnownBlockType(type: string): type is KnownBlockType {
  return Object.hasOwn(knownBlockTypes, type);
}
