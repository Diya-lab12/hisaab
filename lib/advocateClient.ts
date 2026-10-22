import { ADVOCATE } from "./advocate";
import { mutateCase, type CaseRecord, type CaseStatus } from "./cases";
import { evidencePdfBlob, noticePdfBlob } from "./export";
import { parseAmount } from "./checks";
import { resolutionLabel } from "./questions";

type Pic = { name: string; dataUrl: string; width: number; height: number };

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(new Error("read"));
    r.readAsDataURL(blob);
  });
}

const MAX_PDF_BYTES = 2_450_000; // the server accepts about 2.5 MB of PDF per file

/** Builds the evidence pack, shrinking the pictures step by step until it fits in one email. */
async function evidencePack(images: Pic[], company: string): Promise<Blob | null> {
  for (const shrink of [undefined, { side: 1200, quality: 0.7 }, { side: 900, quality: 0.55 }, { side: 700, quality: 0.45 }]) {
    const blob = await evidencePdfBlob(images, company, shrink);
    if (blob.size <= MAX_PDF_BYTES) return blob;
  }
  return null;
}

export type SendResult =
  | { ok: true; ref: string; token: string; tracked: boolean }
  | { ok: false; code: "not_configured" | "too_large" | "error"; message: string };

/** Sends the notice and the evidence pack to the advocate through Hisaab, in one go. */
export async function sendToAdvocate(rec: CaseRecord, v: { email: string; noticeText: string; images: Pic[] }): Promise<SendResult> {
  const pack = await evidencePack(v.images, rec.input.company);
  if (!pack) return { ok: false, code: "too_large", message: "Your pictures are too large to send together. Remove a few, or use smaller screenshots." };
  const notice = await noticePdfBlob(v.noticeText);
  const i = rec.input;
  try {
    const res = await fetch("/api/advocate/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consent: true,
        caseRef: rec.id,
        client: { name: i.name, email: v.email, contact: i.contact, address: i.address },
        company: { brand: i.company, legalName: i.legalName ?? "", address: i.companyAddress ?? "", cin: i.companyCin ?? "", email: i.companyEmail ?? "" },
        issue: i.issueType,
        amount: String(parseAmount(i.amount) || i.amount),
        date: i.incidentDate,
        resolution: resolutionLabel(i.resolution, i.resolutionOther),
        noticeText: v.noticeText,
        evidenceCount: v.images.length,
        noticePdf: await toBase64(notice),
        evidencePdf: await toBase64(pack),
      }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.status === 503 && d.error === "not_configured") return { ok: false, code: "not_configured", message: "Sending straight to the advocate isn't switched on yet." };
    if (!res.ok) return { ok: false, code: "error", message: d.error ?? "Something went wrong. Nothing was sent." };
    return { ok: true, ref: d.ref, token: d.token ?? "", tracked: d.tracked !== false };
  } catch {
    return { ok: false, code: "error", message: "Network problem. Nothing was sent. Please try again." };
  }
}

const LOCAL_STATUS: Record<string, CaseStatus> = { submitted: "review", approved: "approved", sent: "sent", declined: "ready" };

/** Asks the server what the advocate has done and writes anything new into the case. These are real, not self-recorded. */
export async function syncAdvocate(rec: CaseRecord): Promise<"updated" | "same" | "unavailable"> {
  const s = rec.submission;
  if (!s || s.tracked === false || !s.token) return "same";
  try {
    const res = await fetch(`/api/advocate/status?id=${encodeURIComponent(s.ref)}&token=${encodeURIComponent(s.token)}`, { cache: "no-store" });
    if (!res.ok) return "unavailable";
    const d = (await res.json()) as { status: string; advocateNote: string; history: { at: string; text: string }[] };
    let changed = false;
    mutateCase(rec.id, (cur) => {
      const have = new Set(cur.events.map((e) => e.id));
      const events = d.history
        .map((h, i) => ({ id: `adv:${s.ref}:${i}`, at: h.at, kind: "status" as const, text: h.text, byUser: false }))
        .filter((e) => !have.has(e.id));
      const same = cur.submission?.lastStatus === d.status && cur.submission?.note === d.advocateNote;
      if (!events.length && same) return {};
      changed = true;
      const patch: Partial<CaseRecord> = { submission: { ...cur.submission!, lastStatus: d.status, note: d.advocateNote } };
      if (events.length && LOCAL_STATUS[d.status]) patch.status = LOCAL_STATUS[d.status];
      return { patch, events };
    });
    return changed ? "updated" : "same";
  } catch {
    return "unavailable";
  }
}

export const ADVOCATE_LINE = `${ADVOCATE.name}, Advocate · ${ADVOCATE.council} · Enrolment No. ${ADVOCATE.enrolment} · ${ADVOCATE.place}`;
