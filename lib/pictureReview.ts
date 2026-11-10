import { updateEvidence, type EvidenceImage } from "./evidence";
import { readText } from "./ocr";
import { checkPicture, matchSlots, type CaseContext } from "./pictureCheck";

/** Reads the picture on this device and records what it found. Never sends the picture anywhere. */
export async function reviewPicture(img: EvidenceImage, ctx: CaseContext) {
  updateEvidence(img.id, { review: { state: "reading" } });
  try {
    const text = await readText(img.dataUrl);
    updateEvidence(img.id, { review: { state: "done", check: checkPicture(text, img.slot, ctx), slots: matchSlots(text, ctx.issue ?? "other") } });
  } catch {
    updateEvidence(img.id, { review: { state: "failed" } });
  }
}
