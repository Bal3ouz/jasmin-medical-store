import type { CustomerAddress } from "@jasmin/db";
import { EmptyState } from "@jasmin/ui";

export function AddressBook({ addresses }: { addresses: CustomerAddress[] }) {
  if (addresses.length === 0) {
    return (
      <EmptyState
        title="Aucune adresse enregistrée."
        description="Vos adresses apparaîtront ici après votre première commande."
      />
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {addresses.map((a) => (
        <article key={a.id} className="rounded-lg border border-linen p-5">
          <p className="font-[var(--font-display)] text-lg italic text-deep-teal">{a.fullName}</p>
          <p className="mt-1 font-[var(--font-body)] text-sm text-warm-taupe">{a.phone}</p>
          <address className="mt-3 not-italic font-[var(--font-body)] text-sm text-warm-taupe">
            {a.street}
            <br />
            {a.postalCode} {a.city}
            <br />
            {a.governorate}, Tunisie
          </address>
          {a.isDefault && (
            <p className="mt-3 font-[var(--font-label)] text-[10px] uppercase tracking-[0.24em] text-deep-teal">
              Par défaut
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
