import Image from 'next/image';
import type { HeroProps } from '@/domain/cms';
import { CtaLink } from '@/components/blocks/CtaLink';

export function HeroBlock({ eyebrow, title, subtitle, backgroundImage, cta }: HeroProps) {
  return (
    <section className="relative isolate overflow-hidden bg-gray-950">
      {/* The hero is the LCP element, so its image is preloaded, not lazy-loaded. */}
      <Image
        src={backgroundImage.src}
        alt={backgroundImage.alt}
        fill
        preload
        sizes="100vw"
        className="-z-10 object-cover"
      />
      {/* Darkens any background image so white text keeps enough contrast. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gray-950/60" />

      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-24 text-center text-white sm:py-32">
        {eyebrow ? (
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-200">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-6xl">{title}</h1>
        <p className="max-w-2xl text-lg text-pretty text-gray-200">{subtitle}</p>
        <CtaLink cta={cta} size="lg" />
      </div>
    </section>
  );
}
