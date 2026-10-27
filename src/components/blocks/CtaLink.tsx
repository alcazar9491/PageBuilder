import Link from 'next/link';
import type { CallToAction, CtaVariant } from '@/domain/cms';
import { Button, type ButtonSize, type ButtonVariant } from '@/components/ui/Button';

export type CtaLinkProps = {
  cta: CallToAction;
  size?: ButtonSize;
  className?: string;
};

/** The CMS speaks in CTA intents; the UI kit speaks in button styles. */
const ctaVariantMap: Record<CtaVariant, ButtonVariant> = {
  primary: 'primary',
  secondary: 'outline',
};

/** A CMS call to action rendered as a client-side navigating link styled as a button. */
export function CtaLink({ cta, size, className }: CtaLinkProps) {
  return (
    <Button asChild variant={ctaVariantMap[cta.variant]} size={size} className={className}>
      <Link href={cta.href}>{cta.label}</Link>
    </Button>
  );
}
