"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionEmail } from "@/lib/data";

export type SettingsState = { ok?: boolean; error?: string } | null;

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function num(fd: FormData, key: string, fallback: number): number {
  const raw = str(fd, key).replace(",", ".");
  const n = parseFloat(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export async function updateSettingsAction(
  _prev: SettingsState,
  fd: FormData
): Promise<SettingsState> {
  const name = str(fd, "name");
  if (!name) return { error: "Bitte einen Werkstattnamen eingeben." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("workshop_settings")
    .update({
      name,
      owner_name: str(fd, "owner_name"),
      street: str(fd, "street"),
      zip: str(fd, "zip"),
      city: str(fd, "city"),
      phone: str(fd, "phone"),
      email: str(fd, "email").toLowerCase(),
      tax_number: str(fd, "tax_number"),
      vat_id: str(fd, "vat_id"),
      bank_name: str(fd, "bank_name"),
      iban: str(fd, "iban").toUpperCase(),
      bic: str(fd, "bic").toUpperCase(),
      hourly_rate: num(fd, "hourly_rate", 89),
      payment_days: Math.round(num(fd, "payment_days", 14)),
      quote_validity_days: Math.round(num(fd, "quote_validity_days", 30)),
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) return { error: "Speichern fehlgeschlagen." };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function addMemberAction(fd: FormData) {
  const email = str(fd, "email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect(`/einstellungen?err=${encodeURIComponent("Bitte eine gültige E-Mail-Adresse eingeben.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("members").insert({ email, role: "owner" });

  if (error) {
    redirect(`/einstellungen?err=${encodeURIComponent("Diese Adresse ist bereits freigeschaltet.")}`);
  }

  revalidatePath("/einstellungen");
  redirect(`/einstellungen?ok=${encodeURIComponent(`${email} freigeschaltet`)}`);
}

export async function removeMemberAction(email: string) {
  const own = await getSessionEmail();
  if (own && own.toLowerCase() === email.toLowerCase()) {
    return { error: "Du kannst deinen eigenen Zugang nicht entfernen." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("members").delete().eq("email", email);
  if (error) return { error: "Entfernen fehlgeschlagen." };

  revalidatePath("/einstellungen");
  return { ok: true };
}
