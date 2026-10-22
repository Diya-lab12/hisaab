"use client";
import { useId, useMemo, useState } from "react";
import { MAX_PER_SCOPE, addEvidence, forScope, removeEvidence, summarise, updateEvidence, useAllEvidence, type EvidenceImage } from "@/lib/evidence";
import { OTHER_SLOT, evidenceFor } from "@/lib/evidenceItems";
import { evidenceSummary, type CaseRecord } from "@/lib/cases";
import { issueLabel } from "@/lib/issues";
import type { CaseContext } from "@/lib/pictureCheck";
import { askAi, reviewPicture } from "@/lib/pictureReview";

export type EvidenceChange = { kind: "add" | "remove"; slot: string; count: number; names: string[] };

const SLOT = OTHER_SLOT.id;
const ITEM = { id: OTHER_SLOT.id, label: "Evidence", purpose: "to support your complaint" };
const WARN = new Set(["weak", "mismatch", "unreadable"]);
const CHIP: Record<string, string> = { match: "Looks right", weak: "Not sure", mismatch: "Check this one", unreadable: "Couldn't read text", photo: "Photo" };

function needsLook(img: EvidenceImage) {
  return img.review?.state === "done" && WARN.has(img.review.check.status) && !img.kept;
}

function PictureCard({ img, item, issue, onRemove }: { img: EvidenceImage; item: { id: string; label: string; purpose: string }; issue: string; onRemove: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const r = img.review;
  const ai = img.ai;
  const check = r?.state === "done" ? r.check : null;

  return (
    <li className="pic">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img.dataUrl} alt={`${item.label}: ${img.name}`} />
      <button type="button" className="pic-x" aria-label={`Remove ${img.name}`} onClick={onRemove}>×</button>
      <div className="pic-body">
        <span className="cap">{img.name}</span>

        {r?.state === "reading" && (
          <p className="pic-line" role="status"><span className="spin small" aria-hidden="true" /> Reading the text on your device…</p>
        )}
        {r?.state === "failed" && (
          <p className="pic-line">We couldn&apos;t read this picture on your device (the reader may not have loaded). It&apos;s still added. Check it&apos;s the right one.</p>
        )}
        {check && (
          <div className={`pic-result ${check.status}`}>
            <p className="pic-line"><span className={`chip ${check.status}`}>{CHIP[check.status]}</span> {check.headline}</p>
            {check.found.length > 0 && (
              <details className="pic-found">
                <summary>What we found</summary>
                <ul>{check.found.map((f, i) => <li key={i}>{f}</li>)}</ul>
                <p className="fine">Read on your device. The picture wasn&apos;t sent anywhere.</p>
              </details>
            )}
            {WARN.has(check.status) && !img.kept && (
              <div className="pic-actions">
                <button type="button" className="button small" onClick={() => updateEvidence(img.id, { kept: true })}>Keep it anyway</button>
                <span className="fine">or remove it with ×</span>
              </div>
            )}
            {img.kept && WARN.has(check.status) && <p className="fine">You chose to keep this picture.</p>}
          </div>
        )}

        {ai?.state === "done" && (
          <div className={`pic-ai ${ai.matches}`}>
            <p><strong>AI&apos;s view:</strong> {ai.description}</p>
            <p>{ai.matches === "yes" ? "It looks like the right picture." : ai.matches === "no" ? "It may not be the right picture." : "It couldn't tell."} {ai.reason}</p>
            <p className="fine">AI can be wrong. You decide what to keep.</p>
          </div>
        )}
        {ai?.state === "failed" && <p className="pic-line">{ai.message}</p>}
        {ai?.state === "asking" && <p className="pic-line" role="status"><span className="spin small" aria-hidden="true" /> Asking the AI…</p>}

        {!ai && !confirming && (
          <button type="button" className="link" onClick={() => setConfirming(true)}>Check with AI</button>
        )}
        {confirming && (
          <div className="ai-confirm" role="group" aria-label="Send this picture to the AI?">
            <p><strong>Send this one picture to an AI?</strong></p>
            <p>It goes to an AI service (OpenRouter, which passes it to a Google Gemini model) so it can describe what it shows. Hisaab doesn&apos;t store it. Before you send, make sure it doesn&apos;t show card numbers, UPI IDs, OTPs, passwords or other people&apos;s faces.</p>
            <div className="stack-row">
              <button
                type="button"
                className="button small primary"
                onClick={() => { setConfirming(false); void askAi(img, { slotLabel: item.label, purpose: item.purpose, issueLabel: issueLabel(issue) ?? "Complaint" }); }}
              >
                Send this picture
              </button>
              <button type="button" className="link" onClick={() => setConfirming(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * The evidence checklist for one case: each item can hold pictures. Pictures stay in this tab, and
 * the text in them is read on this device. A picture goes to the AI only if you ask for it.
 */
export default function EvidenceSlots({
  issue,
  scope,
  saved,
  context,
  onChange,
}: {
  issue: string;
  scope: string;
  saved?: CaseRecord["evidence"];
  context: CaseContext;
  onChange?: (c: EvidenceChange) => void;
}) {
  const all = useAllEvidence();
  const mine = useMemo(() => forScope(all, scope), [all, scope]);
  const [problems, setProblems] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const inputId = useId();
  const ctx: CaseContext = { ...context, issue };

  const haveAny = (saved?.[SLOT]?.count ?? 0) > 0 || Object.values(saved ?? {}).some((e) => e.count > 0);

  async function add(files: File[]) {
    if (!files.length) return;
    setBusy(true);
    const { problems: p, added } = await addEvidence(files, scope, SLOT);
    setProblems(p);
    const s = summarise(scope)[SLOT];
    onChange?.({ kind: "add", slot: SLOT, count: s?.count ?? 0, names: s?.names ?? [] });
    setBusy(false);
    for (const img of added) void reviewPicture(img, ctx); // reads on this device, one at a time
  }

  function remove(id: string) {
    removeEvidence(id);
    const s = summarise(scope)[SLOT];
    onChange?.({ kind: "remove", slot: SLOT, count: s?.count ?? 0, names: s?.names ?? [] });
  }

  const anyRemembered = mine.length === 0 && Object.values(saved ?? {}).some((e) => e.count > 0);
  const toCheck = mine.filter(needsLook).length;

  return (
    <div className="evidence">
      <p className="ev-summary" role="status">{evidenceSummary(issue, mine.length > 0 || haveAny)}</p>
      {toCheck > 0 && (
        <p className="callout warn" role="status">
          {toCheck} picture{toCheck > 1 ? "s don't" : " doesn't"} clearly match what the checklist asks for. Take a look below. You can keep any of them.
        </p>
      )}
      {anyRemembered && (
        <p className="callout warn">
          Some items show pictures you added on an earlier visit. Hisaab doesn&apos;t save pictures, so add them again if you want to attach them to an email or an evidence pack.
        </p>
      )}

      <div className="slot added">
        <div className="slot-head">
          <div>
            <strong>Pictures as evidence</strong>
            <span className={`chip ${mine.length ? "added" : "missing"}`}>{mine.length ? `${mine.length} added` : "Not added yet"}</span>
          </div>
          <div>
            <input
              id={inputId}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              disabled={busy || mine.length >= MAX_PER_SCOPE}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = "";
                void add(files);
              }}
            />
            <label htmlFor={inputId} className="button small">{busy ? "Adding…" : mine.length ? "Add more" : "Add pictures"}</label>
          </div>
        </div>
        <p className="slot-why">
          Add as many as you need at once: {evidenceFor(issue).map((i) => i.label.toLowerCase()).join(", ")}.
        </p>
        {mine.length > 0 && (
          <ul className="pics">
            {mine.map((img) => (
              <PictureCard key={img.id} img={img} item={ITEM} issue={issue} onRemove={() => remove(img.id)} />
            ))}
          </ul>
        )}
      </div>

      {problems.length > 0 && <ul className="problems" role="alert">{problems.map((p, i) => <li key={i}>{p}</li>)}</ul>}

      <aside className="private" aria-label="Privacy">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
        <div>
          <p><strong>Stays on this device.</strong> Pictures aren&apos;t uploaded or saved, and are cleared when you close the tab. Hisaab reads the text in them on your device. A picture leaves only if you choose &ldquo;Check with AI&rdquo; for it, or when you send your case to the advocate.</p>
          <details>
            <summary>What to hide first</summary>
            <ul>
              <li>Other people&apos;s faces and names.</li>
              <li>Middle digits of card numbers, your UPI ID, OTPs and passwords.</li>
              <li>On a bank statement, crop to the one payment.</li>
              <li>Anything that shows where you live, like a street sign.</li>
            </ul>
          </details>
          <details>
            <summary>How the on-device check works</summary>
            <p className="fine">A small text-reading program is downloaded once when you add your first picture (a few MB). Your picture is read by that program inside your browser. It checks for words, amounts and dates that fit the item. It can miss things or get things wrong, so it only warns you.</p>
          </details>
        </div>
      </aside>
    </div>
  );
}
