import { describe, expect, it } from 'vitest';
import type { StockLevel } from '@/domain/cms';
import { getStockBadge, type StockBadge } from '@/components/blocks/stockBadge';

describe('getStockBadge', () => {
  it.each<[StockLevel, StockBadge]>([
    [{ status: 'inStock', quantity: 120 }, { variant: 'success', label: 'In stock' }],
    [{ status: 'lowStock', quantity: 4 }, { variant: 'warning', label: 'Only 4 left' }],
    [{ status: 'outOfStock' }, { variant: 'danger', label: 'Out of stock' }],
  ])('maps %o to its badge', (stock, expected) => {
    expect(getStockBadge(stock)).toEqual(expected);
  });

  it('uses the remaining quantity in the low-stock label', () => {
    expect(getStockBadge({ status: 'lowStock', quantity: 1 }).label).toBe('Only 1 left');
  });
});
