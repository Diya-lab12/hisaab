import Link from "next/link";
import { SituationLinks } from "@/components/SituationCards";

const HELPS = [
  { t: "Understand the issue", d: "Describe what happened and we check it against the Consumer Protection Act, 2019, in plain words." },
  { t: "Build your case", d: "A checklist shows which documents help for your kind of problem. Pictures stay on your device, and Hisaab reads the text in them to check they fit." },
  { t: "Prepare your complaint", d: "We draft a legal notice you can edit and download. An advocate reviews and signs it before it is sent. You can't send it to the company yourself." },
  { t: "Keep track of what happens next", d: "Record when you asked the advocate, when it was sent, what the company replied, and set a follow-up date. Saved on this device." },
];

export default function Home() {
  return (
    <main className="page home">
      <section className="intro">
        <h1>Customer support going in circles?</h1>
        <p className="sub">Organise your evidence, prepare your complaint, and know your next step.</p>
        <div className="actions">
          <Link href="/new" className="cta">Start my complaint</Link>
          <Link href="/examples" className="btn-secondary">Explore an example</Link>
        </div>
      </section>

      <section aria-labelledby="situations-h" className="block">
        <h2 id="situations-h">What happened?</h2>
        <p className="help">Pick the closest one to start. We&apos;ll ask for your personal details later, only when they&apos;re needed.</p>
        <SituationLinks />
      </section>

      <section aria-labelledby="how-h" className="block">
        <h2 id="how-h">How Hisaab helps</h2>
        <ol className="how">
          {HELPS.map((h) => (
            <li key={h.t}>
              <h3>{h.t}</h3>
              <p>{h.d}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
