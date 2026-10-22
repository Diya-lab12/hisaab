import { ComplaintInput, formatDate, formatRupees, parseAmount } from "./checks";
import { NOTICE_DEADLINE_DAYS } from "./config";
import { advocateLines } from "./advocate";

/** The "To" block. It names the legal entity when we have it, and keeps the brand as the trade name. */
export function addresseeLines(input: ComplaintInput): string[] {
  const brand = input.company.trim();
  const legal = (input.legalName ?? "").trim();
  const lines: string[] = [];
  if (legal) {
    lines.push(`M/s ${legal}`);
    if (brand && brand.toLowerCase() !== legal.toLowerCase()) lines.push(`(operating under the brand or trade name "${brand}")`);
    lines.push(`Registered office: ${(input.companyAddress ?? "").trim() || "to be confirmed by the advocate"}`);
    if ((input.companyCin ?? "").trim()) lines.push(`CIN: ${input.companyCin!.trim()}`);
    if ((input.companyEmail ?? "").trim()) lines.push(`Email: ${input.companyEmail!.trim()}`);
  } else {
    lines.push("The Manager / Grievance Officer", brand);
    lines.push("(Legal name and registered office not provided. To be confirmed by the advocate before sending.)");
    if ((input.companyAddress ?? "").trim()) lines.push(`Address: ${input.companyAddress!.trim()}`);
    if ((input.companyEmail ?? "").trim()) lines.push(`Email: ${input.companyEmail!.trim()}`);
  }
  return lines;
}

/**
 * A legal notice in the form an advocate issues, written for the advocate to review and sign.
 * It is a DRAFT: it carries no signature and says so, because only the advocate can approve it.
 */
export function assembleNotice(input: ComplaintInput, body: string, sectionIds: string[]): string {
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const target = (input.legalName ?? "").trim() || input.company.trim();
  const sections = sectionIds.length ? `Sections relied upon under the Consumer Protection Act, 2019: ${sectionIds.map((s) => "Section " + s).join(", ")}.` : "";
  return `DRAFT FOR ADVOCATE REVIEW. NOT SENT. NOT APPROVED BY AN ADVOCATE YET.

LEGAL NOTICE
Under the Consumer Protection Act, 2019

Date: ${today}
Ref: to be assigned by the advocate

BY REGISTERED POST (ACKNOWLEDGEMENT DUE) / SPEED POST AND BY EMAIL

To,
${addresseeLines(input).join("\n")}

Subject: Legal notice regarding ${formatRupees(parseAmount(input.amount))} paid to ${target} (relevant date: ${formatDate(input.incidentDate)})

Sir/Madam,

Under instructions from and on behalf of my client, ${input.name.trim()}, residing at ${input.address.trim()} (contact: ${input.contact.trim()}), I serve upon you this notice:

${body.trim()}

${sections}

My client requires you to comply within ${NOTICE_DEADLINE_DAYS} days of receiving this notice. If this is not resolved by then, my client will be constrained to approach the appropriate Consumer Disputes Redressal Commission under the Consumer Protection Act, 2019, and to ask for the amount, interest, compensation and costs, at your risk as to cost and consequences.

This notice is issued without prejudice to my client's other rights and remedies.

Yours faithfully,

${advocateLines().join("\n")}

Copy to: ${input.name.trim()} (client)`.replace(/\n{3,}/g, "\n\n");
}
