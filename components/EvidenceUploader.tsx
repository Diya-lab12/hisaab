"use client";
import { useId, useRef, useState } from "react";
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
  const input = useRef<HTMLInputElement>(null);
  const id = useId();

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // lets the same file be picked again later
    if (!files.length) return;
    setBusy(true);
    setProblems(await addEvidence(files));
    setBusy(false);
  }

  return (
    <div className="evidence">
      {!compact && !!suggestions?.length && (
        <>
          <p className="fine"><strong>Good pictures to add</strong>{suggestionsLabel ? ` (${suggestionsLabel})` : ""}:</p>
          <ul className="suggest">{suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </>
      )}

      <div className="pickrow">
        <input
          ref={input}
          id={id}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={onPick}
          disabled={busy || images.length >= MAX_IMAGES}
        />
        <label htmlFor={id} className={`button ${images.length >= MAX_IMAGES ? "disabled" : ""}`}>
          {busy ? "Adding…" : images.length ? "Add more pictures" : "Add pictures"}
        </label>
        <span className="fine">{images.length} of {MAX_IMAGES} added</span>
        {images.length > 0 && (
          <button type="button" className="quiet" onClick={() => { clearEvidence(); setProblems([]); }}>Remove all</button>
        )}
      </div>

      {problems.length > 0 && (
        <ul className="problems" role="alert">{problems.map((p, i) => <li key={i}>{p}</li>)}</ul>
      )}

      {images.length > 0 && (
        <ul className="thumbs">
          {images.map((img) => (
            <li key={img.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.dataUrl} alt={`Evidence: ${img.name}`} />
              <button type="button" aria-label={`Remove ${img.name}`} onClick={() => removeEvidence(img.id)}>×</button>
            </li>
          ))}
        </ul>
      )}

      {!compact && (
        <details className="privacy" open>
          <summary>Keep your pictures private</summary>
          <ul>
            <li><strong>Your pictures stay in this browser tab.</strong> Hisaab doesn&apos;t upload or store them, and they are never sent to the AI. Close or refresh the tab and they are gone.</li>
            <li>Hide what the company doesn&apos;t need: other people&apos;s names and faces, the middle digits of card numbers, your UPI ID or full phone number, OTPs, and any password. Crop a bank statement to the one payment.</li>
            <li>Photos from your phone can hide your location. Hisaab re-saves each picture without it, but check it isn&apos;t visible in the picture itself, such as a street sign.</li>
            <li>You send the pictures yourself, only to the company&apos;s grievance email.</li>
          </ul>
        </details>
      )}
    </div>
  );
}
