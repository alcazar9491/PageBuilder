import type { ComponentPropsWithRef } from 'react';
import { cn } from '@/lib/cn';

export type CardProps = ComponentPropsWithRef<'div'> & {
  /** Draws a subtle border. Defaults to `true`. */
  bordered?: boolean;
  /** Raises the card with a drop shadow. Defaults to `false`. */
  shadow?: boolean;
};

export type CardHeaderProps = ComponentPropsWithRef<'div'>;

export type CardContentProps = ComponentPropsWithRef<'div'>;

export type CardFooterProps = ComponentPropsWithRef<'div'>;

function CardRoot({ bordered = true, shadow = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-xl bg-white p-6 text-gray-900',
        bordered && 'border border-gray-200',
        shadow && 'shadow-md',
        className,
      )}
      {...props}
    />
  );
}

/** Vertical stack for a title and an optional subtitle, passed as children. */
export function CardHeader({ className, ...props }: CardHeaderProps) {
  return <div className={cn('flex flex-col gap-1', className)} {...props} />;
}

/**
 * Main body. It grows to fill the card, so footers line up at the bottom
 * of equal-height cards in a grid (for example pricing plans).
 */
export function CardContent({ className, ...props }: CardContentProps) {
  return <div className={cn('flex-1', className)} {...props} />;
}

/** Row of actions that wraps on narrow cards. */
export function CardFooter({ className, ...props }: CardFooterProps) {
  return <div className={cn('flex flex-wrap items-center gap-2', className)} {...props} />;
}

/**
 * Compound card. Use `Card.Header`, `Card.Content` and `Card.Footer`, or the
 * named exports. It has no `'use client'` on purpose: dot-notation parts do
 * not survive the RSC client boundary.
 */
export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Content: CardContent,
  Footer: CardFooter,
});
