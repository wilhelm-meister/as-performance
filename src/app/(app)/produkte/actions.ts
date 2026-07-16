"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProductFormState = {
  error?: string;
  values?: Record<string, string>;
  ok?: boolean;
} | null;

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function echo(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

export async function saveProductAction(
  productId: string | null,
  _prev: ProductFormState,
  fd: FormData
): Promise<ProductFormState> {
  const name = str(fd, "name");
  if (!name) return { error: "Bitte eine Bezeichnung eingeben.", values: echo(fd) };

  const type = str(fd, "type");
  if (!["labor", "part", "flat"].includes(type)) {
    return { error: "Bitte eine Art wählen.", values: echo(fd) };
  }

  const price = parseFloat(str(fd, "price").replace(",", "."));
  if (!Number.isFinite(price) || price < 0) {
    return { error: "Bitte einen gültigen Preis eingeben.", values: echo(fd) };
  }

  const supabase = await createClient();
  const row = { name, type, price };

  const { error } = productId
    ? await supabase.from("products").update(row).eq("id", productId)
    : await supabase.from("products").insert(row);

  if (error) return { error: "Speichern fehlgeschlagen.", values: echo(fd) };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteProductAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { error: "Löschen fehlgeschlagen." };

  revalidatePath("/", "layout");
  return { redirectTo: `/produkte?ok=${encodeURIComponent("Produkt gelöscht")}` };
}
