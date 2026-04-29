"use client";
import { type NewsletterState, subscribeNewsletterAction } from "@/app/actions/newsletter";
import { VOICE } from "@jasmin/lib";
import { BodyText, Button, Input, LabelEyebrow } from "@jasmin/ui";
import { useActionState } from "react";

export function NewsletterSignup({ source = "footer" }: { source?: string }) {
  const [state, formAction, pending] = useActionState<NewsletterState, FormData>(
    subscribeNewsletterAction,
    { ok: null },
  );

  return (
    <form action={formAction} className="flex w-full flex-col gap-3">
      <LabelEyebrow>Newsletter</LabelEyebrow>
      <BodyText className="max-w-md text-warm-taupe-soft">{VOICE.newsletterPitch}</BodyText>
      <input type="hidden" name="source" value={source} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          name="email"
          type="email"
          required
          placeholder="votre@email.com"
          aria-label="Adresse email"
          className="sm:max-w-sm"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Inscription…" : VOICE.newsletterCta}
        </Button>
      </div>
      {state.ok === true && (
        <output className="text-sm text-deep-teal">Merci, à très vite !</output>
      )}
      {state.ok === false && state.error && (
        <p role="alert" className="text-sm text-warm-taupe">
          {state.error}
        </p>
      )}
    </form>
  );
}
