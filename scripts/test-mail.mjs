// Sends one test email through the SMTP settings in .env.local, so you can check the setup works.
// Run: node --env-file=.env.local scripts/test-mail.mjs someone@example.com
import nodemailer from "nodemailer";

const to = process.argv[2];
const missing = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"].filter((k) => !process.env[k]);
if (!to) {
  console.error("Usage: node --env-file=.env.local scripts/test-mail.mjs recipient@example.com");
  process.exit(1);
}
if (missing.length) {
  console.error(`Missing in .env.local: ${missing.join(", ")}`);
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

try {
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || `Hisaab <${process.env.SMTP_USER}>`,
    to,
    subject: "Hisaab: test email",
    text: "This is a test email from Hisaab. If you can read it, the email setup works.",
  });
  console.log("Sent:", info.messageId);
} catch (e) {
  console.error("Failed:", e instanceof Error ? e.message : e);
  process.exit(1);
}
