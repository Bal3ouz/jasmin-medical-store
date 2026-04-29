"use client";
import { type AuthResult, signInAction } from "@/app/actions/auth";
import { BodyText, Button, Input } from "@jasmin/ui";
import Link from "next/link";
import { useState, useTransition } from "react";

export function LoginForm() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<AuthResult | null>(null);
  return (
    <form
      action={(fd) =>
        start(async () => {
          const r = await signInAction(fd);
          if (!r.ok) setResult(r);
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
      <label className="block">
        <span className="block text-xs uppercase tracking-[0.18em] text-warm-taupe-soft mb-2">
          Mot de passe
        </span>
        <Input name="password" type="password" required />
      </label>
      {result && !result.ok && (
        <p role="alert" className="text-sm text-warm-taupe">
          {result.error}
        </p>
      )}
      <Button type="submit" variant="primary-teal" disabled={pending} className="w-full">
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
      <div className="flex items-center justify-between text-xs">
        <Link
          href="/compte/mot-de-passe-oublie"
          className="text-warm-taupe-soft underline underline-offset-2 hover:text-deep-teal"
        >
          Mot de passe oublié ?
        </Link>
        <Link href="/compte/inscription" className="text-deep-teal underline underline-offset-2">
          Créer un compte
        </Link>
      </div>
      <BodyText className="text-center text-xs text-warm-taupe-soft">
        Pas envie de créer un compte ? Vous pouvez commander en tant qu'invité.
      </BodyText>
    </form>
  );
}
