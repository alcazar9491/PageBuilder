import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Builds a class string from conditional values and resolves Tailwind
 * conflicts so that later utilities win (`cn('px-2', 'px-4')` -> `px-4`).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
