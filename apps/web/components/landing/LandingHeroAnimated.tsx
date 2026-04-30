"use client";
import { VOICE } from "@jasmin/lib";
import { Button, JasmineSprig, LabelEyebrow } from "@jasmin/ui";
import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const HEADLINE_WORDS = VOICE.heroTagline.split(" ");

const HERO_PHOTOS = [
  { src: "/lifestyle/hero-ritual.jpg", alt: "" },
  { src: "/lifestyle/hero-serum.jpg", alt: "" },
  { src: "/lifestyle/hero-morning.jpg", alt: "" },
] as const;
const PHOTO_INTERVAL_MS = 6000;

export function LandingHeroAnimated() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [0, -120]);
  const opacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.85, 0.4]);
  const [photoIdx, setPhotoIdx] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const t = setInterval(
      () => setPhotoIdx((i) => (i + 1) % HERO_PHOTOS.length),
      PHOTO_INTERVAL_MS,
    );
    return () => clearInterval(t);
  }, [reduced]);

  const currentPhoto = HERO_PHOTOS[photoIdx]!;

  return (
    <section
      ref={ref}
      className="relative isolate flex min-h-[92vh] items-stretch overflow-hidden bg-deep-teal text-cream-sand"
    >
      {/* Right-side photo with crossfade between three lifestyle shots */}
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 lg:block">
        <AnimatePresence mode="sync" initial={false}>
          <motion.img
            key={currentPhoto.src}
            src={currentPhoto.src}
            alt=""
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
            className="absolute inset-0 h-full w-full object-cover"
            aria-hidden
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-r from-deep-teal via-deep-teal/60 to-deep-teal/0" />
        <div className="absolute inset-0 bg-gradient-to-t from-deep-teal/40 via-transparent to-transparent" />
      </div>

      {/* Mobile: full-bleed crossfade with stronger overlay */}
      <div className="pointer-events-none absolute inset-0 lg:hidden">
        <AnimatePresence mode="sync" initial={false}>
          <motion.img
            key={`m-${currentPhoto.src}`}
            src={currentPhoto.src}
            alt=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
            className="absolute inset-0 h-full w-full object-cover"
            aria-hidden
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-deep-teal/70" />
      </div>

      {/* Photo indicator dots — bottom right of the photo column on desktop */}
      <div className="absolute right-8 bottom-24 z-10 hidden gap-2 lg:flex">
        {HERO_PHOTOS.map((p, i) => (
          <button
            key={p.src}
            type="button"
            aria-label={`Photo ${i + 1}`}
            onClick={() => setPhotoIdx(i)}
            className={`h-1.5 rounded-pill transition-all duration-500 ${
              i === photoIdx ? "w-10 bg-cream-sand" : "w-4 bg-cream-sand/40 hover:bg-cream-sand/70"
            }`}
          />
        ))}
      </div>

      <motion.div
        aria-hidden
        style={{ y }}
        className="pointer-events-none absolute top-0 left-0 hidden h-full w-2/5 opacity-50 lg:block"
      >
        <div className="absolute -left-12 top-32 h-[420px] w-[420px] -rotate-12 text-jasmine/30">
          <JasmineSprig className="h-full w-full" />
        </div>
      </motion.div>

      <motion.div
        style={{ opacity }}
        className="relative mx-auto flex w-full max-w-[1400px] flex-col justify-center px-6 pt-32 pb-24 lg:px-12 lg:pt-40 lg:pb-32"
      >
        <LabelEyebrow className="text-jasmine">Bienvenue chez Jasmin</LabelEyebrow>
        <h1 className="mt-4 max-w-3xl font-[family-name:var(--font-script)] text-[4.5rem] leading-[0.95] text-cream-sand sm:text-[6.5rem] lg:text-[8.5rem]">
          {HEADLINE_WORDS.map((word, i) => (
            <motion.span
              // biome-ignore lint/suspicious/noArrayIndexKey: stable static list of headline words
              key={`${word}-${i}`}
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 * i, duration: 0.7, ease: "easeOut" }}
              className="mr-4 inline-block"
            >
              {word}
            </motion.span>
          ))}
        </h1>
        <p className="mt-8 max-w-xl font-[var(--font-body)] text-base leading-[1.7] text-cream-sand/85 lg:text-lg">
          {VOICE.heroSubtitle}
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Button asChild variant="jasmine" size="lg">
            <Link href="/boutique">
              Découvrir la boutique <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="text-cream-sand hover:bg-cream-sand/10"
          >
            <Link href="/notre-histoire">Notre histoire</Link>
          </Button>
        </div>
      </motion.div>

      <motion.div
        aria-hidden
        initial={reduced ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute inset-x-0 bottom-6 mx-auto flex justify-center text-cream-sand/70"
      >
        <motion.span
          animate={reduced ? {} : { y: [0, 8, 0] }}
          transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="font-[var(--font-label)] text-xs uppercase tracking-[0.32em]"
        >
          ↓ Découvrir
        </motion.span>
      </motion.div>
    </section>
  );
}
