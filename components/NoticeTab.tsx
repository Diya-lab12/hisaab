"use client";
import { useEffect, useRef, useState } from "react";
import { downloadDocx, downloadPdf, looksLikeEmail, mailtoHref, safeName } from "@/lib/export";

export default function NoticeTab({
  original,
  company,
  source,
}: {
  original: string;
  company: string;
  source: "ai" | "rules";
}) {
  const [text, setText] = useState(original);
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<"pdf" | "docx" | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const edited = text !== original;

  // Grow the sheet to fit its text, so the page scrolls instead of the box.
  useEffect(() => {
    const fit = () => {
      const el = area.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = el.scrollHeight + 2 + "px";
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [text]);
  const emailOk = looksLikeEmail(email);

  async function copy() {
    setMsg(null);
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      // Restricted browsers: select the text and use the legacy copy command.
      area.current?.select();
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
      area.current?.select();
      setMsg("Couldn't copy automatically. The notice is selected: press Ctrl+C (Cmd+C on Mac).");
    }
  }

  async function save(kind: "pdf" | "docx") {
    setMsg(null);
    setBusy(kind);
    try {
      if (kind === "pdf") await downloadPdf(text, safeName(company));
      else await downloadDocx(text, safeName(company));
    } catch {
      setMsg("Couldn't create the file. Use Copy and paste it into a document instead.");
    }
    setBusy(null);
  }

  return (
    <div className="tab-body">
      <p className="fine">
        {source === "ai" ? "Draft written by AI from what you told us." : "Draft built from a basic template."}{" "}
        Read it and fix anything that isn&apos;t true before you send it. You can edit it right here.
      </p>

      <div className="toolbar" role="group" aria-label="Notice actions">
        <button type="button" onClick={copy}>{copied ? "Copied!" : "Copy"}</button>
        <button type="button" onClick={() => save("pdf")} disabled={busy !== null}>{busy === "pdf" ? "Making PDF…" : "Download PDF"}</button>
        <button type="button" onClick={() => save("docx")} disabled={busy !== null}>{busy === "docx" ? "Making Word file…" : "Download Word"}</button>
        {edited && <button type="button" className="quiet" onClick={() => setText(original)}>Undo my edits</button>}
      </div>
      {msg && <p className="callout warn" role="status">{msg}</p>}

      <div className="paper">
        <label className="sr-only" htmlFor="notice-text">Legal notice, editable</label>
        <textarea
          id="notice-text"
          ref={area}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={16}
          spellCheck
        />
      </div>

      <div className="send">
        <h2>Send it by email</h2>
        <label>
          Company&apos;s grievance email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="grievance@company.com" />
        </label>
        <p className="fine">
          Find this on the company&apos;s website or app, under Contact, Terms or Grievance Officer. We don&apos;t guess it for you.
        </p>
        {emailOk ? (
          <a className="button primary" href={mailtoHref(email, text)}>Open in my email app</a>
        ) : (
          <button type="button" className="primary" disabled>Open in my email app</button>
        )}
        <p className="fine">
          This opens your email app with the notice filled in. You press send. If it doesn&apos;t open, use Copy.
          For proof, also post a printed copy by registered post with acknowledgement due.
        </p>
      </div>
    </div>
  );
}
