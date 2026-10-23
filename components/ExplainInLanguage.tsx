"use client";
import { useState } from "react";
import { LANG_LABEL, explainResult, type Lang } from "@/lib/assistClient";
import type { Result } from "@/lib/types";

/** Explains the verdict in plain words in Hindi or Kannada. Only the result is sent to the AI, never the person's details. */
export default function ExplainInLanguage({ result }: { result: Result }) {
  const [busy, setBusy] = useState<Lang | null>(null);
  const [shown, setShown] = useState<{ lang: Lang; text: string } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  async function run(lang: Lang) {
    setBusy(lang);
    setProblem(null);
    const r = await explainResult(lang, {
      explanation: result.explanation ?? "",
      sections: (result.sections ?? []).map((s) => `Section ${s.id}: ${s.why}`),
      relief: result.relief ?? [],
      steps: result.steps ?? [],
    });
    if (r.ok) setShown({ lang, text: r.text });
    else setProblem(r.message);
    setBusy(null);
  }

  return (
    <div className="explain">
      <div className="stack-row">
        <span className="side-label">Explain this in simple words:</span>
        {(["hi", "kn", "en"] as Lang[]).map((l) => (
          <button key={l} type="button" className="button small" onClick={() => run(l)} disabled={busy !== null}>
            {busy === l ? "Writing…" : LANG_LABEL[l]}
          </button>
        ))}
      </div>
      {problem && <p className="msg error" role="alert">{problem}</p>}
      {shown && (
        <div className="callout" role="status" lang={shown.lang}>
          <p className="suggestion">{shown.text}</p>
          <p className="fine">Written by AI from the result above, so it can make mistakes. Only the result was sent, not your details.</p>
        </div>
      )}
    </div>
  );
}
