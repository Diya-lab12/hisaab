import Link from "next/link";
import { ADVOCATE } from "@/lib/advocate";

export const metadata = { title: "Terms" };

export default function Terms() {
  return (
    <main className="page narrow-page">
      <h1 className="page-h">Terms</h1>
      <p className="callout">Draft. These terms describe how Claimatic works today. They have not yet been reviewed as formal terms of service.</p>

      <section className="ws-card" aria-labelledby="t1">
        <h2 id="t1">What Claimatic is</h2>
        <p>Claimatic helps you check whether the Consumer Protection Act, 2019 appears to cover a complaint, drafts a legal notice from the facts you give, and sends your case to an advocate, {ADVOCATE.name}, who reviews it. Claimatic gives general information and not legal advice.</p>
      </section>

      <section className="ws-card" aria-labelledby="t2">
        <h2 id="t2">Your responsibilities</h2>
        <ul>
          <li>Give true and complete facts. The notice is only as accurate as what you tell us.</li>
          <li>Read the draft before you send it to the advocate, and correct anything that is wrong.</li>
          <li>The AI can make mistakes. It does not decide your case.</li>
        </ul>
      </section>

      <section className="ws-card" aria-labelledby="t3">
        <h2 id="t3">The advocate and the notice</h2>
        <p>A notice is sent to the company only after the advocate has reviewed and signed it. She may decline a case, or ask you to change it. You can&apos;t send the notice to the company through Claimatic yourself.</p>
      </section>

      <section className="ws-card" aria-labelledby="t4">
        <h2 id="t4">Fees and refunds</h2>
        <p>Checking your case and sending it to the advocate are free. If she can take your case, she quotes a fee for it, and you pay before she signs and sends the notice. If she can&apos;t go ahead, you get a full refund. See <Link href="/pricing" className="link">Pricing</Link>.</p>
      </section>

      <section className="ws-card" aria-labelledby="t5">
        <h2 id="t5">No guarantee</h2>
        <p>Sending a notice does not guarantee that the company will reply or pay. You may still need to file a complaint with the Consumer Commission.</p>
      </section>
    </main>
  );
}
