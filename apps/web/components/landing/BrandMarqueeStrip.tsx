import { VOICE } from "@jasmin/lib";
import { AiryContainer, LabelEyebrow, Marquee } from "@jasmin/ui";

const BRANDS = [
  { name: "SVR", src: "/brand-logos/svr.svg" },
  { name: "Avène", src: "/brand-logos/avene.svg" },
  { name: "La Roche-Posay", src: "/brand-logos/la-roche-posay.svg" },
  { name: "Vichy", src: "/brand-logos/vichy.svg" },
  { name: "Bioderma", src: "/brand-logos/bioderma.svg" },
  { name: "Nuxe", src: "/brand-logos/nuxe.svg" },
] as const;

export function BrandMarqueeStrip() {
  return (
    <AiryContainer className="border-linen border-y bg-cream-sand px-6 py-12 lg:px-12">
      <div className="mx-auto max-w-[1400px]">
        <LabelEyebrow className="text-center">{VOICE.trustedBrandsLabel}</LabelEyebrow>
        <Marquee className="mt-8" duration={40}>
          {BRANDS.map((b) => (
            // biome-ignore lint/performance/noImgElement: static svg in /public, no optimization gain
            <img
              key={b.name}
              src={b.src}
              alt={b.name}
              className="h-9 w-auto select-none opacity-60 transition-all duration-300 hover:scale-105 hover:opacity-100 lg:h-12"
              loading="lazy"
              decoding="async"
            />
          ))}
        </Marquee>
      </div>
    </AiryContainer>
  );
}
