import { describe, expect, it } from 'vitest';
import type { Money } from '@/domain/cms';
import { formatMoney } from '@/lib/format';

describe('formatMoney', () => {
  it('converts minor units to a USD amount with two decimals', () => {
    const money: Money = { amount: 2900, currency: 'USD' };

    expect(formatMoney(money)).toBe('$29.00');
  });

  it('formats a zero amount', () => {
    expect(formatMoney({ amount: 0, currency: 'USD' })).toBe('$0.00');
  });

  it('keeps the cents of a non-round amount', () => {
    expect(formatMoney({ amount: 129999, currency: 'USD' })).toBe('$1,299.99');
  });

  it.each<[Money, string]>([
    [{ amount: 4950, currency: 'EUR' }, '€49.50'],
    [{ amount: 1000, currency: 'GBP' }, '£10.00'],
  ])('uses the currency symbol of %o', (money, expected) => {
    expect(formatMoney(money)).toBe(expected);
  });
});
