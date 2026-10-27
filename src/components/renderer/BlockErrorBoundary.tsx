'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

/** Every prop is serializable, because the server-side `PageBuilder` renders this boundary. */
export type BlockErrorBoundaryProps = {
  blockId: string;
  blockType: string;
  children: ReactNode;
};

/**
 * A flag next to the error, rather than `error: unknown | null`, because a
 * block may throw `null` or `undefined`; those would read as "no error" and
 * re-render the failing children.
 */
type BlockErrorBoundaryState = { hasError: false } | { hasError: true; error: unknown };

/**
 * Contains a render error to the one CMS block that threw, so its siblings
 * and the rest of the page keep rendering. Outside production it shows a
 * notice naming the block; in production the block simply disappears.
 */
export class BlockErrorBoundary extends Component<BlockErrorBoundaryProps, BlockErrorBoundaryState> {
  state: BlockErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: unknown): BlockErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    const { blockType, blockId } = this.props;
    console.error(`Block "${blockType}" (${blockId}) failed to render.`, error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // Read at render time, not at module load, so tests can stub it.
    if (process.env.NODE_ENV === 'production') {
      return null;
    }

    const { error } = this.state;
    const message = error instanceof Error ? error.message : String(error);

    return (
      <div
        role="alert"
        className="mx-auto my-6 max-w-6xl rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900"
      >
        Block <code className="font-mono font-semibold">&quot;{this.props.blockType}&quot;</code> (
        <code className="font-mono">{this.props.blockId}</code>) failed to render: {message}
      </div>
    );
  }
}
