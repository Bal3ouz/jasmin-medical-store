import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for the admin app.
 *
 * Server-only. Used for narrow privileged operations:
 *   - inviting staff via `auth.admin.inviteUserByEmail`
 *   - uploading / removing files in the `product-images` storage bucket
 *
 * Never import this from a "use client" module.
 */
export function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL not set");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY not set");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
