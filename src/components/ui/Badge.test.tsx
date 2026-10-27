import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';

describe('Badge', () => {
  it('renders its children inside a span', () => {
    render(<Badge>In stock</Badge>);

    const badge = screen.getByText('In stock');
    expect(badge.tagName).toBe('SPAN');
  });

  it('uses the neutral variant by default', () => {
    render(<Badge>Laptops</Badge>);

    expect(screen.getByText('Laptops')).toHaveClass('bg-gray-100');
  });

  it.each<[BadgeVariant, string]>([
    ['neutral', 'bg-gray-100'],
    ['success', 'bg-green-100'],
    ['warning', 'bg-amber-100'],
    ['danger', 'bg-red-100'],
    ['accent', 'bg-indigo-600'],
  ])('applies the %s variant styles', (variant, expectedClass) => {
    render(<Badge variant={variant}>Label</Badge>);

    expect(screen.getByText('Label')).toHaveClass(expectedClass);
  });

  it('merges a custom className and lets it override conflicting utilities', () => {
    render(
      <Badge variant="success" className="custom-badge bg-emerald-200">
        Label
      </Badge>,
    );

    const badge = screen.getByText('Label');
    expect(badge).toHaveClass('custom-badge', 'bg-emerald-200', 'rounded-full');
    expect(badge).not.toHaveClass('bg-green-100');
  });

  it('passes native attributes through to the span', () => {
    render(
      <Badge title="Only 3 left" aria-live="polite">
        Low stock
      </Badge>,
    );

    const badge = screen.getByText('Low stock');
    expect(badge).toHaveAttribute('title', 'Only 3 left');
    expect(badge).toHaveAttribute('aria-live', 'polite');
  });

  it('forwards a ref to the span element', () => {
    const ref = createRef<HTMLSpanElement>();

    render(<Badge ref={ref}>Label</Badge>);

    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    expect(ref.current).toBe(screen.getByText('Label'));
  });
});
