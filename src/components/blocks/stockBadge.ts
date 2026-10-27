import type { StockLevel } from '@/domain/cms';
import type { BadgeVariant } from '@/components/ui/Badge';

export type StockBadge = {
  variant: BadgeVariant;
  label: string;
};

/** Maps a domain stock level to the badge style and copy shown to shoppers. */
export function getStockBadge(stock: StockLevel): StockBadge {
  switch (stock.status) {
    case 'inStock':
      return { variant: 'success', label: 'In stock' };
    case 'lowStock':
      return { variant: 'warning', label: `Only ${stock.quantity} left` };
    case 'outOfStock':
      return { variant: 'danger', label: 'Out of stock' };
    default: {
      // Adding a `StockLevel` status without handling it fails to compile here.
      const unhandled: never = stock;
      throw new Error(`Unhandled stock level: ${JSON.stringify(unhandled)}`);
    }
  }
}
