import { ADVOCATE } from "@/lib/advocate";
import { sendReady, trackingReady } from "@/lib/server/env";
import { EMAIL, json, limited, originOf, str } from "@/lib/server/http";
import { sendMail } from "@/lib/server/mail";
import { deleteSubmission, putSubmission, type Submission } from "@/lib/server/store";
import { hashToken, newRef, newToken } from "@/lib/server/auth";
import { PAYREF, UTR, quote, rupees, upiAccount } from "@/lib/pricing";

export const maxDuration = 60;

const MAX_PDF_B64 = 3_400_000; // about 2.5 MB of PDF

export async function POST(req: Request) {
  const ready = sendReady();
  if (!ready.ok) return json({ error: "not_configured", missing: ready.missing }, 503);
  const tracked = trackingReady().ok; // without storage the email still goes, but nothing can be tracked
  if (limited(req, "submit", 5, 60 * 60 * 1000)) return json({ error: "Too many requests. Please try again in a while." }, 429);

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  const client = (b.client ?? {}) as Record<string, unknown>;
  const company = (b.company ?? {}) as Record<string, unknown>;
  const email = str(client.email, 160).trim();
  const notice = str(b.noticeText, 30_000);
  const noticePdf = str(b.noticePdf, MAX_PDF_B64 + 1);
  const evidencePdf = str(b.evidencePdf, MAX_PDF_B64 + 1);

  if (b.consent !== true) return json({ error: "Please agree to send your details to the advocate." }, 400);
  if (!EMAIL.test(email)) return json({ error: "Enter a valid email so the advocate can reach you." }, 400);
  if (!str(client.name, 100).trim() || !str(client.address, 300).trim()) return json({ error: "Your name and address are needed." }, 400);
  if (!str(company.brand, 100).trim() || !notice.trim()) return json({ error: "The company and the notice are needed." }, 400);
  if (!evidencePdf || evidencePdf.length > MAX_PDF_B64) return json({ error: "Evidence is required, and it must be small enough to send. Try fewer or smaller pictures." }, 400);
  if (noticePdf.length > MAX_PDF_B64) return json({ error: "The notice file is too large." }, 400);

  // When payments are on, the server works out the total itself from the claim amount and the chosen extras.
  let payment: Submission["payment"];
  if (upiAccount()) {
    const p = (b.payment ?? {}) as Record<string, unknown>;
    const ref = str(p.ref, 12).trim();
    const utr = str(p.utr, 12).trim();
    if (!PAYREF.test(ref) || !UTR.test(utr)) return json({ error: "Enter the 12-digit UPI transaction ID from your payment app." }, 400);
    const addons = Array.isArray(p.addons) ? p.addons.filter((x): x is string => typeof x === "string").slice(0, 10) : [];
    const q = quote(Number(b.amount) || 0, addons);
    payment = { ref, utr, total: q.total, fee: q.fee, items: q.items, verified: false };
  }

  const now = new Date().toISOString();
  const id = newRef();
  const token = newToken();
  const sub: Submission = {
    id,
    tokenHash: hashToken(token),
    createdAt: now,
    updatedAt: now,
    status: "submitted",
    client: { name: str(client.name, 100).trim(), email, contact: str(client.contact, 100), address: str(client.address, 300).trim() },
    company: { brand: str(company.brand, 100).trim(), legalName: str(company.legalName, 160), address: str(company.address, 300), cin: str(company.cin, 30), email: str(company.email, 120) },
    caseRef: str(b.caseRef, 60),
    issue: str(b.issue, 40),
    amount: str(b.amount, 20),
    date: str(b.date, 20),
    resolution: str(b.resolution, 200),
    noticeText: notice,
    evidenceCount: Math.max(1, Math.min(20, Number(b.evidenceCount) || 1)),
    advocateNote: "",
    payment,
    history: [{ at: now, text: "Received by the advocate for review." }],
  };

  if (tracked) await putSubmission(sub);
  const dashboard = `${originOf(req)}/advocate`;
  try {
    await sendMail({
      to: ADVOCATE.reviewEmail,
      replyTo: email,
      subject: `${payment?.items.some((i) => i.id === "priority") ? "PRIORITY " : ""}Hisaab review request ${id}: ${sub.company.brand} (₹${Number(sub.amount).toLocaleString("en-IN")})`,
      text: [
        `A client has asked you to review a legal notice.`,
        ``,
        `Reference: ${id}`,
        ...(tracked ? [`Open the approval page: ${dashboard}`] : [`(Status tracking is off, so reply to the client by email: replying goes to ${email}.)`]),
        ``,
        `CLIENT`,
        `Name: ${sub.client.name}`,
        `Email: ${sub.client.email}`,
        `Contact: ${sub.client.contact}`,
        `Address: ${sub.client.address}`,
        ``,
        `COMPANY`,
        `Brand or trade name: ${sub.company.brand}`,
        `Legal name: ${sub.company.legalName || "not provided"}`,
        `Registered office: ${sub.company.address || "not provided"}`,
        `CIN: ${sub.company.cin || "not provided"}`,
        `Company email: ${sub.company.email || "not provided"}`,
        ``,
        ...(payment
          ? [
              `PAYMENT (the client says they paid: check your UPI app before approving)`,
              `Amount to expect: ${rupees(payment.total)}`,
              `Payment note / reference: ${payment.ref}`,
              `UPI transaction ID the client gave: ${payment.utr}`,
              `Review fee: ${rupees(payment.fee)}`,
              ...payment.items.map((i) => `Extra: ${i.label} (${rupees(i.price)})`),
              ``,
            ]
          : []),
        `Amount: ₹${Number(sub.amount).toLocaleString("en-IN")}`,
        `Relevant date: ${isNaN(Date.parse(sub.date)) ? sub.date : new Date(sub.date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`,
        `Client would like: ${sub.resolution || "not stated"}`,
        `Evidence: ${sub.evidenceCount} picture(s), in the attached evidence pack`,
        ``,
        `DRAFT NOTICE`,
        ``,
        notice,
      ].join("\n"),
      attachments: [
        ...(noticePdf ? [{ filename: `Draft-notice-${id}.pdf`, contentBase64: noticePdf, contentType: "application/pdf" }] : []),
        { filename: `Evidence-pack-${id}.pdf`, contentBase64: evidencePdf, contentType: "application/pdf" },
      ],
    });
  } catch {
    if (tracked) await deleteSubmission(id);
    return json({ error: "We couldn't reach the advocate's inbox, so nothing was sent. Please try again." }, 502);
  }

  // A confirmation to the client. If it fails, the request still stands: the advocate has it.
  try {
    await sendMail({
      to: email,
      subject: `Your notice has been sent to the advocate (ref ${id})`,
      text: `Hello ${sub.client.name},\n\nYour draft notice about ${sub.company.brand} has been sent to ${ADVOCATE.name}, Advocate (${ADVOCATE.council}), for review.\n\nReference: ${id}\n${payment ? `Payment: ${rupees(payment.total)}, your note ${payment.ref}. The advocate confirms it when it shows in her account. If she can't take your case, such as a matter outside the consumer law or one that is out of time, you get a full refund.\n` : ""}\nNothing has been sent to the company yet. ${tracked ? "You will get an email when the advocate responds, and the status in your Hisaab case will update." : "The advocate will reply to you by email. Your Hisaab case does not update by itself, so you can record updates there yourself."}\n\nHisaab provides general information, not legal advice.`,
    });
  } catch {
    /* ignore */
  }
  return json({ ok: true, ref: id, token: tracked ? token : "", tracked, status: sub.status, paidTotal: payment?.total ?? 0 });
}
