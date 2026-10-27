import { describe, expect, expectTypeOf, it } from 'vitest';
import type { KnownBlockType } from '@/domain/cms';
import { isBlockEnvelope, isKnownBlockType, type BlockEnvelope } from '@/domain/blockTypes';

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

describe('isBlockEnvelope', () => {
  it.each([
    ['a known block', { id: 'blk_hero', type: 'hero', props: {} }],
    ['an unregistered type', { id: 'blk_slider', type: 'slider' }],
  ])('accepts %s', (_label, value) => {
    expect(isBlockEnvelope(value)).toBe(true);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a number', 42],
    ['a string', 'hero'],
    ['an array', ['blk_hero', 'hero']],
    ['a missing id', { type: 'hero' }],
    ['an empty id', { id: '', type: 'hero' }],
    ['a non-string id', { id: 7, type: 'hero' }],
    ['a missing type', { id: 'blk_hero' }],
    ['an empty type', { id: 'blk_hero', type: '' }],
    ['a non-string type', { id: 'blk_hero', type: ['hero'] }],
  ])('rejects %s', (_label, value) => {
    expect(isBlockEnvelope(value)).toBe(false);
  });

  it('narrows an unknown value to BlockEnvelope', () => {
    const value: unknown = { id: 'blk_hero', type: 'hero' };

    if (isBlockEnvelope(value)) {
      expectTypeOf(value).toEqualTypeOf<BlockEnvelope>();
    }
  });
});
