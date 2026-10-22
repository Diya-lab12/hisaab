import { useSyncExternalStore } from "react";

// Evidence pictures live ONLY in this browser tab's memory. They are never uploaded,
// stored on a server, saved to disk by Hisaab, or sent to the AI.

export type EvidenceImage = { id: string; name: string; dataUrl: string; width: number; height: number };

export const MAX_IMAGES = 8;
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_SIDE = 1600;

const EMPTY: EvidenceImage[] = [];
let items: EvidenceImage[] = EMPTY;
const listeners = new Set<() => void>();

function emit(next: EvidenceImage[]) {
  items = next;
  listeners.forEach((l) => l());
}

export function useEvidence(): EvidenceImage[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => items,
    () => EMPTY,
  );
}

export function removeEvidence(id: string) {
  emit(items.filter((i) => i.id !== id));
}

export function clearEvidence() {
  emit(EMPTY);
}

/**
 * Re-draws the picture onto a canvas and saves it as a smaller JPEG. This also drops hidden
 * metadata such as the GPS location and camera details that phone photos carry.
 */
async function cleanImage(file: File): Promise<EvidenceImage> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("unreadable"));
      el.src = url;
    });
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("unreadable");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return {
      id: Math.random().toString(36).slice(2),
      name: file.name || "picture",
      dataUrl: canvas.toDataURL("image/jpeg", 0.85),
      width,
      height,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Adds pictures and returns a list of plain-language problems, if any. */
export async function addEvidence(files: File[]): Promise<string[]> {
  const problems: string[] = [];
  const added: EvidenceImage[] = [];
  for (const file of files) {
    if (items.length + added.length >= MAX_IMAGES) {
      problems.push(`You can add up to ${MAX_IMAGES} pictures. The rest were skipped.`);
      break;
    }
    if (!file.type.startsWith("image/")) {
      problems.push(`${file.name || "A file"} is not a picture. Add JPG or PNG images (screenshots are fine).`);
      continue;
    }
    if (file.size > MAX_FILE_BYTES) {
      problems.push(`${file.name} is too large (over 15 MB). Try a smaller screenshot.`);
      continue;
    }
    try {
      added.push(await cleanImage(file));
    } catch {
      problems.push(`${file.name || "A picture"} couldn't be read. Try saving it as JPG or PNG.`);
    }
  }
  if (added.length) emit([...items, ...added]);
  return problems;
}
