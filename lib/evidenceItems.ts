import type { IssueId } from "./issues";

export type EvidenceItem = {
  id: string;
  label: string;
  /** How the item reads inside a sentence, for example "the payment receipt". */
  phrase: string;
  /** Why it matters, shown when the item is missing. */
  purpose: string;
};

export const OTHER_SLOT: EvidenceItem = {
  id: "other",
  label: "Anything else that helps",
  phrase: "anything else that helps",
  purpose: "to add anything not covered above, like extra photos or messages",
};

export const EVIDENCE: Record<IssueId, EvidenceItem[]> = {
  refund: [
    { id: "payment", label: "Payment receipt", phrase: "the payment receipt", purpose: "to show what you paid and when" },
    { id: "returnConfirmation", label: "Return or cancellation confirmation", phrase: "the return or cancellation confirmation", purpose: "to document when the company accepted the return or cancellation" },
    { id: "refundPromise", label: "The refund promise", phrase: "the refund promise", purpose: "to show what the company said about refund timing" },
    { id: "followUps", label: "Your follow-up messages", phrase: "your follow-up messages", purpose: "to show you asked for the refund and how they replied" },
    { id: "statement", label: "Bank or card statement", phrase: "a bank or card statement", purpose: "to show the money has not come back" },
  ],
  delivery: [
    { id: "order", label: "Order confirmation", phrase: "the order confirmation", purpose: "to show what you ordered and the promised date" },
    { id: "payment", label: "Payment proof", phrase: "proof of payment", purpose: "to show what you paid" },
    { id: "tracking", label: "Tracking or delivery status", phrase: "the tracking or delivery status", purpose: "to show what the company's own system says happened" },
    { id: "support", label: "Chats or emails with support", phrase: "your chats or emails with support", purpose: "to show your complaint and the company's response" },
  ],
  faulty: [
    { id: "invoice", label: "Invoice or bill", phrase: "the invoice or bill", purpose: "to show what you bought, from whom, and when" },
    { id: "warranty", label: "Warranty card or terms", phrase: "the warranty card or terms", purpose: "to show what the warranty promised" },
    { id: "faultProof", label: "Photos or a video of the fault", phrase: "photos or a video of the fault", purpose: "to show the problem as it is now" },
    { id: "serviceRequests", label: "Service requests or job sheets", phrase: "your service requests or job sheets", purpose: "to show you gave them a chance to repair or replace it" },
    { id: "replies", label: "Messages from the company", phrase: "the messages from the company", purpose: "to show how they responded" },
  ],
  subscription: [
    { id: "signup", label: "Subscription sign-up or terms", phrase: "the sign-up or terms", purpose: "to show what you agreed to" },
    { id: "cancellation", label: "Cancellation confirmation", phrase: "the cancellation confirmation", purpose: "to show you cancelled, and when" },
    { id: "charge", label: "Statement showing the later charge", phrase: "a statement showing the later charge", purpose: "to show you were charged after cancelling" },
    { id: "replies", label: "Messages with the company", phrase: "your messages with the company", purpose: "to show how they responded" },
  ],
  other: [
    { id: "payment", label: "Proof of payment", phrase: "proof of payment", purpose: "to show what you paid" },
    { id: "promise", label: "What was promised", phrase: "what was promised", purpose: "such as an ad, menu, message or contract" },
    { id: "replies", label: "Messages with the company", phrase: "your messages with the company", purpose: "to show how they responded" },
    { id: "problem", label: "Photos or screenshots of the problem", phrase: "photos or screenshots of the problem", purpose: "to show what went wrong" },
  ],
};

export function evidenceFor(issue: string): EvidenceItem[] {
  return EVIDENCE[(issue as IssueId) in EVIDENCE ? (issue as IssueId) : "other"];
}

export function slotLabel(issue: string, slot: string): string {
  if (slot === OTHER_SLOT.id) return OTHER_SLOT.label;
  return evidenceFor(issue).find((e) => e.id === slot)?.label ?? slot;
}
