"use client";
import { type AuthResult, resetPasswordAction } from "@/app/actions/auth";
import { Button, Input } from "@jasmin/ui";
import { useState, useTransition } from "react";

export function ResetPasswordForm() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<AuthResult | null>(null);
  return (
    <form
      action={(fd) =>
        start(async () => {
          const r = await resetPasswordAction(fd);
          if (!r.ok) setResult(r);
        })
      }
      className="space-y-4"
    >
      <label className="block">
        <span className="block text-xs uppercase tracking-[0.18em] text-warm-taupe-soft mb-2">
          Nouveau mot de passe
        </span>
        <Input name="password" type="password" required minLength={8} />
      </label>
      {result && !result.ok && (
        <p role="alert" className="text-sm text-warm-taupe">
          {result.error}
        </p>
      )}
      <Button type="submit" variant="primary-teal" disabled={pending} className="w-full">
        {pending ? "Mise à jour…" : "Mettre à jour"}
      </Button>
    </form>
  );
}
