import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ProductGridProps } from '@/domain/cms';
import { ProductGridBlock } from '@/components/blocks/ProductGridBlock';

const productGridProps: ProductGridProps = {
  title: 'Featured products',
  products: [
    {
      id: 'prd_headphones',
      name: 'Studio Headphones',
      href: '/products/studio-headphones',
      image: { src: '/images/headphones.jpg', alt: 'Black over-ear headphones', width: 800, height: 800 },
      price: { amount: 19900, currency: 'USD' },
      specs: [
        { label: 'Battery', value: '30 h' },
        { label: 'Weight', value: '250 g' },
      ],
      rating: { average: 4.7, count: 1284 },
      stock: { status: 'inStock', quantity: 120 },
    },
    {
      id: 'prd_keyboard',
      name: 'Mechanical Keyboard',
      href: '/products/mechanical-keyboard',
      image: { src: '/images/keyboard.jpg', alt: 'Compact mechanical keyboard', width: 800, height: 600 },
      price: { amount: 12950, currency: 'EUR' },
      specs: [{ label: 'Layout', value: '75%' }],
      rating: { average: 5, count: 1 },
      stock: { status: 'lowStock', quantity: 4 },
    },
    {
      id: 'prd_monitor',
      name: '4K Monitor',
      href: '/products/4k-monitor',
      image: { src: '/images/monitor.jpg', alt: '27-inch monitor on a desk', width: 800, height: 800 },
      price: { amount: 44900, currency: 'USD' },
      specs: [{ label: 'Refresh rate', value: '144 Hz' }],
      rating: { average: 4.8, count: 317 },
      stock: { status: 'outOfStock' },
    },
  ],
};

/** Returns the list item that holds the product whose `<h3>` has this name. */
function getProductCard(name: string): HTMLElement {
  const card = screen.getByRole('heading', { level: 3, name }).closest('li');
  if (!card) {
    throw new Error(`No list item wraps the "${name}" product`);
  }
  return card;
}

describe('ProductGridBlock', () => {
  it('renders a section labelled by its level-2 title', () => {
    render(<ProductGridBlock {...productGridProps} />);

    const section = screen.getByRole('region', { name: 'Featured products' });
    expect(
      within(section).getByRole('heading', { level: 2, name: 'Featured products' }),
    ).toBeInTheDocument();
  });

  it('renders one list item per product, in order', () => {
    render(<ProductGridBlock {...productGridProps} />);

    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(
      items.map((item) => within(item).getByRole('heading', { level: 3 }).textContent),
    ).toEqual(['Studio Headphones', 'Mechanical Keyboard', '4K Monitor']);
  });

  it('links each product name to its page', () => {
    render(<ProductGridBlock {...productGridProps} />);

    const card = within(getProductCard('Studio Headphones'));
    expect(card.getByRole('link', { name: 'Studio Headphones' })).toHaveAttribute(
      'href',
      '/products/studio-headphones',
    );
  });

  it('renders each product image with its alt text and intrinsic size', () => {
    render(<ProductGridBlock {...productGridProps} />);

    const image = within(getProductCard('Mechanical Keyboard')).getByRole('img', {
      name: 'Compact mechanical keyboard',
    });
    expect(image).toHaveAttribute('width', '800');
    expect(image).toHaveAttribute('height', '600');
    expect(image).toHaveAttribute('sizes');
  });

  it.each([
    ['Studio Headphones', '$199.00'],
    ['Mechanical Keyboard', '€129.50'],
    ['4K Monitor', '$449.00'],
  ])('formats the price of %s as %s', (name, price) => {
    render(<ProductGridBlock {...productGridProps} />);

    expect(within(getProductCard(name)).getByText(price)).toBeInTheDocument();
  });

  it.each([
    ['Studio Headphones', 'In stock'],
    ['Mechanical Keyboard', 'Only 4 left'],
    ['4K Monitor', 'Out of stock'],
  ])('labels the stock of %s as "%s"', (name, label) => {
    render(<ProductGridBlock {...productGridProps} />);

    expect(within(getProductCard(name)).getByText(label)).toBeInTheDocument();
  });

  it('lists the specs as terms and values', () => {
    render(<ProductGridBlock {...productGridProps} />);

    const card = within(getProductCard('Studio Headphones'));
    expect(card.getAllByRole('term').map((term) => term.textContent)).toEqual([
      'Battery',
      'Weight',
    ]);
    expect(card.getAllByRole('definition').map((value) => value.textContent)).toEqual([
      '30 h',
      '250 g',
    ]);
  });

  it('describes the rating in words, with a grouped review count', () => {
    render(<ProductGridBlock {...productGridProps} />);

    expect(
      within(getProductCard('Studio Headphones')).getByText('Rated 4.7 out of 5 (1,284 reviews)'),
    ).toBeInTheDocument();
    expect(
      within(getProductCard('Mechanical Keyboard')).getByText('Rated 5.0 out of 5 (1 review)'),
    ).toBeInTheDocument();
  });

  it('gives each "View product" link a unique accessible name and the product href', () => {
    render(<ProductGridBlock {...productGridProps} />);

    const viewLinks = screen.getAllByRole('link', { name: /^View product/ });
    expect(viewLinks.map((link) => link.textContent)).toEqual([
      'View product: Studio Headphones',
      'View product: Mechanical Keyboard',
      'View product: 4K Monitor',
    ]);
    expect(screen.getByRole('link', { name: 'View product: 4K Monitor' })).toHaveAttribute(
      'href',
      '/products/4k-monitor',
    );
  });
});
