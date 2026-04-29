import { signOutAction } from "@/app/actions/session";
import { Button } from "@jasmin/ui";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button variant="ghost" type="submit">
        Se déconnecter
      </Button>
    </form>
  );
}
