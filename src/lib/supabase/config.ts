// Öffentliche Zugangsdaten (der anon-Key ist bewusst öffentlich — Schutz übernimmt RLS).
// Umgebungsvariablen überschreiben die eingebauten Werte.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://jbtlifhgxxroeqhzxiqn.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidGxpZmhneHhyb2VxaHp4aXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMjA5NzEsImV4cCI6MjA5OTc5Njk3MX0.If7vei_q6NhIYNswcwL6trWbwBuDV2rX7kD8Y74KmLE";
