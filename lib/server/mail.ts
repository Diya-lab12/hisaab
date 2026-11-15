import nodemailer from "nodemailer";
import { emailMissing } from "./env";

export type MailAttachment = { filename: string; contentBase64: string; contentType?: string };
export type MailInput = { to: string; subject: string; text: string; replyTo?: string; attachments?: MailAttachment[] };

/**
 * Sends an email through the configured SMTP account (for example a Gmail app password).
 * If SMTP isn't set up, it throws "not_configured": there is no silent fallback.
 * MAIL_TEST_TO: when set, EVERY email goes to that address instead, with the real recipient in the subject.
 * Use it for testing; never set it in production.
 */
export async function sendMail(m: MailInput): Promise<{ sent: true; accepted: number; test: boolean }> {
  const missing = emailMissing();
  if (missing.length) {
    console.error(`Email not sent: missing ${missing.join(", ")}`);
    throw new Error("not_configured");
  }
  const testTo = process.env.MAIL_TEST_TO?.trim();
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || `Claimatic <${process.env.SMTP_USER}>`,
      to: testTo || m.to,
      subject: testTo ? `[TEST, would go to ${m.to}] ${m.subject}` : m.subject,
      text: m.text,
      replyTo: m.replyTo,
      attachments: (m.attachments ?? []).map((a) => ({ filename: a.filename, content: Buffer.from(a.contentBase64, "base64"), contentType: a.contentType })),
    });
    return { sent: true, accepted: info.accepted?.length ?? 0, test: Boolean(testTo) };
  } catch (e) {
    const err = e as { code?: string; responseCode?: number };
    console.error(`Email failed: code=${err.code ?? "unknown"} status=${err.responseCode ?? "n/a"}`);
    throw new Error("send_failed");
  }
}
