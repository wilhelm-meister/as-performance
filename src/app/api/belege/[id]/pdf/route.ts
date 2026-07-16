import { NextResponse } from "next/server";
import { getCustomer, getDoc, getSettings } from "@/lib/data";
import { buildDocumentPdf } from "@/lib/pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const doc = await getDoc(id);
  if (!doc) return new NextResponse("Beleg nicht gefunden", { status: 404 });

  const [settings, customer] = await Promise.all([
    getSettings(),
    getCustomer(doc.customer_id),
  ]);
  if (!settings || !customer) {
    return new NextResponse("Stammdaten nicht gefunden", { status: 404 });
  }

  const vehicle = customer.vehicles.find((v) => v.id === doc.vehicle_id) ?? null;
  const bytes = await buildDocumentPdf({ doc, customer, vehicle, settings });

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${doc.number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
