import { Suspense, type ComponentType } from 'react';
import { isBlockEnvelope, isKnownBlockType } from '@/domain/blockTypes';
import type { Block, BlockOf, BlockPropsMap, KnownBlock, KnownBlockType } from '@/domain/cms';
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
  if (!isList(blocks) || blocks.length === 0) {
    return <div className="flex flex-col" />;
  }

  return (
    <div className="flex flex-col">
      {blocks.map((block, index) => {
        // The same reasoning as the guard above, per entry: a `null`, a
        // primitive or an entry without an id or type is skipped, because
        // reading `block.id` on it would throw here, outside any boundary.
        if (!isBlockEnvelope(block)) {
          return null;
        }

        const typeName = typeNameOf(block);

        return (
          // The index keeps keys unique when the CMS repeats an id. Moving a
          // block remounts it, which is harmless for static CMS content.
          <BlockErrorBoundary key={`${block.id}-${index}`} blockId={block.id} blockType={typeName}>
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
              {isKnownBlock(block) ? (
                <KnownBlockView block={block} />
              ) : (
                <UnknownBlock type={typeName} />
              )}
            </Suspense>
          </BlockErrorBoundary>
        );
      })}
    </div>
  );
}

/**
 * `Array.isArray` itself would narrow `readonly Block[]` to `any[]` (its
 * predicate is `arg is any[]`) and silently untype every block in the `map`.
 * Narrowing to `readonly unknown[]` keeps `readonly Block[]`.
 */
function isList(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

/**
 * The type name the CMS sent, for the notice and the boundary. A parsed
 * `UnknownBlock` keeps it in `originalType`; a raw entry that bypassed
 * `parseBlocks` carries it in `type`, even when it is not a known type.
 */
function typeNameOf(block: Block): string {
  return block.type === 'unknown' ? block.originalType : block.type;
}

/**
 * Asks the registry's guard instead of trusting the `'unknown'` discriminant:
 * an untyped caller can send `type: 'slider'` on what the compiler sees as a
 * known block, and that must reach `UnknownBlock`, not `resolveBlock`.
 */
function isKnownBlock(block: Block): block is KnownBlock {
  return isKnownBlockType(block.type);
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
