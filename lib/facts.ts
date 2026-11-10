import type { IssueId } from "./issues";

/** What we pull out of the person's story. The person confirms or edits each one. */
export type Facts = {
  issueType: IssueId;
  company: string;
  /** Digits only, like "2499", or "" when the story doesn't say. */
  amount: string;
  /** yyyy-mm-dd, or "" when the story doesn't give a date. */
  incidentDate: string;
  /** refund | replacement | repair | other | "" */
  resolution: string;
  /** An order, invoice or booking number, if the story mentions one. */
  orderRef: string;
};

export const EMPTY_FACTS: Facts = { issueType: "other", company: "", amount: "", incidentDate: "", resolution: "", orderRef: "" };

/** The facts a notice needs that the story may not give. Each shows as a blank in the document, with the reason. */
export const BLANK_DEFS: Record<string, { label: string; why: string; placeholder: string }> = {
  client_name: { label: "Your full name", why: "The notice is written on your behalf, so it must name you.", placeholder: "your full name" },
  client_address: { label: "Your address", why: "A legal notice states where the person it is written for lives.", placeholder: "your address" },
  client_contact: { label: "Your email or mobile", why: "So the company knows how to reach you with its reply.", placeholder: "email or mobile" },
  company_name: { label: "The company's name", why: "The notice has to be addressed to someone.", placeholder: "company name" },
  amount: { label: "The amount", why: "The notice asks for a specific sum back, so it needs the exact amount.", placeholder: "amount in ₹" },
  incident_date: { label: "The date", why: "Dates show what happened when, and when the company's time to respond began.", placeholder: "date" },
  order_ref: { label: "Order or invoice number", why: "It lets the company find your order quickly. Leave it blank if you don't have one.", placeholder: "order number" },
};

export const BLANK_KEYS = Object.keys(BLANK_DEFS);

/** A sentence to start from when a card on the home page is tapped. */
export const STARTERS: Record<IssueId, string> = {
  refund: "I returned something I had bought and the company promised a refund, but the money hasn't come back. ",
  delivery: "I paid for an order that never arrived, and the company won't refund me. ",
  faulty: "I bought a product that is faulty, and the company hasn't repaired or replaced it. ",
  subscription: "I cancelled a subscription but I was charged again afterwards. ",
  other: "I paid a company and it didn't do what it promised. ",
};
