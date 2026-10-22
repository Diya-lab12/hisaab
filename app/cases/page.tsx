"use client";
import Link from "next/link";
import { useState } from "react";
import { STATUS_LABEL, deleteCase, followUpLabel, useCases, useStorageProblem, type CaseRecord } from "@/lib/cases";
import { formatRupees, parseAmount } from "@/lib/checks";
import { useHydrated } from "@/lib/hydrated";
import { getIssue } from "@/lib/issues";

function when(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function CaseCard({ c, onDelete }: { c: CaseRecord; onDelete: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false);
  const fu = c.status === "resolved" ? null : followUpLabel(c.followUpDate);
  const issue = getIssue(c.issue);
  const href = c.result ? `/case?id=${c.id}` : `/new?case=${c.id}`;
  const amount = parseAmount(c.input.amount);
  return (
    <li className="case-card">
      <div className="cc-top">
        <h3>{c.input.company || "Untitled case"}</h3>
        <span className={`badge st-${c.status}`}>{STATUS_LABEL[c.status]}</span>
      </div>
      <p className="cc-meta">
        {issue?.label ?? "Complaint"}{amount > 0 ? ` · ${formatRupees(amount)}` : ""} · Updated {when(c.updatedAt)}
        {c.unsaved ? " · Only in this tab" : c.storage === "session" ? " · This session only" : ""}
      </p>
      {fu && <p className={`fu ${fu.tone}`}>{fu.text}</p>}
      <div className="cc-actions">
        <Link href={href} className="button small primary">{c.result ? "Open case" : "Continue draft"}</Link>
        {confirming ? (
          <>
            <span className="fine">Delete this case from this device?</span>
            <button type="button" className="button small danger" onClick={() => onDelete(c.id)}>Yes, delete</button>
            <button type="button" className="link" onClick={() => setConfirming(false)}>Keep it</button>
          </>
        ) : (
          <button type="button" className="link" onClick={() => setConfirming(true)}>Delete</button>
        )}
      </div>
    </li>
  );
}

export default function MyCases() {
  const hydrated = useHydrated();
  const cases = useCases();
  const problem = useStorageProblem();
  const device = cases.filter((c) => c.storage === "device" && !c.unsaved);
  const session = cases.filter((c) => c.storage === "session" && !c.unsaved);
  const tabOnly = cases.filter((c) => c.unsaved);

  if (!hydrated) return <main className="page narrow-page"><p className="status">Loading your cases…</p></main>;

  return (
    <main className="page narrow-page">
      <h1 className="page-h">My cases</h1>
      <p className="callout">
        Cases are saved <strong>in this browser, on this device</strong>. They don&apos;t sync to your phone or other browsers, and clearing your browser data deletes them. Pictures are never saved, so add them again when you reopen a case.
      </p>
      {problem && (
        <p className="callout warn" role="alert">
          This browser wouldn&apos;t let us save. Cases made now are kept only while this tab is open. Private windows and some privacy settings cause this.
        </p>
      )}

      {cases.length === 0 ? (
        <div className="empty">
          <h2>No saved cases yet</h2>
          <p className="help">When you start a complaint and save it, it will appear here so you can come back to it.</p>
          <div className="actions">
            <Link href="/new" className="cta">Start my complaint</Link>
            <Link href="/examples" className="btn-secondary">Explore an example</Link>
          </div>
        </div>
      ) : (
        <>
          {device.length > 0 && (
            <section aria-labelledby="dev-h">
              <h2 id="dev-h" className="sec-h">Saved on this device</h2>
              <ul className="case-list">{device.map((c) => <CaseCard key={c.id} c={c} onDelete={deleteCase} />)}</ul>
            </section>
          )}
          {session.length > 0 && (
            <section aria-labelledby="ses-h">
              <h2 id="ses-h" className="sec-h">This session only</h2>
              <p className="fine">These disappear when you close this tab.</p>
              <ul className="case-list">{session.map((c) => <CaseCard key={c.id} c={c} onDelete={deleteCase} />)}</ul>
            </section>
          )}
          {tabOnly.length > 0 && (
            <section aria-labelledby="tab-h">
              <h2 id="tab-h" className="sec-h">Only in this tab</h2>
              <p className="fine">Your browser wouldn&apos;t store these. They&apos;ll be gone when you close or reload this tab.</p>
              <ul className="case-list">{tabOnly.map((c) => <CaseCard key={c.id} c={c} onDelete={deleteCase} />)}</ul>
            </section>
          )}
          <div className="actions"><Link href="/new" className="btn-secondary">Start another complaint</Link></div>
        </>
      )}
    </main>
  );
}
