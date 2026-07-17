import { NextResponse } from "next/server";
import { getCustomer, getDoc, getSettings } from "@/lib/data";
import { buildReminderPdf } from "@/lib/pdf";
import { REMINDER_TITLE } from "@/lib/format";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const doc = await getDoc(id);
  if (!doc || doc.type !== "invoice" || doc.reminder_level < 1) {
    return new NextResponse("Keine Mahnung vorhanden", { status: 404 });
  }

  const [settings, customer] = await Promise.all([
    getSettings(),
    getCustomer(doc.customer_id),
  ]);
  if (!settings || !customer) {
    return new NextResponse("Stammdaten nicht gefunden", { status: 404 });
  }

  const bytes = await buildReminderPdf({ doc, customer, settings });
  const title = REMINDER_TITLE[doc.reminder_level].replace(/\.? /g, "-");

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${title}-${doc.number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
