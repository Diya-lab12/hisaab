import { evidenceFor, OTHER_SLOT } from "./evidenceItems";

// Plain-code check of the TEXT read from a picture. It looks for words and numbers that fit the
// checklist item, and for details from the case. It can be wrong in both directions, so it only
// ever warns: the person always decides whether to keep a picture.

export type CheckStatus = "match" | "weak" | "mismatch" | "unreadable" | "photo";

export type PictureCheck = {
  status: CheckStatus;
  headline: string;
  /** Things found in the picture, in plain words. */
  found: string[];
};

export type CaseContext = { company?: string; amount?: string; issue?: string };

/** Slots that are normally photos with little or no text. */
const PHOTO_SLOTS = new Set(["faultProof", "problem", OTHER_SLOT.id]);

const WORDS: Record<string, string[]> = {
  payment: ["paid", "payment", "upi", "txn", "transaction", "receipt", "invoice", "amount", "debited", "order id", "successful", "paytm", "gpay", "phonepe", "card"],
  returnConfirmation: ["return", "pickup", "picked up", "received", "cancel", "rma", "reverse"],
  refundPromise: ["refund", "processed", "working days", "business days", "credited", "initiated", "within"],
  followUps: ["support", "chat", "ticket", "agent", "regards", "thank you for", "hello", "hi ", "dear", "wrote", "reply"],
  statement: ["statement", "debit", "credit", "balance", "account", "a/c", "upi", "ref no", "withdrawal", "transaction", "txn"],
  order: ["order", "order id", "qty", "items", "delivery", "estimated", "placed", "arriving", "total"],
  tracking: ["delivered", "shipped", "out for delivery", "tracking", "dispatched", "courier", "awb", "in transit", "status"],
  support: ["support", "chat", "ticket", "agent", "case id", "resolved", "regards", "thank you"],
  invoice: ["invoice", "bill", "gst", "tax", "total", "sold by", "serial", "model", "qty", "date"],
  warranty: ["warranty", "guarantee", "months", "year", "terms", "valid", "covered"],
  serviceRequests: ["service", "request", "ticket", "technician", "job sheet", "engineer", "visit", "complaint", "repair"],
  replies: ["regards", "reply", "from:", "subject", "thank you", "dear", "email", "support", "ticket"],
  signup: ["subscription", "plan", "renew", "billing", "terms", "monthly", "welcome", "trial", "membership"],
  cancellation: ["cancel", "cancelled", "cancellation", "confirm", "ended", "unsubscribe", "no longer", "terminated"],
  charge: ["charged", "debit", "subscription", "amount", "merchant", "upi", "card", "statement", "txn"],
  promise: ["menu", "offer", "price", "terms", "discount", "free", "guarantee", "ad", "promise"],
};

const norm = (t: string) => t.toLowerCase().replace(/(?<=\d),(?=\d{3})/g, "").replace(/\s+/g, " ");

function amountsIn(text: string): number[] {
  // The on-device reader often drops or misreads the rupee sign (for example as "¥" or "%"), so amounts are
  // found by the money words next to them, or by comma/decimal formatting, not by the symbol alone.
  const t = text.replace(/\s+/g, " ");
  const out = new Set<number>();
  const add = (raw: string) => {
    const n = Number(raw.replace(/,/g, ""));
    if (n > 0 && n < 10_000_000) out.add(n);
  };
  const near = /(?:₹|¥|rs\.?|inr|\$|%|paid|amount|total|price|debited|credited|charged|refund(?:ed)?|mrp|fee)[:\s]*[^\d\n]{0,3}(\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?|\d{2,7}(?:\.\d{1,2})?)(?![\d])/gi;
  for (const m of t.matchAll(near)) add(m[1]);
  const formatted = /(?<![\d,])(\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?|\d+\.\d{2})(?![\d])/g;
  for (const m of t.matchAll(formatted)) add(m[1]);
  return [...out].slice(0, 4);
}

function hasAmount(text: string, amount: number): boolean {
  if (!(amount > 0)) return false;
  const re = new RegExp(`(?<![\\d.])${amount}(?:\\.0{1,2})?(?![\\d])`);
  return re.test(norm(text));
}

