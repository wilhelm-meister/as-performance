"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { extractVehicleFromImage, type VehicleExtract } from "@/lib/gemini";
import { normalizePlate } from "@/lib/format";

export type FormState = { error?: string; values?: Record<string, string> } | null;

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function intOrNull(s: string): number | null {
  const n = parseInt(s.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

function echo(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

export async function saveVehicleAction(
  vehicleId: string | null,
  _prev: FormState,
  fd: FormData
): Promise<FormState & { ok?: boolean; id?: string }> {
  const plate = normalizePlate(str(fd, "plate"));
  const vin = str(fd, "vin").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!plate && !vin) {
    return { error: "Bitte mindestens ein Kennzeichen oder eine FIN eingeben.", values: echo(fd) };
  }

  const v = {
    plate,
    vin,
    model: str(fd, "model"),
    km: intOrNull(str(fd, "km")),
    year: intOrNull(str(fd, "year")),
    fuel: str(fd, "fuel"),
    engine: str(fd, "engine"),
    motor_code: str(fd, "motor_code"),
    hsn: str(fd, "hsn") || null,
    tsn: str(fd, "tsn") || null,
    first_registration: str(fd, "first_registration") || null,
    customer_id: str(fd, "customer_id") || null,
  };

  const docPath = str(fd, "document_path");
  const supabase = await createClient();

  if (vehicleId) {
    // Beim Bearbeiten das vorhandene Foto nur ersetzen, wenn ein neues mitkommt
    const patch = docPath ? { ...v, document_url: docPath } : v;
    const { error } = await supabase.from("vehicles").update(patch).eq("id", vehicleId);
    if (error) return { error: "Fahrzeug konnte nicht gespeichert werden.", values: echo(fd) };
    revalidatePath("/", "layout");
    return { ok: true, id: vehicleId };
  }

  const { data, error } = await supabase
    .from("vehicles")
    .insert({ ...v, document_url: docPath || null })
    .select("id")
    .single();
  if (error || !data) {
    return { error: "Fahrzeug konnte nicht gespeichert werden.", values: echo(fd) };
  }
  revalidatePath("/", "layout");
  return { ok: true, id: data.id };
}

/** Legt aus dem erkannten Halter (Fahrzeugschein Feld C) einen Kunden an. */
export async function createCustomerFromHolderAction(holder: {
  name: string;
  street: string;
  zip: string;
  city: string;
}): Promise<{ id?: string; name?: string; error?: string }> {
  const name = (holder.name ?? "").trim();
  if (!name) return { error: "Kein Haltername erkannt." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .insert({
      name,
      company: "",
      phone: "",
      email: "",
      street: (holder.street ?? "").trim(),
      zip: (holder.zip ?? "").trim(),
      city: (holder.city ?? "").trim(),
      notes: "Aus Fahrzeugschein übernommen",
    })
    .select("id, name")
    .single();
  if (error || !data) return { error: "Kunde konnte nicht angelegt werden." };

  revalidatePath("/", "layout");
  return { id: data.id, name: data.name };
}

/** Merkt sich die Blickrichtung des Fahrzeugschein-Fotos (0/90/180/270°). */
export async function setVehicleDocRotationAction(vehicleId: string, rotation: number) {
  const rot = ((Math.round(rotation / 90) * 90) % 360 + 360) % 360;
  const supabase = await createClient();
  const { error } = await supabase
    .from("vehicles")
    .update({ document_rotation: rot })
    .eq("id", vehicleId);
  if (error) return { error: "Drehung konnte nicht gespeichert werden." };
  revalidatePath(`/fahrzeuge/${vehicleId}`);
  return { ok: true };
}

export async function deleteVehicleAction(vehicleId: string) {
  const supabase = await createClient();

  const { count } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("vehicle_id", vehicleId);
  if ((count ?? 0) > 0) {
    return { error: "Fahrzeug hat Angebote oder Rechnungen und kann nicht gelöscht werden." };
  }

  const { data: veh } = await supabase
    .from("vehicles")
    .select("document_url")
    .eq("id", vehicleId)
    .maybeSingle();

  const { error } = await supabase.from("vehicles").delete().eq("id", vehicleId);
  if (error) return { error: "Löschen fehlgeschlagen." };

  if (veh?.document_url) {
    await supabase.storage.from("vehicle-docs").remove([veh.document_url]);
  }
  revalidatePath("/", "layout");
  return { redirectTo: `/fahrzeuge?ok=${encodeURIComponent("Fahrzeug gelöscht")}` };
}

/**
 * Foto des Fahrzeugscheins → Gemini liest die Felder aus und legt das Foto
 * im privaten Speicher ab. Gibt die erkannten Felder + Ablagepfad zurück.
 */
export async function scanFahrzeugscheinAction(
  fd: FormData
): Promise<{ data?: VehicleExtract; documentPath?: string; error?: string }> {
  const file = fd.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Kein Foto empfangen — bitte erneut aufnehmen." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const isPng =
    bytes.length > 3 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isJpg = bytes.length > 2 && bytes[0] === 0xff && bytes[1] === 0xd8;
  if (!isPng && !isJpg) {
    return { error: "Die Datei ist kein gültiges Foto (JPG oder PNG)." };
  }
  const mime = isPng ? "image/png" : "image/jpeg";
  const ext = isPng ? "png" : "jpg";

  const base64 = Buffer.from(bytes).toString("base64");
  const { data, error } = await extractVehicleFromImage(base64, mime);
  if (error || !data) return { error: error ?? "Der Fahrzeugschein konnte nicht gelesen werden." };

  const supabase = await createClient();
  const path = `schein-${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("vehicle-docs")
    .upload(path, bytes, { contentType: mime, upsert: false });
  // Foto-Ablage ist Kür — schlägt sie fehl, liefern wir trotzdem die erkannten Felder
  return { data, documentPath: uploadError ? undefined : path };
}
