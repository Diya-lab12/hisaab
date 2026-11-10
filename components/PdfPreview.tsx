"use client";
import { useRef, useState } from "react";
import { noticePdfBlob } from "@/lib/export";

/** Shows the notice as a PDF in a pop-up before it is downloaded. */
export default function PdfPreview({ text }: { text: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function open() {
    setBusy(true);
    setProblem(null);
    try {
      const blob = await noticePdfBlob(text);
      setUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(blob);
      });
      dialog.current?.showModal();
    } catch {
      setProblem("Couldn't make the preview. You can still download the PDF.");
    }
    setBusy(false);
  }

  function release() {
    setUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
  }

  return (
    <>
      <button type="button" onClick={open} disabled={busy}>{busy ? "Preparing…" : "Preview PDF"}</button>
      {problem && <span className="msg error" role="alert">{problem}</span>}
      <dialog ref={dialog} className="modal pdf-modal" aria-labelledby="pdf-prev-h" onClose={release} onClick={(e) => { if (e.target === e.currentTarget) dialog.current?.close(); }}>
        <div className="modal-in">
          <div className="modal-head">
            <h2 id="pdf-prev-h">PDF preview</h2>
            <button type="button" className="button small primary" onClick={() => dialog.current?.close()}>Done</button>
          </div>
          {url && <iframe className="pdf-frame" src={url} title="PDF preview of your notice" />}
          {url && <p className="fine">If the preview is blank on your phone, <a href={url} target="_blank" rel="noreferrer">open the PDF in a new tab</a>.</p>}
        </div>
      </dialog>
    </>
  );
}
