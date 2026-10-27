/**
 * Builds a deterministic DOM id for a block heading, so its `<section>` can
 * point `aria-labelledby` at it. Blocks are hook-free Server Components, so
 * the id comes from the title instead of `useId`.
 *
 * Two blocks with the same prefix and title on one page would share an id.
 * If that becomes possible, have the renderer pass the CMS block id instead.
 */
export function toHeadingId(prefix: string, text: string): string {
  const slug = text
    .normalize('NFKD')
    // Drop the combining marks that NFKD splits off accented letters.
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug ? `${prefix}-${slug}` : prefix;
}
