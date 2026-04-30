import { JasmineSprig, LabelEyebrow } from "@jasmin/ui";

/**
 * Editorial "ritual" section between the catalogue and the closing quote.
 * Pure SVG botanical composition (no external images) — eucalyptus + jasmine
 * over a warm gradient. Tells the prospect: this isn't just a shop, it's a
 * sensory promise.
 */
export function SensorialMoment() {
  return (
    <section className="relative overflow-hidden bg-linen px-6 py-24 lg:px-12 lg:py-32">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-16 lg:grid-cols-2">
        <div className="relative order-2 lg:order-1">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] shadow-soft">
            {/* biome-ignore lint/performance/noImgElement: lifestyle photo */}
            <img
              src="/lifestyle/zen-stones.jpg"
              alt="Pierres zen empilées sur de la mousse"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-deep-teal/40 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-6 text-cream-sand">
              <div>
                <div className="font-[var(--font-label)] text-[10px] uppercase tracking-[0.32em] opacity-90">
                  Atelier · I
                </div>
                <div className="mt-1 font-[var(--font-display)] text-2xl italic">Le calme retrouvé</div>
              </div>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <LabelEyebrow>Un rituel, pas une simple routine</LabelEyebrow>
          <h2 className="mt-4 font-[var(--font-display)] text-4xl italic leading-[1.05] text-deep-teal lg:text-6xl">
            Le soin se savoure,
            <br />
            comme un thé à la menthe.
          </h2>
          <p className="mt-8 max-w-lg font-[var(--font-body)] text-base leading-[1.7] text-warm-taupe lg:text-lg">
            Chaque flacon que nous sélectionnons traverse la même question : sera-t-il à la hauteur
            de ce moment où l&apos;on respire, où l&apos;on prend soin de soi, où la lumière
            méditerranéenne se pose sur la peau ?
          </p>
          <p className="mt-4 max-w-lg font-[var(--font-body)] text-base leading-[1.7] text-warm-taupe-soft lg:text-lg">
            Du fleuron des laboratoires français aux trésors de la cosmétique tunisienne — eucalyptus,
            néroli, fleur d&apos;oranger — nous composons une bibliothèque sensorielle.
          </p>
          <ul className="mt-10 space-y-3 font-[var(--font-body)] text-sm text-warm-taupe">
            <li className="flex items-start gap-3">
              <span aria-hidden className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-jasmine-dark" />
              <span>Conseils dermatologiques sans rendez-vous, en boutique et en ligne.</span>
            </li>
            <li className="flex items-start gap-3">
              <span aria-hidden className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-jasmine-dark" />
              <span>Livraison soignée à Tunis et environs sous 24 à 48 h.</span>
            </li>
            <li className="flex items-start gap-3">
              <span aria-hidden className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-jasmine-dark" />
              <span>Échantillons offerts dès 60 TND — pour essayer avant d&apos;adopter.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Decorative jasmine sprigs in opposite corners */}
      <JasmineSprig
        aria-hidden
        className="-z-0 pointer-events-none absolute -top-12 -left-12 h-72 w-72 rotate-[18deg] text-jasmine/20"
      />
      <JasmineSprig
        aria-hidden
        className="-z-0 pointer-events-none absolute -bottom-16 -right-10 h-80 w-80 -rotate-[24deg] text-soft-teal/20"
      />
    </section>
  );
}
