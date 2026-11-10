import { formatDate, formatRupees, parseAmount } from "./checks";
import { NOTICE_DEADLINE_DAYS } from "./config";
import { advocateLines } from "./advocate";
import { BLANK_KEYS } from "./facts";
import type { Facts } from "./facts";
import type { Company } from "./companies";

/** A blank in the notice text is written {{key}}. These helpers keep that format in one place. */
const TOKEN = /\{\{([a-z_]+)\}\}/g;
export const blank = (k: string) => `{{${k}}}`;

/** Keeps only blanks we know about. Anything else the AI might write is dropped, so a stray marker can't appear. */
export function cleanTokens(text: string): string {
  return text.replace(TOKEN, (m, k: string) => (BLANK_KEYS.includes(k) ? m : "")).replace(/₹NaN/g, blank("amount")).replace(/Invalid Date/g, blank("incident_date"));
}

/** The pieces of a template: plain text, or a blank to fill. */
export function splitTemplate(template: string): { text?: string; key?: string }[] {
  const out: { text?: string; key?: string }[] = [];
  let last = 0;
  for (const m of template.matchAll(TOKEN)) {
    if (m.index! > last) out.push({ text: template.slice(last, m.index) });
    out.push({ key: m[1] });
    last = m.index! + m[0].length;
  }
  if (last < template.length) out.push({ text: template.slice(last) });
  return out;
}

/** Replaces blanks with the values filled in so far, and leaves a line for each one still empty. */
export function fillTemplate(template: string, values: Record<string, string>): string {
  return template.replace(TOKEN, (_m, k: string) => values[k]?.trim() || "________");
}

export function emptyBlanks(template: string, values: Record<string, string>): string[] {
  const keys = new Set<string>();
  for (const m of template.matchAll(TOKEN)) if (!values[m[1]]?.trim()) keys.add(m[1]);
  return [...keys];
}

function addressee(company: Company | null, brand: string): string[] {
  if (company?.legalName) {
    const lines = [`M/s ${company.legalName}`];
    if (brand && brand.toLowerCase() !== company.legalName.toLowerCase()) lines.push(`(operating under the brand or trade name "${brand}")`);
    lines.push(`Registered office: ${company.registeredOffice || "to be confirmed by the advocate"}`);
    if (company.grievanceEmail) lines.push(`Email: ${company.grievanceEmail}`);
    return lines;
  }
  return ["The Manager / Grievance Officer", brand || blank("company_name"), "(Legal name and registered office: the advocate will confirm before sending.)"];
}

/**
 * The notice, built in code from the story's facts and the AI's numbered paragraphs.
 * Every fact the story doesn't give becomes a blank, so nothing is invented.
 */
export function buildNoticeTemplate(facts: Facts, company: Company | null, noticeBody: string, sectionIds: string[]): string {
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const amount = parseAmount(facts.amount) > 0 ? formatRupees(parseAmount(facts.amount)) : blank("amount");
  const date = facts.incidentDate && !isNaN(Date.parse(facts.incidentDate)) ? formatDate(facts.incidentDate) : blank("incident_date");
  const target = company?.legalName || facts.company.trim() || blank("company_name");
  const sections = sectionIds.length ? `Sections relied upon under the Consumer Protection Act, 2019: ${sectionIds.map((s) => "Section " + s).join(", ")}.` : "";
  return cleanTokens(`DRAFT FOR ADVOCATE REVIEW. NOT SENT. NOT APPROVED BY AN ADVOCATE YET.

LEGAL NOTICE
Under the Consumer Protection Act, 2019

Date: ${today}
Ref: to be assigned by the advocate

BY REGISTERED POST (ACKNOWLEDGEMENT DUE) / SPEED POST AND BY EMAIL

To,
${addressee(company, facts.company.trim()).join("\n")}

Subject: Legal notice regarding ${amount} paid to ${target} (relevant date: ${date})

Sir/Madam,

Under instructions from and on behalf of my client, ${blank("client_name")}, residing at ${blank("client_address")} (contact: ${blank("client_contact")}), I serve upon you this notice:

${noticeBody.trim()}

${sections}

My client requires you to comply within ${NOTICE_DEADLINE_DAYS} days of receiving this notice. If this is not resolved by then, my client will be constrained to approach the appropriate Consumer Disputes Redressal Commission under the Consumer Protection Act, 2019, and to ask for the amount, interest, compensation and costs, at your risk as to cost and consequences.

This notice is issued without prejudice to my client's other rights and remedies.

Yours faithfully,

${advocateLines().join("\n")}

Copy to: ${blank("client_name")} (client)`).replace(/\n{3,}/g, "\n\n");
}
