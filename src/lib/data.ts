import { cache } from "react";
import { createClient } from "./supabase/server";
import type {
  Customer,
  CustomerWithVehicles,
  Doc,
  DocWithRefs,
  Member,
  Product,
  Settings,
} from "./types";

export const getSettings = cache(async (): Promise<Settings | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workshop_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  return (data as Settings) ?? null;
});

export const isMember = cache(async (): Promise<boolean> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_member");
  return data === true;
});

export const listCustomers = cache(async (): Promise<CustomerWithVehicles[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select("*, vehicles(*)")
    .order("name");
  return (data as CustomerWithVehicles[]) ?? [];
});

export async function getCustomer(id: string): Promise<CustomerWithVehicles | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select("*, vehicles(*)")
    .eq("id", id)
    .maybeSingle();
  return (data as CustomerWithVehicles) ?? null;
}

const DOC_SELECT =
  "*, customer:customers(name, company, email), vehicle:vehicles(plate, model)";

export const listDocs = cache(async (): Promise<DocWithRefs[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select(DOC_SELECT)
    .order("created_at", { ascending: false });
  return (data as unknown as DocWithRefs[]) ?? [];
});

export async function getDoc(id: string): Promise<DocWithRefs | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select(DOC_SELECT)
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as DocWithRefs) ?? null;
}

export const listProducts = cache(async (): Promise<Product[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("*").order("name");
  return (data as Product[]) ?? [];
});

export async function getProduct(id: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as Product) ?? null;
}

export async function listMembers(): Promise<Member[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("members").select("*").order("created_at");
  return (data as Member[]) ?? [];
}

export async function getSessionEmail(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ?? null;
}

export type { Customer, Doc, Settings };
