"use client";
import { useId, useState } from "react";
import { MAX_IMAGES, addEvidence, clearEvidence, removeEvidence, useEvidence } from "@/lib/evidence";

export default function EvidenceUploader({
  suggestions,
  suggestionsLabel,
  compact = false,
}: {
  suggestions?: string[];
  suggestionsLabel?: string;
  compact?: boolean;
}) {
  const images = useEvidence();
  const [problems, setProblems] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const id = useId();
  const full = images.length >= MAX_IMAGES;

  async function take(files: File[]) {
    if (!files.length) return;
    setBusy(true);
    setProblems(await addEvidence(files));
    setBusy(false);
  }

  return (
    <div className="evidence">
      {!compact && !!suggestions?.length && (
        <div className="suggest">
          <p><strong>Pictures that help</strong>{suggestionsLabel ? ` for a ${suggestionsLabel.toLowerCase()} complaint` : ""}</p>
          <ul>{suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}

      <input
        id={id}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        disabled={busy || full}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = ""; // allows picking the same file again
          void take(files);
        }}
      />
      <label
        htmlFor={id}
        className={`drop ${over ? "over" : ""} ${full ? "full" : ""} ${compact ? "small" : ""}`}
        onDragOver={(e) => { e.preventDefault(); if (!full) setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (!full) void take(Array.from(e.dataTransfer.files));
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <path d="M12 16V5m0 0l-4 4m4-4l4 4M5 19h14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="drop-t">
          {busy ? "Adding…" : full ? `You've added the maximum of ${MAX_IMAGES}` : compact ? "Add pictures" : "Drop pictures here, or choose files"}
        </span>
        {!compact && <span className="drop-d">Screenshots and photos, JPG or PNG. Up to {MAX_IMAGES}.</span>}
      </label>

      {problems.length > 0 && <ul className="problems" role="alert">{problems.map((p, i) => <li key={i}>{p}</li>)}</ul>}

      {images.length > 0 && (
        <>
          <div className="thumb-head">
            <span>{images.length} of {MAX_IMAGES} added</span>
            <button type="button" className="link" onClick={() => { clearEvidence(); setProblems([]); }}>Remove all</button>
          </div>
          <ul className="thumbs">
            {images.map((img) => (
              <li key={img.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.dataUrl} alt={`Evidence: ${img.name}`} />
                <span className="cap">{img.name}</span>
                <button type="button" aria-label={`Remove ${img.name}`} onClick={() => removeEvidence(img.id)}>×</button>
              </li>
            ))}
          </ul>
        </>
      )}

      {!compact && (
        <aside className="private" aria-label="Privacy">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          <div>
            <p><strong>Stays on your device.</strong> Pictures are never uploaded, stored or sent to the AI. Close the tab and they&apos;re gone. We also remove hidden location data from photos.</p>
            <details>
              <summary>What to hide first</summary>
              <ul>
                <li>Other people&apos;s faces and names.</li>
                <li>Middle digits of card numbers, your UPI ID, OTPs and passwords.</li>
                <li>On a bank statement, crop to the one payment.</li>
                <li>Anything in the picture that shows where you live, like a street sign.</li>
                <li>You send them yourself, only to the company&apos;s grievance email.</li>
              </ul>
            </details>
          </div>
        </aside>
      )}
    </div>
  );
}
