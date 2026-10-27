import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { HeroProps } from '@/domain/cms';
import { HeroBlock } from '@/components/blocks/HeroBlock';

const heroProps: HeroProps = {
  eyebrow: 'New season',
  title: 'Build pages without shipping code',
  subtitle: 'Compose landing pages from reusable blocks managed in your CMS.',
  backgroundImage: {
    src: '/images/hero.jpg',
    alt: 'Abstract gradient background',
    width: 1920,
    height: 1080,
  },
  cta: { label: 'Get started', href: '/signup', variant: 'primary' },
};

describe('HeroBlock', () => {
  it('renders the title as the level-1 heading', () => {
    render(<HeroBlock {...heroProps} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Build pages without shipping code' }),
    ).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    render(<HeroBlock {...heroProps} />);

    expect(
      screen.getByText('Compose landing pages from reusable blocks managed in your CMS.'),
    ).toBeInTheDocument();
  });

  it('renders the eyebrow when one is provided', () => {
    render(<HeroBlock {...heroProps} />);

    expect(screen.getByText('New season')).toBeInTheDocument();
  });

  it('omits the eyebrow when none is provided', () => {
    const { eyebrow: _omitted, ...withoutEyebrow } = heroProps;

    const { container } = render(<HeroBlock {...withoutEyebrow} />);

    expect(screen.queryByText('New season')).not.toBeInTheDocument();
    // Only the subtitle paragraph remains: no empty eyebrow element.
    expect(container.querySelectorAll('p')).toHaveLength(1);
  });

  it('renders the CTA as a link with its label and href', () => {
    render(<HeroBlock {...heroProps} />);

    const cta = screen.getByRole('link', { name: 'Get started' });
    expect(cta).toHaveAttribute('href', '/signup');
    expect(cta).toHaveClass('h-12');
  });

  it('renders the background image with its alt text and loads it eagerly', () => {
    render(<HeroBlock {...heroProps} />);

    const image = screen.getByRole('img', { name: 'Abstract gradient background' });
    expect(image).toHaveAttribute('sizes', '100vw');
    // It is the LCP image, so it is preloaded instead of lazy-loaded.
    expect(image).not.toHaveAttribute('loading', 'lazy');
  });
});
