"use client";
import Link from "next/link";
import { useState } from "react";
import RealDecisions from "./RealDecisions";
import { getIssue } from "@/lib/issues";
import type { Example } from "@/lib/examples";

/** A read-through of a fictional case. Nothing here is saved, and nothing is copied into a real case. */
export default function ExampleWorkspace({ example: e }: { example: Example }) {
  const [text, setText] = useState(e.complaint);
  const issue = getIssue(e.issue);
  return (
    <article className="example">
      <p className="badge illus">Illustrative example</p>
      <h1 className="page-h">{e.title}</h1>
      <p className="callout">
        This is a fictional walkthrough. The people, amounts, dates and documents are made up, and it is not a real customer or a result Hisaab achieved.
      </p>

      <section className="ws-card" aria-labelledby="ex-sit">
        <h2 id="ex-sit">The situation</h2>
        <p>{e.situation}</p>
      </section>

      <section className="ws-card" aria-labelledby="ex-time">
        <h2 id="ex-time">Illustrative timeline</h2>
        <ol className="timeline">
          {e.timeline.map((t) => (
            <li key={t.date + t.text}>
              <time>{t.date}</time>
              <p>{t.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="ws-card" aria-labelledby="ex-ev">
        <h2 id="ex-ev">Sample evidence records</h2>
        <p className="fine">Example records only. In your own case you add your real pictures.</p>
        <ul className="slots">
          {e.evidence.map((ev) => (
            <li key={ev.label} className={`slot ${ev.state === "have" ? "added" : "missing"}`}>
              <div className="slot-head">
                <div>
                  <strong>{ev.label}</strong>
                  <span className={`chip ${ev.state === "have" ? "added" : "missing"}`}>{ev.state === "have" ? "Added (example)" : "Missing (example)"}</span>
                </div>
              </div>
              <p className="slot-why">{ev.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="ws-card" aria-labelledby="ex-miss">
        <h2 id="ex-miss">Information still missing</h2>
        <ul>{e.missing.map((m) => <li key={m}>{m}</li>)}</ul>
      </section>

      <section className="ws-card" aria-labelledby="ex-comp">
        <h2 id="ex-comp">A sample legal notice you can edit</h2>
        <p className="fine">Try editing it. Changes here are not saved. In your own case, your details and facts are filled in for you.</p>
        <div className="paper">
          <label className="sr-only" htmlFor="ex-text">Sample legal notice, editable</label>
          <textarea id="ex-text" value={text} onChange={(ev) => setText(ev.target.value)} rows={18} spellCheck />
        </div>
        {text !== e.complaint && <button type="button" className="link" onClick={() => setText(e.complaint)}>Reset the sample</button>}
      </section>

      <section className="ws-card next" aria-labelledby="ex-next">
        <h2 id="ex-next">Suggested next action</h2>
        <p>{e.nextAction}</p>
      </section>

      <RealDecisions issue={e.issue} />

      <div className="cta-row">
        <Link href={`/new?issue=${e.issue}`} className="cta">I have a similar problem</Link>
        <p className="fine">Starts a fresh case{issue ? ` for “${issue.situation.replace(/\.$/, "")}”` : ""}. Nothing from this example is copied into it.</p>
      </div>
    </article>
  );
}
