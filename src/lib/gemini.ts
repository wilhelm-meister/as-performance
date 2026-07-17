// Fahrzeugschein-Erkennung mit Google Gemini 2.5 Flash-Lite (Bild → Felder).
// Der Schlüssel liegt als Umgebungsvariable GEMINI_API_KEY (nur in Vercel/.env.local,
// nie im Code). Ohne Schlüssel meldet die App freundlich „noch nicht eingerichtet".

const API = "https://generativelanguage.googleapis.com/v1beta";

export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

// Modell-IDs verschieben sich (Google schaltet alte für neue Schlüssel ab → 404, wird
// aber trotzdem noch gelistet). Wir holen daher die für DIESEN Schlüssel verfügbaren
// Modelle, sortieren sie (günstiges flash-lite zuerst, gepflegte „…-latest"-Aliase
// bevorzugt) und probieren beim Aufruf der Reihe nach durch, bis eins funktioniert.
// Das erste funktionierende Modell wandert nach vorn (pro Instanz gecacht).
let modelCandidates: string[] | null = null;

// Für Text-Erkennung ungeeignete Modelle (Bild/Ton/Musik/Embedding) + das für neue
// Schlüssel gesperrte gemini-2.5-flash-lite aussortieren.
const UNSUITABLE = /tts|image|audio|speech|lyria|banana|embedding|omni|gemma|2\.5-flash-lite$/;

function scoreModel(m: string): number {
  let s = 0;
  if (/flash-lite/.test(m)) s += 100; // günstigste Klasse zuerst
  else if (/flash/.test(m)) s += 50;
  if (/latest/.test(m)) s += 20; // gepflegte Aliase bevorzugen
  const v = m.match(/gemini-(\d+(?:\.\d+)?)/);
  if (v) s += parseFloat(v[1]); // neuere Version leicht bevorzugen
  return s;
}

async function listCandidates(key: string): Promise<{ models?: string[]; error?: string }> {
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
  const models = (json.models ?? [])
    .filter((m) => (m.supportedGenerationMethods ?? []).includes("generateContent"))
    .map((m) => (m.name ?? "").replace(/^models\//, ""))
    .filter((m) => m && !UNSUITABLE.test(m))
    .sort((a, b) => scoreModel(b) - scoreModel(a));
  if (!models.length) {
    return { error: "Für diesen Gemini-Schlüssel ist kein passendes Modell verfügbar." };
  }
  return { models };
}

/** Halter laut Fahrzeugschein (Feld C) — Vorschlag für einen Kunden. */
export type HolderExtract = {
  name: string;
  street: string;
  zip: string;
  city: string;
};

/** Fertige, ins Fahrzeug übernehmbare Felder — alles editierbar, nichts blind vertrauen. */
export type VehicleExtract = {
  plate: string;
  model: string;
  vin: string;
  year: string;
  first_registration: string; // YYYY-MM-DD oder ""
  fuel: string;
  engine: string;
  motor_code: string;
  hsn: string;
  tsn: string;
  holder: HolderExtract | null;
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
  motorcode?: string;
  hsn?: string;
  tsn?: string;
  halter_name?: string;
  halter_vorname?: string;
  halter_strasse?: string;
  halter_plz?: string;
  halter_ort?: string;
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

function mapHolder(raw: Raw): HolderExtract | null {
  const name = [raw.halter_vorname, raw.halter_name]
    .map((x) => (x ?? "").trim())
    .filter(Boolean)
    .join(" ");
  const street = (raw.halter_strasse ?? "").trim();
  const zip = (raw.halter_plz ?? "").replace(/[^\d]/g, "").trim();
  const city = (raw.halter_ort ?? "").trim();
  if (!name && !street && !city) return null;
  return { name, street, zip, city };
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
    motor_code: (raw.motorcode ?? "").toUpperCase().replace(/\s+/g, "").trim(),
    hsn: (raw.hsn ?? "").trim(),
    tsn: (raw.tsn ?? "").trim(),
    holder: mapHolder(raw),
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
- motorcode: Motorkennbuchstabe(n) / Motorcode, meist in Feld P.5 (Motorkennnummer) oder in Feld 22 (Bemerkungen). Häufig NICHT vorhanden — dann "". Nur den Buchstaben-/Zahlencode, keine ganze Motornummer.
- hsn: Herstellerschlüsselnummer (Feld 2.1, 4 Ziffern)
- tsn: Typschlüsselnummer (Feld 2.2)
- halter_name: Name oder Firmenname des Halters (Feld C.1.1)
- halter_vorname: Vorname des Halters (Feld C.1.2, bei Firmen leer)
- halter_strasse: Straße und Hausnummer des Halters (aus Anschrift Feld C.1.3)
- halter_plz: Postleitzahl des Halters (aus Feld C.1.3, 5 Ziffern)
- halter_ort: Wohnort/Ort des Halters (aus Feld C.1.3)`;

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
    motorcode: { type: "STRING" },
    hsn: { type: "STRING" },
    tsn: { type: "STRING" },
    halter_name: { type: "STRING" },
    halter_vorname: { type: "STRING" },
    halter_strasse: { type: "STRING" },
    halter_plz: { type: "STRING" },
    halter_ort: { type: "STRING" },
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

  if (!modelCandidates) {
    const r = await listCandidates(key);
    if (r.error || !r.models) {
      return { error: r.error ?? "Für diesen Gemini-Schlüssel ist kein Modell verfügbar." };
    }
    modelCandidates = r.models;
    console.error(`[gemini] Kandidaten: ${modelCandidates.join(" | ")}`);
  }

  const requestBody = JSON.stringify({
    contents: [
      { parts: [{ text: PROMPT }, { inline_data: { mime_type: mimeType, data: base64 } }] },
    ],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: SCHEMA,
    },
  });

  // Kandidaten der Reihe nach probieren: 404 = Modell (doch) nicht verfügbar → nächstes.
  let text: string | undefined;
  let lastStatus = 0;
  for (const model of modelCandidates) {
    let res: Response;
    try {
      res = await fetch(`${API}/models/${model}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(30000),
        body: requestBody,
      });
    } catch {
      return { error: "Keine Verbindung zur Foto-Erkennung — bitte erneut versuchen." };
    }

    if (res.ok) {
      modelCandidates = [model, ...modelCandidates.filter((m) => m !== model)];
      try {
        const json = (await res.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      } catch {
        return { error: "Antwort der Foto-Erkennung konnte nicht gelesen werden." };
      }
      break;
    }

    const body = await res.text().catch(() => "");
    console.error(`[gemini] ${model} → ${res.status} · ${body.slice(0, 200)}`);
    lastStatus = res.status;
    if (res.status === 400 || res.status === 403) {
      return { error: "Der Gemini-Schlüssel wird nicht akzeptiert — bitte in Vercel prüfen." };
    }
    if (res.status === 404) continue; // nächstes Modell probieren
    return { error: `Foto-Erkennung fehlgeschlagen (Fehler ${res.status}).` };
  }

  if (!text) {
    return {
      error:
        lastStatus === 404
          ? "Kein passendes Gemini-Modell verfügbar — bitte kurz melden."
          : "Der Fahrzeugschein konnte nicht gelesen werden — bitte schärferes Foto.",
    };
  }

  try {
    const raw = JSON.parse(text) as Raw;
    return { data: mapRaw(raw) };
  } catch {
    return { error: "Der Fahrzeugschein konnte nicht gelesen werden — bitte schärferes Foto." };
  }
}
