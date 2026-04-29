import { SignupForm } from "@/components/auth/SignupForm";
import { VOICE } from "@jasmin/lib";
import { AiryContainer, BodyText, H1Editorial } from "@jasmin/ui";

export const dynamic = "force-dynamic";

export default function InscriptionPage() {
  return (
    <main>
      <AiryContainer className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-md">
          <H1Editorial className="text-4xl text-deep-teal">{VOICE.signupTitle}</H1Editorial>
          <BodyText className="mt-4">
            Créez votre compte pour suivre vos commandes et bénéficier de promotions exclusives.
          </BodyText>
          <div className="mt-10">
            <SignupForm />
          </div>
        </div>
      </AiryContainer>
    </main>
  );
}
