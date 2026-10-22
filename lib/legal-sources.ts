// UNVERIFIED DRAFT. These sections and summaries were drafted from general
// knowledge of the Consumer Protection Act, 2019 and must be checked against
// the official text (and the Consumer Protection (Jurisdiction of the District
// Commission, the State Commission and the National Commission) Rules, 2021)
// before anyone relies on them. This is the ONLY law the AI may cite.

export type LegalSection = { id: string; summary: string };

export const LEGAL_SOURCES: LegalSection[] = [
  { id: "2(7)", summary: "Defines 'consumer': a person who buys goods or hires services for consideration, excluding resale or commercial purpose." },
  { id: "2(9)", summary: "Consumer rights, including protection against unfair trade practices, the right to be heard and the right to seek redressal." },
  { id: "2(10)", summary: "Defines 'defect': any fault or imperfection in quality, quantity, potency, purity or standard of goods." },
  { id: "2(11)", summary: "Defines 'deficiency': any fault, imperfection or shortcoming in the quality, nature or manner of performance of a service." },
  { id: "2(46)", summary: "Defines 'unfair contract': terms causing significant change in consumer's rights, such as excessive security deposits or one-sided penalties." },
  { id: "2(47)", summary: "Defines 'unfair trade practice', including false representation about goods or services, and (viii) refusing to take back or refund goods or services within the stipulated or 30-day period." },
  { id: "2(42)", summary: "Defines 'service', including banking, transport, telecom, food, lodging and e-commerce services, excluding free or personal-service contracts." },
  { id: "2(5)", summary: "Defines 'complainant', including a consumer or a registered consumer association." },
  { id: "2(6)", summary: "Defines 'complaint': a written allegation of an unfair trade practice, defect, deficiency, overcharging or hazardous goods." },
  { id: "34(1)", summary: "The District Commission has jurisdiction over complaints where the consideration paid does not exceed the pecuniary limit (₹50 lakh under the 2021 rules)." },
  { id: "34(2)(d)", summary: "A complaint may be filed with the District Commission where the complainant resides or personally works for gain." },
  { id: "35", summary: "How a complaint is filed with the District Commission, including electronically." },
  { id: "39", summary: "Relief the Commission may order: remove the defect, replace goods, refund the price, pay compensation, pay costs." },
  { id: "69", summary: "A complaint must be filed within two years from the date the cause of action arose, unless delay is condoned for sufficient cause." },
  { id: "84", summary: "Product liability action may be brought against the manufacturer, service provider or seller for harm caused by a defective product or deficient service." },
];

export const LEGAL_SECTION_IDS = new Set(LEGAL_SOURCES.map((s) => s.id));
