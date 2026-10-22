import { formatDate } from "./checks";
import type { IssueId } from "./issues";

export type Question = {
  id: string;
  label: string;
  type: "text" | "date" | "select" | "textarea";
  options?: { value: string; label: string }[];
  hint?: string;
  placeholder?: string;
};

const YES_NO_NOT_SURE = [
  { value: "yes", label: "Yes, I have it" },
  { value: "no", label: "No, I don't have one" },
  { value: "unsure", label: "Not sure" },
];

/** Questions that change with the problem. All are optional: they sharpen the complaint, they don't block it. */
export const QUESTIONS: Record<IssueId, Question[]> = {
  refund: [
    { id: "paymentDate", label: "When did you pay?", type: "date" },
    {
      id: "returnConfirmation",
      label: "Do you have a return or cancellation confirmation?",
      type: "select",
      options: [...YES_NO_NOT_SURE, { value: "na", label: "I didn't return anything" }],
    },
    { id: "promisedTiming", label: "How long did they say the refund would take?", type: "text", placeholder: "e.g. 5 to 7 working days" },
    { id: "followUps", label: "What have you already tried?", type: "textarea", placeholder: "e.g. emailed support on 3 March, chatted on 10 March", hint: "Dates and the company's replies help most." },
  ],
  delivery: [
    { id: "promisedDelivery", label: "Delivery date they promised", type: "date" },
    { id: "tracking", label: "What does the tracking say?", type: "text", placeholder: "e.g. shows delivered, but nothing arrived" },
    { id: "companyResponse", label: "What has the company said so far?", type: "textarea", placeholder: "e.g. asked me to wait 7 days, then closed the ticket" },
  ],
  faulty: [
    { id: "fault", label: "What exactly is wrong with it?", type: "textarea", placeholder: "e.g. it will not switch on; the screen flickers" },
    {
      id: "warranty",
      label: "Is it under warranty?",
      type: "select",
      options: [
        { value: "in", label: "Yes, within the warranty period" },
        { value: "ended", label: "No, the warranty has ended" },
        { value: "unsure", label: "Not sure" },
      ],
    },
    { id: "attempts", label: "Repair or replacement attempts so far", type: "textarea", placeholder: "e.g. service request on 5 June, technician visit on 12 June, still not fixed" },
  ],
  subscription: [
    {
      id: "cancelConfirmation",
      label: "Do you have a cancellation confirmation?",
      type: "select",
      options: YES_NO_NOT_SURE,
    },
    { id: "laterChargeDate", label: "When were you charged again?", type: "date" },
    { id: "companyResponse", label: "What has the company said so far?", type: "textarea", placeholder: "e.g. support says the plan was still active" },
  ],
  other: [
    { id: "promise", label: "What did the company promise or agree to?", type: "textarea", placeholder: "e.g. the menu showed no service charge" },
    { id: "companyResponse", label: "What has the company said so far?", type: "textarea" },
  ],
};

export const RESOLUTIONS = [
  { value: "refund", label: "A refund" },
  { value: "replacement", label: "A replacement" },
  { value: "repair", label: "A repair" },
  { value: "other", label: "Something else" },
] as const;

export type ResolutionId = (typeof RESOLUTIONS)[number]["value"];

export function resolutionLabel(id: string | undefined, other?: string): string {
  if (id === "other") return other?.trim() || "Something else";
  return RESOLUTIONS.find((r) => r.value === id)?.label ?? "";
}

export function questionFor(issue: string, id: string): Question | undefined {
  return QUESTIONS[(issue as IssueId) in QUESTIONS ? (issue as IssueId) : "other"].find((q) => q.id === id);
}

/** Human-readable "label: value" lines for the AI and for the review screen. */
export function answerLines(issue: string, answers: Record<string, string> | undefined): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  const list = QUESTIONS[(issue as IssueId) in QUESTIONS ? (issue as IssueId) : "other"];
  for (const q of list) {
    const raw = (answers?.[q.id] ?? "").trim();
    if (!raw) continue;
    const value = q.type === "select" ? q.options?.find((o) => o.value === raw)?.label ?? raw : q.type === "date" && !isNaN(Date.parse(raw)) ? formatDate(raw) : raw;
    out.push({ label: q.label, value });
  }
  return out;
}
