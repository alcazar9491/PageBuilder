export type UnknownBlockProps = { type: string };

/**
 * Fallback for block types the registry does not know. Editors and
 * developers see a notice while building pages; visitors in production
 * see nothing, so one unsupported block never breaks the page.
 */
export function UnknownBlock({ type }: UnknownBlockProps) {
  // Read at render time, not at module load, so tests can stub it.
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div
      role="status"
      className="mx-auto my-6 max-w-6xl rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      Unsupported block type: <code className="font-mono font-semibold">&quot;{type}&quot;</code>.
      Register it in <code className="font-mono">src/components/blocks/registry.ts</code>.
    </div>
  );
}
