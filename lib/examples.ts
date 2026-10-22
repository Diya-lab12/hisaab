import type { IssueId } from "./issues";

// ILLUSTRATIVE ONLY. These are fictional walkthroughs: no real customer, company, amount or outcome.
// They are static code and are never stored with, or mixed into, a user's real cases.

export type ExampleEvidence = { label: string; note: string; state: "have" | "missing" };
export type ExampleStep = { date: string; text: string };

export type Example = {
  slug: string;
  issue: IssueId;
  title: string;
  teaser: string;
  situation: string;
  timeline: ExampleStep[];
  evidence: ExampleEvidence[];
  missing: string[];
  complaint: string;
  nextAction: string;
};

export const EXAMPLES: Example[] = [
  {
    slug: "shoes-refund",
    issue: "refund",
    title: "Returned the shoes. Still waiting for ₹2,499.",
    teaser: "A returned order, a confirmation, and a refund that never came.",
    situation:
      "A customer returned a pair of shoes bought online. The company confirmed it had received the return and promised a refund, but the ₹2,499 has not reached their account.",
    timeline: [
      { date: "2 Mar 2026", text: "Ordered the shoes online and paid ₹2,499 by UPI." },
      { date: "6 Mar 2026", text: "The shoes didn't fit. Requested a return and a pickup was scheduled." },
      { date: "8 Mar 2026", text: "The courier collected the parcel. The app showed “Return received”." },
      { date: "10 Mar 2026", text: "The company emailed that the refund would be processed in 5 to 7 working days." },
      { date: "20 Mar 2026", text: "No refund. A support chat said it was “being processed”." },
      { date: "29 Mar 2026", text: "A second chat asked the customer to wait. No refund date was given." },
    ],
    evidence: [
      { label: "Payment receipt", note: "UPI confirmation for ₹2,499, dated 2 March.", state: "have" },
      { label: "Return or cancellation confirmation", note: "Screenshot of “Return received”, dated 8 March.", state: "have" },
      { label: "The refund promise", note: "The 10 March email giving a 5 to 7 working day timeline.", state: "have" },
      { label: "Your follow-up messages", note: "The 20 March chat is saved. The 29 March chat is not saved yet.", state: "missing" },
      { label: "Bank or card statement", note: "Not added yet. It would show the money has not come back.", state: "missing" },
    ],
    missing: [
      "The order number, which the company will ask for.",
      "A screenshot of the 29 March chat.",
      "A bank statement for the period showing no refund credit.",
      "The company's grievance contact, found on its website or app under Contact, Terms or Grievance Officer.",
    ],
    complaint: `DRAFT FOR ADVOCATE REVIEW. NOT SENT. NOT APPROVED BY AN ADVOCATE YET.

LEGAL NOTICE
Under the Consumer Protection Act, 2019

To,
M/s The Company (Private Limited)
(operating under the brand or trade name "The online store")
Registered office: as shown on the company's invoice

Subject: Legal notice regarding ₹2,499 paid for a returned order

Sir/Madam,

Under instructions from and on behalf of my client, I serve upon you this notice:

1. On 2 March 2026 my client paid ₹2,499 by UPI for a pair of shoes. The shoes did not fit, so a return was requested on 6 March. Your courier collected the parcel on 8 March and your app showed "Return received".

2. On 10 March you wrote that the refund would be processed in 5 to 7 working days. It has still not been received. My client contacted your support on 20 March and 29 March, and was asked to wait without being given a date.

3. This is a deficiency in service and can be an unfair trade practice under the Consumer Protection Act, 2019.

4. My client therefore requests that you refund ₹2,499 to the original payment method.

My client requires you to comply within 15 days of receiving this notice. If this is not resolved by then, my client will be constrained to approach the appropriate Consumer Disputes Redressal Commission.

Yours faithfully,

(The advocate's name, enrolment number and signature would appear here after review.)`,
    nextAction:
      "Add the bank statement and the 29 March chat, then send the complaint to the company's grievance contact. Record that you sent it, and set a follow-up date.",
  },
  {
    slug: "appliance-warranty",
    issue: "faulty",
    title: "My ₹18,000 appliance stopped working.",
    teaser: "A product that failed under warranty, and service requests that go nowhere.",
    situation:
      "A customer bought an appliance for ₹18,000 with a stated 12-month warranty. It stopped working within that period. They raised service requests, but the problem is still not fixed.",
    timeline: [
      { date: "14 Jan 2026", text: "Bought the appliance for ₹18,000. The warranty card says 12 months." },
      { date: "20 Jul 2026", text: "It stopped working." },
      { date: "21 Jul 2026", text: "Raised a service request on the company's app and got a ticket number." },
      { date: "26 Jul 2026", text: "A technician visited and said a part was needed." },
      { date: "14 Aug 2026", text: "Called for an update. Told the part was not available yet." },
      { date: "2 Sep 2026", text: "Raised a second request. Still no repair or replacement." },
    ],
    evidence: [
      { label: "Invoice or bill", note: "Shows ₹18,000 and the purchase date of 14 January.", state: "have" },
      { label: "Warranty card or terms", note: "Photo of the card showing 12 months.", state: "have" },
      { label: "Photos or a video of the fault", note: "A short video taken on 20 July.", state: "have" },
      { label: "Service requests or job sheets", note: "Ticket numbers are noted, but there are no screenshots yet.", state: "missing" },
      { label: "Messages from the company", note: "Not added yet. They would show how the company replied.", state: "missing" },
    ],
    missing: [
      "The model and serial number, usually on a sticker or the invoice.",
      "Screenshots of both service requests with their dates.",
      "Any written note from the technician about the part.",
      "Whether the customer would accept a repair, a replacement or a refund.",
    ],
    complaint: `DRAFT FOR ADVOCATE REVIEW. NOT SENT. NOT APPROVED BY AN ADVOCATE YET.

LEGAL NOTICE
Under the Consumer Protection Act, 2019

To,
M/s The Company (Private Limited)
(operating under the brand or trade name "The online store")
Registered office: as shown on the company's invoice

Subject: Legal notice regarding an appliance that failed under warranty

Sir/Madam,

Under instructions from and on behalf of my client, I serve upon you this notice:

1. My client bought an appliance from you on 14 January 2026 for ₹18,000. The warranty card states 12 months. On 20 July 2026 it stopped working.

2. A service request was raised on 21 July. A technician visited on 26 July and said a part was needed. On 14 August my client was told the part was not available. A second request on 2 September has also not led to a repair.

3. A product that fails within its warranty period and is not repaired is a defect under the Consumer Protection Act, 2019, and the service given is deficient.

4. My client therefore requests that you repair the appliance free of charge, or replace it if repair is not possible.

My client requires you to comply within 15 days of receiving this notice. If this is not resolved by then, my client will be constrained to approach the appropriate Consumer Disputes Redressal Commission.

Yours faithfully,

(The advocate's name, enrolment number and signature would appear here after review.)`,
    nextAction:
      "Add screenshots of the two service requests, then send the complaint. Set a follow-up date so you remember to check for a reply.",
  },
  {
    slug: "subscription-charge",
    issue: "subscription",
    title: "Cancelled my subscription. Charged again.",
    teaser: "A cancellation confirmation, and a charge that came after it.",
    situation:
      "A customer cancelled a monthly subscription and received a confirmation. A later charge of ₹499 still appeared on their statement, and support says the plan was active.",
    timeline: [
      { date: "5 Jan 2026", text: "Signed up for a monthly plan at ₹499." },
      { date: "28 Jan 2026", text: "Cancelled in the app and received a confirmation email." },
      { date: "5 Feb 2026", text: "Charged ₹499 again." },
      { date: "6 Feb 2026", text: "A support chat said the plan was still active and asked the customer to wait." },
      { date: "20 Feb 2026", text: "A second chat. No refund was offered." },
    ],
    evidence: [
      { label: "Subscription sign-up or terms", note: "Not added yet. It would show what was agreed.", state: "missing" },
      { label: "Cancellation confirmation", note: "The 28 January email.", state: "have" },
      { label: "Statement showing the later charge", note: "Bank statement showing ₹499 on 5 February.", state: "have" },
      { label: "Messages with the company", note: "The 6 February chat is saved. The 20 February chat is not.", state: "missing" },
    ],
    missing: [
      "The sign-up terms, to check what they say about cancelling and renewal dates.",
      "Whether the confirmation email states an effective date.",
      "A screenshot of the 20 February chat.",
    ],
    complaint: `DRAFT FOR ADVOCATE REVIEW. NOT SENT. NOT APPROVED BY AN ADVOCATE YET.

LEGAL NOTICE
Under the Consumer Protection Act, 2019

To,
M/s The Company (Private Limited)
(operating under the brand or trade name "The online store")
Registered office: as shown on the company's invoice

Subject: Legal notice regarding a charge made after cancellation

Sir/Madam,

Under instructions from and on behalf of my client, I serve upon you this notice:

1. My client took a monthly subscription from you at ₹499. It was cancelled on 28 January 2026 and you confirmed the cancellation by email.

2. On 5 February 2026 my client was charged ₹499 again. When my client contacted your support on 6 February and 20 February, the plan was said to be still active and no refund was offered.

3. Charging a customer after a confirmed cancellation is a deficiency in service and can be an unfair trade practice under the Consumer Protection Act, 2019.

4. My client therefore requests that you refund the ₹499 charged after the cancellation.

My client requires you to comply within 15 days of receiving this notice. If this is not resolved by then, my client will be constrained to approach the appropriate Consumer Disputes Redressal Commission.

Yours faithfully,

(The advocate's name, enrolment number and signature would appear here after review.)`,
    nextAction:
      "Add the sign-up terms and the 20 February chat. Then send the complaint, and set a follow-up date for the reply.",
  },
];

export function getExample(slug: string): Example | undefined {
  return EXAMPLES.find((e) => e.slug === slug);
}
