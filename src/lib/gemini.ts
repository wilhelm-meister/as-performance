// Fahrzeugschein-Erkennung mit Google Gemini 2.5 Flash-Lite (Bild → Felder).
// Der Schlüssel liegt als Umgebungsvariable GEMINI_API_KEY (nur in Vercel/.env.local,
// nie im Code). Ohne Schlüssel meldet die App freundlich „noch nicht eingerichtet".

const API = "https://generativelanguage.googleapis.com/v1beta";

export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

// Die exakte Modell-ID variiert je nach Schlüssel/Zeitpunkt (sonst 404). Wir fragen
// daher einmal die verfügbaren Modelle ab und wählen das beste „flash-lite" (Fallback:
// flash), das generateContent kann — pro Serverless-Instanz gecacht.
let cachedModel: string | null = null;

async function resolveModel(key: string): Promise<{ model?: string; error?: string }> {
  if (cachedModel) return { model: cachedModel };
  let res: Response;
  try {
    res = await fetch(`${API}/models?key=${key}&pageSize=1000`, {
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    return { error: "Keine Verbindung zur Foto-Erkennung — bitte erneut versuchen." };
  }
  if (!res.ok) {
    if (res.status === 400 || res.status === 403) {
      return { error: "Der Gemini-Schlüssel wird nicht akzeptiert — bitte in Vercel prüfen." };
    }
    return { error: `Modell-Liste nicht abrufbar (Fehler ${res.status}).` };
  }
  const json = (await res.json()) as {
    models?: Array<{ name?: string; supportedGenerationMethods?: string[] }>;
  };
  const usable = (json.models ?? [])
    .filter((m) => (m.supportedGenerationMethods ?? []).includes("generateContent"))
    .map((m) => (m.name ?? "").replace(/^models\//, ""))
    .filter(Boolean);
  const pick = (re: RegExp) => usable.find((m) => re.test(m));
  const model =
    pick(/2\.5-flash-lite/) ||
    pick(/flash-lite/) ||
    pick(/2\.5-flash(?!-lite)/) ||
    pick(/flash/) ||
    usable[0];
  console.error(`[gemini] verfügbare Modelle (${usable.length}): ${usable.slice(0, 30).join(" | ")}`);
  console.error(`[gemini] gewählt: ${model ?? "(keins)"}`);
  if (!model) {
    return { error: "Für diesen Gemini-Schlüssel ist kein passendes Modell verfügbar." };
  }
  cachedModel = model;
  return { model };
}

/** Fertige, ins Fahrzeug übernehmbare Felder — alles editierbar, nichts blind vertrauen. */
export type VehicleExtract = {
  plate: string;
  model: string;
  vin: string;
  year: string;
  first_registration: string; // YYYY-MM-DD oder ""
  fuel: string;
  engine: string;
  hsn: string;
  tsn: string;
};

type Raw = {
  kennzeichen?: string;
  marke?: string;
  typ?: string;
  fin?: string;
  erstzulassung?: string;
  kraftstoff?: string;
  hubraum_ccm?: string;
  leistung_kw?: string;
  hsn?: string;
  tsn?: string;
};

const FUEL_MAP: Record<string, string> = {
  benzin: "Benzin",
  diesel: "Diesel",
  elektro: "Elektro",
  hybrid: "Hybrid",
  "benzin/elektro": "Hybrid",
  erdgas: "Erdgas (CNG)",
  autogas: "Autogas (LPG)",
  wasserstoff: "Wasserstoff",
};

function tidyFuel(raw: string): string {
  const k = raw.trim().toLowerCase();
  if (!k) return "";
  if (k.includes("plug")) return "Plug-in-Hybrid";
  if (k.includes("hybrid")) return "Hybrid";
  return FUEL_MAP[k] ?? raw.trim();
}

/** „12.03.2019" | „2019" → { iso, year } */
function parseDate(raw: string): { iso: string; year: string } {
  const s = (raw || "").trim();
  const dmy = s.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return { iso: `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`, year: y };
  }
  const y = s.match(/\b(19|20)\d{2}\b/);
  return y ? { iso: "", year: y[0] } : { iso: "", year: "" };
}

function buildEngine(ccm: string, kw: string): string {
  const parts: string[] = [];
  const cc = parseInt((ccm || "").replace(/[^\d]/g, ""), 10);
  if (Number.isFinite(cc) && cc > 0) {
    parts.push((cc / 1000).toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " l");
  }
  const k = parseInt((kw || "").replace(/[^\d]/g, ""), 10);
  if (Number.isFinite(k) && k > 0) {
    parts.push(`${k} kW (${Math.round(k / 0.7355)} PS)`);
  }
  return parts.join(" · ");
}

function mapRaw(raw: Raw): VehicleExtract {
  const date = parseDate(raw.erstzulassung ?? "");
  const model = [raw.marke, raw.typ].map((x) => (x ?? "").trim()).filter(Boolean).join(" ");
  return {
    plate: (raw.kennzeichen ?? "").toUpperCase().replace(/\s+/g, " ").trim(),
    model,
    vin: (raw.fin ?? "").toUpperCase().replace(/[^A-Z0-9]/g, ""),
    year: date.year,
    first_registration: date.iso,
    fuel: tidyFuel(raw.kraftstoff ?? ""),
    engine: buildEngine(raw.hubraum_ccm ?? "", raw.leistung_kw ?? ""),
    hsn: (raw.hsn ?? "").trim(),
    tsn: (raw.tsn ?? "").trim(),
  };
}

const PROMPT = `Du bekommst das Foto eines deutschen Fahrzeugscheins (Zulassungsbescheinigung Teil I).
Lies die folgenden Felder so genau wie möglich aus und gib sie als JSON zurück.
Wenn ein Feld nicht sicher lesbar oder nicht vorhanden ist, gib einen leeren String "" zurück — niemals raten.

- kennzeichen: amtliches Kennzeichen (Feld oben)
- marke: Hersteller/Marke (Feld D.1, z.B. VOLKSWAGEN)
- typ: Handelsbezeichnung/Typ (Feld D.3, z.B. GOLF)
- fin: Fahrzeug-Identifizierungsnummer / FIN (Feld E, 17 Zeichen)
- erstzulassung: Datum der Erstzulassung (Feld B, Format TT.MM.JJJJ)
- kraftstoff: Kraftstoff/Energiequelle (Feld P.3, z.B. DIESEL)
- hubraum_ccm: Hubraum in cm³ (Feld P.1, nur Zahl)
- leistung_kw: Nennleistung in kW (Feld P.2, nur Zahl)
- hsn: Herstellerschlüsselnummer (Feld 2.1, 4 Ziffern)
- tsn: Typschlüsselnummer (Feld 2.2)`;

const SCHEMA = {
  type: "OBJECT",
  properties: {
    kennzeichen: { type: "STRING" },
    marke: { type: "STRING" },
    typ: { type: "STRING" },
    fin: { type: "STRING" },
    erstzulassung: { type: "STRING" },
    kraftstoff: { type: "STRING" },
    hubraum_ccm: { type: "STRING" },
    leistung_kw: { type: "STRING" },
    hsn: { type: "STRING" },
    tsn: { type: "STRING" },
  },
} as const;

export async function extractVehicleFromImage(
  base64: string,
  mimeType: string
): Promise<{ data?: VehicleExtract; error?: string }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return {
      error:
        "Die Foto-Erkennung ist noch nicht eingerichtet. In Vercel die Umgebungsvariable GEMINI_API_KEY hinterlegen, dann funktioniert der Fahrzeugschein-Scan.",
    };
  }

  const resolved = await resolveModel(key);
  if (resolved.error || !resolved.model) {
    return { error: resolved.error ?? "Für diesen Gemini-Schlüssel ist kein Modell verfügbar." };
  }

  let res: Response;
  try {
    res = await fetch(`${API}/models/${resolved.model}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PROMPT },
              { inline_data: { mime_type: mimeType, data: base64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
          responseSchema: SCHEMA,
        },
      }),
    });
  } catch {
    return { error: "Keine Verbindung zur Foto-Erkennung — bitte erneut versuchen." };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[gemini] generateContent ${res.status} · Modell ${resolved.model} · ${body.slice(0, 500)}`);
    // Gemerktes Modell wird doch abgelehnt → Cache leeren, damit der nächste Versuch neu wählt
    if (res.status === 404) cachedModel = null;
    if (res.status === 400 || res.status === 403) {
      return { error: "Der Gemini-Schlüssel wird nicht akzeptiert — bitte in Vercel prüfen." };
    }
    return { error: `Foto-Erkennung fehlgeschlagen (Fehler ${res.status}).` };
  }

  let text: string | undefined;
  try {
    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch {
    return { error: "Antwort der Foto-Erkennung konnte nicht gelesen werden." };
  }
  if (!text) {
    return { error: "Der Fahrzeugschein konnte nicht gelesen werden — bitte schärferes Foto." };
  }

  try {
    const raw = JSON.parse(text) as Raw;
    return { data: mapRaw(raw) };
  } catch {
    return { error: "Der Fahrzeugschein konnte nicht gelesen werden — bitte schärferes Foto." };
  }
}
