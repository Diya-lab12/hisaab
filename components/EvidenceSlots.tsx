"use client";
import { useId, useMemo, useState } from "react";
import { MAX_PER_SCOPE, addEvidence, forScope, removeEvidence, summarise, useAllEvidence } from "@/lib/evidence";
import { OTHER_SLOT, evidenceFor, slotLabel } from "@/lib/evidenceItems";
import { evidenceSummary, type CaseRecord } from "@/lib/cases";

export type EvidenceChange = { kind: "add" | "remove"; slot: string; count: number; names: string[] };

/**
 * The evidence checklist for one case: each item can hold pictures. Pictures stay in this tab only.
 * `saved` holds counts remembered from an earlier visit; those pictures are gone and must be added again.
 */
export default function EvidenceSlots({
  issue,
  scope,
  saved,
  onChange,
}: {
  issue: string;
  scope: string;
  saved?: CaseRecord["evidence"];
  onChange?: (c: EvidenceChange) => void;
}) {
  const all = useAllEvidence();
  const mine = useMemo(() => forScope(all, scope), [all, scope]);
  const [problems, setProblems] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const baseId = useId();
  const items = [...evidenceFor(issue), OTHER_SLOT];

  const inMemory = (id: string) => mine.filter((m) => m.slot === id);
  const rememberedOnly = (id: string) => inMemory(id).length === 0 && (saved?.[id]?.count ?? 0) > 0;
  const haveAny = (id: string) => inMemory(id).length > 0 || (saved?.[id]?.count ?? 0) > 0;

  async function add(slot: string, files: File[]) {
    if (!files.length) return;
    setBusy(slot);
    setProblems(await addEvidence(files, scope, slot));
    const s = summarise(scope)[slot];
    onChange?.({ kind: "add", slot, count: s?.count ?? 0, names: s?.names ?? [] });
    setBusy(null);
  }

  function remove(slot: string, id: string) {
    removeEvidence(id);
    const s = summarise(scope)[slot];
    onChange?.({ kind: "remove", slot, count: s?.count ?? 0, names: s?.names ?? [] });
  }

  const anyRemembered = items.some((i) => rememberedOnly(i.id));

  return (
    <div className="evidence">
      <p className="ev-summary" role="status">{evidenceSummary(issue, haveAny)}</p>
      {anyRemembered && (
        <p className="callout warn">
          Some items show pictures you added on an earlier visit. Hisaab doesn&apos;t save pictures, so add them again if you want to attach them to an email or an evidence pack.
        </p>
      )}

      <ul className="slots">
        {items.map((item) => {
          const imgs = inMemory(item.id);
          const inputId = `${baseId}-${item.id}`;
          const state = imgs.length ? "added" : rememberedOnly(item.id) ? "earlier" : "missing";
          return (
            <li key={item.id} className={`slot ${state}`}>
              <div className="slot-head">
                <div>
                  <strong>{item.label}</strong>
                  <span className={`chip ${state}`}>
                    {state === "added" ? `${imgs.length} added` : state === "earlier" ? "Added earlier, add again" : "Not added yet"}
                  </span>
                </div>
                <div>
                  <input
                    id={inputId}
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    disabled={busy !== null || mine.length >= MAX_PER_SCOPE}
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      e.target.value = "";
                      void add(item.id, files);
                    }}
                  />
                  <label htmlFor={inputId} className="button small">{busy === item.id ? "Adding…" : imgs.length ? "Add another" : "Add picture"}</label>
                </div>
              </div>
              {state !== "added" && <p className="slot-why">Add this {item.purpose}.</p>}
              {imgs.length > 0 && (
                <ul className="thumbs">
                  {imgs.map((img) => (
                    <li key={img.id}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.dataUrl} alt={`${slotLabel(issue, item.id)}: ${img.name}`} />
                      <span className="cap">{img.name}</span>
                      <button type="button" aria-label={`Remove ${img.name}`} onClick={() => remove(item.id, img.id)}>×</button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      {problems.length > 0 && <ul className="problems" role="alert">{problems.map((p, i) => <li key={i}>{p}</li>)}</ul>}

      <aside className="private" aria-label="Privacy">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
        <div>
          <p><strong>Stays on this device.</strong> Pictures are never uploaded, saved or sent to the AI, and are cleared when you close the tab. Hidden location data is removed from photos.</p>
          <details>
            <summary>What to hide first</summary>
            <ul>
              <li>Other people&apos;s faces and names.</li>
              <li>Middle digits of card numbers, your UPI ID, OTPs and passwords.</li>
              <li>On a bank statement, crop to the one payment.</li>
              <li>Anything that shows where you live, like a street sign.</li>
            </ul>
          </details>
        </div>
      </aside>
    </div>
  );
}
