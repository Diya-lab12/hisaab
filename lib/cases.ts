import { useMemo, useSyncExternalStore } from "react";
import type { ComplaintInput } from "./checks";
import { evidenceFor } from "./evidenceItems";
import { NOTICE_DEADLINE_DAYS } from "./config";
import { addDays, daysFromToday, longDate, toIso } from "./deadlines";
import { timingCheck } from "./timing";
import type { Result } from "./types";

// Cases are saved only in this browser. There is no account and no server copy, so they do not
// sync across devices. "Session only" cases use sessionStorage and vanish when the tab closes.
// Pictures are never saved here: only their counts and file names.

export type CaseStatus = "draft" | "ready" | "review" | "approved" | "sent" | "awaiting" | "resolved";

export const STATUS_LABEL: Record<CaseStatus, string> = {
  draft: "Draft",
  ready: "Ready for review",
  review: "With the advocate",
  approved: "Approved by the advocate",
  sent: "Sent to the company — recorded by you",
  awaiting: "Awaiting response — recorded by you",
  resolved: "Resolved — recorded by you",
};

export type EventKind = "created" | "generated" | "regenerated" | "edited" | "evidence" | "status" | "followup" | "reply" | "date";

export type CaseEvent = {
  id: string;
  at: string; // ISO timestamp
  kind: EventKind;
  text: string;
  byUser: boolean; // true when the user recorded it (we cannot verify it)
};

export type StorageKind = "device" | "session";

export type CaseRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  storage: StorageKind;
  issue: string;
  input: ComplaintInput;
  /** The latest analysis, or null while the case is still a draft. */
  result: Result | null;
  /** The complaint text as the user last edited it. */
  noticeText: string;
  status: CaseStatus;
  followUpDate: string; // yyyy-mm-dd or ""
  events: CaseEvent[];
  evidence: Record<string, { count: number; names: string[] }>;
  /** Furthest wizard step reached, so a draft can be continued. */
  step: number;
  /** True when the browser refused to store it, so it exists only in this tab. */
  unsaved?: boolean;
  /** Set when the case was sent to the advocate through Hisaab. The token is the client's secret for checking status. */
  submission?: { ref: string; token: string; email: string; sentAt: string; lastStatus: string; note?: string; tracked?: boolean; addons?: string[]; payment?: { ref: string; amount: number; items: { id: string; label: string; price: number }[]; utr: string; verified: boolean } | null };
};

const LOCAL_KEY = "hisaab-cases-v1";
const SESSION_KEY = "hisaab-cases-session-v1";
const EVENT = "hisaab-cases-change";

let memory: CaseRecord[] = []; // used only when browser storage is unavailable
let memoryVersion = 0;
let storageProblem = false;

export function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

export function makeEvent(kind: EventKind, text: string, byUser = false): CaseEvent {
  return { id: newId(), at: new Date().toISOString(), kind, text, byUser };
}

function emit() {
  try {
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* not in a browser */
  }
}

