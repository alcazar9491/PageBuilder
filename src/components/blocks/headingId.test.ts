import { describe, expect, it } from 'vitest';
import { toHeadingId } from '@/components/blocks/headingId';

describe('toHeadingId', () => {
  it('prefixes a lowercase, hyphenated slug of the text', () => {
    expect(toHeadingId('pricing', 'Simple pricing')).toBe('pricing-simple-pricing');
  });

  it('strips accents, punctuation and surrounding separators', () => {
    expect(toHeadingId('products', '  Crème brûlée & Co.!  ')).toBe('products-creme-brulee-co');
  });

  it('falls back to the bare prefix when nothing usable is left', () => {
    expect(toHeadingId('pricing', '')).toBe('pricing');
    expect(toHeadingId('pricing', '¡¿?!')).toBe('pricing');
  });
});
