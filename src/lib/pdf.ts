import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import type { Customer, Doc, Settings, Vehicle } from "./types";
import { lineTotal } from "./totals";

// ---------- Text-Sicherheit (Standardfonts können nur WinAnsi-Zeichen) ----------

const CHAR_MAP: Record<string, string> = {
  ı: "i", İ: "I", ş: "s", Ş: "S", ğ: "g", Ğ: "G",
  ć: "c", Ć: "C", č: "c", Č: "C", đ: "d", Đ: "D",
  ł: "l", Ł: "L", ń: "n", Ń: "N", ř: "r", Ř: "R",
  ś: "s", Ś: "S", ż: "z", Ż: "Z", ź: "z", Ź: "Z",
  ě: "e", Ě: "E", ů: "u", Ů: "U", ą: "a", Ą: "A",
  ę: "e", Ę: "E", ț: "t", Ț: "T", ș: "s", Ș: "S",
};

const WINANSI_EXTRA = "€„“”‚‘’–—…•‰™ŒœŠšŽžŸƒ";

function safe(t: string | null | undefined): string {
  return Array.from((t ?? "").normalize("NFC"))
    .map((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      if (code <= 0xff) return ch;
      if (CHAR_MAP[ch]) return CHAR_MAP[ch];
      if (WINANSI_EXTRA.includes(ch)) return ch;
      const base = ch.normalize("NFKD").replace(/[̀-ͯ]/g, "");
      const baseCode = base.codePointAt(0) ?? 0x100;
      if (base && baseCode <= 0xff) return base;
      return "?";
    })
    .join("");
}

