import { VOICE } from "@jasmin/lib";
import { AiryContainer, LabelEyebrow, Marquee } from "@jasmin/ui";

const BRANDS = ["SVR", "Avène", "La Roche-Posay", "Vichy", "Bioderma", "Nuxe"] as const;

export function BrandMarqueeStrip() {
  return (
    <AiryContainer className="px-6 py-14 lg:px-12">
      <div className="mx-auto max-w-[1400px]">
        <LabelEyebrow>{VOICE.trustedBrandsLabel}</LabelEyebrow>
        <Marquee className="mt-6">
          {BRANDS.map((b) => (
            <span
              key={b}
              className="font-[var(--font-display)] text-2xl italic text-warm-taupe-soft lg:text-3xl"
            >
              {b}
            </span>
          ))}
        </Marquee>
      </div>
    </AiryContainer>
  );
}
