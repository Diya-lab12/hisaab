"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CaseTab from "@/components/CaseTab";
import NextStepsTab from "@/components/NextStepsTab";
import NoticeTab from "@/components/NoticeTab";
import { formatDate, formatRupees, parseAmount } from "@/lib/checks";
import { useHydrated, useSavedCase, type SavedCase } from "@/lib/session";

type Tab = "case" | "notice" | "next";
const TABS: { id: Tab; label: string }[] = [
  { id: "case", label: "Your case" },
  { id: "notice", label: "Notice" },
  { id: "next", label: "Next steps" },
];

export default function CasePage() {
  const router = useRouter();
  const saved = useSavedCase();
  const hydrated = useHydrated();

  // Opened directly with nothing to show: go back to the form.
  useEffect(() => {
    if (hydrated && !saved) router.replace("/");
  }, [hydrated, saved, router]);

  if (!saved) return <main className="page"><p className="status">Loading your case…</p></main>;

  // The key makes a new case start fresh (first tab, its own checklist and notice edits),
  // because Next keeps this page mounted while you go back to edit your details.
  const { input } = saved;
  const key = [input.name, input.company, input.amount, input.incidentDate, input.description].join("|");
  return <CaseView key={key} saved={saved} />;
}

function CaseView({ saved }: { saved: SavedCase }) {
  const [tab, setTab] = useState<Tab>("case");
  const { input, result: r } = saved;
  const covered = r.status === "covered";

  return (
    <main className="page case">
      <header className="brand-row">
        <Link href="/" className="brand">Hisaab</Link>
        <Link href="/" className="back">Edit my details</Link>
      </header>

      <section className="summary">
        <h1>{covered ? "Yes, this is covered" : "Not covered"}</h1>
        <p className="meta">
          {input.company} · {formatRupees(parseAmount(input.amount))} · {formatDate(input.incidentDate)}
        </p>
      </section>

      {covered ? (
        <>
          <div role="tablist" aria-label="Case sections" className="tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls={`panel-${t.id}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
            {tab === "case" && <CaseTab r={r} />}
            {tab === "notice" && r.notice && (
              <NoticeTab original={r.notice} company={input.company} source={r.source === "rules" ? "rules" : "ai"} />
            )}
            {tab === "next" && <NextStepsTab input={input} r={r} />}
          </div>
        </>
      ) : (
        <div className="tab-body">
          <p className="lede">{r.not_covered_reason || r.explanation}</p>
          {!!r.alternatives?.length && (
            <>
              <h2>Where else you could go</h2>
              <ul>{r.alternatives.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </>
          )}
          <Link href="/" className="button primary">Check another complaint</Link>
        </div>
      )}

      <p className="disclaimer">General legal information, not legal advice. Review your notice before sending it.</p>
    </main>
  );
}
