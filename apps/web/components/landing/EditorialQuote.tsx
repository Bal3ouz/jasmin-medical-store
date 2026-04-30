import { AiryContainer, JasmineSprig } from "@jasmin/ui";

export function EditorialQuote() {
  return (
    <AiryContainer className="relative overflow-hidden bg-cream-sand px-6 py-24 lg:px-12 lg:py-32">
      <JasmineSprig
        aria-hidden
        className="-z-0 pointer-events-none absolute top-8 left-8 h-32 w-32 rotate-[12deg] text-jasmine/30 lg:h-48 lg:w-48"
      />
      <JasmineSprig
        aria-hidden
        className="-z-0 pointer-events-none absolute right-10 bottom-12 h-32 w-32 -rotate-[18deg] text-soft-teal/30 lg:h-48 lg:w-48"
      />
      <blockquote className="relative mx-auto max-w-3xl text-center">
        <span
          aria-hidden
          className="block font-[var(--font-display)] text-7xl text-jasmine-dark/40 leading-none lg:text-8xl"
        >
          &ldquo;
        </span>
        <p className="-mt-4 font-[var(--font-display)] text-3xl italic leading-[1.3] text-deep-teal lg:text-5xl">
          Une parapharmacie qui ressemble à la Méditerranée : douce, généreuse, attentive.
        </p>
        <footer className="mt-8 font-[var(--font-label)] text-xs uppercase tracking-[0.32em] text-warm-taupe-soft">
          — Notre philosophie
        </footer>
      </blockquote>
    </AiryContainer>
  );
}
