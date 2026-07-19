"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCustomer, getDoc, getSettings } from "@/lib/data";
import { computeTotals } from "@/lib/totals";
import { REMINDER_TITLE, docNoun, effectiveStatus, todayISO } from "@/lib/format";
import { buildDocumentPdf, buildReminderPdf } from "@/lib/pdf";
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
  const km = input.km ? parseInt(input.km.replace(/[^\d]/g, ""), 10) || null : null;
  const listPath = input.type === "quote" ? "/angebote" : "/rechnungen";

  const supabase = await createClient();

  if (input.id) {
    const { data: existing } = await supabase
      .from("documents")
      .select("id, type, status, locked, number, vat_rate")
      .eq("id", input.id)
      .maybeSingle();

    if (!existing) return { error: "Beleg nicht gefunden." };
    if (existing.locked || existing.status === "paid" || existing.status === "accepted") {
      return { error: "Dieser Beleg ist gesperrt und kann nicht mehr geändert werden." };
    }

    // Steuersatz wurde beim Anlegen eingefroren — Summen damit neu rechnen.
    const totals = computeTotals(items, Number(existing.vat_rate ?? 19));

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

  // Kleinunternehmer (§ 19 UStG) → 0 % — wird am Beleg eingefroren.
  const vatRate = settings?.small_business ? 0 : 19;
  const totals = computeTotals(items, vatRate);

  const payload = {
    type: input.type,
    customer_id: input.customer_id,
    vehicle_id: input.vehicle_id || "",
    km: km != null ? String(km) : "",
    issue_date: today,
    due_date: input.type === "invoice" ? addDaysISO(today, settings?.payment_days ?? 14) : "",
    items,
    vat_rate: String(vatRate),
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

export async function cancelInvoiceAction(id: string) {
  const doc = await getDoc(id);
  if (!doc || doc.type !== "invoice") return { error: "Rechnung nicht gefunden." };
  if (doc.status !== "open" && doc.status !== "paid") {
    return { error: "Nur offene oder bezahlte Rechnungen können storniert werden." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("documents")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      locked: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: "Stornieren fehlgeschlagen." };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Kopiert eine (z.B. stornierte) Rechnung als neuen offenen Entwurf mit neuer Nummer. */
export async function duplicateInvoiceAction(id: string) {
  const doc = await getDoc(id);
  if (!doc || doc.type !== "invoice") return { error: "Rechnung nicht gefunden." };

  const settings = await getSettings();
  const today = todayISO();
  const vatRate = Number(doc.vat_rate);
  const totals = computeTotals(doc.items ?? [], vatRate);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_document", {
    p: {
      type: "invoice",
      customer_id: doc.customer_id,
      vehicle_id: doc.vehicle_id ?? "",
      km: doc.km != null ? String(doc.km) : "",
      issue_date: today,
      due_date: addDaysISO(today, settings?.payment_days ?? 14),
      items: doc.items ?? [],
      vat_rate: String(vatRate),
      net_total: String(totals.net),
      vat_total: String(totals.vat),
      gross_total: String(totals.gross),
    },
  });

  if (error || !data) return { error: "Kopie fehlgeschlagen: " + (error?.message ?? "") };
  const inv = data as { id: string; number: string };
  revalidatePath("/", "layout");
  return { ok: true, invoiceId: inv.id, number: inv.number };
}

/** Erhöht die Mahnstufe (1=Zahlungserinnerung, 2=1. Mahnung, 3=2. Mahnung). */
export async function createReminderAction(id: string) {
  const doc = await getDoc(id);
  if (!doc || doc.type !== "invoice") return { error: "Rechnung nicht gefunden." };
  if (effectiveStatus(doc) !== "overdue") {
    return { error: "Gemahnt wird erst, wenn das Zahlungsziel überschritten ist." };
  }
  if (doc.reminder_level >= 3) {
    return { error: "Die höchste Mahnstufe (2. Mahnung) ist bereits erreicht." };
  }

  const level = doc.reminder_level + 1;
  const supabase = await createClient();
  const { error } = await supabase
    .from("documents")
    .update({
      reminder_level: level,
      reminded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: "Mahnung konnte nicht erstellt werden." };
  revalidatePath("/", "layout");
  return { ok: true, level };
}

export async function sendReminderAction(id: string) {
  const doc = await getDoc(id);
  if (!doc || doc.type !== "invoice" || doc.reminder_level < 1) {
    return { error: "Es wurde noch keine Mahnung erstellt." };
  }

  const [settings, customer] = await Promise.all([
    getSettings(),
    getCustomer(doc.customer_id),
  ]);
  if (!settings || !customer) return { error: "Stammdaten konnten nicht geladen werden." };

  const to = (customer.email || "").trim();
  if (!to) {
    return { error: "Der Kunde hat keine E-Mail-Adresse hinterlegt — bitte zuerst beim Kunden ergänzen." };
  }

  const pdf = await buildReminderPdf({ doc, customer, settings });
  const title = REMINDER_TITLE[doc.reminder_level];

  const text = `Guten Tag ${customer.name},

anbei erhalten Sie eine ${title} zur Rechnung ${doc.number} vom ${doc.issue_date.split("-").reverse().join(".")} über ${Number(doc.gross_total).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}.

Sollten Sie den Betrag bereits überwiesen haben, betrachten Sie dieses Schreiben bitte als gegenstandslos.

Mit freundlichen Grüßen
${settings.owner_name || settings.name}
${settings.name}${settings.phone ? `\nTelefon: ${settings.phone}` : ""}`;

  const result = await sendDocumentMail({
    to,
    replyTo: settings.email || undefined,
    fromName: settings.name,
    subject: `${title} zur Rechnung ${doc.number} – ${settings.name}`,
    text,
    pdf,
    filename: `${title.replace(/\.? /g, "-")}-${doc.number}.pdf`,
  });

  if (result.error) return { error: result.error };
  revalidatePath("/", "layout");
  return { ok: true };
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
    fromName: settings.name,
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