function getStore(kind: StorageKind): Storage | null {
  try {
    return kind === "device" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function readRaw(kind: StorageKind): string | null {
  try {
    return getStore(kind)?.getItem(kind === "device" ? LOCAL_KEY : SESSION_KEY) ?? null;
  } catch {
    return null;
  }
}

function parse(raw: string | null, storage: StorageKind): CaseRecord[] {
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list
      .filter((c) => c && typeof c.id === "string" && c.input)
      .map((c) => ({ ...c, storage, events: Array.isArray(c.events) ? c.events : [], evidence: c.evidence ?? {} }) as CaseRecord);
  } catch {
    return [];
  }
}

let cache: { key: string; list: CaseRecord[] } = { key: "\u0000", list: [] };
const EMPTY_LIST: CaseRecord[] = [];

function snapshot(): CaseRecord[] {
  const local = readRaw("device");
  const session = readRaw("session");
  const key = `${local ?? ""}|${session ?? ""}|${memoryVersion}`;
  if (key === cache.key) return cache.list;
  const list = [...parse(local, "device"), ...parse(session, "session"), ...memory.map((m) => ({ ...m, unsaved: true }))].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  cache = { key, list };
  return list;
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useCases(): CaseRecord[] {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY_LIST);
}

export function useCase(id: string | null): CaseRecord | null {
  const all = useCases();
  return useMemo(() => (id ? all.find((c) => c.id === id) ?? null : null), [all, id]);
}

export function useStorageProblem(): boolean {
  return useSyncExternalStore(subscribe, () => storageProblem, () => false);
}

function writeList(kind: StorageKind, list: CaseRecord[]): boolean {
  try {
    const store = getStore(kind);
    if (!store) return false;
    const key = kind === "device" ? LOCAL_KEY : SESSION_KEY;
    // Strip the storage tag: it is implied by where the record lives.
    store.setItem(key, JSON.stringify(list.map((c) => ({ ...c, storage: undefined, unsaved: undefined }))));
    return true;
  } catch {
    return false;
  }
}

/** Saves a case. Returns where it ended up: "memory" means the browser refused to store it. */
export function saveCase(rec: CaseRecord): "device" | "session" | "memory" {
  const next: CaseRecord = { ...rec, updatedAt: new Date().toISOString() };
  const kind = next.storage;
  const current = parse(readRaw(kind), kind).filter((c) => c.id !== next.id);
  // A case can only live in one place at a time.
  const other: StorageKind = kind === "device" ? "session" : "device";
  const otherList = parse(readRaw(other), other);
  if (otherList.some((c) => c.id === next.id)) writeList(other, otherList.filter((c) => c.id !== next.id));
  memory = memory.filter((c) => c.id !== next.id);
  const ok = writeList(kind, [next, ...current]);
  if (ok) {
    storageProblem = false;
    memoryVersion++;
    emit();
    return kind;
  }
  storageProblem = true;
  memory = [next, ...memory];
  memoryVersion++;
  emit();
  return "memory";
}

export function deleteCase(id: string) {
  for (const kind of ["device", "session"] as StorageKind[]) {
    const list = parse(readRaw(kind), kind);
    if (list.some((c) => c.id === id)) writeList(kind, list.filter((c) => c.id !== id));
  }
  memory = memory.filter((c) => c.id !== id);
  memoryVersion++;
  emit();
}

/**
 * Applies a change to the LATEST saved copy of a case (not a stale copy held by a component), so quick
 * successive actions never overwrite each other.
 */
export function mutateCase(id: string, change: (rec: CaseRecord) => { patch?: Partial<CaseRecord>; events?: CaseEvent[] }): CaseRecord | null {
  const rec = snapshot().find((c) => c.id === id);
  if (!rec) return null;
  const { patch = {}, events = [] } = change(rec);
  const next: CaseRecord = { ...rec, ...patch, events: [...rec.events, ...events] };
  saveCase(next);
  return next;
}

export function blankInput(): ComplaintInput {
  return { name: "", address: "", contact: "", company: "", amount: "", incidentDate: "", description: "", issueType: "", resolution: "", resolutionOther: "", answers: {}, legalName: "", companyAddress: "", companyCin: "", companyEmail: "" };
}

/** Add events and optionally change fields, then save. */
export function updateCase(rec: CaseRecord, patch: Partial<CaseRecord>, events: CaseEvent[] = []): CaseRecord {
  const next: CaseRecord = { ...rec, ...patch, events: [...rec.events, ...events] };
  saveCase(next);
  return next;
}

// ---------- labels and next action ----------

export type FollowUp = { text: string; tone: "overdue" | "due" | "upcoming" };

export function followUpLabel(dateIso: string, now = new Date()): FollowUp | null {
  if (!dateIso) return null;
  const d = daysFromToday(dateIso, now);
  if (d < 0) return { text: `Follow-up overdue by ${-d} day${d === -1 ? "" : "s"}`, tone: "overdue" };
  if (d === 0) return { text: "Follow-up due today", tone: "due" };
  return { text: `Follow-up due in ${d} day${d === 1 ? "" : "s"}`, tone: "upcoming" };
}

export type NextAction = { title: string; body: string; anchor?: string; anchorLabel?: string };

/**
 * One clear next step, from facts we know. It never invents a company deadline or contact.
 * `have` is the set of checklist items that have a picture added in this session.
 */
export function nextAction(rec: CaseRecord, have: Set<string>, now = new Date()): NextAction {
  const anyEvidence = have.size > 0 || Object.values(rec.evidence).some((e) => e.count > 0);
  const fu = followUpLabel(rec.followUpDate, now);
  const sentEvent = [...rec.events].reverse().find((e) => e.kind === "status" && e.text.startsWith("Sent"));

  if (rec.status === "resolved") {
    return { title: "Keep your records", body: "You marked this case resolved. Keep your documents and messages for a while in case the issue comes back." };
  }
  if (rec.status === "review") {
    return {
      title: "Waiting for the advocate",
      body: rec.submission
        ? rec.submission.tracked === false
          ? "Your notice has been emailed to the advocate. They'll reply to you by email. When you hear back, record it here."
          : "Your notice is with the advocate. You'll get an email when they respond, and this page updates by itself."
        : "You've asked the advocate to review your notice. When the signed notice has been sent to the company, record that here.",
      anchor: "record",
      anchorLabel: rec.submission?.tracked === false || !rec.submission ? "Record an update" : "Check for updates",
    };
  }
  if (rec.status === "approved") {
    return {
      title: "The advocate approved your notice",
      body: "It has been signed. The advocate sends it to the company, and you'll see that here. Set a follow-up date for the company's reply: the notice asks for a response within 15 days.",
      anchor: "followup",
      anchorLabel: "Set follow-up date",
    };
  }
  if (rec.status === "awaiting" || rec.status === "sent") {
    if (fu?.tone === "overdue") {
      return {
        title: "Your follow-up date has passed",
        body: "Record any reply you've had. If there is none, follow up with the company in writing, then look at the escalation options below.",
        anchor: "escalation",
        anchorLabel: "See escalation options",
      };
    }
    if (!rec.followUpDate) {
      const suggested = sentEvent ? addDays(toIso(new Date(sentEvent.at)), NOTICE_DEADLINE_DAYS) : "";
      return {
        title: "Set a follow-up date",
        body: `Pick the day you'll check for a reply${suggested ? `. Your complaint asks for a response within ${NOTICE_DEADLINE_DAYS} days, which is around ${suggested}` : ""}. We'll show whether it is due when you come back.`,
        anchor: "followup",
        anchorLabel: "Set follow-up date",
      };
    }
    return {
      title: "Wait for their reply",
      body: "Record anything the company sends you as soon as it arrives. If it resolves the problem, mark the case resolved.",
      anchor: "record",
      anchorLabel: "Record a reply",
    };
  }
  // draft or ready
  const timing = timingCheck(rec.input, now);
  if (rec.result && timing.state === "too_early" && timing.dueIso) {
    return {
      title: "It's too early to send your notice",
      body: `By the company's own timeline it has until ${longDate(timing.dueIso)} (${timing.daysLeft === 0 ? "today is its last day" : `${timing.daysLeft} day${timing.daysLeft === 1 ? "" : "s"} left`}). A notice sent now may be premature. Set a follow-up for the day after, and check again then.`,
      anchor: "followup",
      anchorLabel: "Set my follow-up date",
    };
  }
  if (!rec.result) {
    return { title: "Finish your complaint", body: "Your answers are saved as a draft. Continue to check your case and prepare the complaint.", anchor: "continue", anchorLabel: "Continue draft" };
  }
  if (!anyEvidence) {
    return {
      title: "Add your pictures as evidence",
      body: `Add pictures such as ${evidenceFor(rec.issue).slice(0, 3).map((i) => i.phrase).join(", ")}. You can still read and edit your complaint first.`,
      anchor: "evidence",
      anchorLabel: "Add evidence",
    };
  }
  return {
    title: "Read your notice, then ask the advocate to review it",
    body: "Check every fact is true and edit anything that isn't. Then email it to the advocate, who reviews, signs and sends it to the company. Come back and record each step.",
    anchor: "complaint",
    anchorLabel: "Open complaint",
  };
}

/** A plain sentence about the checklist. It never rates the case or predicts an outcome. */
export function evidenceSummary(issue: string, hasAny: boolean): string {
  const items = evidenceFor(issue);
  if (!hasAny) return `Start with ${items[0].phrase}. Then add anything else that shows what happened.`;
  return "Check each picture is clear and shows dates and amounts. You can add more.";
}
