import type { CurrencyCode, PlanFeature, PricingPlan, PricingProps } from '@/domain/cms';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { CtaLink } from '@/components/blocks/CtaLink';
import { toHeadingId } from '@/components/blocks/headingId';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';

/**
 * Pricing plans side by side. Both billing periods are shown as text:
 * a monthly/yearly toggle would need client state, and blocks stay
 * Server Components.
 */
export function PricingBlock({ title, subtitle, currency, plans }: PricingProps) {
  const headingId = toHeadingId('pricing', title);

  return (
    <section aria-labelledby={headingId} className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 id={headingId} className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {title}
        </h2>
        <p className="mt-4 text-lg text-gray-600">{subtitle}</p>
      </div>

      {/* `role="list"` keeps list semantics in Safari, which drops them for `list-style: none`. */}
      <ul role="list" className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <li key={plan.id} className="flex">
            <PlanCard plan={plan} currency={currency} />
          </li>
        ))}
      </ul>
    </section>
  );
}

type PlanCardProps = {
  plan: PricingPlan;
  currency: CurrencyCode;
};

function PlanCard({ plan, currency }: PlanCardProps) {
  return (
    <Card
      shadow={plan.highlighted}
      className={cn('w-full', plan.highlighted && 'ring-2 ring-indigo-600')}
    >
      <Card.Header>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">{plan.name}</h3>
          {/* `PlanHighlight` narrows `tag` to `string` once `highlighted` is true. */}
          {plan.highlighted ? <Badge variant="accent">{plan.tag}</Badge> : null}
        </div>
        <p className="text-sm text-gray-600">{plan.description}</p>
      </Card.Header>

      <Card.Content className="flex flex-col gap-6">
        <div>
          <p className="flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight">
              {formatMoney({ amount: plan.prices.monthly, currency })}
            </span>
            <span aria-hidden="true" className="text-sm text-gray-600">
              /month
            </span>
            <span className="sr-only">per month</span>
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {formatMoney({ amount: plan.prices.yearly, currency })} billed yearly
          </p>
        </div>

        <ul role="list" className="flex flex-col gap-3 text-sm">
          {plan.features.map((feature) => (
            <FeatureItem key={feature.label} feature={feature} />
          ))}
        </ul>
      </Card.Content>

      <Card.Footer>
        <CtaLink cta={plan.cta} className="w-full" />
      </Card.Footer>
    </Card>
  );
}

function FeatureItem({ feature }: { feature: PlanFeature }) {
  return (
    <li className={cn('flex items-start gap-3', !feature.included && 'text-gray-400')}>
      {feature.included ? <CheckIcon /> : <CrossIcon />}
      <span>
        {/* The icon is decorative, so the included state is also spelled out. */}
        <span className="sr-only">{feature.included ? 'Included: ' : 'Not included: '}</span>
        {feature.label}
      </span>
    </li>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="size-5 shrink-0 text-indigo-600"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
      />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-5 shrink-0">
      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
  );
}
