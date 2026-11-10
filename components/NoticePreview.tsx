import { ADVOCATE } from "@/lib/advocate";

/** A finished notice on paper, as the hero visual. Every name, date and amount in it is made up. */
export default function NoticePreview() {
  return (
    <figure className="notice-preview">
      <div className="np-sheet" aria-hidden="true">
        <header className="np-head">
          <strong>{ADVOCATE.name}, {ADVOCATE.title}</strong>
          <span>{ADVOCATE.council} · Enrolment No. {ADVOCATE.enrolment}</span>
          <span>{ADVOCATE.place}</span>
        </header>
        <p className="np-title">LEGAL NOTICE</p>
        <p className="np-sub">Under the Consumer Protection Act, 2019</p>
        <p className="np-meta">Date: 12 March 2026 · Ref: CLM/2026/0142<br />By registered post (acknowledgement due) and email</p>
        <p>To, The Manager, Example Footwear Private Limited</p>
        <p>Under instructions from my client, Ms A. Sharma, I state as follows:</p>
        <ol>
          <li>My client bought a pair of shoes from you on 2 February 2026 and paid ₹2,499 by UPI.</li>
          <li>She returned them on 10 February. You confirmed receipt on 12 February and promised a refund within 7 working days.</li>
          <li>The refund has not been paid. This is a deficiency in service under Section 2(11) of the Act.</li>
          <li>You are called upon to pay ₹2,499 within 15 days of receiving this notice, failing which my client will approach the Consumer Commission.</li>
        </ol>
        <div className="np-sign"><span>Advocate for the complainant</span></div>
        <span className="np-stamp">Illustrative example</span>
      </div>
      <figcaption className="fine">An example of a finished notice. The people, amounts and dates are fictional.</figcaption>
    </figure>
  );
}
