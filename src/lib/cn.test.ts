import { describe, expect, it } from 'vitest';
import { cn } from '@/lib/cn';

describe('cn', () => {
  it('joins truthy class values and drops falsy ones', () => {
    const isActive = true;
    const isDisabled = false;

    expect(
      cn('base', isActive && 'active', isDisabled && 'disabled', null, undefined, {
        selected: true,
        hidden: false,
      }),
    ).toBe('base active selected');
  });

  it('lets a later Tailwind utility override a conflicting earlier one', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('returns an empty string when there is nothing to merge', () => {
    expect(cn()).toBe('');
  });
});
