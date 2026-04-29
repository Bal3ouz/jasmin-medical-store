import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { AiryContainer, BodyText, H1Editorial } from "@jasmin/ui";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <main>
      <AiryContainer className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-md">
          <H1Editorial className="text-4xl text-deep-teal">Nouveau mot de passe</H1Editorial>
          <BodyText className="mt-4">Choisissez un mot de passe d'au moins 8 caractères.</BodyText>
          <div className="mt-10">
            <ResetPasswordForm />
          </div>
        </div>
      </AiryContainer>
    </main>
  );
}
