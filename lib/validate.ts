import type { ComplaintInput } from "./checks";
import { parseAmount } from "./checks";
import { LIMITATION_YEARS } from "./config";
import { getIssue } from "./issues";
import type { Question } from "./questions";

export type FieldKey = "legalName" | "companyAddress" | "companyCin" | "companyEmail" | "name" | "address" | "contact" | "company" | "amount" | "incidentDate" | "description" | "issueType" | "resolution" | "resolutionOther";
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
  const issue = getIssue(input.issueType);
  const ok: FieldCheck = { error: null, note: null };
  switch (key) {
    case "issueType":
      return v ? ok : { error: "Pick the kind of complaint.", note: null };
    case "legalName":
      if (v && !/\b(limited|ltd|llp|pvt|private|incorporated|inc|corporation|corp|co)\b/i.test(v)) {
        return { error: null, note: "Companies registered in India end with “Limited” or “Private Limited”. If this isn't a company, you can ignore this." };
      }
      return ok;
    case "companyCin":
      if (v && !/^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/i.test(v.replace(/\s/g, ""))) {
        return { error: null, note: "A CIN has 21 characters and starts with L or U. Check it against the company's invoice." };
      }
      return ok;
    case "companyEmail":
      if (v && !EMAIL.test(v)) return { error: "That email doesn't look right.", note: null };
      return ok;
    case "companyAddress":
      return ok;
    case "resolution":
      return v ? ok : { error: "Choose what you'd like the company to do.", note: null };
    case "resolutionOther":
      if (input.resolution !== "other") return ok;
      return v ? ok : { error: "Say what you'd like instead.", note: null };
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
      if (!v) return { error: `Add a date. ${issue?.dateHint ?? "An approximate date is fine."}`, note: null };
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
  complaint: ["issueType", "company", "companyEmail", "amount", "incidentDate", "resolution", "resolutionOther", "description"],
  details: ["name", "address", "contact"],
};

/** Feedback for the answers to the questions that change with the problem. These never block progress, except impossible dates. */
export function checkAnswer(q: Question, value: string, now = new Date()): { error: string | null } {
  const v = value.trim();
  if (!v) return { error: null };
  if (v.length > 500) return { error: "Please keep this under 500 characters." };
  if (q.type === "date") {
    const d = new Date(v + "T00:00:00");
    if (isNaN(d.getTime())) return { error: "That date doesn't look right." };
    if (d.getTime() > now.getTime() + 24 * 3600 * 1000) return { error: "That date is in the future." };
  }
  if (q.type === "select" && !q.options?.some((o) => o.value === v)) return { error: "Pick one of the options." };
  return { error: null };
}
