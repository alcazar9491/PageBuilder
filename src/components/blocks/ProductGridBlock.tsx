import { Fragment } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Product, ProductGridProps, ProductRating } from '@/domain/cms';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { toHeadingId } from '@/components/blocks/headingId';
import { getStockBadge } from '@/components/blocks/stockBadge';
import { DISPLAY_LOCALE, formatMoney } from '@/lib/format';

const ratingFormat = new Intl.NumberFormat(DISPLAY_LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const countFormat = new Intl.NumberFormat(DISPLAY_LOCALE);

/** One column on phones, two from `sm`, three from `lg` inside a `max-w-6xl` container. */
const imageSizes = '(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw';

export function ProductGridBlock({ title, products }: ProductGridProps) {
  const headingId = toHeadingId('products', title);

  return (
    <section aria-labelledby={headingId} className="mx-auto max-w-6xl px-6 py-24">
      <h2 id={headingId} className="text-3xl font-bold tracking-tight text-gray-900">
        {title}
      </h2>

      {/* `role="list"` keeps list semantics in Safari, which drops them for `list-style: none`. */}
      <ul role="list" className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <li key={product.id} className="flex">
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  const stockBadge = getStockBadge(product.stock);

  return (
    <Card className="w-full">
      <Image
        src={product.image.src}
        alt={product.image.alt}
        width={product.image.width}
        height={product.image.height}
        sizes={imageSizes}
        className="aspect-square w-full rounded-lg bg-gray-100 object-cover"
      />

      <Card.Header>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold">
            <Link href={product.href} className="hover:underline">
              {product.name}
            </Link>
          </h3>
          <Badge variant={stockBadge.variant}>{stockBadge.label}</Badge>
        </div>
      </Card.Header>

      <Card.Content className="flex flex-col gap-4">
        <p className="text-lg font-semibold">{formatMoney(product.price)}</p>
        <Rating rating={product.rating} />
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          {product.specs.map((spec) => (
            <Fragment key={spec.label}>
              <dt className="text-gray-500">{spec.label}</dt>
              <dd className="text-gray-900">{spec.value}</dd>
            </Fragment>
          ))}
        </dl>
      </Card.Content>

      <Card.Footer>
        <Button asChild variant="outline" className="w-full">
          <Link href={product.href}>
            View product
            {/* Repeated "View product" links need distinct names for screen readers. */}
            <span className="sr-only">: {product.name}</span>
          </Link>
        </Button>
      </Card.Footer>
    </Card>
  );
}

function Rating({ rating }: { rating: ProductRating }) {
  const average = ratingFormat.format(rating.average);
  const count = countFormat.format(rating.count);
  const reviews = rating.count === 1 ? 'review' : 'reviews';

  return (
    <p className="flex items-center gap-1 text-sm text-gray-600">
      <StarIcon />
      <span aria-hidden="true">
        {average} ({count})
      </span>
      <span className="sr-only">
        Rated {average} out of 5 ({count} {reviews})
      </span>
    </p>
  );
}

function StarIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="size-4 shrink-0 text-amber-400"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z"
      />
    </svg>
  );
}
