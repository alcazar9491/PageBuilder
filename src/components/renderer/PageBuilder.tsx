import { Suspense, type ComponentType } from 'react';
import type { Block, BlockOf, BlockPropsMap, KnownBlockType } from '@/domain/cms';
import { UnknownBlock } from '@/components/blocks/UnknownBlock';
import { resolveBlock } from '@/components/blocks/registry';
import { BlockErrorBoundary } from '@/components/renderer/BlockErrorBoundary';

export type PageBuilderProps = { blocks: readonly Block[] };

/**
 * Renders CMS blocks in order. Each block gets its own `BlockErrorBoundary`,
 * so one block that throws never takes its siblings down with it.
 *
 * A Server Component: it holds no state, and the blocks it renders stay on
 * the server. Only the boundary ships to the client.
 */
export function PageBuilder({ blocks }: PageBuilderProps) {
  // Typed input comes from `parseBlocks`, but the guard keeps a bad caller
  // from crashing the page: it gets the same container, empty.
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return <div className="flex flex-col" />;
  }

  return (
    <div className="flex flex-col">
      {blocks.map((block, index) => (
        // The index keeps keys unique when the CMS repeats an id. Moving a
        // block remounts it, which is harmless for static CMS content.
        <BlockErrorBoundary
          key={`${block.id}-${index}`}
          blockId={block.id}
          blockType={block.type === 'unknown' ? block.originalType : block.type}
        >
          {/*
            Error boundaries do not run during server rendering. There, React
            contains a throw only at the nearest <Suspense>: it emits the
            fallback and retries the block on the client, where the boundary
            above catches it. Without this, one corrupted block turns a
            request-time render (`next dev`, or a dynamic page under
            `next start`) into an HTTP 500 with an empty body. Valid blocks
            still render on the server, because nothing suspends.

            A build-time prerender still fails on such a block: Next.js
            rethrows any Server Component error during `next build`, even when
            the render recovered. Bad bundled CMS data therefore stops the
            build instead of shipping.
          */}
          <Suspense fallback={null}>
            {block.type === 'unknown' ? (
              <UnknownBlock type={block.originalType} />
            ) : (
              <KnownBlockView block={block} />
            )}
          </Suspense>
        </BlockErrorBoundary>
      ))}
    </div>
  );
}

/**
 * Generic over the block type, so `resolveBlock` returns the component typed
 * with exactly this block's props and the spread needs no cast.
 */
function KnownBlockView<K extends KnownBlockType>({ block }: { block: BlockOf<K> }) {
  // The annotation (not a cast) turns the deferred `BlockRegistry[K]` into
  // `ComponentType<BlockPropsMap[K]>`, which JSX can check against the props.
  const Component: ComponentType<BlockPropsMap[K]> = resolveBlock(block.type);
  return <Component {...block.props} />;
}
