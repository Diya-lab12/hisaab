import type { IndustryId } from "./categories";

export type IssueId = "refund" | "delivery" | "faulty" | "subscription" | "other";

export type Issue = {
  id: IssueId;
  /** The situation, in the customer's own words (home page cards and the first question). */
  situation: string;
  /** A short label for lists and headings. */
  label: string;
  blurb: string;
  example: string;
  fallbackIndustry: IndustryId;
  /** What the "when" field means for this problem. */
  dateLabel: string;
  dateHint: string;
};

export const ISSUES: Issue[] = [
  {
    id: "refund",
    situation: "My refund hasn't arrived.",
    label: "Refund not received",
    blurb: "You returned or cancelled, but the money hasn't come back.",
    example: "I returned the item and got a confirmation, but the refund of ₹2,499 has not reached my account.",
    fallbackIndustry: "other",
    dateLabel: "When did you return or cancel?",
    dateHint: "Use the date the company accepted your return or cancellation.",
  },
  {
    id: "delivery",
    situation: "My order never arrived.",
    label: "Order not delivered",
    blurb: "Late, wrong, or it never showed up.",
    example: "My ₹1,200 order never arrived, but the app shows it as delivered. Support refuses to refund.",
    fallbackIndustry: "ecommerce",
    dateLabel: "When did you place the order?",
    dateHint: "Use the order or payment date.",
  },
  {
    id: "faulty",
    situation: "I received a faulty product.",
    label: "Faulty product",
    blurb: "It arrived broken, or stopped working.",
    example: "I bought an appliance for ₹18,000. It stopped working within the warranty period and service requests are unresolved.",
    fallbackIndustry: "product",
    dateLabel: "When did you buy it?",
    dateHint: "Use the date on your bill or invoice.",
  },
  {
    id: "subscription",
    situation: "I'm being charged after cancelling.",
    label: "Charged after cancelling",
    blurb: "You cancelled a plan or subscription, but they charged you again.",
    example: "I cancelled my subscription and got a confirmation, but was charged again afterwards.",
    fallbackIndustry: "service",
    dateLabel: "When did you cancel?",
    dateHint: "Use the date on your cancellation confirmation.",
  },
  {
    id: "other",
    situation: "Something else happened.",
    label: "Something else",
    blurb: "Overcharged, poor service, anything else.",
    example: "The restaurant added a ₹230 service charge I never agreed to and refused to remove it from my bill.",
    fallbackIndustry: "other",
    dateLabel: "When did it happen?",
    dateHint: "An approximate date is fine.",
  },
];

export function getIssue(id: string | undefined): Issue | undefined {
  return ISSUES.find((i) => i.id === id);
}

export function issueLabel(id: string | undefined): string | null {
  return getIssue(id)?.label ?? null;
}

export function cleanIssue(id: unknown): IssueId | "" {
  return ISSUES.some((i) => i.id === id) ? (id as IssueId) : "";
}
