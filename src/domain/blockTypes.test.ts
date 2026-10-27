import { describe, expect, expectTypeOf, it } from 'vitest';
import type { KnownBlockType } from '@/domain/cms';
import { isKnownBlockType } from '@/domain/blockTypes';

describe('isKnownBlockType', () => {
  it.each(['hero', 'pricing', 'productGrid'])('accepts the supported type "%s"', (type) => {
    expect(isKnownBlockType(type)).toBe(true);
  });

  it.each(['slider', '', 'Hero', 'constructor', 'toString', 'hasOwnProperty', '__proto__'])(
    'rejects "%s"',
    (type) => {
      expect(isKnownBlockType(type)).toBe(false);
    },
  );

  it('narrows a string to KnownBlockType', () => {
    const type: string = 'pricing';

    if (isKnownBlockType(type)) {
      expectTypeOf(type).toEqualTypeOf<KnownBlockType>();
    }
  });
});
