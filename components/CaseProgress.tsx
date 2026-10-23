import type { CaseRecord } from "@/lib/cases";

/** Where the case stands, in six plain steps. Done steps come from facts we know, never from guesses. */
export default function CaseProgress({ rec, hasPictures, early }: { rec: CaseRecord; hasPictures: boolean; early: boolean }) {
  const s = rec.submission;
  const sentToAdvocate = Boolean(s);
  const approved = s?.lastStatus === "approved" || s?.lastStatus === "sent" || rec.status === "approved" || rec.status === "sent" || rec.status === "awaiting" || rec.status === "resolved";
  const sentToCompany = s?.lastStatus === "sent" || rec.status === "sent" || rec.status === "awaiting" || rec.status === "resolved";
  const steps = [
    { label: "Case checked", done: Boolean(rec.result) },
    { label: "Evidence added", done: hasPictures || Object.keys(rec.evidence).length > 0 },
    { label: "Timing clear", done: Boolean(rec.result) && !early },
    { label: "With the advocate", done: sentToAdvocate },
    { label: "Signed by the advocate", done: approved },
    { label: "Sent to the company", done: sentToCompany },
  ];
  const current = steps.findIndex((x) => !x.done);
  return (
    <nav className="progress" aria-label="Case progress">
      <ol>
        {steps.map((x, i) => (
          <li key={x.label} className={x.done ? "done" : i === current ? "now" : ""} aria-current={i === current ? "step" : undefined}>
            <span className="pg-dot" aria-hidden="true">{x.done ? "✓" : i + 1}</span>
            <span className="pg-t">{x.label}{x.done && <span className="sr-only"> (done)</span>}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
