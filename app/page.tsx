"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ComplaintForm, { EMPTY_INPUT } from "@/components/ComplaintForm";
import type { ComplaintInput } from "@/lib/checks";
import { saveCase, useSavedCase } from "@/lib/session";
import type { Result } from "@/lib/types";

export default function Describe() {
  const router = useRouter();
  const saved = useSavedCase();
  const [loading, setLoading] = useState(false);
  const [more, setMore] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function check(input: ComplaintInput) {
    setLoading(true);
    setMore(null);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await res.json()) as Result & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
      } else if (data.status === "need_more_info") {
        setMore(data.missing ?? []);
      } else {
        saveCase({ input, result: data });
        router.push("/case");
      }
    } catch {
      setError("Network problem. Your details are still here, so try again.");
    }
    setLoading(false);
  }

  return (
    <main className="page describe">
      <header className="brand">Hisaab</header>
      <div className="split">
        <section className="intro">
          <h1>Shortchanged? Find out if the law is on your side.</h1>
          <p className="lede">
            Tell us what the company did. Hisaab checks it against the Consumer Protection Act, 2019,
            explains what you can claim, and drafts your legal notice.
          </p>
          <ol className="steps">
            <li><strong>Describe</strong> what happened and what you paid.</li>
            <li><strong>See</strong> which sections apply and what to do next.</li>
            <li><strong>Send</strong> your notice by email, or download it.</li>
          </ol>
        </section>

        <section className="work">
          {/* Coming back from the case page keeps what she typed (the key remounts the form once it loads). */}
          <ComplaintForm
            key={saved ? "saved" : "new"}
            initial={saved?.input ?? EMPTY_INPUT}
            loading={loading}
            onSubmit={check}
            onInvalid={() => { setMore(null); setError(null); }}
          />
          {loading && <p className="status" aria-live="polite">Reading the Consumer Protection Act…</p>}
          {error && <p className="error" role="alert">{error}</p>}
          {more && (
            <div className="callout warn" role="status">
              <h2>We need a bit more information</h2>
              <ul>{more.map((m, i) => <li key={i}>{m}</li>)}</ul>
            </div>
          )}
        </section>
      </div>
      <p className="disclaimer">General legal information, not legal advice. Review your notice before sending it.</p>
    </main>
  );
}
