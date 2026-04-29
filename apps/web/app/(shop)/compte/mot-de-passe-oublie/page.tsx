import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AiryContainer, BodyText, H1Editorial } from "@jasmin/ui";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <main>
      <AiryContainer className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-md">
          <H1Editorial className="text-4xl text-deep-teal">Mot de passe oublié</H1Editorial>
          <BodyText className="mt-4">
            Entrez votre adresse email — nous vous envoyons un lien pour le réinitialiser.
          </BodyText>
          <div className="mt-10">
            <ForgotPasswordForm />
          </div>
        </div>
      </AiryContainer>
    </main>
  );
}
