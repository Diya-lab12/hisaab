import Link from "next/link";
import NoticePreview from "@/components/NoticePreview";
import { SituationLinks } from "@/components/SituationCards";
import StatsBand from "@/components/StatsBand";
import TrustSection from "@/components/TrustSection";

const STEPS = ["Describe what happened", "Law check", "Notice drafted", "Advocate signs"];

const HELPS = [
  { t: "Understand the issue", d: "Describe what happened and we check it against the Consumer Protection Act, 2019, in plain words." },
  { t: "Build your case", d: "Add your screenshots and receipts. They stay on your device until you send your case to the advocate, and Claimatic reads the text in them to check they fit." },
  { t: "Prepare your complaint", d: "We draft a legal notice you can edit and download. An advocate reviews and signs it before it is sent." },
  { t: "Keep track of what happens next", d: "Record when it was sent, what the company replied, and set a follow-up date. Saved on this device." },
];

export default function Home() {
  return (
    <main className="page home">
      <div className="hero">
        <section className="intro">
          <p className="eyebrow">Consumer Protection Act, 2019</p>
          <h1>AI-drafted, <span className="nowrap">advocate-signed</span> legal notices.</h1>
          <p className="sub">Describe what a company did wrong. Claimatic checks it against the Act, drafts the notice, and an advocate reviews and signs it.</p>
          <div className="actions">
            <Link href="/new" className="cta">Start my complaint</Link>
            <Link href="/examples" className="btn-secondary">See an example</Link>
          </div>
          <ol className="stepper-static" aria-label="How a case moves">
            {STEPS.map((s, i) => (
              <li key={s}><span className="ss-n">{i + 1}</span><span>{s}</span></li>
            ))}
          </ol>
        </section>
        <NoticePreview />
      </div>

      <StatsBand />

      <section aria-labelledby="situations-h" className="block">
        <h2 id="situations-h">What happened?</h2>
        <p className="help">Pick the closest one to start. We&apos;ll ask for your personal details later, only when they&apos;re needed.</p>
        <SituationLinks />
      </section>

      <section aria-labelledby="how-h" className="block">
        <h2 id="how-h">How Claimatic helps</h2>
        <ol className="how">
          {HELPS.map((h) => (
            <li key={h.t}>
              <h3>{h.t}</h3>
              <p>{h.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <TrustSection />
    </main>
  );
}
