"use client";
import { useId } from "react";
import NoticeLetterhead from "./NoticeLetterhead";
import { BLANK_DEFS } from "@/lib/facts";
import { splitTemplate } from "@/lib/noticeBlanks";

/**
 * The notice as a document. Facts the story didn't give are highlighted blanks: each says why it is needed,
 * and filling one updates the notice in place. "Edit the full text" switches to a plain text box instead.
 */
export default function NoticeDoc({
  template, values, onValue, override, onOverride, plain,
}: {
  template: string;
  values: Record<string, string>;
  onValue: (key: string, v: string) => void;
  override: string | null;
  onOverride: (text: string | null) => void;
  /** The template filled with the values so far, blanks left as lines. */
  plain: string;
}) {
  const id = useId();
  const parts = splitTemplate(template);
  return (
    <div>
      <div className="stack-row notice-tools">
        {override === null ? (
          <button type="button" className="button small" onClick={() => onOverride(plain)}>Edit the full text</button>
        ) : (
          <button type="button" className="button small" onClick={() => { if (window.confirm("Go back to the blanks view? Your text edits will be lost.")) onOverride(null); }}>Back to blanks</button>
        )}
        <span className="fine">{override === null ? "Highlighted blanks are facts we still need. Hover or focus one to see why." : "You're editing the text directly. The blanks are no longer linked."}</span>
      </div>
      <div className="a4">
        <NoticeLetterhead />
        {override === null ? (
          <div className="a4-doc" aria-label="Legal notice with blanks to fill">
            {parts.map((p, i) =>
              p.key ? (
                <span key={i} className="blank-wrap">
                  <input
                    className="blank"
                    value={values[p.key] ?? ""}
                    onChange={(e) => onValue(p.key!, e.target.value)}
                    placeholder={BLANK_DEFS[p.key].placeholder}
                    aria-label={BLANK_DEFS[p.key].label}
                    aria-describedby={`${id}-${p.key}`}
                    size={Math.max((values[p.key] ?? "").length, BLANK_DEFS[p.key].placeholder.length, 8)}
                  />
                  <span role="tooltip" id={`${id}-${p.key}`} className="blank-tip">{BLANK_DEFS[p.key].why}</span>
                </span>
              ) : (
                <span key={i}>{p.text}</span>
              ),
            )}
          </div>
        ) : (
          <textarea className="a4-edit" value={override} onChange={(e) => onOverride(e.target.value)} aria-label="Notice, editable text" spellCheck rows={22} />
        )}
        <span className="a4-watermark" aria-hidden="true">Draft, not yet reviewed</span>
      </div>
    </div>
  );
}
