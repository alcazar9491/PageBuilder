import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CallToAction } from '@/domain/cms';
import { CtaLink } from '@/components/blocks/CtaLink';

const primaryCta: CallToAction = { label: 'Get started', href: '/signup', variant: 'primary' };
const secondaryCta: CallToAction = { label: 'Contact sales', href: '/contact', variant: 'secondary' };

describe('CtaLink', () => {
  it('renders a link with the CTA label and href', () => {
    render(<CtaLink cta={primaryCta} />);

    expect(screen.getByRole('link', { name: 'Get started' })).toHaveAttribute('href', '/signup');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('maps the primary CTA variant to the primary button styles', () => {
    render(<CtaLink cta={primaryCta} />);

    expect(screen.getByRole('link', { name: 'Get started' })).toHaveClass('bg-indigo-600');
  });

  it('maps the secondary CTA variant to the outline button styles', () => {
    render(<CtaLink cta={secondaryCta} />);

    const link = screen.getByRole('link', { name: 'Contact sales' });
    expect(link).toHaveClass('border-gray-300');
    expect(link).not.toHaveClass('bg-indigo-600');
  });

  it('forwards the size and a custom className', () => {
    render(<CtaLink cta={primaryCta} size="lg" className="w-full" />);

    expect(screen.getByRole('link', { name: 'Get started' })).toHaveClass('h-12', 'w-full');
  });
});
