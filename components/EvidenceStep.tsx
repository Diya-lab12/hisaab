"use client";
import { useMemo } from "react";
import DataNote from "./DataNote";
import EvidenceSlots from "./EvidenceSlots";
import type { CaseRecord } from "@/lib/cases";
import { forScope, useAllEvidence } from "@/lib/evidence";
import { evidenceFor } from "@/lib/evidenceItems";

/** The checklist, with a strength meter that moves as pictures are added and read. It is an estimate, and says so. */
export default function EvidenceStep({ issue, scope, saved, company, amount }: { issue: string; scope: string; saved?: CaseRecord["evidence"]; company: string; amount: string }) {
  const all = useAllEvidence();
  const mine = useMemo(() => forScope(all, scope), [all, scope]);
  const items = evidenceFor(issue);
  const covered = new Set(mine.flatMap((p) => (p.review?.state === "done" ? p.review.slots ?? [] : [])));
  const reading = mine.some((p) => p.review?.state === "reading");
  const pct = items.length ? Math.round((covered.size / items.length) * 100) : 0;
  const label = mine.length === 0 ? "Nothing added yet" : reading ? "Reading your pictures…" : pct === 0 ? "Added, but we couldn't match them to the list" : pct <= 34 ? "Thin" : pct <= 67 ? "Fair" : "Strong";

  return (
    <div>
      <div className="meter-box">
        <div className="meter-head">
          <strong>Evidence strength</strong>
          <span className="meter-label" role="status">{label}</span>
        </div>
        <div className="meter" role="meter" aria-label="Evidence strength" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
          <span style={{ width: `${pct}%` }} />
        </div>
        <ul className="checklist">
          {items.map((i) => (
            <li key={i.id} className={covered.has(i.id) ? "ok" : ""}>
              <span className="ck" aria-hidden="true">{covered.has(i.id) ? "✓" : ""}</span>
              <span><strong>{i.label}</strong> <span className="fine">{i.purpose}</span>{covered.has(i.id) && <span className="sr-only"> (found)</span>}</span>
            </li>
          ))}
        </ul>
        <p className="fine">An estimate from reading the text in your pictures on your device. It can miss things, and it doesn&apos;t predict the outcome. The advocate checks everything.</p>
      </div>
      <EvidenceSlots issue={issue} scope={scope} saved={saved} context={{ company, amount }} />
      <DataNote line="Pictures stay on this device until you send your case to the advocate." />
    </div>
  );
}
