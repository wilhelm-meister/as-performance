import { Resend } from "resend";

export function mailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function mailFrom(): string {
  return process.env.MAIL_FROM || "AS Performance <onboarding@resend.dev>";
}

export async function sendDocumentMail({
  to,
  replyTo,
  subject,
  text,
  pdf,
  filename,
}: {
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  pdf: Uint8Array;
  filename: string;
}): Promise<{ ok?: true; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return {
      error:
        "E-Mail-Versand ist noch nicht eingerichtet. In Vercel die Umgebungsvariable RESEND_API_KEY hinterlegen, dann funktioniert dieser Knopf.",
    };
  }

  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: mailFrom(),
    to,
    replyTo,
    subject,
    text,
    attachments: [{ filename, content: Buffer.from(pdf) }],
  });

  if (error) {
    return { error: `Versand fehlgeschlagen: ${error.message}` };
  }
  return { ok: true };
}
