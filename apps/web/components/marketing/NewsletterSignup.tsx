"use client";
import { type NewsletterState, subscribeNewsletterAction } from "@/app/actions/newsletter";
import { VOICE } from "@jasmin/lib";
import { Button, Input, cn } from "@jasmin/ui";
import { useActionState } from "react";

/**
 * Newsletter form. Lives in the deep-teal footer, so the eyebrow + pitch
 * use jasmine + cream-sand for legibility instead of the default
 * dark-on-light typography palette.
 */
export function NewsletterSignup({ source = "footer" }: { source?: string }) {
  const [state, formAction, pending] = useActionState<NewsletterState, FormData>(
    subscribeNewsletterAction,
    { ok: null },
  );

  return (
    <form action={formAction} className="flex w-full flex-col gap-3">
      <span className="font-[var(--font-label)] font-medium text-jasmine text-xs uppercase tracking-[0.24em]">
        Newsletter
      </span>
      <p className="max-w-md font-[var(--font-body)] text-cream-sand/85 text-sm leading-[1.6]">
        {VOICE.newsletterPitch}
      </p>
      <input type="hidden" name="source" value={source} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          name="email"
          type="email"
          required
          placeholder="votre@email.com"
          aria-label="Adresse email"
          className={cn(
            "sm:max-w-sm",
            "bg-cream-sand/95 text-warm-taupe placeholder:text-warm-taupe-soft",
          )}
        />
        <Button type="submit" variant="jasmine" disabled={pending}>
          {pending ? "Inscription…" : VOICE.newsletterCta}
        </Button>
      </div>
      {state.ok === true && (
        <output className="text-jasmine text-sm">Merci, à très vite !</output>
      )}
      {state.ok === false && state.error && (
        <p role="alert" className="text-cream-sand/85 text-sm">
          {state.error}
        </p>
      )}
    </form>
  );
}
