// Rule-based analysis: keyword rules decide the verdict. No AI is involved.
import { NOTICE_DEADLINE_DAYS } from "./config";
import { ComplaintInput, formatDate, formatRupees, parseAmount } from "./checks";
import { LEGAL_SECTION_IDS } from "./legal-sources";

export type Analysis =
  | { status: "need_more_info"; missing: string[] }
  | { status: "not_covered"; not_covered_reason: string; alternatives: string[] }
  | {
      status: "covered";
      explanation: string;
      sections: { id: string; why: string }[];
      relief: string[];
      steps: string[];
      noticeBody: string;
    };

type Category = {
  name: string;
  keywords: RegExp[];
  explanation: string;
  sections: { id: string; why: string }[];
  breach: string; // sentence for the notice
  demand: string;
};

const CATEGORIES: Category[] = [
  {
    name: "non-delivery / refund refused",
    keywords: [/never (arrived|came|delivered)/, /not (been )?delivered/, /did(n't| not) (arrive|receive|get)/, /refus\w* (to )?(a )?(refund|return)/, /no refund/, /won'?t refund/, /not refund/, /cancel+ed/],
    explanation: "You paid for goods or a service that you did not receive, and the company will not refund you. Taking your money without delivering, then refusing a refund, is both a deficiency in service and an unfair trade practice.",
    sections: [
      { id: "2(11)", why: "Failing to deliver what you paid for is a shortcoming or inadequacy in the performance of a service." },
      { id: "2(47)", why: "Refusing to refund what you paid for a service that was not delivered properly, within the stated period or 30 days, is an unfair trade practice (clause (viii))." },
      { id: "39", why: "Lets the Commission order a refund, compensation and costs." },
    ],
    breach: "The goods or services I paid for were not delivered, and you have refused to refund my money. This is a deficiency in service under Section 2(11) and an unfair trade practice under Section 2(47)(viii) of the Consumer Protection Act, 2019.",
    demand: "refund the full amount with interest and pay reasonable compensation for the harassment caused",
  },
  {
    name: "overcharging",
    keywords: [/overcharg/, /charged (me )?(more|extra|too much)/, /extra charge/, /service charge/, /above (the )?mrp/, /hidden (fee|charge)/, /excess (fee|charge)/, /surge/],
    explanation: "You were charged more than the agreed or displayed price, or were billed charges you never agreed to. Overcharging is a recognised ground for a consumer complaint.",
    sections: [
      { id: "2(7)", why: "You paid for the goods or service for your own use, so you are a 'consumer'." },
      { id: "2(47)", why: "Charging beyond the agreed or displayed price can be an unfair trade practice." },
      { id: "39", why: "Lets the Commission order a refund of the excess, compensation and costs." },
    ],
    breach: "I was charged more than the agreed or displayed price. Overcharging can be an unfair trade practice under Section 2(47) of the Consumer Protection Act, 2019.",
    demand: "refund the excess amount charged with interest and pay reasonable compensation",
  },
  {
    name: "defective goods",
    keywords: [/defect/, /faulty/, /stopped working/, /not working/, /broken/, /damaged/, /malfunction/, /fake/, /counterfeit/, /expired/],
    explanation: "The product you bought has a defect or does not work as promised. Defective goods give you the right to ask for repair, replacement or a refund.",
    sections: [
      { id: "2(10)", why: "A fault in the quality or standard of goods is a 'defect'." },
      { id: "2(7)", why: "You bought the goods for your own use, so you are a 'consumer'." },
      { id: "39", why: "Lets the Commission order repair, replacement, refund, compensation and costs." },
    ],
    breach: "The product I bought has a defect, which is covered by Section 2(10) of the Consumer Protection Act, 2019, and you have not remedied it.",
    demand: "replace the product or refund the price in full with interest and pay reasonable compensation",
  },
  {
    name: "deficient service",
    keywords: [/delay/, /cancel/, /poor service/, /rude/, /refused (service|to (repair|fix|serve))/, /not (fixed|repaired|resolved)/, /overbook/, /closed down/, /no response/, /ignor/, /misbehav/, /negligen/],
    explanation: "The service you paid for was not delivered properly or on time. A shortfall in the quality or manner of a paid service is a 'deficiency' under the Act.",
    sections: [
      { id: "2(11)", why: "A shortcoming in the quality or manner of a paid service is a deficiency." },
      { id: "2(7)", why: "You paid for the service for your own use, so you are a 'consumer'." },
      { id: "39", why: "Lets the Commission order a refund, compensation and costs." },
    ],
    breach: "The service I paid for was deficient, which is covered by Section 2(11) of the Consumer Protection Act, 2019.",
    demand: "refund the amount paid with interest and pay reasonable compensation for the loss and inconvenience",
  },
  {
    name: "refund refused",
    keywords: [/refund/, /money back/, /return (policy|my money)/],
    explanation: "You are asking for your money back and the company is not giving it. Refusing a refund that is due is an unfair trade practice.",
    sections: [
      { id: "2(47)", why: "Refusing to refund the price of defective goods or a deficient service within the stated period or 30 days is an unfair trade practice (clause (viii))." },
      { id: "39", why: "Lets the Commission order a refund, compensation and costs." },
    ],
    breach: "You have refused to refund the amount due to me, which is an unfair trade practice under Section 2(47)(viii) of the Consumer Protection Act, 2019.",
    demand: "refund the full amount with interest and pay reasonable compensation",
  },
];

const NOT_COVERED: { pattern: RegExp; reason: string; alternatives: string[] }[] = [
  {
    pattern: /neighbou?r|noisy|noise|loud music|barking|parking dispute|society|apartment association|roommate|landlord (dispute|evict)/,
    reason: "This is a dispute with a person or neighbour, not something you bought from a business. The Consumer Protection Act covers goods and services you paid for.",
    alternatives: ["Talk to your neighbour or residents' association first.", "Complain to the local police (noise rules) or the local municipal authority.", "For a continuing nuisance, a civil court or a lawyer can advise."],
  },
  {
    pattern: /\b(my )?(boss|employer|manager|colleague|coworker|salary|fired|termination|wages)\b/,
    reason: "Employment matters are not consumer disputes, because you are not buying goods or a service from the other side.",
    alternatives: ["Contact the labour commissioner or the relevant labour court.", "Speak to an employment lawyer."],
  },
  {
    pattern: /\b(divorce|custody|property dispute|inheritance|my will|family|husband|wife|in-laws?)\b/,
    reason: "Family and property disputes are decided by civil or family courts, not consumer commissions.",
    alternatives: ["Consult a family or property lawyer.", "Approach the family court or civil court, or your district legal services authority for free legal aid."],
  },
  {
    pattern: /\b(stolen|theft|assault|harass(ed|ment) (by|at work)|threat|cyber ?bully|police)\b/,
    reason: "This looks like a criminal matter, not a consumer complaint.",
    alternatives: ["File a complaint or FIR at the nearest police station.", "For cyber crimes, use the national cybercrime portal (cybercrime.gov.in)."],
  },
  {
    pattern: /for (resale|my business|commercial)|resell/,
    reason: "Goods or services bought for resale or a commercial purpose are generally outside the definition of 'consumer'.",
    alternatives: ["Check the contract for an arbitration clause.", "A lawyer can advise on a commercial claim."],
  },
];

export function notCoveredMatch(description: string) {
  const text = description.toLowerCase();
  for (const n of NOT_COVERED) {
    if (n.pattern.test(text)) return { not_covered_reason: n.reason, alternatives: n.alternatives };
  }
  return null;
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

export function analyze(input: ComplaintInput): Analysis {
  const text = input.description.toLowerCase();

  for (const n of NOT_COVERED) {
    if (n.pattern.test(text)) {
      return { status: "not_covered", not_covered_reason: n.reason, alternatives: n.alternatives };
    }
  }

  const scored = CATEGORIES.map((c) => ({ c, score: c.keywords.filter((k) => k.test(text)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!scored.length || wordCount(input.description) < 4) {
    return {
      status: "need_more_info",
      missing: [
        "What exactly did the company do wrong? (e.g. overcharged me, did not deliver, product is faulty, refused a refund)",
        "What did you pay for, and what did you expect to receive?",
        "Did you already complain to the company? What did they say?",
      ],
    };
  }

  const c = scored[0].c;
  // Safety net: never cite a section that is not on the verified list.
  const sections = c.sections.filter((s) => {
    const ok = LEGAL_SECTION_IDS.has(s.id);
    if (!ok) console.warn("Section guard removed unlisted section:", s.id);
    return ok;
  });

  const company = input.company.trim();
  const amount = formatRupees(parseAmount(input.amount));
  const date = formatDate(input.incidentDate);
  const facts = input.description.trim().replace(/\s+/g, " ");

  const noticeBody = `I am a consumer. I paid ${amount} to ${company}. The incident took place on ${date}. The facts are as follows: ${facts}${/[.!?]$/.test(facts) ? "" : "."}

${c.breach}

I therefore demand that you ${c.demand}.`;

  return {
    status: "covered",
    explanation: c.explanation,
    sections,
    relief: ["Refund of the amount paid, with interest", "Compensation for harassment and inconvenience", "The cost of filing the case"],
    steps: [
      `Collect your proof: the payment receipt or order ID, screenshots of your chats with ${company}, and any emails.`,
      `Complain to ${company}'s customer support or grievance officer in writing and keep the complaint number.`,
      "Send the legal notice below by email and by registered post. A notice is a smart first step, not a legal requirement before filing.",
      `Wait ${NOTICE_DEADLINE_DAYS} days for a reply.`,
      "If there is no fair reply, file a complaint online at e-Jagriti (edaakhil / e-jagriti.gov.in) with the District Commission where you live or work.",
    ],
    noticeBody,
  };
}
