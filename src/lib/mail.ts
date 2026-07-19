import nodemailer from "nodemailer";

// Versand von Belegen (Angebot/Rechnung/Mahnung) als PDF-Anhang über den
// eigenen Plesk-Mailserver (SMTP). Zugangsdaten liegen als Umgebungsvariablen
// in Vercel — nie im Code:
//   SMTP_HOST   z. B. wilhelmmeister.com   (Name muss zum TLS-Zertifikat passen)
//   SMTP_PORT   587 (STARTTLS) oder 465 (direktes TLS)
//   SMTP_USER   noreply@pkwdesk.de
//   SMTP_PASS   Postfach-Passwort
//   MAIL_FROM   Absender-Adresse (optional, Standard: noreply@pkwdesk.de)
// Ohne diese Angaben meldet die App freundlich „noch nicht eingerichtet".

export function mailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/** Absender-Adresse für ausgehende Belege (ohne Anzeigename). */
export function mailFrom(): string {
  return process.env.MAIL_FROM || "noreply@pkwdesk.de";
}

function buildTransport() {
  const port = Number(process.env.SMTP_PORT || "587");
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465, // 465 = direktes TLS, 587 = STARTTLS
    requireTLS: port !== 465, // auf 587 die Verschlüsselung erzwingen
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
    // In der Serverless-Umgebung darf ein hängender Mailserver die Aktion nicht ewig blockieren.
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
}

export async function sendDocumentMail({
  to,
  replyTo,
  subject,
  text,
  pdf,
  filename,
  fromName,
}: {
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  pdf: Uint8Array;
  filename: string;
  /** Anzeigename des Absenders — hier der Werkstattname, damit der Kunde die Werkstatt sieht, nicht „PKWdesk". */
  fromName?: string;
}): Promise<{ ok?: true; error?: string }> {
  if (!mailConfigured()) {
    return {
      error:
        "E-Mail-Versand ist noch nicht eingerichtet. In Vercel die SMTP-Zugangsdaten (SMTP_HOST, SMTP_USER, SMTP_PASS) hinterlegen, dann funktioniert dieser Knopf.",
    };
  }

  const address = mailFrom();
  try {
    await buildTransport().sendMail({
      from: fromName ? { name: fromName, address } : address,
      to,
      replyTo,
      subject,
      text,
      attachments: [{ filename, content: Buffer.from(pdf) }],
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unbekannter Fehler";
    return { error: `Versand fehlgeschlagen: ${msg}` };
  }
}
