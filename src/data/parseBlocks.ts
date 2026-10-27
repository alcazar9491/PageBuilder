import type { Block, KnownBlock, KnownBlockType } from '@/domain/cms';
import { isKnownBlockType } from '@/domain/blockTypes';

/**
 * Maps raw CMS blocks to the domain `Block[]`. This is the single trust
 * boundary between the CMS and the renderer.
 *
 * Only the envelope is validated: a non-empty string `id`, a non-empty string
 * `type` and an object `props`. Entries that fail are dropped. Supported types
 * pass through; any other type becomes an `UnknownBlock`, so the renderer can
 * name it in its fallback.
 *
 * Prop shapes are NOT validated. A known block with corrupted props reaches
 * render, where `BlockErrorBoundary` contains it.
 */
export function parseBlocks(raw: unknown): Block[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.flatMap((entry: unknown) => {
    const block = parseBlock(entry);
    return block ? [block] : [];
  });
}

function parseBlock(entry: unknown): Block | null {
  if (!isPlainObject(entry)) {
    return null;
  }

  const { id, type, props } = entry;
  if (!isNonEmptyString(id) || !isNonEmptyString(type) || !isPlainObject(props)) {
    return null;
  }

  if (isKnownBlockType(type)) {
    // Trust boundary: the envelope is checked above, but `props` is only known
    // to be an object, not the shape `type` promises. This is the app's one
    // assertion from CMS data to block props; it keeps everything downstream
    // fully typed, and `BlockErrorBoundary` contains render-time failures from
    // bad props per block. The annotation widens `props` to `object` so the
    // assertion compares against each block's props without a double cast.
    const envelope: { id: string; type: KnownBlockType; props: object } = { id, type, props };
    return envelope as KnownBlock;
  }

  return { id, type: 'unknown', originalType: type, payload: props };
}

/** A non-null, non-array object, as JSON produces for `{ ... }`. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}
