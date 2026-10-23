import Link from "next/link";
import { ADVOCATE } from "@/lib/advocate";
import { ADDONS, TIERS, rupees } from "@/lib/pricing";

export const metadata = { title: "How it works and who reviews it · Hisaab" };

export default function HowItWorks() {
  return (
    <main className="page narrow-page">
      <h1 className="page-h">How Hisaab works, and who reviews it</h1>
      <p className="lede">
        Hisaab helps you use the Consumer Protection Act, 2019. It checks your complaint, drafts a legal notice, and sends it to an advocate who reviews and signs it. Here is exactly what happens, and what doesn&apos;t.
      </p>

      <section className="ws-card" aria-labelledby="who">
        <h2 id="who">Who reviews your notice</h2>
        <p>
          <strong>{ADVOCATE.name}, {ADVOCATE.title}</strong>, {ADVOCATE.council}, Enrolment No. {ADVOCATE.enrolment}, {ADVOCATE.place}. She reads your case, edits the notice if needed, signs it and sends it to the company.
        </p>
        <p>You can&apos;t send the notice to the company yourself through Hisaab. That is on purpose, so every notice that goes out has been checked by a real advocate.</p>
      </section>

      <section className="ws-card" aria-labelledby="what">
        <h2 id="what">What the AI does, and what it doesn&apos;t</h2>
        <ul>
          <li>It reads what you wrote and says whether the Consumer Protection Act, 2019 appears to cover it.</li>
          <li>It can only name law sections from a short list checked against the Act. Anything else is deleted automatically.</li>
          <li>It drafts the notice from your facts. It can still make mistakes, so read every line before you send it to the advocate.</li>
          <li>It does not decide your case, promise an outcome, or give legal advice. Hisaab gives general information.</li>
        </ul>
      </section>

      <section className="ws-card" aria-labelledby="data">
        <h2 id="data">Where your information goes</h2>
        <ul>
          <li><strong>Your pictures</strong> stay on your device. The text in them is read on your device. A picture goes to an AI only if you choose &ldquo;Check with AI&rdquo; for it.</li>
          <li><strong>What you wrote about the problem</strong> is sent to an AI to check your case. Your name, address and contact details are not.</li>
          <li><strong>When you send your case to the advocate</strong>, your details, notice and pictures go to her by email, and Hisaab keeps your request so it can show you its status.</li>
          <li><strong>You can delete your request</strong> from Hisaab&apos;s server at any time before it is sent, using the link on your case page. The advocate keeps the email she already received.</li>
        </ul>
      </section>

      <section className="ws-card" aria-labelledby="cost">
        <h2 id="cost">What it costs</h2>
        <p><strong>Checking your case and drafting the notice is free. Sending it to the advocate is free.</strong> She reads your case first. If she can take it and you want the notice signed and sent to the company, she tells you the fee for your case, and you pay only then. If she can&apos;t take it, you pay nothing.</p>
        <p>Her usual fee depends on the size of your claim: {TIERS.map((t) => `${t.label}, ${rupees(t.fee)}`).join("; ")}. The final fee can differ with your case. Optional extras: {ADDONS.map((a) => `${a.label.toLowerCase()}, about ${rupees(a.price)}`).join("; ")}.</p>
      </section>

      <section className="ws-card" aria-labelledby="limits">
        <h2 id="limits">Limits you should know</h2>
        <ul>
          <li>A notice is not a guarantee. The company may not reply, and you may still need to file a complaint with the Consumer Commission.</li>
          <li>Limits and fees for filing change. Check the official site before you file.</li>
          <li>Hisaab is for consumer complaints under the Act. It is not for criminal, property or family matters.</li>
        </ul>
      </section>

      <p>
        <Link href="/new" className="button primary">Start my complaint</Link>
      </p>
    </main>
  );
}
