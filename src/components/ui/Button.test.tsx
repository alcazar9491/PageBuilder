import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button, type ButtonSize, type ButtonVariant } from '@/components/ui/Button';

describe('Button', () => {
  it('defaults to type="button" so it never submits a form by accident', () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button');
  });

  it('keeps an explicit type', () => {
    render(<Button type="submit">Send</Button>);

    expect(screen.getByRole('button', { name: 'Send' })).toHaveAttribute('type', 'submit');
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Buy</Button>);

    await user.click(screen.getByRole('button', { name: 'Buy' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Buy
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Buy' });
    await user.click(button);

    expect(button).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('is reachable with the keyboard', async () => {
    const user = userEvent.setup();
    render(<Button>Focus me</Button>);

    await user.tab();

    expect(screen.getByRole('button', { name: 'Focus me' })).toHaveFocus();
  });

  it('renders its single child with button styles when asChild is set', () => {
    render(
      <Button asChild variant="outline">
        <a href="/pricing">See pricing</a>
      </Button>,
    );

    const link = screen.getByRole('link', { name: 'See pricing' });
    expect(link).toHaveAttribute('href', '/pricing');
    expect(link).toHaveClass('inline-flex', 'border-gray-300');
    expect(link).not.toHaveAttribute('type');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(link.querySelector('button')).toBeNull();
  });

  it('uses the primary variant and md size by default', () => {
    render(<Button>Default</Button>);

    expect(screen.getByRole('button', { name: 'Default' })).toHaveClass('bg-indigo-600', 'h-10');
  });

  it.each<[ButtonVariant, string]>([
    ['primary', 'bg-indigo-600'],
    ['outline', 'border-gray-300'],
    ['ghost', 'bg-transparent'],
  ])('applies the %s variant styles', (variant, expectedClass) => {
    render(<Button variant={variant}>Label</Button>);

    expect(screen.getByRole('button', { name: 'Label' })).toHaveClass(expectedClass);
  });

  it.each<[ButtonSize, string]>([
    ['sm', 'h-8'],
    ['md', 'h-10'],
    ['lg', 'h-12'],
  ])('applies the %s size styles', (size, expectedClass) => {
    render(<Button size={size}>Label</Button>);

    expect(screen.getByRole('button', { name: 'Label' })).toHaveClass(expectedClass);
  });

  it('exposes focus-visible and disabled styling hooks', () => {
    render(<Button>Label</Button>);

    expect(screen.getByRole('button', { name: 'Label' })).toHaveClass(
      'focus-visible:ring-2',
      'disabled:opacity-50',
      'aria-disabled:opacity-50',
    );
  });

  it('merges a custom className and lets it override conflicting utilities', () => {
    render(<Button className="w-full px-8">Wide</Button>);

    const button = screen.getByRole('button', { name: 'Wide' });
    expect(button).toHaveClass('w-full', 'px-8', 'h-10');
    expect(button).not.toHaveClass('px-4');
  });

  it('forwards a ref to the button element', () => {
    const ref = createRef<HTMLButtonElement>();

    render(<Button ref={ref}>Label</Button>);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current).toBe(screen.getByRole('button', { name: 'Label' }));
  });
});
