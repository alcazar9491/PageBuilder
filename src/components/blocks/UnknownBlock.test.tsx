import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UnknownBlock } from '@/components/blocks/UnknownBlock';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('UnknownBlock', () => {
  it.each(['development', 'test'])(
    'shows a notice naming the unsupported type when NODE_ENV is %s',
    (nodeEnv) => {
      vi.stubEnv('NODE_ENV', nodeEnv);

      render(<UnknownBlock type="slider" />);

      const notice = screen.getByRole('status');
      expect(notice).toHaveTextContent(
        'Unsupported block type: "slider". Register it in src/components/blocks/registry.ts.',
      );
      expect(within(notice).getByText('"slider"').tagName).toBe('CODE');
    },
  );

  it('renders nothing in production', () => {
    vi.stubEnv('NODE_ENV', 'production');

    const { container } = render(<UnknownBlock type="slider" />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
