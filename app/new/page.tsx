"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ComplaintWizard from "@/components/ComplaintWizard";
import { useCase } from "@/lib/cases";
import { cleanIssue } from "@/lib/issues";
import { useHydrated } from "@/lib/hydrated";

function Loader() {
  const params = useSearchParams();
  const caseId = params.get("case");
  const issue = cleanIssue(params.get("issue"));
  const hydrated = useHydrated();
  const existing = useCase(caseId);

  if (!hydrated) return <p className="status">Loading…</p>;
  if (caseId && !existing) {
    return (
      <div className="panel narrow">
        <h2>We couldn&apos;t find that case</h2>
        <p className="help">It may have been deleted, saved in a different browser, or kept for a session that has ended. Cases are stored only on the device where you made them.</p>
        <Link href="/cases" className="button primary">Go to My cases</Link>
      </div>
    );
  }
  // The key restarts the form when you open a different case or pick a different situation.
  return <ComplaintWizard key={existing?.id ?? issue ?? "blank"} existing={existing} initial={existing ? existing.input : issue ? { issueType: issue } : undefined} />;
}

export default function NewComplaint() {
  return (
    <main className="page">
      <Suspense fallback={<p className="status">Loading…</p>}>
        <Loader />
      </Suspense>
    </main>
  );
}
