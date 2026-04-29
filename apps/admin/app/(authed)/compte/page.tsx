import { resetPasswordAction } from "@/app/login/actions";
import { getStaffSession } from "@/lib/auth";
import { BodyText, Button, H1Editorial, Input, LabelEyebrow } from "@jasmin/ui";
import { redirect } from "next/navigation";

export default async function ComptePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getStaffSession();
  if (!session) redirect("/login");
  const params = await searchParams;

  return (
    <div className="max-w-xl">
      <LabelEyebrow>Mon compte</LabelEyebrow>
      <H1Editorial className="mt-2 text-deep-teal text-4xl">{session.fullName}</H1Editorial>
      <BodyText className="mt-2 text-warm-taupe-soft">{session.email}</BodyText>

      <h2 className="mt-12 font-display text-2xl text-deep-teal">Changer mon mot de passe</h2>
      <form action={resetPasswordAction} className="mt-6 space-y-4">
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Nouveau mot de passe (≥ 8 caractères)"
        />
        {params.error && (
          <p role="alert" className="text-sm text-warm-taupe">
            {params.error}
          </p>
        )}
        <Button type="submit">Mettre à jour</Button>
      </form>
    </div>
  );
}
