import { PDFDocument, PDFFont, PDFImage, PDFPage, StandardFonts, degrees, rgb } from "pdf-lib";
import type { Customer, Doc, Settings, Vehicle } from "./types";
import { REMINDER_TITLE } from "./format";
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

/** Logo laden (falls hinterlegt) — bei Fehlern einfach ohne Logo weitermachen */
async function loadLogo(pdf: PDFDocument, settings: Settings): Promise<PDFImage | null> {
  if (!settings.logo_url) return null;
  try {
    const res = await fetch(settings.logo_url, {
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    // Dateityp anhand der Signatur erkennen — Endungen lügen manchmal
    const isPng =
      bytes.length > 3 &&
      bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    const isJpg = bytes.length > 2 && bytes[0] === 0xff && bytes[1] === 0xd8;
    if (isPng) return await pdf.embedPng(bytes);
    if (isJpg) return await pdf.embedJpg(bytes);
    return null;
  } catch {
    return null;
  }
}

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

  const logoImg = await loadLogo(pdf, settings);

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

  // Bricht Text wortweise auf mehrere Zeilen um (überlange Wörter werden hart getrennt)
  const wrapText = (t: string, maxWidth: number, size: number, f: PDFFont = font): string[] => {
    const words = safe(t).split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const probe = line ? `${line} ${w}` : w;
      if (f.widthOfTextAtSize(probe, size) <= maxWidth) {
        line = probe;
        continue;
      }
      if (line) lines.push(line);
      let rest = w;
      while (f.widthOfTextAtSize(rest, size) > maxWidth && rest.length > 1) {
        let cut = rest.length - 1;
        while (cut > 1 && f.widthOfTextAtSize(rest.slice(0, cut), size) > maxWidth) cut--;
        lines.push(rest.slice(0, cut));
        rest = rest.slice(cut);
      }
      line = rest;
    }
    if (line) lines.push(line);
    return lines.length ? lines : ["—"];
  };

  // ---- Kopf: Logo bzw. Werkstattname links, Kontakt rechts ----
  if (logoImg) {
    const maxW = 325;
    const maxH = 104;
    const scale = Math.min(maxW / logoImg.width, maxH / logoImg.height, 1);
    page.drawImage(logoImg, {
      x: M_LEFT,
      y: 812 - logoImg.height * scale,
      width: logoImg.width * scale,
      height: logoImg.height * scale,
    });
  } else {
    text(settings.name, M_LEFT, 785, 16, bold);
    text("KFZ-Werkstatt", M_LEFT, 770, 9, font, GRAY);
  }

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
    text(senderParts.join(" · "), M_LEFT, 698, 7.5, font, GRAY);
    page.drawLine({
      start: { x: M_LEFT, y: 694 },
      end: { x: M_LEFT + 200, y: 694 },
      thickness: 0.5,
      color: LIGHT_LINE,
    });
  }

  let ry = 678;
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
  let my = 678;
  for (const [label, value] of metaRows) {
    text(label, 380, my, 9, font, GRAY);
    rightText(value, M_RIGHT, my, 9, bold);
    my -= 15;
  }

  // ---- Titel ----
  text(`${noun} ${doc.number}`, M_LEFT, 596, 15, bold);

  // ---- Storno-Kennzeichnung ----
  if (doc.status === "cancelled") {
    page.drawText("STORNIERT", {
      x: 115,
      y: 330,
      size: 92,
      font: bold,
      color: rgb(0.82, 0.21, 0.17),
      opacity: 0.14,
      rotate: degrees(30),
    });
  }

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
  const DESC_W = COL_QTY_R - COL_DESC - 40;
  const DESC_LINE_H = 12;
  items.forEach((it, i) => {
    const allLines = wrapText(it.desc || "—", DESC_W, 9.5);
    const lines = allLines.slice(0, 10);
    if (allLines.length > 10) {
      lines[9] = truncate(lines[9] + " …", DESC_W, 9.5);
    }
    const rowH = 20 + (lines.length - 1) * DESC_LINE_H;
    if (y - (rowH - 20) < 170) {
      page = pdf.addPage(A4);
      y = 780;
      drawTableHeader(y, page);
      y -= 24;
    }
    text(String(i + 1), COL_POS + 4, y, 9.5);
    lines.forEach((ln, j) => text(ln, COL_DESC, y - j * DESC_LINE_H, 9.5));
    rightText(qtyPdf(it.qty), COL_QTY_R, y, 9.5);
    text(ITEM_UNIT_PDF[it.type] ?? "", COL_UNIT, y, 9.5, font, GRAY);
    rightText(euroPdf(it.price), COL_PRICE_R, y, 9.5);
    rightText(euroPdf(lineTotal(it)), COL_TOTAL_R, y, 9.5, bold);
    const sepY = y - (rowH - 20) - 6;
    page.drawLine({
      start: { x: M_LEFT, y: sepY },
      end: { x: M_RIGHT, y: sepY },
      thickness: 0.5,
      color: LIGHT_LINE,
    });
    y -= rowH;
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
  if (doc.status === "cancelled") {
    notes.push(
      `STORNIERT am ${datePdf(doc.cancelled_at?.slice(0, 10))} — dieser Beleg ist gegenstandslos.`
    );
  }
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

// ---------------------------------------------------------------------------
// Mahnschreiben (Zahlungserinnerung / 1. Mahnung / 2. Mahnung)
// ---------------------------------------------------------------------------

const REMINDER_BODY: Record<number, string> = {
  1: "sicherlich ist es Ihrer Aufmerksamkeit entgangen, dass die unten aufgeführte Rechnung noch offen ist. Wir bitten Sie, den Betrag bis zum {FRIST} auf das unten angegebene Konto zu überweisen.",
  2: "auf unsere Zahlungserinnerung haben wir leider noch keinen Zahlungseingang feststellen können. Wir bitten Sie nunmehr dringend, den offenen Betrag bis zum {FRIST} zu begleichen.",
  3: "trotz Zahlungserinnerung und 1. Mahnung ist die unten aufgeführte Rechnung weiterhin offen. Wir fordern Sie letztmalig auf, den Betrag bis zum {FRIST} zu begleichen. Andernfalls behalten wir uns weitere Schritte vor.",
};

export async function buildReminderPdf({
  doc,
  customer,
  settings,
}: {
  doc: Doc;
  customer: Customer;
  settings: Settings;
}): Promise<Uint8Array> {
  const level = Math.min(Math.max(doc.reminder_level, 1), 3);
  const title = REMINDER_TITLE[level];
  const remindedDate = (doc.reminded_at ?? new Date().toISOString()).slice(0, 10);
  const deadline = addDaysISO(remindedDate, level === 1 ? 10 : 7);

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  pdf.setTitle(`${title} ${doc.number}`);
  pdf.setAuthor(settings.name);

  const logoImg = await loadLogo(pdf, settings);
  const page = pdf.addPage(A4);

  const text = (t: string, x: number, y: number, size: number, f: PDFFont = font, color = DARK) =>
    page.drawText(safe(t), { x, y, size, font: f, color });
  const rightText = (t: string, xRight: number, y: number, size: number, f: PDFFont = font, color = DARK) => {
    const w = f.widthOfTextAtSize(safe(t), size);
    page.drawText(safe(t), { x: xRight - w, y, size, font: f, color });
  };
  const wrap = (t: string, maxWidth: number, size: number, f: PDFFont = font): string[] => {
    const words = safe(t).split(" ");
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const probe = line ? `${line} ${w}` : w;
      if (f.widthOfTextAtSize(probe, size) > maxWidth && line) {
        lines.push(line);
        line = w;
      } else {
        line = probe;
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  // Kopf (wie Rechnung)
  if (logoImg) {
    const scale = Math.min(325 / logoImg.width, 104 / logoImg.height, 1);
    page.drawImage(logoImg, {
      x: M_LEFT,
      y: 812 - logoImg.height * scale,
      width: logoImg.width * scale,
      height: logoImg.height * scale,
    });
  } else {
    text(settings.name, M_LEFT, 785, 16, bold);
    text("KFZ-Werkstatt", M_LEFT, 770, 9, font, GRAY);
  }
  const headRight: string[] = [];
  if (settings.street) headRight.push(settings.street);
  if (settings.zip || settings.city) headRight.push(`${settings.zip} ${settings.city}`.trim());
  if (settings.phone) headRight.push(`Telefon ${settings.phone}`);
  if (settings.email) headRight.push(settings.email);
  headRight.forEach((line, i) => rightText(line, M_RIGHT, 790 - i * 11, 8.5, font, GRAY));

  const senderParts = [settings.name, settings.street, `${settings.zip} ${settings.city}`.trim()]
    .filter((p) => p && p.trim());
  if (senderParts.length > 1) {
    text(senderParts.join(" · "), M_LEFT, 698, 7.5, font, GRAY);
    page.drawLine({
      start: { x: M_LEFT, y: 694 },
      end: { x: M_LEFT + 200, y: 694 },
      thickness: 0.5,
      color: LIGHT_LINE,
    });
  }

  let ry = 678;
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

  // Meta rechts
  const metaRows: Array<[string, string]> = [
    ["Datum", datePdf(remindedDate)],
    ["Rechnungs-Nr.", doc.number],
    ["Zahlbar bis", datePdf(deadline)],
  ];
  let my = 678;
  for (const [label, value] of metaRows) {
    text(label, 380, my, 9, font, GRAY);
    rightText(value, M_RIGHT, my, 9, bold);
    my -= 15;
  }

  // Titel + Anschreiben
  text(title, M_LEFT, 596, 15, bold);

  let y = 570;
  const anrede = customer.company
    ? "Sehr geehrte Damen und Herren,"
    : `Guten Tag ${customer.name},`;
  text(anrede, M_LEFT, y, 10);
  y -= 20;

  const body = REMINDER_BODY[level].replace("{FRIST}", datePdf(deadline));
  for (const line of wrap(body, M_RIGHT - M_LEFT, 10)) {
    text(line, M_LEFT, y, 10);
    y -= 15;
  }
  y -= 4;
  for (const line of wrap(
    "Sollten Sie den Betrag zwischenzeitlich bereits überwiesen haben, betrachten Sie dieses Schreiben bitte als gegenstandslos.",
    M_RIGHT - M_LEFT,
    10
  )) {
    text(line, M_LEFT, y, 10);
    y -= 15;
  }

  // Rechnungs-Bezugskasten
  y -= 14;
  page.drawRectangle({
    x: M_LEFT,
    y: y - 58,
    width: M_RIGHT - M_LEFT,
    height: 70,
    color: BOX_BG,
  });
  text("Rechnung", M_LEFT + 14, y - 4, 8.5, bold, GRAY);
  text(`${doc.number} vom ${datePdf(doc.issue_date)}`, M_LEFT + 14, y - 19, 10.5, bold);
  text(
    `Ursprünglich zahlbar bis ${datePdf(doc.due_date)}`,
    M_LEFT + 14,
    y - 35,
    9,
    font,
    GRAY
  );
  rightText("Offener Betrag", M_RIGHT - 14, y - 4, 8.5, bold, GRAY);
  rightText(euroPdf(Number(doc.gross_total)), M_RIGHT - 14, y - 26, 15, bold);
  y -= 84;

  text("Mit freundlichen Grüßen", M_LEFT, y, 10);
  y -= 15;
  text(settings.owner_name || settings.name, M_LEFT, y, 10);

  // Fußzeile (wie Rechnung)
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
