import { ADVOCATE } from "@/lib/advocate";
import { isAdvocate } from "@/lib/server/auth";
import { trackingReady } from "@/lib/server/env";
import { json, str } from "@/lib/server/http";
import { sendMail } from "@/lib/server/mail";
import { getSubmission, putSubmission, type SubmissionStatus } from "@/lib/server/store";

export const maxDuration = 60;

const MAX_PDF_B64 = 3_400_000;
const NEXT: Record<string, { to: SubmissionStatus; from: SubmissionStatus[] }> = {
  approve: { to: "approved", from: ["submitted", "declined"] },
  sent: { to: "sent", from: ["submitted", "approved"] },
  decline: { to: "declined", from: ["submitted", "approved"] },
};

export async function POST(req: Request) {
  if (!(await isAdvocate())) return json({ error: "Not signed in." }, 401);
  if (!trackingReady().ok) return json({ error: "Storage isn't set up yet." }, 503);
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  const action = str(b.action, 10);
  const rule = NEXT[action];
  if (!rule) return json({ error: "Unknown action." }, 400);
  const sub = await getSubmission(str(b.id, 40));
  if (!sub) return json({ error: "Not found." }, 404);
  if (!rule.from.includes(sub.status)) return json({ error: `This request is already ${sub.status}.` }, 409);

  const note = str(b.note, 1000).trim();
  if (action === "decline" && !note) return json({ error: "Add a short note so the client knows what to change." }, 400);
  const pdf = str(b.signedPdf, MAX_PDF_B64 + 1);
  if (pdf.length > MAX_PDF_B64) return json({ error: "That PDF is too large (limit about 2.5 MB)." }, 400);

  const now = new Date().toISOString();
  const line =
    action === "approve" ? "The advocate approved and signed your notice."
    : action === "sent" ? "The advocate sent your notice to the company."
    : "The advocate asked for changes.";
  sub.status = rule.to;
  sub.updatedAt = now;
  sub.advocateNote = note;
  sub.history = [...sub.history, { at: now, text: note ? `${line} Note: ${note}` : line }];
  await putSubmission(sub);

  const subject =
    action === "approve" ? `Your notice was approved (ref ${sub.id})`
    : action === "sent" ? `Your notice was sent to the company (ref ${sub.id})`
    : `The advocate asked for changes (ref ${sub.id})`;
  const body =
    action === "approve"
      ? `${ADVOCATE.name}, Advocate (${ADVOCATE.council}, Enrolment No. ${ADVOCATE.enrolment}) has reviewed and approved your notice about ${sub.company.brand}.${pdf ? " The signed notice is attached." : ""}`
      : action === "sent"
        ? `${ADVOCATE.name}, Advocate, has sent your notice about ${sub.company.brand} to the company.${pdf ? " A copy is attached." : ""} The notice asks for a response within 15 days.`
        : `${ADVOCATE.name}, Advocate, reviewed your notice about ${sub.company.brand} and needs changes before it can go out.`;
  try {
    await sendMail({
      to: sub.client.email,
      subject,
      text: `Hello ${sub.client.name},\n\n${body}${note ? `\n\nNote from the advocate: ${note}` : ""}\n\nYour Hisaab case has been updated. Open it in the same browser you used to send it.\n\nHisaab provides general information, not legal advice.`,
      attachments: pdf ? [{ filename: `Notice-${sub.id}.pdf`, contentBase64: pdf, contentType: "application/pdf" }] : [],
    });
  } catch {
    return json({ ok: true, status: sub.status, warning: "Updated, but the email to the client could not be sent." });
  }
  return json({ ok: true, status: sub.status });
}
