import type { IssueId } from "./issues";

// Real, reported decisions. Each was checked against the page linked as the source. Most are news
// reports of district-level orders (not the full order), appeals were not checked, and every case
// turns on its own facts. They are context, not predictions.

export type RealCase = {
  id: string;
  issues: IssueId[];
  title: string;
  where: string;
  summary: string;
  outcome: string;
  source: { name: string; url: string };
};

export const REAL_CASES: RealCase[] = [
  {
    id: "zomato-kollam",
    issues: ["delivery", "refund"],
    title: "Food order never arrived, no refund",
    where: "District Commission, Kollam, Kerala. Decided 29 Oct 2022.",
    summary: "A law student paid ₹176 for food that never arrived and got no refund. The company did not appear.",
    outcome: "The Commission ordered a refund with 9% interest, plus compensation for mental agony and costs. The report gives the total as ₹8,362.",
    source: { name: "LiveLaw report", url: "https://www.livelaw.in/amp/news-updates/consumer-disputes-redressal-commission-orders-zomato-to-pay-compensation-to-law-student-for-non-delivery-of-food-215046" },
  },
  {
    id: "amazon-kangra",
    issues: ["delivery", "refund"],
    title: "Prepaid mattress cancelled and returned, no refund",
    where: "District Commission, Kangra, Himachal Pradesh. Reported Aug 2026; order date not stated.",
    summary: "A prepaid order of ₹8,819.10 was not delivered, was cancelled and went back to the seller, and no refund followed.",
    outcome: "The platform was ordered to refund with 9% interest and pay ₹5,000 compensation and ₹5,000 costs. The complaint against the courier was dismissed.",
    source: { name: "LiveLaw report", url: "https://www.livelaw.in/amp/consumer-cases/failing-to-refund-returned-mattress-kangra-consumer-commission-holds-amazon-liable-545235" },
  },
  {
    id: "xiaomi-hamirpur",
    issues: ["faulty"],
    title: "Phone developed a fault within warranty",
    where: "District Commission, Hamirpur, Himachal Pradesh. Order of 17 May 2024.",
    summary: "A ₹21,990 phone developed a booting fault in the warranty period. The shop refused a replacement and the service centre blamed the customer.",
    outcome: "The Commission found a manufacturing defect and ordered a full refund with 9% interest, plus ₹10,000 compensation and ₹7,500 costs against the manufacturer. The complaint against the shop was dismissed.",
    source: { name: "LiveLaw report", url: "https://www.livelaw.in/amp/consumer-cases/failure-resolve-manufacturing-defects-warranty-period-hamirpur-district-commission-xiaomi-india-liable-260695" },
  },
  {
    id: "code-fitness",
    issues: ["subscription", "other"],
    title: "Gym stopped services and did not refund",
    where: "District Commission-I, Chandigarh. Reported 22 Jan 2024.",
    summary: "A gym stopped services after selling memberships and did not refund an amount it had admitted was due.",
    outcome: "The Commission ordered refunds with 9% interest from the date of the complaint, plus ₹10,000 compensation and ₹10,000 costs. It refused interest from the deposit date.",
    source: { name: "LiveLaw report", url: "https://www.livelaw.in/amp/consumer-cases/code-fitness-gym-found-liable-for-service-deficiency-chandigarh-consumer-commission-orders-refund-compensation-247373" },
  },
  {
    id: "upsc-pathshala",
    issues: ["subscription", "refund", "other"],
    title: "Online coaching fee not refunded",
    where: "District Commission, Cuttack, Odisha. Reported 16 Jan 2024; order date not stated.",
    summary: "A student paid ₹40,000 for an online course with poor service. The institute did not process a refund and did not appear.",
    outcome: "The Commission ordered a refund of ₹35,324 with 8% interest, ₹50,000 for harassment and ₹10,000 costs. It heard the case without the institute.",
    source: { name: "LiveLaw report", url: "https://www.livelaw.in/amp/consumer-cases/cuttack-consumer-commission-upsc-pathshala-refund-fee-consumer-complaint-246851" },
  },
  {
    id: "delhi-hc-service-charge",
    issues: ["other"],
    title: "Mandatory service charge on restaurant bills",
    where: "Delhi High Court, 28 Mar 2025.",
    summary: "Restaurant bodies challenged the consumer authority's 2022 guidelines on service charge.",
    outcome: "The High Court dismissed the challenge. It held a mandatory service charge on food bills is unlawful, and that a voluntary tip is allowed but must not be added by default. The report doesn't say whether it was appealed.",
    source: { name: "LiveLaw report", url: "https://www.livelaw.in/amp/high-court/delhi-high-court/delhi-high-court-restaurant-service-charge-on-food-not-mandatory-287836" },
  },
  {
    id: "air-india-delhi",
    issues: ["refund", "other"],
    title: "Flight cancelled at short notice with no alternative",
    where: "District Commission-II, New Delhi. Reported 26 Feb 2024.",
    summary: "A flight (₹12,870) was cancelled at short notice with no alternative offered. The passengers bought other tickets for ₹19,382.",
    outcome: "The Commission found deficiency in service and awarded ₹10,000 compensation plus costs. That is small next to the extra fare they paid, which shows awards can fall short of the loss.",
    source: { name: "LiveLaw report", url: "https://www.livelaw.in/amp/consumer-cases/flight-cancellation-and-no-support-to-passenger-new-delhi-district-commission-holds-air-india-liable-250465" },
  },
];

/** Cases where the complaint failed or came with limits. Honest context matters. */
export const LIMIT_CASES: RealCase[] = [
  {
    id: "poly-medicure",
    issues: ["refund", "delivery", "faulty", "subscription", "other"],
    title: "Buying for business profit can mean you're not a “consumer”",
    where: "Supreme Court, 13 Nov 2025.",
    summary: "A company bought software to automate its business and complained about it.",
    outcome: "The complaint was dismissed: the Court held the purchase was linked to profit, so the company was not a consumer under Section 2(1)(d) of the earlier Act. It applied a “dominant purpose” test, and a self-employed person buying for their livelihood can still be a consumer.",
    source: { name: "LiveLaw report", url: "https://www.livelaw.in/amp/supreme-court/company-purchasing-software-to-enhance-efficiency-profit-is-not-a-consumer-within-consumer-protection-act-supreme-court-309864" },
  },
  {
    id: "dssd-limitation",
    issues: ["refund", "delivery", "faulty", "subscription", "other"],
    title: "A complaint filed too late can be thrown out",
    where: "NCDRC. Reported 1 Mar 2026; order date not stated.",
    summary: "Flat buyers took possession in 2016 and complained in 2026 about a defective parking slot and area differences.",
    outcome: "The complaint was dismissed as time-barred under Section 69 of the 2019 Act. Finding the defects later did not restart the two-year period.",
    source: { name: "LiveLaw report", url: "https://www.livelaw.in/amp/consumer-cases/ncdrc-dismisses-consumer-complaint-filed-nearly-10-years-after-possession-holds-claim-barred-by-limitation-525056" },
  },
];

export function casesFor(issue: string): RealCase[] {
  return REAL_CASES.filter((c) => c.issues.includes(issue as IssueId)).slice(0, 3);
}
