// VERIFIED against the Gazette of India text of the Consumer Protection Act, 2019
// (No. 35 of 2019, published 9 Aug 2019; copy in docs/consumer-protection-act-2019.pdf).
// Checked: 2(7), 2(10), 2(11), 2(47)(viii), 34(2)(d), 35 (electronic filing), 39, 69, and that
// the Act requires no legal notice before filing.
//
// NOT in that PDF, so NOT verified by it:
//  - The Rs 50 lakh District Commission limit. The Act's own s.34(1) says Rs 1 crore; the lower
//    figure comes from the Consumer Protection (Jurisdiction ...) Rules, 2021.
//  - "Free to file up to Rs 5 lakh". The Act (s.35(2)) only says the fee is "as may be prescribed";
//    the figure comes from the Consumer Protection (Consumer Disputes Redressal Commissions) Rules, 2020.
// Check those two against the Rules before relying on them.
//
// This is the ONLY law the AI may cite.

export type LegalSection = { id: string; summary: string };

export const LEGAL_SOURCES: LegalSection[] = [
  { id: "2(7)", summary: "Defines 'consumer': a person who buys goods or hires or avails any service for a consideration paid or promised, including offline and online transactions. It excludes goods obtained for resale or any commercial purpose (using goods only to earn a livelihood by self-employment is not 'commercial')." },
  { id: "2(10)", summary: "Defines 'defect': any fault, imperfection or shortcoming in the quality, quantity, potency, purity or standard of goods that is required by law or contract, or as claimed by the trader." },
  { id: "2(11)", summary: "Defines 'deficiency': any fault, imperfection, shortcoming or inadequacy in the quality, nature and manner of performance of a service that is required by law or has been undertaken under a contract. It includes negligence, omission or commission causing loss or injury, and deliberate withholding of relevant information." },
  { id: "2(47)", summary: "Defines 'unfair trade practice'. Clause (viii): refusing, after selling goods or rendering services, to take back defective goods or withdraw deficient services and refund the consideration paid, within the period stated in the bill or receipt, or 30 days if none is stated. Other clauses cover false representations about goods or services, spurious goods, and not issuing a bill or receipt." },
  { id: "34(1)", summary: "The District Commission hears complaints where the consideration paid is within its monetary limit. The Act says Rs 1 crore; the 2021 Rules reduced it to Rs 50 lakh." },
  { id: "34(2)(d)", summary: "A complaint may be filed in the District Commission within whose area the complainant resides or personally works for gain." },
  { id: "39", summary: "Relief the District Commission may order when a defect, deficiency or unfair trade practice is proved: remove the defect or deficiency, replace the goods, return the price or charges with interest, pay compensation for loss or injury from negligence (punitive damages possible), stop the unfair trade practice, and pay costs." },
];

export const LEGAL_SECTION_IDS = new Set(LEGAL_SOURCES.map((s) => s.id));
