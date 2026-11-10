"use client";
import Link from "next/link";
import TrackingPreview from "./TrackingPreview";
import { ADVOCATE } from "@/lib/advocate";
import { filingInfo, parseAmount, formatRupees, type ComplaintInput } from "@/lib/checks";
import { longDate } from "@/lib/deadlines";
import type { Facts } from "@/lib/facts";
import { ISSUES } from "@/lib/issues";
import { RESOLUTIONS } from "@/lib/questions";
import { decisionsFor } from "@/lib/realCases";
import { reviewFee, rupees } from "@/lib/pricing";
import { timingCheck } from "@/lib/timing";
import type { Result } from "@/lib/types";

function Chip({ label, children, found }: { label: string; children: React.ReactNode; found: boolean }) {
  return (
    <label className={`fchip ${found ? "" : "missing"}`}>
      <span className="fchip-l">{label}</span>
      {children}
    </label>
  );
}

/** The "verdict first" screen: what we understood, whether the Act covers it, what time is left, and who would review it. */
export default function CaseCard({ facts, result, onFacts }: { facts: Facts; result: Result; onFacts: (f: Facts) => void }) {
  const set = <K extends keyof Facts>(k: K, v: Facts[K]) => onFacts({ ...facts, [k]: v });
  const amount = parseAmount(facts.amount);
  const stub: ComplaintInput = { name: "", address: "", contact: "", company: facts.company, amount: facts.amount, incidentDate: facts.incidentDate, description: "", issueType: facts.issueType };
  const timing = timingCheck(stub);
  const { wins, loss } = decisionsFor(facts.issueType);
  const forum = amount > 0 ? filingInfo(amount) : null;
  const decisions = [...wins, ...(loss ? [loss] : [])];

  return (
    <div className="case-card">
      <p className="prelim">Preliminary, based on what you&apos;ve told us so far</p>

      <section aria-labelledby="cc-facts">
        <h2 id="cc-facts">What we understood</h2>
        <p className="fine">We read these from your story. Fix anything that&apos;s wrong, and add what&apos;s missing.</p>
        <div className="chips">
          <Chip label="Company" found={Boolean(facts.company)}>
            <input value={facts.company} onChange={(e) => set("company", e.target.value)} placeholder="Not found. Add it" autoComplete="organization" />
          </Chip>
          <Chip label="Amount (₹)" found={amount > 0}>
            <input value={facts.amount} onChange={(e) => set("amount", e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" placeholder="Not found. Add it" />
          </Chip>
          <Chip label="Date" found={Boolean(facts.incidentDate)}>
            <input type="date" value={facts.incidentDate} onChange={(e) => set("incidentDate", e.target.value)} max={new Date().toISOString().slice(0, 10)} />
          </Chip>
          <Chip label="Problem" found>
            <select value={facts.issueType} onChange={(e) => set("issueType", e.target.value as Facts["issueType"])}>
              {ISSUES.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
            </select>
          </Chip>
          <Chip label="You'd like" found={Boolean(facts.resolution)}>
            <select value={facts.resolution} onChange={(e) => set("resolution", e.target.value)}>
              <option value="">Not stated</option>
              {RESOLUTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </Chip>
        </div>
      </section>

      <section className="result-card" aria-labelledby="cc-result">
        <h2 id="cc-result">Your complaint appears to fall under the Consumer Protection Act, 2019</h2>
        {result.source === "rules" && <p className="callout warn">Answered with basic rules because the AI was unavailable. Treat this as a rough guide.</p>}
        <p className="lede">{result.explanation}</p>
        <ul className="plain">
          {result.sections?.map((s) => <li key={s.id}><strong>Section {s.id}</strong> {s.why}</li>)}
        </ul>
        <p className="verified-tag"><span aria-hidden="true">✓</span> Section numbers checked against the Act</p>
        <p className="fine">The AI chose which sections fit, and it can be wrong. This isn&apos;t a legal decision.</p>
        {forum && <p className="fine">Where you would file, for a claim of {formatRupees(amount)}: <strong>{forum.forum}</strong>. {forum.fee}</p>}
      </section>

      {facts.incidentDate && timing.filingLimitIso && (
        <section className="time-left" aria-labelledby="cc-time">
          <h2 id="cc-time">Time left to file</h2>
          {timing.filingDaysLeft < 0 ? (
            <p>That date is more than two years ago. Section 69 allows two years, and a late complaint needs a good reason for the delay.</p>
          ) : (
            <p>
              <strong>{timing.filingDaysLeft} days</strong> (about {Math.max(1, Math.round(timing.filingDaysLeft / 30))} months), until {longDate(timing.filingLimitIso)}. Section 69 allows two years from when the problem arose.
            </p>
          )}
        </section>
      )}

      {decisions.length > 0 && (
        <section aria-labelledby="cc-dec">
          <h2 id="cc-dec">Real decisions, including losses</h2>
          <ul className="decisions">
            {decisions.map((c) => (
              <li key={c.id} className={c.result}>
                <span className={`badge ${c.result === "win" ? "st-ready" : "st-draft"}`}>{c.result === "win" ? "Went the person's way" : "Did not succeed"}</span>
                <strong>{c.title}</strong>
                <span className="fine">{c.where}</span>
                <span>{c.outcome}</span>
                <a href={c.source.url} target="_blank" rel="noreferrer" className="fine">{c.source.name}</a>
              </li>
            ))}
          </ul>
          <p className="fine">Context from reported decisions, not a prediction. Every case turns on its own facts.</p>
        </section>
      )}

      <section className="adv-block" aria-labelledby="cc-adv">
        <h2 id="cc-adv">Who would review it</h2>
        <p className="trust-name">{ADVOCATE.name}, {ADVOCATE.title}</p>
        <p>{ADVOCATE.council} · Enrolment No. {ADVOCATE.enrolment} · {ADVOCATE.place}</p>
        <p>
          <strong>Pay only if she takes your case.</strong>{" "}
          {amount > 0 ? <>Her usual fee for a claim of {formatRupees(amount)} is about {rupees(reviewFee(amount))}. </> : <>Her fee depends on the size of your claim. </>}
          Sending your case to her is free. <Link href="/pricing" className="link">See pricing</Link>
        </p>
      </section>

      <TrackingPreview />
    </div>
  );
}
