import nodemailer from "nodemailer";
import { promises as fs } from "node:fs";
import path from "node:path";
import { isProd, smtpConfigured } from "./env";

export type MailAttachment = { filename: string; contentBase64: string; contentType?: string };
export type MailInput = { to: string; subject: string; text: string; replyTo?: string; attachments?: MailAttachment[] };

/**
 * Sends an email through the configured SMTP account (for example a Gmail app password).
 * With no SMTP set up on a developer's computer, the email is saved under .outbox instead of being sent.
 */
export async function sendMail(m: MailInput): Promise<{ sent: boolean; outbox?: string }> {
  if (smtpConfigured()) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: process.env.MAIL_FROM || `Hisaab <${process.env.SMTP_USER}>`,
      to: m.to,
      subject: m.subject,
      text: m.text,
      replyTo: m.replyTo,
      attachments: (m.attachments ?? []).map((a) => ({ filename: a.filename, content: Buffer.from(a.contentBase64, "base64"), contentType: a.contentType })),
    });
    return { sent: true };
  }
  if (isProd) throw new Error("not_configured");

  const dir = path.join(process.cwd(), ".outbox");
  await fs.mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const base = `${stamp}-${m.to.replace(/[^a-z0-9]+/gi, "_")}`;
  const files: string[] = [];
  for (const a of m.attachments ?? []) {
    const f = `${base}-${a.filename.replace(/[^a-z0-9._-]+/gi, "_")}`;
    await fs.writeFile(path.join(dir, f), Buffer.from(a.contentBase64, "base64"));
    files.push(f);
  }
  await fs.writeFile(path.join(dir, `${base}.json`), JSON.stringify({ to: m.to, subject: m.subject, text: m.text, replyTo: m.replyTo, attachments: files }, null, 2));
  return { sent: false, outbox: `${base}.json` };
}