function datesIn(text: string): string[] {
  const t = text.replace(/\s+/g, " ");
  const found = new Set<string>();
  const res = [
    /\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b/g,
    /\b\d{4}-\d{2}-\d{2}\b/g,
    /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?,?\s+\d{2,4}\b/gi,
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+\d{2,4}\b/gi,
  ];
  for (const re of res) for (const m of t.matchAll(re)) found.add(m[0]);
  return [...found].slice(0, 3);
}

function companyHit(text: string, company?: string): string | null {
  const t = norm(text);
  const tokens = (company ?? "").toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !["the", "pvt", "ltd", "limited", "private", "store", "online", "india"].includes(w));
  const hit = tokens.find((w) => t.includes(w));
  return hit ? (company ?? "").trim() : null;
}

export function slotWantsPhoto(slot: string): boolean {
  return PHOTO_SLOTS.has(slot);
}

/** Judges text read from a picture against the checklist item it was added to. */
export function checkPicture(rawText: string, slot: string, ctx: CaseContext): PictureCheck {
  const text = rawText.trim();
  const readable = text.replace(/[^a-z0-9]/gi, "").length >= 20;
  const item = ctx.issue ? evidenceFor(ctx.issue).find((i) => i.id === slot) : undefined;
  const phrase = item?.phrase ?? "what this item asks for";

  if (!readable) {
    return PHOTO_SLOTS.has(slot)
      ? { status: "photo", headline: "This looks like a photo. Hisaab can't judge photos on your device. You can ask for an AI check if you want a second look.", found: [] }
      : { status: "unreadable", headline: `We couldn't read any text in this picture, so we can't tell if it shows ${phrase}. Check it's the right one.`, found: [] };
  }

  const t = norm(text);
  const hits = (WORDS[slot] ?? []).filter((w) => t.includes(w));
  const wantedAmount = Number((ctx.amount ?? "").replace(/[₹,\s]/g, ""));
  const amountOk = hasAmount(text, wantedAmount);
  const company = companyHit(text, ctx.company);
  const amounts = amountsIn(text);
  const dates = datesIn(text);

  const found: string[] = [];
  if (amountOk) found.push(`The amount ₹${wantedAmount.toLocaleString("en-IN")}, which matches your case`);
  else if (amounts.length) found.push(`Amounts shown: ${amounts.map((a) => "₹" + a.toLocaleString("en-IN")).join(", ")}${wantedAmount > 0 ? ` (your case says ₹${wantedAmount.toLocaleString("en-IN")})` : ""}`);
  if (company) found.push(`The company name “${company}”`);
  if (dates.length) found.push(`Dates: ${dates.join(", ")}`);
  if (hits.length) found.push(`Words that fit: ${hits.slice(0, 5).join(", ")}`);

  if (slot === OTHER_SLOT.id) return { status: "match", headline: "We read some text in this picture.", found };

  // For pictures that should show the money involved, a different amount is worth a warning.
  const MONEY_SLOTS = new Set(["payment", "statement", "charge", "order", "invoice"]);
  if (MONEY_SLOTS.has(slot) && wantedAmount > 0 && amounts.length > 0 && !amountOk && (hits.length >= 1 || !!company)) {
    return {
      status: "weak",
      headline: `This looks like ${phrase}, but the amount in it (${amounts.map((a) => "₹" + a.toLocaleString("en-IN")).join(", ")}) doesn't match the ₹${wantedAmount.toLocaleString("en-IN")} in your case.`,
      found,
    };
  }

  const strong = hits.length >= 2 || (hits.length >= 1 && (amountOk || !!company)) || (amountOk && !!company);
  if (strong) return { status: "match", headline: `This looks like ${phrase}.`, found };
  if (hits.length === 1 || amountOk || company) return { status: "weak", headline: `This might be ${phrase}, but we couldn't be sure.`, found };
  return { status: "mismatch", headline: `We read text in this picture, but nothing that looks like ${phrase}. Is it the right picture?`, found };
}
