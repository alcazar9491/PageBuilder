import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { BlockErrorBoundary } from '@/components/renderer/BlockErrorBoundary';

const renderError = new Error('plans.map is not a function');

function Thrower({ error = renderError }: { error?: unknown }): never {
  throw error;
}

let consoleError: MockInstance<typeof console.error>;

beforeEach(() => {
  // React logs every caught render error; keep the test output clean.
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
  vi.unstubAllEnvs();
});

describe('BlockErrorBoundary', () => {
  it('renders its children when nothing throws', () => {
    render(
      <BlockErrorBoundary blockId="blk_pricing_01" blockType="pricing">
        <p>Simple pricing</p>
      </BlockErrorBoundary>,
    );

    expect(screen.getByText('Simple pricing')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it.each(['development', 'test'])(
    'shows a contained alert naming the block when a child throws (NODE_ENV=%s)',
    (nodeEnv) => {
      vi.stubEnv('NODE_ENV', nodeEnv);

      render(
        <BlockErrorBoundary blockId="blk_pricing_01" blockType="pricing">
          <Thrower />
        </BlockErrorBoundary>,
      );

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Block "pricing" (blk_pricing_01) failed to render: plans.map is not a function',
      );
    },
  );

  it('describes a non-Error throw with String(), including a thrown null', () => {
    render(
      <BlockErrorBoundary blockId="blk_hero_01" blockType="hero">
        <Thrower error={null} />
      </BlockErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Block "hero" (blk_hero_01) failed to render: null',
    );
  });

  it('renders nothing in production', () => {
    vi.stubEnv('NODE_ENV', 'production');

    const { container } = render(
      <BlockErrorBoundary blockId="blk_pricing_01" blockType="pricing">
        <Thrower />
      </BlockErrorBoundary>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('keeps siblings outside the boundary rendered', () => {
    render(
      <>
        <p>Before</p>
        <BlockErrorBoundary blockId="blk_pricing_01" blockType="pricing">
          <Thrower />
        </BlockErrorBoundary>
        <p>After</p>
      </>,
    );

    expect(screen.getByText('Before')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('After')).toBeInTheDocument();
  });

  it('logs the error with the block type, id and component stack', () => {
    render(
      <BlockErrorBoundary blockId="blk_pricing_01" blockType="pricing">
        <Thrower />
      </BlockErrorBoundary>,
    );

    expect(consoleError).toHaveBeenCalledWith(
      'Block "pricing" (blk_pricing_01) failed to render.',
      renderError,
      expect.stringContaining('Thrower'),
    );
  });
});
