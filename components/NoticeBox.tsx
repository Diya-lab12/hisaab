"use client";
import { useRef, useState } from "react";

export default function NoticeBox({ notice, source }: { notice: string; source: "ai" | "rules" }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  function selectNotice() {
    const el = preRef.current;
    if (!el) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }

  async function copy() {
    setMsg(null);
    let ok = false;
    try {
      await navigator.clipboard.writeText(notice);
      ok = true;
    } catch {
      // Older or restricted browsers: select the text and use the legacy copy command.
      selectNotice();
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      selectNotice();
      setMsg("Couldn't copy automatically. The notice is selected: press Ctrl+C (Cmd+C on Mac).");
    }
  }

  return (
    <section className="notice">
      <div className="notice-head">
        <h3>Your legal notice</h3>
        <button type="button" onClick={copy}>{copied ? "Copied!" : "Copy"}</button>
      </div>
      <p className="draft-note">
        {source === "ai" ? "Draft written by AI from what you told us." : "Draft built from a basic template."}{" "}
        Check every fact before you send it.
      </p>
      {msg && <p className="warn" role="status">{msg}</p>}
      <pre ref={preRef}>{notice}</pre>
    </section>
  );
}
