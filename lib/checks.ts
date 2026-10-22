import {
  DISTRICT_LIMIT_RUPEES,
  FREE_FILING_LIMIT_RUPEES,
  LIMITATION_YEARS,
} from "./config";

export type ComplaintInput = {
  name: string;
  address: string;
  contact: string; // email or phone
  company: string;
  amount: string;
  incidentDate: string; // yyyy-mm-dd
  description: string;
};

export function missingFields(input: ComplaintInput): string[] {
  const missing: string[] = [];
  if (!input.name.trim()) missing.push("your name");
  if (!input.address.trim()) missing.push("your address");
  if (!input.contact.trim()) missing.push("your email or phone");
  if (!input.company.trim()) missing.push("the company's name");
  if (!input.amount.trim() || !(parseAmount(input.amount) > 0)) missing.push("the amount you paid");
  if (!input.incidentDate.trim() || isNaN(Date.parse(input.incidentDate))) missing.push("the incident date");
  if (!input.description.trim()) missing.push("what happened");
  return missing;
}

export function parseAmount(raw: string): number {
  return Number(raw.replace(/[₹,\s]/g, ""));
}

export function formatRupees(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}

export function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export type FilingInfo = {
  timeWarning: string | null;
  forum: string;
  fee: string | null;
};

export function filingInfo(amount: number, incidentIso: string, now = new Date()): FilingInfo {
  const incident = new Date(incidentIso + "T00:00:00");
  const limit = new Date(incident);
  limit.setFullYear(limit.getFullYear() + LIMITATION_YEARS);
  const timeWarning =
    now > limit
      ? `This incident was more than ${LIMITATION_YEARS} years ago. Under Section 69 a complaint must normally be filed within ${LIMITATION_YEARS} years, so the Commission may refuse it unless it condones the delay.`
      : null;
  const forum =
    amount <= DISTRICT_LIMIT_RUPEES
      ? "District Consumer Disputes Redressal Commission, filed where you live or work (Section 34(2)(d))."
      : "Your claim is above ₹50 lakh, so it falls outside the District Commission. A State Commission may apply; consider legal advice.";
  const fee = amount <= FREE_FILING_LIMIT_RUPEES ? "Free to file." : null;
  return { timeWarning, forum, fee };
}
