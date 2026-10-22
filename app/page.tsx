"use client";
import { useState } from "react";
import ComplaintForm from "@/components/ComplaintForm";
import ResultCard, { Result } from "@/components/ResultCard";
import type { ComplaintInput } from "@/lib/checks";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function check(input: ComplaintInput) {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Something went wrong.");
      else setResult(data);
    } catch {
      setError("Network problem. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Hisaab</h1>
      <p className="lead">Describe what a company did wrong. We tell you whether the Consumer Protection Act, 2019 covers it and draft your legal notice.</p>
      <ComplaintForm
        loading={loading}
        onSubmit={check}
        onInvalid={() => {
          setResult(null);
          setError(null);
        }}
      />
      {loading && <p className="loading" aria-live="polite">Reading the Consumer Protection Act…</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {result && <ResultCard r={result} />}
      <p className="disclaimer">This is general legal information, not legal advice. Please review the notice before sending it.</p>
    </main>
  );
}