function euroPdf(n: number): string {
  const neg = n < 0;
  const [int, dec] = Math.abs(n).toFixed(2).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${neg ? "-" : ""}${grouped},${dec} €`;
}

function qtyPdf(n: number): string {
  return n.toLocaleString("de-DE", { maximumFractionDigits: 2 }).replace(/ /g, " ");
}

function datePdf(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}

function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// ---------- Layout ----------

const A4: [number, number] = [595.28, 841.89];
const M_LEFT = 70;
const M_RIGHT = 525.28; // 595.28 - 70

const DARK = rgb(0.1, 0.11, 0.13);
const GRAY = rgb(0.45, 0.45, 0.48);
const LIGHT_LINE = rgb(0.9, 0.9, 0.92);
const BOX_BG = rgb(0.965, 0.965, 0.972);

const ITEM_UNIT_PDF: Record<string, string> = {
  labor: "Std.",
  part: "Stk.",
  flat: "pausch.",
};

export async function buildDocumentPdf({
  doc,
  customer,
  vehicle,
  settings,
}: {
  doc: Doc;
  customer: Customer;
  vehicle: Vehicle | null;
  settings: Settings;
}): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const noun = doc.type === "quote" ? "Angebot" : "Rechnung";
  pdf.setTitle(`${noun} ${doc.number}`);
  pdf.setAuthor(settings.name);

  let page = pdf.addPage(A4);

  const text = (
    t: string,
    x: number,
    y: number,
    size: number,
    f: PDFFont = font,
    color = DARK,
    pg: PDFPage = page
  ) => pg.drawText(safe(t), { x, y, size, font: f, color });

  const rightText = (
    t: string,
    xRight: number,
    y: number,
    size: number,
    f: PDFFont = font,
    color = DARK,
    pg: PDFPage = page
  ) => {
    const w = f.widthOfTextAtSize(safe(t), size);
    pg.drawText(safe(t), { x: xRight - w, y, size, font: f, color });
  };

  const truncate = (t: string, maxWidth: number, size: number, f: PDFFont = font) => {
    let s = safe(t);
    if (f.widthOfTextAtSize(s, size) <= maxWidth) return s;
    while (s.length > 1 && f.widthOfTextAtSize(s + "…", size) > maxWidth) {
      s = s.slice(0, -1);
    }
    return s + "…";
  };

  // ---- Kopf: Werkstattname links, Kontakt rechts ----
  text(settings.name, M_LEFT, 785, 16, bold);
  text("KFZ-Werkstatt", M_LEFT, 770, 9, font, GRAY);

  const headRight: string[] = [];
  if (settings.street) headRight.push(settings.street);
  if (settings.zip || settings.city) headRight.push(`${settings.zip} ${settings.city}`.trim());
  if (settings.phone) headRight.push(`Telefon ${settings.phone}`);
  if (settings.email) headRight.push(settings.email);
  headRight.forEach((line, i) => rightText(line, M_RIGHT, 790 - i * 11, 8.5, font, GRAY));

  // ---- Absenderzeile + Empfänger ----
  const senderParts = [settings.name, settings.street, `${settings.zip} ${settings.city}`.trim()]
    .filter((p) => p && p.trim());
  if (senderParts.length > 1) {
    text(senderParts.join(" · "), M_LEFT, 712, 7.5, font, GRAY);
    page.drawLine({
      start: { x: M_LEFT, y: 708 },
      end: { x: M_LEFT + 200, y: 708 },
      thickness: 0.5,
      color: LIGHT_LINE,
    });
  }

  let ry = 692;
  const recipient = [
    customer.company,
    customer.name,
    customer.street,
    `${customer.zip} ${customer.city}`.trim(),
  ].filter((l) => l && l.trim());
  for (const line of recipient) {
    text(line, M_LEFT, ry, 10.5);
    ry -= 14;
  }

  // ---- Meta-Block rechts ----
  const metaRows: Array<[string, string]> = [
    [`${noun}s-Nr.`, doc.number],
    ["Datum", datePdf(doc.issue_date)],
  ];
  if (doc.type === "invoice" && doc.due_date) {
    metaRows.push(["Zahlbar bis", datePdf(doc.due_date)]);
  }
  if (doc.type === "quote") {
    metaRows.push([
      "Gültig bis",
      datePdf(addDaysISO(doc.issue_date, settings.quote_validity_days ?? 30)),
    ]);
  }
  if (doc.km != null) {
    metaRows.push(["KM-Stand", doc.km.toLocaleString("de-DE").replace(/ /g, " ") + " km"]);
  }
  let my = 692;
  for (const [label, value] of metaRows) {
    text(label, 380, my, 9, font, GRAY);
    rightText(value, M_RIGHT, my, 9, bold);
    my -= 15;
  }

  // ---- Titel ----
  text(`${noun} ${doc.number}`, M_LEFT, 596, 15, bold);

  // ---- Fahrzeugkasten ----
  let tableTop = 570;
  if (vehicle) {
    page.drawRectangle({
      x: M_LEFT,
      y: 538,
      width: M_RIGHT - M_LEFT,
      height: 38,
      color: BOX_BG,
    });
    const boxWidth = M_RIGHT - M_LEFT - 24;
    text(
      truncate(
        `Fahrzeug: ${vehicle.model || "—"}${vehicle.year ? ` (${vehicle.year})` : ""}    Kennzeichen: ${vehicle.plate}`,
        boxWidth,
        9,
        bold
      ),
      M_LEFT + 12,
      560,
      9,
      bold
    );
    const kmText =
      doc.km != null
        ? doc.km.toLocaleString("de-DE").replace(/ /g, " ") + " km"
        : vehicle.km != null
          ? vehicle.km.toLocaleString("de-DE").replace(/ /g, " ") + " km"
          : "—";
    const detailTail = [vehicle.fuel, vehicle.engine].filter(Boolean).join(" · ");
    text(
      truncate(
        `VIN: ${vehicle.vin || "—"}    KM-Stand: ${kmText}${detailTail ? `    ${detailTail}` : ""}`,
        boxWidth,
        8.5
      ),
      M_LEFT + 12,
      546,
      8.5,
      font,
      GRAY
    );
    tableTop = 518;
  }

  // ---- Positionstabelle ----
  const COL_POS = M_LEFT;
  const COL_DESC = M_LEFT + 28;
  const COL_QTY_R = 370;
  const COL_UNIT = 380;
  const COL_PRICE_R = 452;
  const COL_TOTAL_R = M_RIGHT;

  const drawTableHeader = (y: number, pg: PDFPage) => {
    pg.drawRectangle({
      x: M_LEFT,
      y: y - 5,
      width: M_RIGHT - M_LEFT,
      height: 19,
      color: BOX_BG,
    });
    text("Pos", COL_POS + 4, y, 8, bold, GRAY, pg);
    text("Bezeichnung", COL_DESC, y, 8, bold, GRAY, pg);
    rightText("Menge", COL_QTY_R, y, 8, bold, GRAY, pg);
    text("Einheit", COL_UNIT, y, 8, bold, GRAY, pg);
    rightText("Einzelpreis", COL_PRICE_R, y, 8, bold, GRAY, pg);
    rightText("Gesamt", COL_TOTAL_R, y, 8, bold, GRAY, pg);
  };

  let y = tableTop;
  drawTableHeader(y, page);
  y -= 24;

  const items = doc.items ?? [];
  items.forEach((it, i) => {
    if (y < 170) {
      page = pdf.addPage(A4);
      y = 780;
      drawTableHeader(y, page);
      y -= 24;
    }
    text(String(i + 1), COL_POS + 4, y, 9.5);
    text(truncate(it.desc || "—", COL_QTY_R - COL_DESC - 40, 9.5), COL_DESC, y, 9.5);
    rightText(qtyPdf(it.qty), COL_QTY_R, y, 9.5);
    text(ITEM_UNIT_PDF[it.type] ?? "", COL_UNIT, y, 9.5, font, GRAY);
    rightText(euroPdf(it.price), COL_PRICE_R, y, 9.5);
    rightText(euroPdf(lineTotal(it)), COL_TOTAL_R, y, 9.5, bold);
    page.drawLine({
      start: { x: M_LEFT, y: y - 6 },
      end: { x: M_RIGHT, y: y - 6 },
      thickness: 0.5,
      color: LIGHT_LINE,
    });
    y -= 20;
  });

  if (items.length === 0) {
    text("Keine Positionen.", COL_DESC, y, 9.5, font, GRAY);
    y -= 20;
  }

  // ---- Summen ----
  if (y < 200) {
    page = pdf.addPage(A4);
    y = 760;
  }
  y -= 8;
  const sumLabelX = 360;
  const smallBusiness = Number(doc.vat_rate) === 0;
  if (!smallBusiness) {
    text("Zwischensumme (netto)", sumLabelX, y, 9.5, font, GRAY);
    rightText(euroPdf(Number(doc.net_total)), COL_TOTAL_R, y, 9.5);
    y -= 16;
    text(`zzgl. ${qtyPdf(Number(doc.vat_rate))} % MwSt.`, sumLabelX, y, 9.5, font, GRAY);
    rightText(euroPdf(Number(doc.vat_total)), COL_TOTAL_R, y, 9.5);
    y -= 10;
  }
  page.drawLine({
    start: { x: sumLabelX, y },
    end: { x: M_RIGHT, y },
    thickness: 0.8,
    color: DARK,
  });
  y -= 16;
  text("Gesamtbetrag", sumLabelX, y, 11.5, bold);
  rightText(euroPdf(Number(doc.gross_total)), COL_TOTAL_R, y, 11.5, bold);
  y -= 34;

  // ---- Hinweistexte ----
  const notes: string[] = [];
  if (smallBusiness) {
    notes.push("Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).");
  }
  if (doc.type === "invoice") {
    if (doc.due_date) {
      notes.push(
        `Bitte überweisen Sie den Gesamtbetrag bis zum ${datePdf(doc.due_date)} auf das unten angegebene Konto.`
      );
    }
    notes.push("Leistungsdatum entspricht dem Rechnungsdatum, soweit nicht anders angegeben.");
    notes.push("Vielen Dank für Ihren Auftrag!");
  } else {
    notes.push(
      `Dieses Angebot ist gültig bis ${datePdf(addDaysISO(doc.issue_date, settings.quote_validity_days ?? 30))}.`
    );
    notes.push("Wir freuen uns auf Ihren Auftrag!");
  }
  for (const n of notes) {
    text(n, M_LEFT, y, 9, font, GRAY);
    y -= 13;
  }

  // ---- Fußzeile ----
  page.drawLine({
    start: { x: M_LEFT, y: 95 },
    end: { x: M_RIGHT, y: 95 },
    thickness: 0.5,
    color: LIGHT_LINE,
  });

  const col1 = [
    settings.name,
    settings.owner_name ? `Inhaber: ${settings.owner_name}` : "",
    settings.street,
    `${settings.zip} ${settings.city}`.trim(),
  ].filter(Boolean);
  const col2 = [
    settings.phone ? `Telefon ${settings.phone}` : "",
    settings.email,
    settings.tax_number ? `Steuernummer ${settings.tax_number}` : "",
    settings.vat_id ? `USt-IdNr. ${settings.vat_id}` : "",
  ].filter(Boolean);
  const col3 = [
    settings.bank_name,
    settings.iban ? `IBAN ${settings.iban}` : "",
    settings.bic ? `BIC ${settings.bic}` : "",
  ].filter(Boolean);

  col1.forEach((l, i) => text(l, M_LEFT, 82 - i * 10, 7.5, font, GRAY));
  col2.forEach((l, i) => text(l, 255, 82 - i * 10, 7.5, font, GRAY));
  col3.forEach((l, i) => text(l, 410, 82 - i * 10, 7.5, font, GRAY));

  return pdf.save();
}
