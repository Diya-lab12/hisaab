// What the advocate review costs, and how a payment is described. Shared by the browser and the server,
// so the server can recompute the total and never trust the number the browser sends.
// These prices are the advocate's own to set: change the numbers below.

export type Addon = { id: string; label: string; price: number; detail: string };

/** Optional extras, chosen when sending. The advocate delivers each one by hand. */
export const ADDONS: Addon[] = [
  { id: "post", label: "Registered post (AD) with tracking", price: 150, detail: "The advocate also sends the signed notice by registered post, acknowledgement due, and shares the tracking number." },
  { id: "followUp", label: "Follow-up notice", price: 149, detail: "If the company ignores the first notice for 15 days, the advocate sends a firm second notice." },
  { id: "filingPack", label: "Filing pack for e-Jagriti", price: 999, detail: "The complaint draft with index, synopsis and affidavit, ready for you to file if the company still doesn't respond." },
  { id: "call", label: "15-minute call with the advocate", price: 299, detail: "A phone call to talk through your case. The advocate will contact you to fix a time." },
  { id: "priority", label: "Priority review", price: 100, detail: "The advocate aims to review and reply within 24 hours instead of the usual few days." },
];

/** The review fee depends on the claim, so nobody pays more to recover less. */
export const TIERS: { upTo: number; fee: number; label: string }[] = [
  { upTo: 1_000, fee: 101, label: "Claims up to ₹1,000" },
  { upTo: 10_000, fee: 299, label: "₹1,001 to ₹10,000" },
  { upTo: 50_000, fee: 499, label: "₹10,001 to ₹50,000" },
  { upTo: Infinity, fee: 999, label: "Above ₹50,000" },
];

export function reviewFee(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return TIERS[1].fee;
  return (TIERS.find((t) => amount <= t.upTo) ?? TIERS[TIERS.length - 1]).fee;
}

export type Quote = { fee: number; items: { id: string; label: string; price: number }[]; total: number };

/** Unknown add-on ids are ignored, and repeats are counted once. */
export function quote(amount: number, addonIds: string[]): Quote {
  const fee = reviewFee(amount);
  const items = ADDONS.filter((a) => addonIds.includes(a.id)).map(({ id, label, price }) => ({ id, label, price }));
  return { fee, items, total: fee + items.reduce((s, i) => s + i.price, 0) };
}

export type Payment = { ref: string; utr: string; addons: string[] };

/** The UPI account that receives payments. When it isn't set, the review is free and no payment step appears. */
export function upiAccount(): { id: string; name: string } | null {
  const id = process.env.NEXT_PUBLIC_UPI_ID?.trim();
  if (!id || !/^[\w.\-]{2,}@[A-Za-z][\w.\-]{1,}$/.test(id)) return null;
  return { id, name: process.env.NEXT_PUBLIC_UPI_NAME?.trim() || "Hisaab" };
}

/** A upi:// link. Phones open it in a payment app; the QR code carries the same link. */
export function upiLink(account: { id: string; name: string }, amount: number, ref: string): string {
  const q = new URLSearchParams({ pa: account.id, pn: account.name, am: String(amount), cu: "INR", tn: ref });
  return `upi://pay?${q.toString().replace(/\+/g, "%20")}`;
}

const REF_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I to mix up

/** A short code the client puts in the payment note, so the advocate can match it to the request. */
export function newPayRef(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return "HSB-" + Array.from(bytes, (b) => REF_CHARS[b % REF_CHARS.length]).join("");
}

export const UTR = /^\d{12}$/;
export const PAYREF = /^HSB-[A-Z2-9]{6}$/;
export const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;
