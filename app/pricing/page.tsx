import Link from "next/link";
import { ADDONS, TIERS, rupees } from "@/lib/pricing";

export const metadata = { title: "Pricing" };

export default function Pricing() {
  return (
    <main className="page narrow-page">
      <h1 className="page-h">Pricing</h1>
      <p className="lede">Checking your case, the draft notice and sending it to the advocate are free. You pay only if the advocate can take your case and you want the notice signed and sent to the company.</p>

      <section className="ws-card" aria-labelledby="fee-h">
        <h2 id="fee-h">Usual fee by claim size</h2>
        <table className="fee-table">
          <thead><tr><th scope="col">Your claim</th><th scope="col">Usual fee</th></tr></thead>
          <tbody>{TIERS.map((t) => <tr key={t.label}><td>{t.label}</td><td>{rupees(t.fee)}</td></tr>)}</tbody>
        </table>
        <p className="fine">The advocate quotes the final fee for your case after reading it. It can differ from the usual fee.</p>
      </section>

      <section className="ws-card" aria-labelledby="extras-h">
        <h2 id="extras-h">Optional extras</h2>
        <table className="fee-table">
          <thead><tr><th scope="col">Extra</th><th scope="col">About</th></tr></thead>
          <tbody>{ADDONS.map((a) => <tr key={a.id}><td><strong>{a.label}</strong><br /><span className="fine">{a.detail}</span></td><td>{rupees(a.price)}</td></tr>)}</tbody>
        </table>
      </section>

      <section className="ws-card" aria-labelledby="how-pay">
        <h2 id="how-pay">How you pay</h2>
        <ol>
          <li>You send your case to the advocate for free.</li>
          <li>She reads it. If she can take it, she tells you the fee.</li>
          <li>You pay by UPI and enter the transaction ID. She confirms the payment, signs the notice and sends it to the company.</li>
          <li>If she can&apos;t take your case, you pay nothing. If you paid and she can&apos;t go ahead, you get a full refund.</li>
        </ol>
      </section>

      <p><Link href="/new" className="button primary">Start my complaint</Link></p>
    </main>
  );
}
