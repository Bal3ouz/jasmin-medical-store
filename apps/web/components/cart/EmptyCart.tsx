import { VOICE } from "@jasmin/lib";
import { Button, EmptyState, JasmineSprig } from "@jasmin/ui";
import Link from "next/link";

export function EmptyCart() {
  return (
    <EmptyState
      title={VOICE.emptyCartTitle}
      description="Découvrez notre sélection de cosmétiques, orthopédie et matériel médical."
      illustration={<JasmineSprig className="h-16 w-16 text-jasmine" />}
      action={
        <Button asChild variant="primary-teal">
          <Link href="/boutique">{VOICE.emptyCartCta}</Link>
        </Button>
      }
    />
  );
}
