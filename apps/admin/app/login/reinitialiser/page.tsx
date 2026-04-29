import { AiryContainer, BodyText, Button, H1Editorial, Input, Logo } from "@jasmin/ui";
import { resetPasswordAction } from "../actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <AiryContainer className="min-h-screen px-8 py-24 lg:px-24">
      <Logo />
      <div className="mx-auto mt-16 max-w-md">
        <H1Editorial className="text-deep-teal text-4xl">Nouveau mot de passe</H1Editorial>
        <BodyText className="mt-4">Choisissez un mot de passe d'au moins 8 caractères.</BodyText>
        <form action={resetPasswordAction} className="mt-10 space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-xs uppercase tracking-[0.18em] text-warm-taupe-soft mb-2"
            >
              Mot de passe
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          {params.error && (
            <p role="alert" className="text-sm text-warm-taupe">
              {params.error}
            </p>
          )}
          <Button type="submit" className="w-full">
            Mettre à jour
          </Button>
        </form>
      </div>
    </AiryContainer>
  );
}
