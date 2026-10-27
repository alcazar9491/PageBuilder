import type { ComponentPropsWithRef } from 'react';
import { cn } from '@/lib/cn';

/**
 * Visual intent of a badge:
 * - `success` / `warning` / `danger`: status labels such as stock levels.
 * - `neutral`: plain categories and tags.
 * - `accent`: emphasis, such as a recommended plan.
 */
export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'accent';

export type BadgeProps = ComponentPropsWithRef<'span'> & {
  variant?: BadgeVariant;
};

const baseClasses =
  'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset';

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-gray-100 text-gray-700 ring-gray-200',
  success: 'bg-green-100 text-green-800 ring-green-200',
  warning: 'bg-amber-100 text-amber-800 ring-amber-200',
  danger: 'bg-red-100 text-red-800 ring-red-200',
  accent: 'bg-indigo-600 text-white ring-indigo-600',
};

export function Badge({ variant = 'neutral', className, ...props }: BadgeProps) {
  return <span className={cn(baseClasses, variantClasses[variant], className)} {...props} />;
}
