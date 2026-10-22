"use client";
import { useState } from "react";
import { daysFromToday, filingLimitIso, longDate, replyDueIso, toIso } from "@/lib/deadlines";
import { downloadIcs, safeName } from "@/lib/export";
import type { ComplaintInput } from "@/lib/checks";
import type { Result } from "@/lib/types";
import { NOTICE_DEADLINE_DAYS } from "@/lib/config";

export default function NextStepsTab({ input, r }: { input: ComplaintInput; r: Result }) {
  // This tab only renders in the browser, so reading today's date here is safe.
  const [sendDate, setSendDate] = useState(() => toIso(new Date()));

  const due = sendDate ? replyDueIso(sendDate) : "";
  const limit = filingLimitIso(input.incidentDate);
  const daysToLimit = daysFromToday(limit);

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
