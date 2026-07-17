import { NextResponse } from "next/server";
import { cleanVin, decodeVin, isValidVin } from "@/lib/vin";
import { decodeVinStructurally } from "@/lib/gemini";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ vin: string }> }
) {
  const { vin: raw } = await params;
  const vin = cleanVin(raw);

  if (!isValidVin(vin)) {
    return NextResponse.json(
      { error: "Eine VIN hat genau 17 Zeichen (Buchstaben I, O, Q kommen nicht vor)." },
      { status: 400 }
    );
  }

  try {
    const data = (await decodeVin(vin).catch(() => null)) ?? {
      make: "",
      model: "",
      year: null as number | null,
      fuel: "",
      engine: "",
    };

    // EU-Fahrzeuge stehen nicht vollständig in der US-Datenbank — fehlende
    // Kernfelder werden strukturell aus der FIN selbst ergänzt (Gemini).
    if (!data.make || !data.model || !data.year) {
      const g = await decodeVinStructurally(vin);
      if (g) {
        const marke = (g.marke ?? "").trim();
        let modell = (g.modell ?? "").trim();
        if (marke && modell.toLowerCase().startsWith(marke.toLowerCase())) {
          modell = modell.slice(marke.length).trim(); // „Audi A6" → „A6" (Marke steht separat)
        }
        if (!data.make && marke) data.make = marke;
        if (!data.model && modell) data.model = modell;
        const gy = parseInt(g.baujahr ?? "", 10);
        if (!data.year && Number.isFinite(gy) && gy > 1950 && gy <= new Date().getFullYear() + 1) {
          data.year = gy;
        }
        if (!data.fuel && (g.kraftstoff ?? "").trim()) data.fuel = (g.kraftstoff ?? "").trim();
      }
    }

    if (!data.make && !data.model && !data.year && !data.fuel && !data.engine) {
      return NextResponse.json(
        { error: "Die Fahrzeugdatenbank hat nicht geantwortet — bitte später erneut versuchen." },
        { status: 502 }
      );
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Die Fahrzeugdatenbank ist gerade nicht erreichbar." },
      { status: 502 }
    );
  }
}
