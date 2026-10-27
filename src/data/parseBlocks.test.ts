import { describe, expect, it } from 'vitest';
import cmsData from '@/data/data.json';
import { parseBlocks } from '@/data/parseBlocks';

const heroProps = {
  title: 'Build pages without shipping code',
  subtitle: 'Compose landing pages from reusable blocks.',
  backgroundImage: { src: '/images/hero.jpg', alt: 'Gradient', width: 1920, height: 1080 },
  cta: { label: 'Get started', href: '/signup', variant: 'primary' },
};
const pricingProps = { title: 'Simple pricing', subtitle: 'Pick a plan.', currency: 'USD', plans: [] };
const productGridProps = { title: 'Featured products', products: [] };
const sliderProps = { autoplay: true, slides: [] };

describe('parseBlocks', () => {
  it.each([
    ['null', null],
    ['undefined', undefined],
    ['an object', { blocks: [] }],
    ['a string', 'blocks'],
    ['a number', 42],
  ])('returns an empty list for %s', (_label, raw) => {
    expect(parseBlocks(raw)).toEqual([]);
  });

  it.each([
    ['a null entry', null],
    ['a string entry', 'blk_hero'],
    ['an array entry', ['blk_hero', 'hero']],
    ['a missing id', { type: 'hero', props: heroProps }],
    ['an empty id', { id: '', type: 'hero', props: heroProps }],
    ['a non-string id', { id: 7, type: 'hero', props: heroProps }],
    ['a missing type', { id: 'blk_hero', props: heroProps }],
    ['an empty type', { id: 'blk_hero', type: '', props: heroProps }],
    ['a non-string type', { id: 'blk_hero', type: ['hero'], props: heroProps }],
    ['missing props', { id: 'blk_hero', type: 'hero' }],
    ['null props', { id: 'blk_hero', type: 'hero', props: null }],
    ['array props', { id: 'blk_hero', type: 'hero', props: [heroProps] }],
    ['string props', { id: 'blk_hero', type: 'hero', props: 'title' }],
  ])('drops an entry with %s', (_label, entry) => {
    expect(parseBlocks([entry])).toEqual([]);
  });

  it.each([
    ['hero', heroProps],
    ['pricing', pricingProps],
    ['productGrid', productGridProps],
  ])('passes a "%s" block through unchanged', (type, props) => {
    expect(parseBlocks([{ id: `blk_${type}`, type, props }])).toEqual([
      { id: `blk_${type}`, type, props },
    ]);
  });

  it('maps an unsupported type to an unknown block that keeps the original type and payload', () => {
    expect(parseBlocks([{ id: 'blk_slider', type: 'slider', props: sliderProps }])).toEqual([
      { id: 'blk_slider', type: 'unknown', originalType: 'slider', payload: sliderProps },
    ]);
  });

  it.each(['constructor', '__proto__', 'toString'])(
    'treats the inherited key "%s" as an unknown type',
    (type) => {
      expect(parseBlocks([{ id: 'blk_proto', type, props: {} }])).toEqual([
        { id: 'blk_proto', type: 'unknown', originalType: type, payload: {} },
      ]);
    },
  );

  it('keeps the CMS order and skips invalid entries in place', () => {
    const blocks = parseBlocks([
      { id: 'blk_products', type: 'productGrid', props: productGridProps },
      { id: '', type: 'hero', props: heroProps },
      { id: 'blk_slider', type: 'slider', props: sliderProps },
      { id: 'blk_hero', type: 'hero', props: heroProps },
    ]);

    expect(blocks.map((block) => block.id)).toEqual(['blk_products', 'blk_slider', 'blk_hero']);
  });

  it('parses the real CMS data into three known blocks and one unknown "slider"', () => {
    const blocks = parseBlocks(cmsData.blocks);

    expect(blocks.map((block) => block.type)).toEqual(['hero', 'pricing', 'productGrid', 'unknown']);
    expect(blocks[3]).toMatchObject({ id: 'blk_slider_01', originalType: 'slider' });
  });
});
