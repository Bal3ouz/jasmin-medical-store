import { LoginForm } from "@/components/auth/LoginForm";
import { VOICE } from "@jasmin/lib";
import { AiryContainer, BodyText, H1Editorial } from "@jasmin/ui";

export const dynamic = "force-dynamic";

export default function ConnexionPage() {
  return (
    <main>
      <AiryContainer className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-md">
          <H1Editorial className="text-4xl text-deep-teal">{VOICE.loginTitle}</H1Editorial>
          <BodyText className="mt-4">Connectez-vous pour suivre vos commandes.</BodyText>
          <div className="mt-10">
            <LoginForm />
          </div>
        </div>
      </AiryContainer>
    </main>
  );
}
