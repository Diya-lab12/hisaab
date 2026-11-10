import Link from "next/link";
import { ADVOCATE } from "@/lib/advocate";
import { ADDONS, TIERS, rupees } from "@/lib/pricing";

/** Who reviews your notice, how your case is checked, and what it costs. Shared by the home page and the how-it-works page. */
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
          <h3>How your case is checked</h3>
          <ul>
            <li>Your words are matched against the Consumer Protection Act, 2019 to see whether it appears to cover your complaint.</li>
            <li>Only sections that exist in the Act are ever cited, checked one by one.</li>
            <li>The notice is built from the facts you give. Anything you didn&apos;t say is left as a blank for you to fill in.</li>
            <li>This first check is automatic and can be wrong. The advocate makes the real call, and nothing is sent without her signature.</li>
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
