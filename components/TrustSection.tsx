import Link from "next/link";
import { ADVOCATE } from "@/lib/advocate";
import { ADDONS, TIERS, rupees } from "@/lib/pricing";

/** Who reviews your notice, what the AI does, and what it costs. Shared by the home page and the how-it-works page. */
export default function TrustSection() {
  return (
    <section aria-labelledby="trust-h" className="block trust">
      <h2 id="trust-h">Who reviews your notice, and what it costs</h2>
      <div className="trust-grid">
        <article className="trust-card">
          <h3>The reviewing advocate</h3>
          <p className="trust-name">{ADVOCATE.name}, {ADVOCATE.title}</p>
          <p>{ADVOCATE.council}<br />Enrolment No. {ADVOCATE.enrolment}<br />{ADVOCATE.place}</p>
          <p>She reads your case, edits the notice if needed, signs it and sends it to the company. You can&apos;t send it yourself, so every notice that goes out has been checked by a real advocate.</p>
        </article>

        <article className="trust-card">
          <h3>What the AI does, and what it doesn&apos;t</h3>
          <ul>
            <li>Reads your account and says whether the Consumer Protection Act, 2019 appears to cover it.</li>
            <li>Names only law sections from a list checked against the Act. Others are deleted automatically.</li>
            <li>Drafts the notice from your facts. It can make mistakes, so read every line.</li>
            <li>Does not decide your case or promise an outcome.</li>
          </ul>
        </article>

        <article className="trust-card">
          <h3>Fees</h3>
          <p><strong>Checking your case, the draft and sending it to the advocate are free.</strong> If she can take your case, she quotes a fee for it, and you pay only then.</p>
          <table className="fee-table">
            <caption className="sr-only">Usual fee by claim size</caption>
            <thead><tr><th scope="col">Claim</th><th scope="col">Usual fee</th></tr></thead>
            <tbody>
              {TIERS.map((t) => <tr key={t.label}><td>{t.label}</td><td>{rupees(t.fee)}</td></tr>)}
            </tbody>
          </table>
          <p className="fine">The final fee can differ with your case. Optional extras: {ADDONS.map((a) => `${a.label.toLowerCase()} (about ${rupees(a.price)})`).join(", ")}.</p>
        </article>
      </div>
      <p><Link href="/how-it-works" className="link">How it works, in full</Link></p>
    </section>
  );
}
