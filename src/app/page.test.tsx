import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Home from '@/app/page';

// Toolchain smoke test: proves jsdom, RTL, jest-dom matchers and the
// `@` alias are wired together.
describe('Home page', () => {
  it('renders the placeholder heading', () => {
    render(<Home />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Page Builder' }),
    ).toBeInTheDocument();
  });
});
