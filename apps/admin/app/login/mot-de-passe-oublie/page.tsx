import { AiryContainer, BodyText, Button, H1Editorial, Input, Logo } from "@jasmin/ui";
import { requestPasswordResetAction } from "../actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const params = await searchParams;
  return (
    <AiryContainer className="min-h-screen px-8 py-24 lg:px-24">
      <Logo />
      <div className="mx-auto mt-16 max-w-md">
        <H1Editorial className="text-deep-teal text-4xl">Mot de passe oublié</H1Editorial>
        <BodyText className="mt-4">Recevez un lien pour le réinitialiser.</BodyText>
        <form action={requestPasswordResetAction} className="mt-10 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs uppercase tracking-[0.18em] text-warm-taupe-soft mb-2"
            >
              Email
            </label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          {params.sent && (
            <output className="block text-sm text-deep-teal">
              Un email vous a été envoyé. Vérifiez votre boîte de réception.
            </output>
          )}
          {params.error && (
            <p role="alert" className="text-sm text-warm-taupe">
              {params.error}
            </p>
          )}
          <Button type="submit" className="w-full">
            Envoyer le lien
          </Button>
        </form>
      </div>
    </AiryContainer>
  );
}
