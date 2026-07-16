"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; values?: Record<string, string> } | null;

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function intOrNull(s: string): number | null {
  const n = parseInt(s.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

function customerFields(fd: FormData) {
  return {
    name: str(fd, "name"),
    company: str(fd, "company"),
    phone: str(fd, "phone"),
    email: str(fd, "email").toLowerCase(),
    street: str(fd, "street"),
    zip: str(fd, "zip"),
    city: str(fd, "city"),
    notes: str(fd, "notes"),
  };
}

function echo(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

export async function createCustomerAction(
  _prev: FormState,
  fd: FormData
): Promise<FormState & { ok?: boolean; id?: string }> {
  const c = customerFields(fd);
  if (!c.name) return { error: "Bitte einen Namen eingeben.", values: echo(fd) };

  const supabase = await createClient();
  const { data: customer, error } = await supabase
    .from("customers")
    .insert(c)
    .select("id")
    .single();

  if (error || !customer) {
    return { error: "Kunde konnte nicht gespeichert werden.", values: echo(fd) };
  }

  const plate = str(fd, "plate").toUpperCase();
  if (plate) {
    await supabase.from("vehicles").insert({
      customer_id: customer.id,
      plate,
      model: str(fd, "model"),
      vin: str(fd, "vin").toUpperCase(),
      km: intOrNull(str(fd, "km")),
      year: intOrNull(str(fd, "year")),
      fuel: str(fd, "fuel"),
      engine: str(fd, "engine"),
    });
  }

  revalidatePath("/", "layout");
  return { ok: true, id: customer.id };
}

export async function updateCustomerAction(
  id: string,
  _prev: FormState,
  fd: FormData
): Promise<FormState & { ok?: boolean; id?: string }> {
  const c = customerFields(fd);
  if (!c.name) return { error: "Bitte einen Namen eingeben.", values: echo(fd) };

  const supabase = await createClient();
  const { error } = await supabase.from("customers").update(c).eq("id", id);
  if (error) return { error: "Änderungen konnten nicht gespeichert werden.", values: echo(fd) };

  revalidatePath("/", "layout");
  return { ok: true, id };
}

export async function deleteCustomerAction(id: string) {
  const supabase = await createClient();

  const { count } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", id);

  if ((count ?? 0) > 0) {
    return {
      error: "Kunde hat Angebote oder Rechnungen und kann deshalb nicht gelöscht werden.",
    };
  }

  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) return { error: "Löschen fehlgeschlagen." };

  revalidatePath("/", "layout");
  return { redirectTo: `/kunden?ok=${encodeURIComponent("Kunde gelöscht")}` };
}

export async function saveVehicleAction(
  customerId: string,
  vehicleId: string | null,
  _prev: FormState,
  fd: FormData
): Promise<FormState & { ok?: boolean }> {
  const plate = str(fd, "plate").toUpperCase();
  if (!plate) return { error: "Bitte ein Kennzeichen eingeben.", values: echo(fd) };

  const v = {
    plate,
    model: str(fd, "model"),
    vin: str(fd, "vin").toUpperCase(),
    km: intOrNull(str(fd, "km")),
    year: intOrNull(str(fd, "year")),
    fuel: str(fd, "fuel"),
    engine: str(fd, "engine"),
  };

  const supabase = await createClient();
  const { error } = vehicleId
    ? await supabase.from("vehicles").update(v).eq("id", vehicleId)
    : await supabase.from("vehicles").insert({ ...v, customer_id: customerId });

  if (error) return { error: "Fahrzeug konnte nicht gespeichert werden.", values: echo(fd) };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteVehicleAction(vehicleId: string, customerId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").delete().eq("id", vehicleId);
  if (error) return { error: "Löschen fehlgeschlagen." };
  revalidatePath("/", "layout");
  return { redirectTo: `/kunden/${customerId}?ok=${encodeURIComponent("Fahrzeug gelöscht")}` };
}
