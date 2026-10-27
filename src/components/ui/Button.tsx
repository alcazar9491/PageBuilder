import type { ComponentPropsWithRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'outline' | 'ghost';

export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = ComponentPropsWithRef<'button'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /**
   * Renders the single child element (for example `<a>` or `next/link`)
   * with the button styles and props instead of a `<button>`.
   * This is the only way to render a link: there is no `href` prop.
   */
  asChild?: boolean;
};

const baseClasses = [
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors',
  'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
  'disabled:pointer-events-none disabled:opacity-50',
  'aria-disabled:pointer-events-none aria-disabled:opacity-50',
].join(' ');

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500',
  outline: 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50',
  ghost: 'bg-transparent text-gray-900 hover:bg-gray-100',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  asChild = false,
  type,
  className,
  ...props
}: ButtonProps) {
  const classes = cn(baseClasses, variantClasses[variant], sizeClasses[size], className);

  if (asChild) {
    // `type` only applies to a native `<button>`, so it is not forwarded
    // to the slotted child.
    return <Slot className={classes} {...props} />;
  }

  // Default to `button` so a Button inside a form never submits it by accident.
  return <button type={type ?? 'button'} className={classes} {...props} />;
}
