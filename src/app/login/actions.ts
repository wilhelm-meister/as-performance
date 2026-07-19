"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { ok?: boolean; email?: string; error?: string };
export type VerifyState = { error?: string } | null;

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

/**
 * Anmeldung per 6-stelligem Code aus der E-Mail.
 *
 * Warum es das gibt: Der Klick-Link nutzt das PKCE-Verfahren und braucht einen
 * Schlüssel, der im anfordernden Browser als Cookie liegt. Mail-Apps (Gmail &
 * Co.) öffnen Links aber in ihrem eigenen eingebauten Browser — dort fehlt der
 * Schlüssel, die Anmeldung scheitert und sah bisher wie „Link abgelaufen" aus.
 * Der Code kommt ohne Cookie aus und funktioniert deshalb auf jedem Gerät.
 */
export async function verifyCode(
  _prev: VerifyState,
  formData: FormData
): Promise<VerifyState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const token = String(formData.get("code") || "").replace(/\D/g, "");

  // Die Codelänge ist in Supabase einstellbar (6–10 Stellen) — nicht fest auf 6
  // prüfen, sonst lehnt die App einen gültigen Code wegen der Länge ab.
  if (token.length < 6 || token.length > 10) {
    return { error: "Bitte den vollständigen Code aus der E-Mail eingeben." };
  }

  const supabase = await createClient();
  // Je nach Konto hinterlegt Supabase den Code als „email"- oder als
  // „magiclink"-Token. Beide Varianten prüfen, sonst scheitert ein gültiger
  // Code nur wegen der Typbezeichnung.
  let { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) {
    ({ error } = await supabase.auth.verifyOtp({ email, token, type: "magiclink" }));
  }

  if (error) {
    return {
      error: "Der Code stimmt nicht oder ist abgelaufen. Fordere dir eine neue E-Mail an.",
    };
  }

  redirect("/");
}
