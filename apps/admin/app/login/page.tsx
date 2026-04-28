import { AiryContainer, BodyText, Button, H1Editorial, Input, Logo } from "@jasmin/ui";
import { signInAction } from "./actions";

export default function LoginPage() {
  return (
    <AiryContainer className="min-h-screen px-8 py-24 lg:px-24">
      <Logo />
      <div className="mx-auto mt-16 max-w-md">
        <H1Editorial className="text-deep-teal text-4xl">Espace équipe</H1Editorial>
        <BodyText className="mt-4">
          Connectez-vous pour accéder au tableau de bord interne.
        </BodyText>
        <form action={signInAction} className="mt-10 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs uppercase tracking-[0.18em] text-warm-taupe-soft mb-2"
            >
              Email
            </label>
            <Input id="email" type="email" name="email" required autoComplete="email" />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-xs uppercase tracking-[0.18em] text-warm-taupe-soft mb-2"
            >
              Mot de passe
            </label>
            <Input
              id="password"
              type="password"
              name="password"
              required
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full">
            Se connecter
          </Button>
        </form>
      </div>
    </AiryContainer>
  );
}
