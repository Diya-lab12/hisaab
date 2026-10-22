"use client";
import Link from "next/link";
import IssueIcon from "./IssueIcon";
import { ISSUES } from "@/lib/issues";

/** On the home page the cards are links: choosing one starts the matching guided flow. */
export function SituationLinks() {
  return (
    <ul className="situations">
      {ISSUES.map((i) => (
        <li key={i.id}>
          <Link href={`/new?issue=${i.id}`} className="situation">
            <IssueIcon id={i.id} />
            <span className="t">{i.situation}</span>
            <span className="d">{i.blurb}</span>
          </Link>
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
