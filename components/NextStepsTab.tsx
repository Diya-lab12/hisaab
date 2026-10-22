"use client";
import { useState } from "react";
import { daysFromToday, filingLimitIso, longDate, replyDueIso, toIso } from "@/lib/deadlines";
import { downloadIcs, safeName } from "@/lib/export";
import type { ComplaintInput } from "@/lib/checks";
import type { Result } from "@/lib/types";
import { NOTICE_DEADLINE_DAYS } from "@/lib/config";

export default function NextStepsTab({ input, r }: { input: ComplaintInput; r: Result }) {
  const evidence = r.evidence ?? [];
  const storeKey = `hisaab-checklist-${input.company}-${input.incidentDate}`;
  // This tab only renders in the browser, so reading the date and saved ticks here is safe.
  const [sendDate, setSendDate] = useState(() => toIso(new Date()));
  const [done, setDone] = useState<boolean[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storeKey) ?? "[]");
      return evidence.map((_, i) => Boolean(saved[i]));
    } catch {
      return evidence.map(() => false);
    }
  });

  function toggle(i: number) {
    const next = evidence.map((_, k) => (k === i ? !done[k] : Boolean(done[k])));
    setDone(next);
    try {
      localStorage.setItem(storeKey, JSON.stringify(next));
    } catch {
      /* the checklist still works for this visit */
    }
  }

  const due = sendDate ? replyDueIso(sendDate) : "";
  const limit = filingLimitIso(input.incidentDate);
  const daysToLimit = daysFromToday(limit);
  const have = done.filter(Boolean).length;

  return (
    <div className="tab-body">
      <h2>Deadlines</h2>
      <div className="deadline">
        <label>
          I will send the notice on
          <input type="date" value={sendDate} onChange={(e) => setSendDate(e.target.value)} />
        </label>
        {due && (
          <>
            <p className="big">{longDate(due)}</p>
            <p className="fine">That is {NOTICE_DEADLINE_DAYS} days after you send it. If the company has not fixed things by then, you can file.</p>
            <button
              type="button"
              onClick={() =>
                downloadIcs(
                  {
                    title: `Hisaab: ${input.company} reply due`,
                    description: `The ${NOTICE_DEADLINE_DAYS}-day deadline in your legal notice to ${input.company} ends today. If they have not resolved it, consider filing with the District Commission.`,
                    dateIso: due,
                  },
                  safeName(input.company) + "-reminder",
                )
              }
            >
              Add a reminder to my calendar
            </button>
          </>
        )}
      </div>

      <div className={`callout ${daysToLimit < 0 ? "warn" : ""}`}>
        <strong>Last day to file: {longDate(limit)}.</strong>{" "}
        {daysToLimit < 0
          ? "That date has passed. Under Section 69 the Commission can refuse a late complaint unless you show a good reason for the delay."
          : `Under Section 69 a complaint must normally be filed within two years of the incident. That is ${daysToLimit} days from today.`}
      </div>

      <h2>Evidence to gather{r.industry ? ` (${r.industry.label.toLowerCase()})` : ""}</h2>
      <p className="fine">{have} of {evidence.length} ready. Tick items as you collect them.</p>
      <ul className="checklist">
        {evidence.map((item, i) => (
          <li key={i}>
            <label>
              <input type="checkbox" checked={Boolean(done[i])} onChange={() => toggle(i)} />
              <span>{item}</span>
            </label>
          </li>
        ))}
      </ul>

      {!!r.tips?.length && (
        <>
          <h2>Practical tips</h2>
          <p className="fine">General guidance, not part of the Act.</p>
          <ul>{r.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </>
      )}
    </div>
  );
}
