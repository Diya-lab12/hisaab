"use client";
import IssueIcon from "./IssueIcon";
import { STARTERS } from "@/lib/facts";
import { ISSUES } from "@/lib/issues";

/** On the home page the cards are shortcuts: choosing one puts a starter sentence in the story box above. */
export function SituationLinks() {
  function pick(id: string) {
    window.dispatchEvent(new CustomEvent("claimatic:prefill", { detail: STARTERS[id as keyof typeof STARTERS] }));
    document.getElementById("home-story")?.scrollIntoView({ block: "center" });
  }
  return (
    <ul className="situations">
      {ISSUES.map((i) => (
        <li key={i.id}>
          <button type="button" className="situation" onClick={() => pick(i.id)}>
            <IssueIcon id={i.id} />
            <span className="t">{i.situation}</span>
            <span className="d">{i.blurb}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Inside the flow the same cards act as a radio group. */
export function IssuePicker({ value, onChange, error }: { value: string; onChange: (id: string) => void; error?: string | null }) {
  return (
    <fieldset className="issues" aria-describedby={error ? "issue-err" : undefined}>
      <legend>What happened?</legend>
      <div className="cards">
        {ISSUES.map((i) => (
          <label key={i.id} className={`issue ${value === i.id ? "picked" : ""}`}>
            <input type="radio" name="issue" value={i.id} checked={value === i.id} onChange={() => onChange(i.id)} />
            <IssueIcon id={i.id} />
            <span className="t">{i.situation}</span>
            <span className="d">{i.blurb}</span>
          </label>
        ))}
      </div>
      {error && <p id="issue-err" className="msg error" role="alert">{error}</p>}
    </fieldset>
  );
}
