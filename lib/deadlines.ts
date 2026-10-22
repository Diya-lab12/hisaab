import { LIMITATION_YEARS, NOTICE_DEADLINE_DAYS } from "./config";

export function parseIso(iso: string): Date {
  return new Date(iso + "T00:00:00");
}

export function toIso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function addDays(iso: string, days: number): string {
  const d = parseIso(iso);
  d.setDate(d.getDate() + days);
  return toIso(d);
}

/** Last day to file with the Commission: two years from the incident (Section 69). */
export function filingLimitIso(incidentIso: string): string {
  const d = parseIso(incidentIso);
  d.setFullYear(d.getFullYear() + LIMITATION_YEARS);
  return toIso(d);
}

export function replyDueIso(sendIso: string): string {
  return addDays(sendIso, NOTICE_DEADLINE_DAYS);
}

export function longDate(iso: string): string {
  return parseIso(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
}

export function daysFromToday(iso: string, now = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((parseIso(iso).getTime() - today.getTime()) / 86_400_000);
}
