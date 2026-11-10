import { EMPTY_FACTS, type Facts } from "./facts";

const MONTHS: Record<string, number> = { jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11 };
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** With no year given, take the most recent time that date has happened. */
function pastDate(day: number, month: number, year: number | null, now: Date): string {
  let y = year ?? now.getFullYear();
  if (y < 100) y += 2000;
  let d = new Date(y, month, day);
  if (year === null && d.getTime() > now.getTime() + 24 * 3600 * 1000) d = new Date(y - 1, month, day);
  return isNaN(d.getTime()) || d.getDate() !== day ? "" : iso(d);
}

/** Reads the story in plain code. It finds the company, amount, date and problem when they are written plainly, and leaves the rest empty for the person to fill in. */
export function extractRules(story: string, now = new Date()): Facts {
  const f: Facts = { ...EMPTY_FACTS };
  const t = story;

  const amt = t.match(/(?:₹|rs\.?|inr|rupees?)\s*([\d,]+(?:\.\d+)?)/i) ?? t.match(/\b([\d,]{3,}(?:\.\d+)?)\s*(?:rs\b|rupees?|inr)/i);
  if (amt) f.amount = String(Math.round(Number(amt[1].replace(/,/g, ""))) || "") || "";

  const dm = t.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b(?:,?\s+(\d{4}))?/i);
  const dn = t.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\b/);
  if (dm) f.incidentDate = pastDate(Number(dm[1]), MONTHS[dm[2].toLowerCase()], dm[3] ? Number(dm[3]) : null, now);
  else if (dn) f.incidentDate = pastDate(Number(dn[1]), Number(dn[2]) - 1, Number(dn[3]), now);

  const lower = t.toLowerCase();
  f.issueType = /subscri|renew|auto-?debit|cancel(?:l)?ed.*charg|charged.*after/.test(lower) ? "subscription"
    : /refund|returned|return(?:ed)?\b/.test(lower) ? "refund"
    : /never (?:arrived|came|delivered)|not delivered|didn'?t (?:arrive|come)|delivery/.test(lower) ? "delivery"
    : /broken|defect|faulty|not working|stopped working|damaged/.test(lower) ? "faulty"
    : "other";
  f.resolution = /refund|money back/.test(lower) ? "refund" : /replace/.test(lower) ? "replacement" : /repair/.test(lower) ? "repair" : "";

  const STOP = /^(i|my|me|the|a|an|this|that|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|india|rs|inr)$/i;
  for (const m of t.matchAll(/\b(?:from|at|with|by|to)\s+([A-Z][A-Za-z0-9&'.-]+(?:\s+[A-Z][A-Za-z0-9&'.-]+){0,2})/g)) {
    const words = m[1].replace(/[.,]$/, "").split(/\s+/).filter((w) => !STOP.test(w));
    if (words.length) {
      f.company = words.join(" ");
      break;
    }
  }
  const ref = t.match(/\b(?:order|invoice|booking|ref(?:erence)?)\s*(?:no\.?|number|id|#)?\s*[:#-]?\s*([A-Z0-9][A-Z0-9-]{5,})\b/i);
  if (ref && /\d/.test(ref[1])) f.orderRef = ref[1];
  return f;
}
