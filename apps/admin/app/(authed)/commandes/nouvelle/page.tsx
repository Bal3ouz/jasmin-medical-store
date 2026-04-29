import { WalkInOrderForm } from "@/components/WalkInOrderForm";
import { getStaffSession } from "@/lib/auth";
import { H1Editorial, LabelEyebrow } from "@jasmin/ui";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * POS-lite walk-in order page. Cashiers, managers, and admins can create
 * a `confirmed`/`paid`/`cash_on_delivery` order on behalf of a walk-in
 * customer. The form lives in `WalkInOrderForm` (client component); this
 * page only enforces auth + role and renders the shell.
 */
export default async function NewWalkInOrderPage() {
  const session = await getStaffSession();
  if (!session) redirect("/login");
  if (!["admin", "manager", "cashier"].includes(session.role)) {
    return (
      <div>
        <LabelEyebrow>Nouvelle commande</LabelEyebrow>
        <H1Editorial className="mt-2 text-4xl text-deep-teal">Accès restreint</H1Editorial>
        <p className="mt-4 text-warm-taupe-soft text-sm">
          Seuls les rôles admin, manager et caissier peuvent créer une commande au comptoir.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header>
        <LabelEyebrow>Nouvelle commande</LabelEyebrow>
        <H1Editorial className="mt-2 text-4xl text-deep-teal">Vente au comptoir</H1Editorial>
        <p className="mt-3 text-warm-taupe-soft text-sm">
          Saisissez le client et les articles, puis confirmez la vente. La commande sera marquée
          comme payée en espèces.
        </p>
      </header>

      <WalkInOrderForm />
    </div>
  );
}
