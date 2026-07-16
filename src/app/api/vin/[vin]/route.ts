import { NextResponse } from "next/server";
import { cleanVin, decodeVin, isValidVin } from "@/lib/vin";

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
    const data = await decodeVin(vin);
    if (!data) {
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
