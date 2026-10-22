import type { IndustryId } from "./categories";

export type IssueId = "refund" | "faulty" | "delivery" | "other";

export const ISSUES: {
  id: IssueId;
  label: string;
  blurb: string;
  example: string;
  fallbackIndustry: IndustryId;
}[] = [
  {
    id: "refund",
    label: "Refund refused",
    blurb: "You paid, but they won't give your money back.",
    example: "I cancelled my order and paid ₹1,200. The company confirmed the cancellation but still refuses to refund me.",
    fallbackIndustry: "other",
  },
  {
    id: "faulty",
    label: "Faulty product",
    blurb: "It arrived broken, or stopped working.",
    example: "I bought a phone for ₹24,999. It stopped working after two weeks and the seller refuses to repair or replace it.",
    fallbackIndustry: "product",
  },
  {
    id: "delivery",
    label: "Delayed or missing delivery",
    blurb: "Late, wrong, or it never arrived.",
    example: "My ₹1,200 order never arrived but the app shows it as delivered. Support refuses to refund.",
    fallbackIndustry: "ecommerce",
  },
  {
    id: "other",
    label: "Something else",
    blurb: "Overcharged, poor service, anything else.",
    example: "The restaurant added a ₹230 service charge I never agreed to and refused to remove it from my bill.",
    fallbackIndustry: "other",
  },
];

export function issueLabel(id: string | undefined): string | null {
  return ISSUES.find((i) => i.id === id)?.label ?? null;
}

export function cleanIssue(id: unknown): IssueId | "" {
  return ISSUES.some((i) => i.id === id) ? (id as IssueId) : "";
}
