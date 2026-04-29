"use client";
import { type AuthResult, requestPasswordResetAction } from "@/app/actions/auth";
import { Button, Input } from "@jasmin/ui";
import { useState, useTransition } from "react";

export function ForgotPasswordForm() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<AuthResult | null>(null);
  return (
    <form
      action={(fd) =>
        start(async () => {
          setResult(await requestPasswordResetAction(fd));
        })
      }
      className="space-y-4"
    >
      <label className="block">
        <span className="block text-xs uppercase tracking-[0.18em] text-warm-taupe-soft mb-2">
          Email
        </span>
        <Input name="email" type="email" required />
      </label>
      {result?.ok === true && (
        <output className="block text-sm text-deep-teal">
          Un email vous a été envoyé. Vérifiez votre boîte de réception.
        </output>
      )}
      {result?.ok === false && (
        <p role="alert" className="text-sm text-warm-taupe">
          {result.error}
        </p>
      )}
      <Button type="submit" variant="primary-teal" disabled={pending} className="w-full">
        {pending ? "Envoi…" : "Envoyer le lien"}
      </Button>
    </form>
  );
}
