"use client";
import { useEffect, useRef, useState } from "react";
import EvidenceUploader from "./EvidenceUploader";
import { useEvidence } from "@/lib/evidence";
import { useHydrated } from "@/lib/session";
import {
  canShareFiles,
  downloadDocx,
  downloadEvidencePdf,
  downloadPdf,
  evidencePdfBlob,
  looksLikeEmail,
  mailtoHref,
  noticePdfBlob,
  safeName,
  shareFiles,
} from "@/lib/export";

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
  const [busy, setBusy] = useState<"pdf" | "docx" | "evidence" | "share" | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const images = useEvidence();
  const hydrated = useHydrated();
  const hasEvidence = images.length > 0;
  const shareable = hydrated && hasEvidence && canShareFiles();
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

  async function saveEvidence() {
    setMsg(null);
    setBusy("evidence");
    try {
      await downloadEvidencePdf(images, company, safeName(company).replace("Legal-notice", "Evidence-pack"));
    } catch {
      setMsg("Couldn't create the evidence pack. Try removing a large picture and adding it again.");
    }
    setBusy(null);
  }

  async function shareAll() {
    setMsg(null);
    setBusy("share");
    try {
      const base = safeName(company);
      const files = [
        new File([await noticePdfBlob(text)], base + ".pdf", { type: "application/pdf" }),
        new File([await evidencePdfBlob(images, company)], base.replace("Legal-notice", "Evidence-pack") + ".pdf", { type: "application/pdf" }),
      ];
      const ok = await shareFiles(files, "Legal notice", "Legal notice and evidence");
      if (!ok) setMsg("Sharing was cancelled or isn't available here. Use the download buttons and attach the files yourself.");
    } catch {
      setMsg("Couldn't prepare the files to share. Use the download buttons instead.");
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

        <h3>1. Your evidence</h3>
        {hasEvidence ? (
          <p className="fine">{images.length} picture{images.length > 1 ? "s" : ""} ready. They stay in this browser tab only.</p>
        ) : (
          <p className="callout warn" role="status">
            Add at least one picture of your evidence to unlock the email button. A notice with proof is much harder to ignore.
          </p>
        )}
        <EvidenceUploader compact />
        {hasEvidence && (
          <button type="button" onClick={saveEvidence} disabled={busy !== null}>
            {busy === "evidence" ? "Making evidence pack…" : "Download evidence pack (PDF)"}
          </button>
        )}

        <h3>2. The company&apos;s email</h3>
        <label>
          Company&apos;s grievance email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="grievance@company.com" />
        </label>
        <p className="fine">
          Find this on the company&apos;s website or app, under Contact, Terms or Grievance Officer. We don&apos;t guess it for you.
        </p>

        <h3>3. Send</h3>
        {hasEvidence && emailOk ? (
          <a className="button primary" href={mailtoHref(email, text)}>Open in my email app</a>
        ) : (
          <button type="button" className="primary" disabled>Open in my email app</button>
        )}
        {!hasEvidence && <p className="fine">Locked until you add a picture.</p>}
        {hasEvidence && !emailOk && <p className="fine">Locked until you enter a valid company email.</p>}
        {shareable && (
          <button type="button" onClick={shareAll} disabled={busy !== null}>
            {busy === "share" ? "Preparing…" : "Share notice + evidence (attaches both files)"}
          </button>
        )}
        <p className="fine">
          Email links can&apos;t attach files by themselves. After your email app opens, attach the two PDFs you downloaded: your notice and the evidence pack, then press send.
          For proof, also post a printed copy by registered post with acknowledgement due.
        </p>
      </div>
    </div>
  );
}
