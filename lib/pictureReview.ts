import { updateEvidence, type EvidenceImage } from "./evidence";
import { readText } from "./ocr";
import { checkPicture, type CaseContext } from "./pictureCheck";

/** Reads the picture on this device and records what it found. Never sends the picture anywhere. */
export async function reviewPicture(img: EvidenceImage, ctx: CaseContext) {
  updateEvidence(img.id, { review: { state: "reading" } });
  try {
    const text = await readText(img.dataUrl);
    updateEvidence(img.id, { review: { state: "done", check: checkPicture(text, img.slot, ctx) } });
  } catch {
    updateEvidence(img.id, { review: { state: "failed" } });
  }
}

/** Sends ONE picture to the AI, only when the person has asked for it and confirmed. */
export async function askAi(img: EvidenceImage, info: { slotLabel: string; purpose: string; issueLabel: string }) {
  updateEvidence(img.id, { ai: { state: "asking" } });
  try {
    const res = await fetch("/api/describe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: img.dataUrl, ...info }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "failed");
    updateEvidence(img.id, { ai: { state: "done", description: data.description, matches: data.matches, reason: data.reason } });
  } catch (e) {
    updateEvidence(img.id, { ai: { state: "failed", message: e instanceof Error && e.message !== "failed" ? e.message : "The AI check didn't work this time. Your picture is still added." } });
  }
}
