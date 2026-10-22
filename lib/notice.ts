import { ComplaintInput, formatDate, formatRupees, parseAmount } from "./checks";
import { NOTICE_DEADLINE_DAYS } from "./config";

export function assembleNotice(input: ComplaintInput, body: string, sectionIds: string[]): string {
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const sections = sectionIds.length
    ? `Sections relied upon under the Consumer Protection Act, 2019: ${sectionIds.map((s) => "Section " + s).join(", ")}.`
    : "";
  return `Date: ${today}

To,
The Manager / Grievance Officer,
${input.company.trim()}

Subject: Legal notice under the Consumer Protection Act, 2019: complaint regarding ${formatRupees(parseAmount(input.amount))} paid to ${input.company.trim()} (incident date: ${formatDate(input.incidentDate)})

Sir/Madam,

${body.trim()}

${sections}

Please comply within ${NOTICE_DEADLINE_DAYS} days of receiving this notice. If this is not resolved by then, I may approach the appropriate Consumer Disputes Redressal Commission and ask for the amount, interest, compensation and costs.

Yours faithfully,
${input.name.trim()}
${input.address.trim()}
Contact: ${input.contact.trim()}`.replace(/\n{3,}/g, "\n\n");
}
