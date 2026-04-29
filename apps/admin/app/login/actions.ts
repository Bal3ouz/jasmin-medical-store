"use server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  if (!email) {
    redirect(`/login/mot-de-passe-oublie?error=${encodeURIComponent("Email requis.")}`);
  }
  const supabase = await createSupabaseServerClient();
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3001";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${adminUrl}/login/reinitialiser`,
  });
  if (error) {
    redirect(`/login/mot-de-passe-oublie?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/login/mot-de-passe-oublie?sent=1");
}

export async function resetPasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    redirect(
      `/login/reinitialiser?error=${encodeURIComponent("Mot de passe trop court (8 minimum).")}`,
    );
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(`/login/reinitialiser?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/");
}
