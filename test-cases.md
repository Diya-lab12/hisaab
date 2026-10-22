# Test cases

Run each in the app (no AI or API key needed) (`npm run dev`, http://localhost:3000). Use your real name/address/contact.

## 1. Covered (Swiggy)
- Company: Swiggy | Amount: 1200 | Date: 2026-10-02
- Text: Swiggy charged me ₹1,200 for an order that never arrived and refuses to refund. Ordered on 2 October 2026.
- Expect within 20s: green "Yes, this is covered", at least one listed section, numbered steps, filing info ("Free to file"), notice with name, address, Swiggy, ₹1,200, 2 October 2026, sections, demand, deadline; no placeholders.

## 2. Copy
- On the result above tap Copy, paste into Notes. Whole notice is there.

## 3a. Not covered
- Company: (any) | Amount: 100 | Date: recent
- Text: My neighbour plays loud music every night.
- Expect: grey "Not covered" with reason; no notice.

## 3b. Too vague
- Text: bad service, with company/amount left empty -> form stops and lists what is missing.
- Then with a company and amount filled but text "bad service" -> yellow "need more info" card ; no notice.

## 4. Keyword sweep (the app is rule-based, so check each gets a sensible category)
1. Restaurant added a mandatory 10% service charge on the bill (₹2,300).
2. Airline cancelled flight, refused refund of ₹18,500.
3. Phone bought for ₹24,999 stopped working in 2 weeks; seller refuses replacement.
4. Gym took ₹30,000 annual fee, closed after 3 months, no refund.
5. Online order of shoes (₹3,499) never delivered; platform says "no refund".
Note: rule-based matching only knows common complaint types; unusual wording may give "need more info".

## 5. Old incident
- Date more than 2 years ago -> covered result shows the Section 69 time warning.
