"use server";
import { createClient } from "@jasmin/db";
import { newsletterSubscribers } from "@jasmin/db/schema";
import { NewsletterSubscribeSchema } from "@jasmin/lib/schemas";

export type NewsletterState = { ok: null } | { ok: true } | { ok: false; error: string };

export async function subscribeNewsletterAction(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const parsed = NewsletterSubscribeSchema.safeParse({
    email: formData.get("email"),
    source: formData.get("source") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: "Adresse email invalide." };
  }

  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) return { ok: false, error: "Service indisponible — réessayez plus tard." };
  const db = createClient(dbUrl);

  await db
    .insert(newsletterSubscribers)
    .values({ email: parsed.data.email, source: parsed.data.source ?? null })
    .onConflictDoNothing();

  return { ok: true };
}
