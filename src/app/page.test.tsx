import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Home from '@/app/page';

// Renders the real CMS data through parseBlocks and PageBuilder. NODE_ENV is
// "test" here, so the UnknownBlock notice for "slider" is visible.
describe('Home page', () => {
  it('renders the hero title as the only level-1 heading', () => {
    render(<Home />);

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Build pages without shipping code' }),
    ).toBeInTheDocument();
  });

  it('renders the pricing and product regions', () => {
    render(<Home />);

    expect(screen.getByRole('region', { name: 'Simple pricing' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Featured products' })).toBeInTheDocument();
  });

  it('shows the notice for the unsupported "slider" block', () => {
    render(<Home />);

    expect(screen.getByRole('status')).toHaveTextContent('Unsupported block type: "slider".');
  });

  it('renders every block inside the main landmark', () => {
    render(<Home />);

    const main = screen.getByRole('main');
    expect(main).toContainElement(screen.getByRole('region', { name: 'Simple pricing' }));
    expect(main).toContainElement(screen.getByRole('status'));
  });
});
