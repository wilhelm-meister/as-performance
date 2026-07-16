"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { ok?: boolean; email?: string; error?: string };

export async function sendMagicLink(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Bitte eine gültige E-Mail-Adresse eingeben." };
  }

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const origin = h.get("origin") ?? `${proto}://${host}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    if (error.status === 429) {
      return {
        error:
          "Zu viele Anmelde-Mails in kurzer Zeit. Bitte warte einen Moment und versuche es dann erneut.",
      };
    }
    return { error: "Der Link konnte nicht gesendet werden. Bitte versuche es erneut." };
  }

  return { ok: true, email };
}
