import type { Money } from '@/domain/cms';

/**
 * Fixed display locale. Server and client must format numbers identically,
 * or React reports a hydration mismatch, so never rely on the runtime's
 * default locale.
 */
export const DISPLAY_LOCALE = 'en-US';

/**
 * Formats an amount in minor units as a localized currency string
 * (`{ amount: 2900, currency: 'USD' }` -> `$29.00`).
 */
export function formatMoney({ amount, currency }: Money): string {
  // Every supported `CurrencyCode` (USD, EUR, GBP) has 2 decimal places,
  // so minor units convert with a fixed divisor. Revisit this before adding
  // a zero-decimal currency such as JPY.
  const majorUnits = amount / 100;

  return new Intl.NumberFormat(DISPLAY_LOCALE, { style: 'currency', currency }).format(majorUnits);
}
