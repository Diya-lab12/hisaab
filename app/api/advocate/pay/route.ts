import { ADVOCATE } from "@/lib/advocate";
import { UTR, rupees } from "@/lib/pricing";
import { hashToken } from "@/lib/server/auth";
import { trackingReady } from "@/lib/server/env";
import { json, limited, originOf, str } from "@/lib/server/http";
import { sendMail } from "@/lib/server/mail";
import { getSubmission, putSubmission } from "@/lib/server/store";

/** The client says they paid the fee the advocate asked for, and gives the UPI transaction ID. The advocate still confirms it. */
export async function POST(req: Request) {
  if (!trackingReady().ok) return json({ error: "not_configured" }, 503);
  if (limited(req, "pay", 20, 60 * 60 * 1000)) return json({ error: "Too many requests." }, 429);
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  const sub = await getSubmission(str(b.id, 40));
  const token = str(b.token, 100);
  if (!sub || !token || sub.tokenHash !== hashToken(token)) return json({ error: "Not found." }, 404);
  if (sub.status !== "quoted" || !sub.payment || sub.payment.verified) return json({ error: "There is no payment due on this request." }, 409);
  const utr = str(b.utr, 12).trim();
  if (!UTR.test(utr)) return json({ error: "Enter the 12-digit UPI transaction ID from your payment app." }, 400);

  const now = new Date().toISOString();
  sub.payment.utr = utr;
  sub.updatedAt = now;
  sub.history = [...sub.history, { at: now, text: "You told us you paid. The advocate will confirm it when it shows in her account." }];
  await putSubmission(sub);

  try {
    await sendMail({
      to: ADVOCATE.reviewEmail,
      replyTo: sub.client.email,
      subject: `Payment to check: ${rupees(sub.payment.amount)} for ${sub.id} (${sub.company.brand})`,
      text: `${sub.client.name} says they paid ${rupees(sub.payment.amount)}.\n\nReference: ${sub.id}\nPayment note: ${sub.payment.ref}\nUPI transaction ID: ${utr}\n\nCheck your UPI app, then open ${originOf(req)}/advocate and press "Payment received".`,
    });
  } catch {
    /* the request page still shows it */
  }
  return json({ ok: true });
}
