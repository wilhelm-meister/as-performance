"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCustomer, getDoc, getSettings } from "@/lib/data";
import { computeTotals } from "@/lib/totals";
import { docNoun, todayISO } from "@/lib/format";
import { buildDocumentPdf } from "@/lib/pdf";
import { sendDocumentMail } from "@/lib/mail";
import type { Item } from "@/lib/types";

export type SaveDocInput = {
  id: string | null;
  type: "quote" | "invoice";
  customer_id: string;
  vehicle_id: string;
  km: string;
  items: Item[];
};

function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function sanitizeItems(items: Item[]): Item[] {
  return (items ?? [])
    .filter((it) => it && ["labor", "part", "flat"].includes(it.type))
    .map((it) => ({
      type: it.type,
      desc: String(it.desc ?? "").slice(0, 300),
      qty: Number.isFinite(Number(it.qty)) ? Number(it.qty) : 0,
      price: Number.isFinite(Number(it.price)) ? Number(it.price) : 0,
    }));
}

export async function saveDocumentAction(input: SaveDocInput) {
  if (!input.customer_id) {
    return { error: "Bitte zuerst einen Kunden wählen." };
  }

  const items = sanitizeItems(input.items);
  const totals = computeTotals(items);
  const km = input.km ? parseInt(input.km.replace(/[^\d]/g, ""), 10) || null : null;
  const listPath = input.type === "quote" ? "/angebote" : "/rechnungen";

  const supabase = await createClient();

  if (input.id) {
    const { data: existing } = await supabase
      .from("documents")
      .select("id, type, status, locked, number")
      .eq("id", input.id)
      .maybeSingle();

    if (!existing) return { error: "Beleg nicht gefunden." };
    if (existing.locked || existing.status === "paid" || existing.status === "accepted") {
      return { error: "Dieser Beleg ist gesperrt und kann nicht mehr geändert werden." };
    }

    const { error } = await supabase
      .from("documents")
      .update({
        customer_id: input.customer_id,
        vehicle_id: input.vehicle_id || null,
        km,
        items,
        net_total: totals.net,
        vat_total: totals.vat,
        gross_total: totals.gross,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id);

    if (error) return { error: "Speichern fehlgeschlagen." };

    revalidatePath("/", "layout");
    return { ok: true, id: input.id, number: existing.number as string, listPath };
  }

  const settings = await getSettings();
  const today = todayISO();

  const payload = {
    type: input.type,
    customer_id: input.customer_id,
    vehicle_id: input.vehicle_id || "",
    km: km != null ? String(km) : "",
    issue_date: today,
    due_date: input.type === "invoice" ? addDaysISO(today, settings?.payment_days ?? 14) : "",
    items,
    vat_rate: "19",
    net_total: String(totals.net),
    vat_total: String(totals.vat),
    gross_total: String(totals.gross),
  };

  const { data, error } = await supabase.rpc("create_document", { p: payload });
  if (error || !data) return { error: "Anlegen fehlgeschlagen: " + (error?.message ?? "") };

  const doc = data as { id: string; number: string };
  revalidatePath("/", "layout");
  return { ok: true, id: doc.id, number: doc.number, listPath };
}

export async function convertQuoteAction(id: string) {
  const settings = await getSettings();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("convert_quote", {
    p_quote_id: id,
    p_due_days: settings?.payment_days ?? 14,
  });

  if (error || !data) {
    return { error: error?.message ?? "Umwandeln fehlgeschlagen." };
  }

  const inv = data as { id: string; number: string };
  revalidatePath("/", "layout");
  return { ok: true, invoiceId: inv.id, number: inv.number };
}

export async function markPaidAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("documents")
    .update({
      status: "paid",
      paid_at: todayISO(),
      locked: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("type", "invoice")
    .eq("status", "open");

  if (error) return { error: "Aktion fehlgeschlagen." };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteDocumentAction(id: string) {
  const doc = await getDoc(id);
  if (!doc) return { error: "Beleg nicht gefunden." };
  if (doc.sent_at) {
    return { error: "Bereits versendete Belege können nicht gelöscht werden." };
  }
  if (doc.status !== "draft" && doc.status !== "open") {
    return { error: "Dieser Beleg kann nicht mehr gelöscht werden." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) return { error: "Löschen fehlgeschlagen." };

  const listPath = doc.type === "quote" ? "/angebote" : "/rechnungen";
  revalidatePath("/", "layout");
  return {
    redirectTo: `${listPath}?ok=${encodeURIComponent(`${docNoun(doc.type)} ${doc.number} gelöscht`)}`,
  };
}

export async function sendDocumentAction(id: string) {
  const doc = await getDoc(id);
  if (!doc) return { error: "Beleg nicht gefunden." };

  const [settings, customer] = await Promise.all([
    getSettings(),
    getCustomer(doc.customer_id),
  ]);
  if (!settings || !customer) return { error: "Stammdaten konnten nicht geladen werden." };

  const to = (customer.email || "").trim();
  if (!to) {
    return { error: "Der Kunde hat keine E-Mail-Adresse hinterlegt — bitte zuerst beim Kunden ergänzen." };
  }

  const vehicle = customer.vehicles.find((v) => v.id === doc.vehicle_id) ?? null;
  const pdf = await buildDocumentPdf({ doc, customer, vehicle, settings });

  const noun = docNoun(doc.type);
  const vehicleLine = vehicle
    ? ` für Ihr Fahrzeug ${vehicle.model ? vehicle.model + " " : ""}(${vehicle.plate})`
    : "";
  const payLine =
    doc.type === "invoice" && doc.due_date
      ? `\n\nBitte überweisen Sie den Betrag bis zum ${doc.due_date.split("-").reverse().join(".")} auf das in der Rechnung angegebene Konto.`
      : "";

  const text = `Guten Tag ${customer.name},

anbei erhalten Sie ${doc.type === "quote" ? "unser Angebot" : "unsere Rechnung"} ${doc.number}${vehicleLine} als PDF.${payLine}

Bei Fragen melden Sie sich gern.

Mit freundlichen Grüßen
${settings.owner_name || settings.name}
${settings.name}${settings.phone ? `\nTelefon: ${settings.phone}` : ""}`;

  const result = await sendDocumentMail({
    to,
    replyTo: settings.email || undefined,
    subject: `${noun} ${doc.number} – ${settings.name}`,
    text,
    pdf,
    filename: `${doc.number}.pdf`,
  });

  if (result.error) return { error: result.error };

  const supabase = await createClient();
  const patch: Record<string, unknown> = {
    sent_at: new Date().toISOString(),
    sent_to: to,
    updated_at: new Date().toISOString(),
  };
  if (doc.type === "quote" && doc.status === "draft") patch.status = "sent";
  if (doc.type === "invoice") patch.locked = true;

  await supabase.from("documents").update(patch).eq("id", id);

  revalidatePath("/", "layout");
  return { ok: true };
}
