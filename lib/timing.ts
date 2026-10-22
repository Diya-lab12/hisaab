import type { ComplaintInput } from "./checks";
import { LIMITATION_YEARS } from "./config";
import { addDays, daysFromToday, filingLimitIso, longDate, parseIso, toIso } from "./deadlines";

// Is it too early to send a notice? A company that promised a refund within a period isn't in the wrong
// until that period ends (Section 2(47)(viii): the period on the bill or receipt, otherwise 30 days).
// This reads the period the person told us. It is a guide, and it never decides the law.

export type Period = { count: number; working: boolean; unit: "day" | "week" | "month"; text: string };

const WORD_NUM: Record<string, number> = { one: 1, a: 1, an: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, fourteen: 14, fifteen: 15, thirty: 30 };

/** Reads things like "5 to 7 working days", "30 days", "2 weeks", "one month". Uses the longer end of a range. */
export function parsePeriod(raw: string | undefined): Period | null {
  const t = (raw ?? "").toLowerCase().replace(/[,]/g, " ");
  if (!t.trim()) return null;
  const num = "(\\d+|one|two|three|four|five|six|seven|eight|nine|ten|twelve|fourteen|fifteen|thirty|a|an)";
  const unit = "(day|week|month|fortnight)s?";
  const work = "(working|business)?";
  const range = new RegExp(`${num}\\s*(?:to|-|–|or)\\s*${num}\\s*${work}\\s*${unit}`).exec(t);
  const single = new RegExp(`${num}\\s*${work}\\s*${unit}`).exec(t);
  const toN = (s: string) => (/^\d+$/.test(s) ? Number(s) : WORD_NUM[s] ?? NaN);
  const m = range
    ? { n: toN(range[2]), working: !!range[3], u: range[4] }
    : single
      ? { n: toN(single[1]), working: !!single[2], u: single[3] }
      : null;
  if (!m || !(m.n > 0)) return null;
  const u = m.u === "fortnight" ? "week" : (m.u as "day" | "week" | "month");
  const count = m.u === "fortnight" ? m.n * 2 : m.n;
  return { count, working: m.working, unit: u, text: raw!.trim() };
}

function addWorkingDays(iso: string, n: number): string {
  const d = parseIso(iso);
  let left = n;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) left--;
  }
  return toIso(d);
}

function dueFrom(startIso: string, p: Period): string {
  if (p.working) return addWorkingDays(startIso, p.unit === "day" ? p.count : p.unit === "week" ? p.count * 5 : p.count * 22);
  return addDays(startIso, p.unit === "day" ? p.count : p.unit === "week" ? p.count * 7 : p.count * 30);
}

export type Timing = {
  state: "refused" | "too_early" | "ready" | "unknown";
  dueIso?: string;
  daysLeft?: number;
  basis?: string;
  filingLimitIso: string;
  filingDaysLeft: number;
};

export function timingCheck(input: ComplaintInput, now = new Date()): Timing {
  const hasDate = !!input.incidentDate && !isNaN(parseIso(input.incidentDate).getTime());
  const limit = hasDate ? filingLimitIso(input.incidentDate) : "";
  const base = { filingLimitIso: limit, filingDaysLeft: limit ? daysFromToday(limit, now) : 0 };
  if (input.answers?.refusedInWriting === "yes") return { state: "refused", ...base, basis: "You said the company has already refused in writing, so there is no period left to wait for." };
  if (!hasDate) return { state: "unknown", ...base };

  let due: string | undefined;
  let basis = "";
  if (input.issueType === "refund") {
    const p = parsePeriod(input.answers?.promisedTiming);
    if (p) {
      due = dueFrom(input.incidentDate, p);
      basis = `The company said "${p.text}", counted from ${longDate(input.incidentDate)}.`;
    } else {
      due = addDays(input.incidentDate, 30);
      basis = `No period was given, so the Act's default of 30 days applies (Section 2(47)(viii)). If your bill or receipt states a different period, that one applies.`;
    }
  } else if (input.issueType === "delivery" && input.answers?.promisedDelivery) {
    due = input.answers.promisedDelivery;
    basis = `The company promised delivery by ${longDate(due)}.`;
  }
  if (!due) return { state: "unknown", ...base };
  const daysLeft = daysFromToday(due, now);
  // The company still has all of its last day, so it is only "ready" from the day after.
  return { state: daysLeft >= 0 ? "too_early" : "ready", dueIso: due, daysLeft, basis, ...base };
}

export { LIMITATION_YEARS };
