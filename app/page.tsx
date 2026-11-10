import StoryBox from "@/components/StoryBox";
import { SituationLinks } from "@/components/SituationCards";
import StatsBand from "@/components/StatsBand";
import TrustSection from "@/components/TrustSection";

const STEPS = [
  { t: "Tell us what happened", d: "Write it in your own words. We check it against the Consumer Protection Act, 2019 first." },
  { t: "See your case", d: "We show what we understood, whether the Act appears to cover it, and how much time you have left to file." },
  { t: "Get your notice", d: "The notice is written from your story. Fill in any blanks and add your receipts and screenshots." },
  { t: "An advocate signs it", d: "She reads your case, signs the notice and sends it to the company. You pay only if she takes your case." },
];

export default function Home() {
  return (
    <main className="page home">
      <div className="hero">
        <section className="intro">
          <p className="eyebrow">Consumer Protection Act, 2019</p>
          <h1>Consumer complaint? Get a legal notice <span className="nowrap">signed by an advocate.</span></h1>
          <p className="sub">Tell us what the company did wrong. We check it against the Consumer Protection Act, 2019 and prepare your notice. An advocate reviews every line, signs it and sends it for you.</p>
          <StoryBox />
        </section>
        <aside className="side-steps" aria-labelledby="side-steps-h">
          <h2 id="side-steps-h">How Claimatic works</h2>
          <ol>
            {STEPS.map((x) => (
              <li key={x.t}>
                <h3>{x.t}</h3>
                <p>{x.d}</p>
              </li>
            ))}
          </ol>
        </aside>
      </div>

      <StatsBand />

      <section aria-labelledby="situations-h" className="block">
        <h2 id="situations-h">Not sure how to start?</h2>
        <p className="help">Tap the closest one and we&apos;ll start your sentence for you. We ask for your personal details only at the end.</p>
        <SituationLinks />
      </section>

      <TrustSection />
    </main>
  );
}
