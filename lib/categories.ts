// Plain-code industry detection and advice. These tips are general practical guidance,
// NOT statements from the Consumer Protection Act, and the screen says so.

export type IndustryId = "flight" | "food_delivery" | "restaurant" | "ecommerce" | "product" | "service" | "other";

type Industry = { label: string; evidence: string[]; tips: string[] };

export const INDUSTRIES: Record<IndustryId, Industry> = {
  flight: {
    label: "Airline",
    evidence: [
      "E-ticket or booking confirmation with the PNR",
      "Cancellation or delay email or SMS from the airline",
      "Boarding pass, if you got that far",
      "Receipt for any replacement ticket you had to buy",
      "Bank or card statement showing the payment and any refund status",
      "Screenshots of your chats or emails with the airline's support",
    ],
    tips: [
      "Write to the airline's customer relations or grievance officer first and ask for a refund to the original payment method.",
      "Keep the replacement ticket receipt if you rebooked, because it supports a claim for extra cost.",
      "The government's AirSewa portal also takes airline complaints.",
    ],
  },
  food_delivery: {
    label: "Food or quick delivery app",
    evidence: [
      "Screenshot of the order, with the order ID, items and amount",
      "Screenshot of the order status (for example 'delivered' when it was not)",
      "UPI or card statement showing the payment",
      "Chat transcript with the app's support and any refund promise",
      "Photos of what arrived, if it was wrong or spoilt",
    ],
    tips: [
      "Raise it in the app's support chat first, so there is a complaint number on record.",
      "Online platforms must publish a grievance officer's details. Look in the app's Help page or terms and write to that officer.",
      "Ask for the refund to your original payment method, not credits.",
    ],
  },
  restaurant: {
    label: "Restaurant",
    evidence: [
      "The itemised bill, or a clear photo of it",
      "The menu showing the prices, if the bill differs",
      "Proof of payment (card slip or UPI)",
      "Date, time and the name of the staff or manager you spoke to",
      "Any message or review where you raised the issue",
    ],
    tips: [
      "Ask the manager in writing (or by email) to correct the bill, and keep their reply.",
      "Pay only what you agree to, and note that you paid under protest if you must pay to leave.",
      "Keep the language factual. Describe what the bill says and what the menu said.",
    ],
  },
  ecommerce: {
    label: "Online shopping",
    evidence: [
      "Order confirmation and invoice",
      "Delivery tracking page or courier messages",
      "Photos or an unboxing video of the product as received",
      "Your return or refund request and the ticket number",
      "Chats or emails with the seller or the platform",
      "Payment statement",
    ],
    tips: [
      "File the return or refund request inside the app or site so there is a dated ticket.",
      "Write to the platform's grievance officer, whose details the platform must publish.",
      "Check whether the seller or the platform took your money, because the notice should go to the one who did.",
    ],
  },
  product: {
    label: "Faulty product",
    evidence: [
      "Invoice or bill with the date and seller's name",
      "Warranty card and the product's serial number or IMEI",
      "Photos or a video of the fault",
      "Service-centre job sheets or repair history",
      "Messages where the seller or company refused repair, replacement or refund",
    ],
    tips: [
      "Give the seller or service centre a written chance to repair or replace, and keep proof that you did.",
      "Do not let anyone open or repair the item without a job sheet that records its condition.",
      "Keep the original box and accessories if you can.",
    ],
  },
  service: {
    label: "Service provider",
    evidence: [
      "Contract, membership form or terms you signed or accepted",
      "Receipts or statements for every payment",
      "Messages, emails or call notes about the problem",
      "Proof the service was not given (closure notice, missed appointments, screenshots)",
    ],
    tips: [
      "Complain in writing to the provider and keep a dated copy.",
      "List exactly what was promised, what you got, and what you paid.",
      "For banks, telecom or insurance, also use the company's formal grievance and escalation steps before filing.",
    ],
  },
  other: {
    label: "Your complaint",
    evidence: [
      "Proof of payment (receipt, invoice or statement)",
      "Anything showing what was promised (ad, message, contract)",
      "Messages or emails with the company",
      "Photos or screenshots showing the problem",
    ],
    tips: [
      "Complain to the company in writing first and keep a dated copy.",
      "Keep a short timeline: what you bought, when, what went wrong, what they said.",
    ],
  },
};

export const COMMON_TIP =
  "You can also call the National Consumer Helpline on 1915 for free guidance. It is a general helpline, separate from your legal notice.";

const RULES: { id: IndustryId; brands: RegExp; words: RegExp }[] = [
  { id: "flight", brands: /indigo|air india|vistara|spicejet|akasa|air asia|airasia|go first/i, words: /\b(flight|airline|airport|boarding|pnr)\b/i },
  { id: "food_delivery", brands: /swiggy|zomato|dunzo|zepto|blinkit|instamart|bigbasket|eatsure/i, words: /\b(food delivery|delivery partner|delivery app)\b/i },
  { id: "restaurant", brands: /restaurant|cafe|café|dhaba|bistro|kitchen/i, words: /\b(restaurant|cafe|dined|dine-in|waiter|service charge|menu)\b/i },
  { id: "ecommerce", brands: /amazon|flipkart|myntra|meesho|ajio|nykaa|snapdeal|tata ?cliq/i, words: /\b(online order|online shopping|marketplace|e-?commerce|return request|courier)\b|\b(order(ed)?|bought|purchased)\b[^.]{0,40}\bonline\b/i },
  { id: "product", brands: /apple|samsung|oneplus|xiaomi|lg\b|sony|whirlpool|dell|hp\b|lenovo/i, words: /\b(phone|mobile|laptop|tv|television|fridge|refrigerator|washing machine|ac\b|air conditioner|headphones|watch|warranty|repair|replace|stopped working|faulty|defect)/i },
  { id: "service", brands: /gym|airtel|jio|vodafone|vi\b|bsnl|act fibernet|insurance|bank|hospital|clinic|school|coaching|salon|ola|uber|rapido/i, words: /\b(gym|membership|subscription|broadband|internet|insurance|bank|hospital|clinic|course|coaching|tuition|salon|cab|ride|telecom|plan)\b/i },
];

export function detectIndustry(company: string, description: string): IndustryId {
  for (const r of RULES) if (r.brands.test(company)) return r.id;
  for (const r of RULES) if (r.words.test(description)) return r.id;
  return "other";
}

export function industryFor(company: string, description: string, fallback: IndustryId): IndustryId {
  const found = detectIndustry(company, description);
  return found === "other" ? fallback : found;
}

export function industryInfo(id: string) {
  const info = INDUSTRIES[(id as IndustryId) in INDUSTRIES ? (id as IndustryId) : "other"];
  return info;
}
