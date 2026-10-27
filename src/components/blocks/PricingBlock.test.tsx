import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PricingProps } from '@/domain/cms';
import { PricingBlock } from '@/components/blocks/PricingBlock';

const pricingProps: PricingProps = {
  title: 'Simple pricing',
  subtitle: 'Pick the plan that fits your team.',
  currency: 'USD',
  plans: [
    {
      id: 'plan_starter',
      name: 'Starter',
      description: 'For individuals and side projects.',
      prices: { monthly: 0, yearly: 0 },
      features: [
        { label: '1 project', included: true },
        { label: 'Custom domains', included: false },
      ],
      cta: { label: 'Start free', href: '/signup?plan=starter', variant: 'secondary' },
      highlighted: false,
    },
    {
      id: 'plan_pro',
      name: 'Pro',
      description: 'For growing teams that ship often.',
      prices: { monthly: 2900, yearly: 29000 },
      features: [
        { label: 'Unlimited projects', included: true },
        { label: 'Priority support', included: true },
      ],
      cta: { label: 'Go Pro', href: '/signup?plan=pro', variant: 'primary' },
      highlighted: true,
      tag: 'Most popular',
    },
    {
      id: 'plan_enterprise',
      name: 'Enterprise',
      description: 'For organizations with advanced needs.',
      prices: { monthly: 9900, yearly: 99000 },
      features: [{ label: 'SSO and audit logs', included: true }],
      cta: { label: 'Contact sales', href: '/contact', variant: 'secondary' },
      highlighted: false,
    },
  ],
};

/** Returns the list item that holds the plan whose `<h3>` has this name. */
function getPlanCard(name: string): HTMLElement {
  const card = screen.getByRole('heading', { level: 3, name }).closest('li');
  if (!card) {
    throw new Error(`No list item wraps the "${name}" plan`);
  }
  return card;
}

describe('PricingBlock', () => {
  it('renders a section labelled by its level-2 title, with the subtitle', () => {
    render(<PricingBlock {...pricingProps} />);

    const section = screen.getByRole('region', { name: 'Simple pricing' });
    expect(
      within(section).getByRole('heading', { level: 2, name: 'Simple pricing' }),
    ).toBeInTheDocument();
    expect(within(section).getByText('Pick the plan that fits your team.')).toBeInTheDocument();
  });

  it('renders one card per plan, in order', () => {
    render(<PricingBlock {...pricingProps} />);

    const planNames = screen
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent);
    expect(planNames).toEqual(['Starter', 'Pro', 'Enterprise']);
    expect(within(getPlanCard('Pro')).getByText('For growing teams that ship often.')).toBeVisible();
  });

  it('shows the tag only on the highlighted plan', () => {
    render(<PricingBlock {...pricingProps} />);

    expect(within(getPlanCard('Pro')).getByText('Most popular')).toBeInTheDocument();
    expect(screen.getAllByText('Most popular')).toHaveLength(1);
  });

  it('raises and rings only the highlighted plan', () => {
    render(<PricingBlock {...pricingProps} />);

    expect(getPlanCard('Pro').firstElementChild).toHaveClass('shadow-md', 'ring-2');

    // Checked one by one: a negated multi-class match passes if any single class is missing.
    const starterCard = getPlanCard('Starter').firstElementChild;
    expect(starterCard).not.toHaveClass('shadow-md');
    expect(starterCard).not.toHaveClass('ring-2');
  });

  it('formats the monthly price and the yearly price in the block currency', () => {
    render(<PricingBlock {...pricingProps} />);

    const pro = within(getPlanCard('Pro'));
    expect(pro.getByText('$29.00')).toBeInTheDocument();
    expect(pro.getByText('per month')).toBeInTheDocument();
    expect(pro.getByText('$290.00 billed yearly')).toBeInTheDocument();

    const starter = within(getPlanCard('Starter'));
    expect(starter.getByText('$0.00')).toBeInTheDocument();
    expect(starter.getByText('$0.00 billed yearly')).toBeInTheDocument();
  });

  it('exposes whether each feature is included through text, not only icons', () => {
    render(<PricingBlock {...pricingProps} />);

    const features = within(getPlanCard('Starter')).getAllByRole('listitem');
    expect(features.map((feature) => feature.textContent)).toEqual([
      'Included: 1 project',
      'Not included: Custom domains',
    ]);
    for (const feature of features) {
      expect(feature.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('mutes features that are not included', () => {
    render(<PricingBlock {...pricingProps} />);

    const [included, notIncluded] = within(getPlanCard('Starter')).getAllByRole('listitem');
    expect(included).not.toHaveClass('text-gray-400');
    expect(notIncluded).toHaveClass('text-gray-400');
  });

  it.each([
    ['Starter', 'Start free', '/signup?plan=starter'],
    ['Pro', 'Go Pro', '/signup?plan=pro'],
    ['Enterprise', 'Contact sales', '/contact'],
  ])('links the %s plan CTA "%s" to %s', (planName, label, href) => {
    render(<PricingBlock {...pricingProps} />);

    expect(within(getPlanCard(planName)).getByRole('link', { name: label })).toHaveAttribute(
      'href',
      href,
    );
  });
});
