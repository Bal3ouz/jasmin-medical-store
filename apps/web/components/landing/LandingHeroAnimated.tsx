"use client";
import { VOICE } from "@jasmin/lib";
import { Button, JasmineSprig, LabelEyebrow } from "@jasmin/ui";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { useRef } from "react";

const HEADLINE_WORDS = VOICE.heroTagline.split(" ");

export function LandingHeroAnimated() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [0, -120]);
  const opacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.85, 0.4]);

  return (
    <section
      ref={ref}
      className="relative isolate flex min-h-[88vh] items-end overflow-hidden bg-deep-teal pb-20 pt-32 text-cream-sand lg:pb-28 lg:pt-40"
    >
      <motion.div
        aria-hidden
        style={{ y }}
        className="pointer-events-none absolute right-0 top-0 h-full w-3/5 opacity-60"
      >
        <div className="absolute -right-10 top-10 h-[420px] w-[420px] rotate-12 text-jasmine/40">
          <JasmineSprig className="h-full w-full" />
        </div>
        <div className="absolute -right-32 bottom-12 h-[640px] w-[640px] -rotate-6 text-cream-sand/10">
          <JasmineSprig className="h-full w-full" />
        </div>
      </motion.div>

      <motion.div
        style={{ opacity }}
        className="relative mx-auto w-full max-w-[1400px] px-6 lg:px-12"
      >
        <LabelEyebrow className="text-jasmine">Bienvenue</LabelEyebrow>
        <h1 className="mt-6 max-w-4xl font-[var(--font-display)] text-[3.5rem] leading-[0.98] italic text-cream-sand sm:text-7xl lg:text-[7.5rem]">
          {HEADLINE_WORDS.map((word, i) => (
            <motion.span
              // biome-ignore lint/suspicious/noArrayIndexKey: stable static list of headline words
              key={`${word}-${i}`}
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.6, ease: "easeOut" }}
              className="mr-3 inline-block"
            >
              {word}
            </motion.span>
          ))}
        </h1>
        <p className="mt-6 max-w-xl font-[var(--font-body)] text-base leading-[1.7] text-cream-sand/80 lg:text-lg">
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
