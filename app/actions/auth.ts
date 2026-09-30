"use server";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { clearLocalSession, localSignIn, localSignUp } from "@/lib/local/auth";
import { createClient } from "@/lib/supabase/server";

export type AuthResult = { ok: true } | { ok: false; error: string };

export async function signUpWithPassword(email: string, password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return localSignUp(email, password);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, error: error.message };
  if (!data.session) return { ok: false, error: "Check your email to confirm your account, then sign in." };
  return { ok: true };
}

export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) return localSignIn(email, password);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } else {
    await clearLocalSession();
  }
  redirect("/login");
}
