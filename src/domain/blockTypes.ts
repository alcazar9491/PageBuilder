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

/** The fields every block carries, whatever its type: what code reads before anything else. */
export type BlockEnvelope = { readonly id: string; readonly type: string };

/**
 * Checks the envelope of an untrusted block: a non-null, non-array object with
 * a non-empty string `id` and `type`. The data layer drops entries that fail,
 * and the renderer skips them, so both agree on what counts as a block.
 * Props are not checked here.
 */
export function isBlockEnvelope(value: unknown): value is BlockEnvelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'id' in value &&
    isNonEmptyString(value.id) &&
    'type' in value &&
    isNonEmptyString(value.type)
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}
