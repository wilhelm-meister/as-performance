export type ItemType = "labor" | "part" | "flat";

export type Item = {
  type: ItemType;
  desc: string;
  qty: number;
  price: number;
};

export type DocType = "quote" | "invoice";

// Status im Feld: quote → draft|sent|accepted, invoice → open|paid|cancelled.
// "overdue" wird nie gespeichert, sondern aus due_date abgeleitet.
export type DocStatus = "draft" | "sent" | "accepted" | "open" | "paid" | "cancelled";
export type EffectiveStatus = DocStatus | "overdue";

export type Customer = {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  street: string;
  zip: string;
  city: string;
  notes: string;
  created_at: string;
};

export type Vehicle = {
  id: string;
  customer_id: string;
  plate: string;
  model: string;
  vin: string;
  km: number | null;
  year: number | null;
  fuel: string;
  engine: string;
  created_at: string;
};

export type CustomerWithVehicles = Customer & { vehicles: Vehicle[] };

export type Doc = {
  id: string;
  type: DocType;
  number: string;
  status: DocStatus;
  customer_id: string;
  vehicle_id: string | null;
  km: number | null;
  issue_date: string;
  due_date: string | null;
  items: Item[];
  vat_rate: number;
  net_total: number;
  vat_total: number;
  gross_total: number;
  sent_at: string | null;
  sent_to: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  /** 0 = nie gemahnt, 1 = Zahlungserinnerung, 2 = 1. Mahnung, 3 = 2. Mahnung */
  reminder_level: number;
  reminded_at: string | null;
  source_quote: string | null;
  converted_to: string | null;
  locked: boolean;
  created_at: string;
  updated_at: string;
};

export type DocWithRefs = Doc & {
  customer: Pick<Customer, "name" | "company" | "email"> | null;
  vehicle: Pick<Vehicle, "plate" | "model"> | null;
};

export type Settings = {
  id: number;
  name: string;
  owner_name: string;
  street: string;
  zip: string;
  city: string;
  phone: string;
  email: string;
  tax_number: string;
  vat_id: string;
  bank_name: string;
  iban: string;
  bic: string;
  hourly_rate: number;
  payment_days: number;
  quote_validity_days: number;
  small_business: boolean;
  logo_url: string;
  updated_at: string;
};

export type Member = {
  email: string;
  role: string;
  created_at: string;
};

export type Product = {
  id: string;
  type: ItemType;
  name: string;
  price: number;
  /** Vorgabe-Menge beim Einfügen: Stunden bei Arbeitszeit, Stück bei Teilen */
  default_qty: number;
  created_at: string;
};
