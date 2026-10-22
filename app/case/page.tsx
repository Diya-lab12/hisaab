"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import CaseWorkspace from "@/components/CaseWorkspace";
import { useCase } from "@/lib/cases";
import { useHydrated } from "@/lib/hydrated";

function Loader() {
  const id = useSearchParams().get("id");
  const hydrated = useHydrated();
  const rec = useCase(id);

  if (!hydrated) return <p className="status">Loading your case…</p>;
  if (!rec) {
    return (
      <div className="panel narrow">
        <h2>We couldn&apos;t find this case</h2>
        <p className="help">
          Cases are saved only in the browser where you made them. It may have been deleted, opened in a different browser, or kept for a session that has ended.
        </p>
        <div className="actions">
          <Link href="/cases" className="button primary">Go to My cases</Link>
          <Link href="/new" className="btn-secondary">Start a new complaint</Link>
        </div>
      </div>
    );
  }
  return <CaseWorkspace key={rec.id} rec={rec} />;
}

export default function CasePage() {
  return (
    <main className="page case-page">
      <Suspense fallback={<p className="status">Loading your case…</p>}>
        <Loader />
      </Suspense>
    </main>
  );
}
