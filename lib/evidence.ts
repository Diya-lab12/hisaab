import { useSyncExternalStore } from "react";
import type { PictureCheck } from "./pictureCheck";

// Evidence pictures live ONLY in this browser tab's memory. They are never uploaded, never
// written to localStorage or sessionStorage, and never sent to the AI. Reloading or closing the
// tab clears them, so a reopened case asks you to add them again.

export type EvidenceImage = {
  id: string;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
  /** Which case the picture belongs to ("new" while a complaint is still being written). */
  scope: string;
  /** Which checklist item it supports. */
  slot: string;
  /** What the on-device text reader found. Never leaves the browser. */
  review?: { state: "reading" } | { state: "done"; check: PictureCheck } | { state: "failed" };
  /** The person chose to keep it after a warning. */
  kept?: boolean;
  /** An optional AI look, only if the person asked for it for this picture. */
  ai?: { state: "asking" } | { state: "done"; description: string; matches: "yes" | "no" | "unsure"; reason: string } | { state: "failed"; message: string };
};

export const MAX_PER_SCOPE = 12;
export const MAX_PER_SLOT = 12;
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_SIDE = 1600;
export const NEW_SCOPE = "new";

const EMPTY: EvidenceImage[] = [];
let items: EvidenceImage[] = EMPTY;
const listeners = new Set<() => void>();

function emit(next: EvidenceImage[]) {
  items = next;
  listeners.forEach((l) => l());
}

/** Every picture in memory. Filter with `forScope` inside useMemo. */
export function useAllEvidence(): EvidenceImage[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => items,
    () => EMPTY,
  );
}

export function getAllEvidence(): EvidenceImage[] {
  return items;
}

export function forScope(all: EvidenceImage[], scope: string): EvidenceImage[] {
  return all.filter((i) => i.scope === scope);
}

/** Counts and names per checklist item, for saving with a case. Names only: never the pictures. */
export function summarise(scope: string): Record<string, { count: number; names: string[] }> {
  const out: Record<string, { count: number; names: string[] }> = {};
  for (const img of items) {
    if (img.scope !== scope) continue;
    const e = (out[img.slot] ??= { count: 0, names: [] });
    e.count += 1;
    e.names.push(img.name);
  }
  return out;
}

export function updateEvidence(id: string, patch: Partial<EvidenceImage>) {
  emit(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
}

export function removeEvidence(id: string) {
  emit(items.filter((i) => i.id !== id));
}

export function clearEvidence(scope?: string) {
  emit(scope ? items.filter((i) => i.scope !== scope) : EMPTY);
}

/** Moves pictures from one scope to another, for example from "new" to the id of the saved case. */
export function rescopeEvidence(from: string, to: string) {
  if (from === to) return;
  emit(items.map((i) => (i.scope === from ? { ...i, scope: to } : i)));
}

/**
 * Re-draws the picture onto a canvas and saves it as a smaller JPEG. This also drops hidden
 * metadata such as the GPS location and camera details that phone photos carry.
 */
async function cleanImage(file: File, scope: string, slot: string): Promise<EvidenceImage> {
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
      scope,
      slot,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Adds pictures. Returns plain-language problems, if any, and the pictures that were added. */
export async function addEvidence(files: File[], scope: string, slot: string): Promise<{ problems: string[]; added: EvidenceImage[] }> {
  const problems: string[] = [];
  const added: EvidenceImage[] = [];
  for (const file of files) {
    const inScope = items.filter((i) => i.scope === scope).length + added.length;
    const inSlot = items.filter((i) => i.scope === scope && i.slot === slot).length + added.filter((a) => a.slot === slot).length;
    if (inScope >= MAX_PER_SCOPE) {
      problems.push(`You can add up to ${MAX_PER_SCOPE} pictures to one case. The rest were skipped.`);
      break;
    }
    if (inSlot >= MAX_PER_SLOT) {
      problems.push(`You can add up to ${MAX_PER_SLOT} pictures to one case. Remove one to add another.`);
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
      added.push(await cleanImage(file, scope, slot));
    } catch {
      problems.push(`${file.name || "A picture"} couldn't be read. Try saving it as JPG or PNG.`);
    }
  }
  if (added.length) emit([...items, ...added]);
  return { problems, added };
}
