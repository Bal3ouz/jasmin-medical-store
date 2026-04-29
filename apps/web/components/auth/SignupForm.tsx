"use client";
import { type AuthResult, signUpAction } from "@/app/actions/auth";
import { BodyText, Button, Input } from "@jasmin/ui";
import Link from "next/link";
import { useState, useTransition } from "react";

export function SignupForm() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<AuthResult | null>(null);
  return (
    <form
      action={(fd) =>
        start(async () => {
          const r = await signUpAction(fd);
          if (!r.ok) setResult(r);
        })
      }
      className="space-y-4"
    >
      <Field label="Nom complet" name="fullName" />
      <Field label="Email" name="email" type="email" />
      <Field
        label="Mot de passe (8 caractères min)"
        name="password"
        type="password"
        minLength={8}
      />
      {result && !result.ok && (
        <p role="alert" className="text-sm text-warm-taupe">
          {result.error}
        </p>
      )}
      <Button type="submit" variant="primary-teal" disabled={pending} className="w-full">
        {pending ? "Création…" : "Créer mon compte"}
      </Button>
      <BodyText className="text-center text-xs text-warm-taupe-soft">
        Déjà un compte ?{" "}
        <Link href="/compte/connexion" className="text-deep-teal underline underline-offset-2">
          Se connecter
        </Link>
      </BodyText>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  minLength,
}: {
  label: string;
  name: string;
  type?: string;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-[0.18em] text-warm-taupe-soft mb-2">
        {label}
      </span>
      <Input name={name} type={type} required minLength={minLength} />
    </label>
  );
}
