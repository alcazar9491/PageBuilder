import { createRef } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  type CardProps,
} from '@/components/ui/Card';

/** Renders a pricing-style card labelled by its title, and returns its root. */
function renderPlanCard(props: CardProps = {}) {
  render(
    <Card role="article" aria-labelledby="plan-title" {...props}>
      <Card.Header>
        <h3 id="plan-title">Pro</h3>
        <p>For growing teams</p>
      </Card.Header>
      <Card.Content>
        <p>Unlimited projects</p>
      </Card.Content>
      <Card.Footer>
        <button type="button">Go Pro</button>
      </Card.Footer>
    </Card>,
  );

  return screen.getByRole('article', { name: 'Pro' });
}

function isBefore(first: Node, second: Node): boolean {
  return Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
}

describe('Card', () => {
  it('renders header, content and footer children in order', () => {
    const card = renderPlanCard();

    const title = within(card).getByRole('heading', { name: 'Pro' });
    const subtitle = within(card).getByText('For growing teams');
    const feature = within(card).getByText('Unlimited projects');
    const cta = within(card).getByRole('button', { name: 'Go Pro' });

    expect(isBefore(title, subtitle)).toBe(true);
    expect(isBefore(subtitle, feature)).toBe(true);
    expect(isBefore(feature, cta)).toBe(true);
  });

  it('passes native attributes through to the root', () => {
    const card = renderPlanCard({ id: 'plan-pro' });

    expect(card).toHaveAttribute('aria-labelledby', 'plan-title');
    expect(card).toHaveAttribute('id', 'plan-pro');
  });

  it('lays the root out as a rounded vertical flex column', () => {
    const card = renderPlanCard();

    expect(card).toHaveClass('flex', 'flex-col', 'rounded-xl');
  });

  it('has a border by default and none when bordered is false', () => {
    const { unmount } = render(<Card aria-label="Bordered" role="group" />);
    expect(screen.getByRole('group', { name: 'Bordered' })).toHaveClass('border');
    unmount();

    render(<Card aria-label="Borderless" role="group" bordered={false} />);
    expect(screen.getByRole('group', { name: 'Borderless' })).not.toHaveClass('border');
  });

  it('has no shadow by default and one when shadow is set', () => {
    const { unmount } = render(<Card aria-label="Flat" role="group" />);
    expect(screen.getByRole('group', { name: 'Flat' })).not.toHaveClass('shadow-md');
    unmount();

    render(<Card aria-label="Raised" role="group" shadow />);
    expect(screen.getByRole('group', { name: 'Raised' })).toHaveClass('shadow-md');
  });

  it('merges a custom className on the root and lets it override conflicting utilities', () => {
    const card = renderPlanCard({ className: 'max-w-sm p-8' });

    expect(card).toHaveClass('max-w-sm', 'p-8', 'flex-col');
    expect(card).not.toHaveClass('p-6');
  });

  it('forwards a ref to the root element', () => {
    const ref = createRef<HTMLDivElement>();

    const card = renderPlanCard({ ref });

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toBe(card);
  });

  it('stretches the content so footers align at the bottom of equal-height cards', () => {
    renderPlanCard();

    const header = screen.getByRole('heading', { name: 'Pro' }).parentElement;
    const content = screen.getByText('Unlimited projects').parentElement;
    const footer = screen.getByRole('button', { name: 'Go Pro' }).parentElement;

    expect(header).toHaveClass('flex-col');
    expect(content).toHaveClass('flex-1');
    expect(footer).toHaveClass('flex-wrap');
  });

  it('merges className and passes native attributes on each part', () => {
    render(
      <Card>
        <CardHeader className="gap-3" aria-label="Plan header" role="group" />
        <CardContent className="text-sm" aria-label="Plan details" role="group" />
        <CardFooter className="justify-end" aria-label="Plan actions" role="group" />
      </Card>,
    );

    expect(screen.getByRole('group', { name: 'Plan header' })).toHaveClass('gap-3', 'flex-col');
    expect(screen.getByRole('group', { name: 'Plan details' })).toHaveClass('text-sm', 'flex-1');
    expect(screen.getByRole('group', { name: 'Plan actions' })).toHaveClass(
      'justify-end',
      'flex-wrap',
    );
  });

  it('exposes the same parts through dot notation and named exports', () => {
    expect(Card.Header).toBe(CardHeader);
    expect(Card.Content).toBe(CardContent);
    expect(Card.Footer).toBe(CardFooter);
  });
});
