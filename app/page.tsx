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
      <header className="hero">
        <h1 className="wordmark">Hisaab</h1>
        <p className="tagline">Get your money back.</p>
      </header>

      <section className="work">
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
      <p className="disclaimer">General legal information, not legal advice. Review your notice before sending it.</p>
    </main>
  );
}
