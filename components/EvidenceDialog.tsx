"use client";
import { useEffect, useRef } from "react";

/** A pop-up for adding evidence, so the checklist isn't repeated on the page. Esc or Done closes it. */
export default function EvidenceDialog({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="ev-dialog-h"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); // a click on the dimmed area
      }}
    >
      <div className="modal-in">
        <div className="modal-head">
          <h2 id="ev-dialog-h">Your evidence</h2>
          <button type="button" className="button small primary" onClick={onClose}>Done</button>
        </div>
        {open && children}
      </div>
    </dialog>
  );
}
