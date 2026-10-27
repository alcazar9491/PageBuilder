import cmsData from '@/data/data.json';
import { parseBlocks } from '@/data/parseBlocks';
import { PageBuilder } from '@/components/renderer/PageBuilder';

/**
 * The home page, composed from CMS blocks. `parseBlocks` is the trust
 * boundary: the JSON import is untyped CMS data until it passes through it.
 * The hero block owns the page's `<h1>`.
 */
export default function Home() {
  return (
    <main>
      <PageBuilder blocks={parseBlocks(cmsData.blocks)} />
    </main>
  );
}
