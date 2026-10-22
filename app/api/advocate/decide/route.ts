import { ADVOCATE } from "@/lib/advocate";
import { isAdvocate } from "@/lib/server/auth";
import { trackingReady } from "@/lib/server/env";
import { json, str } from "@/lib/server/http";
import { newPayRef, quote, rupees, upiAccount } from "@/lib/pricing";
import { sendMail } from "@/lib/server/mail";
import { getSubmission, putSubmission, type SubmissionStatus } from "@/lib/server/store";

export const maxDuration = 60;

const MAX_PDF_B64 = 3_400_000;
const NEXT: Record<string, { to: SubmissionStatus; from: SubmissionStatus[] }> = {
  approve: { to: "approved", from: ["submitted", "quoted", "declined"] },
  sent: { to: "sent", from: ["submitted", "quoted", "approved"] },
  decline: { to: "declined", from: ["submitted", "quoted", "approved"] },
  quote: { to: "quoted", from: ["submitted", "declined"] },
};
// Recording that the money arrived. It changes the payment, not the status.
const PAID = "paid";

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
  if (action === PAID) {
    const s = await getSubmission(str(b.id, 40));
    if (!s) return json({ error: "Not found." }, 404);
    if (!s.payment) return json({ error: "This request has no payment." }, 400);
    s.payment.verified = true;
    s.updatedAt = new Date().toISOString();
    s.history = [...s.history, { at: s.updatedAt, text: "Payment received." }];
    await putSubmission(s);
    return json({ ok: true, status: s.status });
  }
  const rule = NEXT[action];
  if (!rule) return json({ error: "Unknown action." }, 400);
  const amount = Math.round(Number(b.amount));
  const sub = await getSubmission(str(b.id, 40));
  if (!sub) return json({ error: "Not found." }, 404);
  if (action === "quote") {
    if (!upiAccount()) return json({ error: "Payments are switched off, so there is no fee to ask for." }, 400);
    if (!Number.isFinite(amount) || amount < 0 || amount > 200_000) return json({ error: "Enter the fee in rupees. Use 0 to waive it." }, 400);
  }
  if ((action === "approve" || action === "sent") && upiAccount() && !sub.payment) return json({ error: "Set the fee for this case first (use \"Take the case and ask for ...\", or waive the fee)." }, 409);
  if ((action === "approve" || action === "sent") && sub.payment && !sub.payment.verified) return json({ error: "Check your UPI app for the payment first, then press \"Payment received\"." }, 409);
  if (!rule.from.includes(sub.status)) return json({ error: `This request is already ${sub.status}.` }, 409);

  const note = str(b.note, 1000).trim();
  if (action === "decline" && !note) return json({ error: "Add a short note so the client knows what to change." }, 400);
  const pdf = str(b.signedPdf, MAX_PDF_B64 + 1);
  if (pdf.length > MAX_PDF_B64) return json({ error: "That PDF is too large (limit about 2.5 MB)." }, 400);

  const now = new Date().toISOString();
  if (action === "quote") {
    const q = quote(Number(sub.amount) || 0, sub.addons ?? []);
    if (amount === 0) {
      sub.payment = { ref: "WAIVED", amount: 0, items: q.items, utr: "", verified: true, requestedAt: now };
    } else {
      sub.payment = { ref: newPayRef(), amount, items: q.items, utr: "", verified: false, requestedAt: now };
    }
  }
  const line =
    action === "quote" ? (amount === 0 ? "The advocate can take your case and has waived the fee." : `The advocate can take your case. The fee is ${rupees(amount)}. Pay it by UPI to go ahead.`)
    : action === "approve" ? "The advocate approved and signed your notice."
    : action === "sent" ? "The advocate sent your notice to the company."
    : "The advocate asked for changes.";
  // A waived fee needs no payment step, so the case stays in review until the advocate approves it.
  sub.status = action === "quote" && amount === 0 ? "submitted" : rule.to;
  sub.updatedAt = now;
  sub.advocateNote = note;
  sub.history = [...sub.history, { at: now, text: note ? `${line} Note: ${note}` : line }];
  await putSubmission(sub);

  const subject =
    action === "quote" ? (amount === 0 ? `The advocate can take your case (ref ${sub.id})` : `Next step: pay the fee for your notice (ref ${sub.id})`)
    : action === "approve" ? `Your notice was approved (ref ${sub.id})`
    : action === "sent" ? `Your notice was sent to the company (ref ${sub.id})`
    : `The advocate asked for changes (ref ${sub.id})`;
  const body =
    action === "quote"
      ? (amount === 0
          ? `${ADVOCATE.name}, Advocate, has read your case about ${sub.company.brand} and can take it. She has waived the fee.`
          : `${ADVOCATE.name}, Advocate, has read your case about ${sub.company.brand} and can take it.\n\nThe fee for this case is ${rupees(amount)}${sub.payment!.items.length ? ` (it includes: ${sub.payment!.items.map((i) => i.label.toLowerCase()).join(", ")})` : ""}.\n\nOpen your Hisaab case in the same browser you used to send it, pay by UPI, and enter the transaction ID. After she sees the payment she will sign the notice and send it to the company. If she can't go ahead, you get a full refund.`)
    : action === "approve"
      ? `${ADVOCATE.name}, Advocate (${ADVOCATE.council}, Enrolment No. ${ADVOCATE.enrolment}) has reviewed and approved your notice about ${sub.company.brand}.${pdf ? " The signed notice is attached." : ""}`
      : action === "sent"
        ? `${ADVOCATE.name}, Advocate, has sent your notice about ${sub.company.brand} to the company.${pdf ? " A copy is attached." : ""} The notice asks for a response within 15 days.`
        : `${ADVOCATE.name}, Advocate, reviewed your notice about ${sub.company.brand} and needs changes before it can go out.${sub.payment?.utr ? " If you already paid, she will refund you in full if the case can't go ahead." : ""}`;
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
