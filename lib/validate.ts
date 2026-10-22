import type { ComplaintInput } from "./checks";
import { parseAmount } from "./checks";
import { LIMITATION_YEARS } from "./config";

export type FieldKey = keyof ComplaintInput;
export type FieldCheck = { error: string | null; note: string | null };

const EMAIL = /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/;
const PHONE = /^(\+?91)?[6-9]\d{9}$/;

export function isValidContact(s: string): boolean {
  const t = s.trim();
  return EMAIL.test(t) || PHONE.test(t.replace(/[\s-]/g, ""));
}

/** Friendly, specific feedback for one field. `error` blocks progress; `note` is only advice. */
export function checkField(key: FieldKey, input: ComplaintInput, now = new Date()): FieldCheck {
  const v = (input[key] ?? "").trim();
  const ok: FieldCheck = { error: null, note: null };
  switch (key) {
    case "issueType":
      return v ? ok : { error: "Pick the kind of complaint.", note: null };
    case "company":
      if (!v) return { error: "Add the company's name, for example Swiggy.", note: null };
      return ok;
    case "amount": {
      if (!v) return { error: "Add the amount you paid, in rupees.", note: null };
      const n = parseAmount(v);
      if (!(n > 0)) return { error: "Enter just the number, like 1200.", note: null };
      if (n > 1_000_000_000) return { error: "That amount looks too large. Check the zeros.", note: null };
      return ok;
    }
    case "incidentDate": {
      if (!v) return { error: "Add the date it happened. An approximate date is fine.", note: null };
      const d = new Date(v + "T00:00:00");
      if (isNaN(d.getTime())) return { error: "That date doesn't look right.", note: null };
      if (d.getTime() > now.getTime() + 24 * 3600 * 1000) return { error: "That date is in the future.", note: null };
      const limit = new Date(d);
      limit.setFullYear(limit.getFullYear() + LIMITATION_YEARS);
      if (now > limit) {
        return {
          error: null,
          note: `This was over ${LIMITATION_YEARS} years ago. Under Section 69 the Commission can refuse a late complaint unless you give a good reason for the delay.`,
        };
      }
      return ok;
    }
    case "description":
      if (!v) return { error: "Tell us what happened.", note: null };
      if (v.length < 10) return { error: "Add a little more: what you bought, what went wrong, what they said.", note: null };
      if (v.length > 2000) return { error: "Please keep it under 2,000 characters.", note: null };
      return ok;
    case "name":
      if (!v) return { error: "Add your full name. It goes on the notice.", note: null };
      if (v.length < 2) return { error: "That name looks too short.", note: null };
      return ok;
    case "address":
      if (!v) return { error: "Add your address. It goes on the notice.", note: null };
      if (v.length < 10) return { error: "Include your house or flat, area, city and PIN code.", note: null };
      return ok;
    case "contact":
      if (!v) return { error: "Add an email or mobile number so the company can reply.", note: null };
      if (!isValidContact(v)) return { error: "Enter a valid email, or a 10-digit mobile number.", note: null };
      return ok;
  }
}

export const STEP_FIELDS: Record<"complaint" | "details", FieldKey[]> = {
  complaint: ["issueType", "company", "amount", "incidentDate", "description"],
  details: ["name", "address", "contact"],
};
