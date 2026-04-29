import { createClient } from "@jasmin/db";
import { listCategories } from "@jasmin/db/queries";
import { AiryContainer, BodyText, H2Section } from "@jasmin/ui";
import Link from "next/link";

export async function CategoryShowcase() {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) return null;
  const db = createClient(dbUrl);
  const categories = await listCategories(db);
  const roots = categories.filter((c) => c.parentId === null);

  return (
    <AiryContainer className="px-6 py-20 lg:px-12 lg:py-28">
      <div className="mx-auto max-w-[1400px]">
        <H2Section>Nos univers</H2Section>
        <BodyText className="mt-3 max-w-2xl">
          Quatre rayons, une même attention au détail — sélectionnés avec soin, livrés avec sourire.
        </BodyText>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {roots.map((c) => (
            <Link
              key={c.id}
              href={`/boutique/${c.slug}`}
              className="group flex flex-col justify-between rounded-lg bg-linen/60 p-8 transition-all duration-300 hover:bg-linen hover:shadow-soft"
            >
              <h3 className="font-[var(--font-display)] text-2xl italic text-deep-teal">
                {c.name}
              </h3>
              <p className="mt-3 font-[var(--font-body)] text-sm leading-[1.6] text-warm-taupe-soft">
                {c.description}
              </p>
              <span className="mt-8 font-[var(--font-label)] text-xs uppercase tracking-[0.24em] text-deep-teal transition-colors group-hover:text-deep-teal-dark">
                Explorer →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </AiryContainer>
  );
}
