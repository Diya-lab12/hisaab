import { useSyncExternalStore } from "react";
import type { ComplaintInput } from "./checks";
import type { Result } from "./types";

const KEY = "hisaab-case";
const EVENT = "hisaab-case-change";

export type SavedCase = { input: ComplaintInput; result: Result };

// sessionStorage can be unavailable (private windows, blocked storage), so every access is guarded.
export function saveCase(c: SavedCase) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(c));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* ignore */
  }
}

let lastRaw: string | null | undefined;
let lastValue: SavedCase | null = null;

function snapshot(): SavedCase | null {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw === lastRaw) return lastValue;
  lastRaw = raw;
  try {
    lastValue = raw ? (JSON.parse(raw) as SavedCase) : null;
  } catch {
    lastValue = null;
  }
  return lastValue;
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** The case saved by the first page, or null. Always null during server rendering. */
export function useSavedCase(): SavedCase | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}

/** False while rendering on the server and during hydration, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
