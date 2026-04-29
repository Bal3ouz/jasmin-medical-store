import { AiryContainer } from "@jasmin/ui";

export function EditorialQuote() {
  return (
    <AiryContainer className="bg-linen px-6 py-24 lg:px-12 lg:py-32">
      <blockquote className="mx-auto max-w-3xl text-center">
        <p className="font-[var(--font-display)] text-3xl italic leading-[1.3] text-deep-teal lg:text-5xl">
          « Une parapharmacie qui ressemble à la Méditerranée : douce, généreuse, attentive. »
        </p>
        <footer className="mt-8 font-[var(--font-label)] text-xs uppercase tracking-[0.32em] text-warm-taupe-soft">
          — Notre philosophie
        </footer>
      </blockquote>
    </AiryContainer>
  );
}
