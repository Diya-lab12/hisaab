"use client";
import { useState } from "react";
import { rewriteComplaint } from "@/lib/assistClient";

/** "Help me write this": the person can type in any language and get a clear English account to use or ignore. */
export default function WriteHelper({ value, issueLabel, onUse }: { value: string; issueLabel: string; onUse: (text: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const enough = value.trim().length >= 10;

  async function run() {
    setBusy(true);
    setProblem(null);
    setSuggestion(null);
    const r = await rewriteComplaint(value, issueLabel);
    if (r.ok) setSuggestion(r.text);
    else setProblem(r.message);
    setBusy(false);
  }

  return (
    <div className="write-helper">
      <div className="stack-row">
        <button type="button" className="button small" onClick={run} disabled={!enough || busy}>{busy ? "Writing…" : "Help me write this"}</button>
        <span className="fine">Type in any language, even Hindi or Kannada. We&apos;ll turn it into a clear English account.</span>
      </div>
      {problem && <p className="msg error" role="alert">{problem}</p>}
      {suggestion && (
        <div className="callout" role="status">
          <p><strong>Suggested wording</strong></p>
          <p className="suggestion">{suggestion}</p>
          <p className="fine">Check that every fact, date and amount is right. The AI can make mistakes.</p>
          <div className="stack-row">
            <button type="button" className="button small primary" onClick={() => { onUse(suggestion); setSuggestion(null); }}>Use this</button>
            <button type="button" className="link" onClick={() => setSuggestion(null)}>Keep mine</button>
          </div>
        </div>
      )}
    </div>
  );
}
