"use client";
import { useState } from "react";
import UpiQr from "./UpiQr";
import { reportPayment } from "@/lib/advocateClient";
import type { CaseRecord } from "@/lib/cases";
import { UTR, rupees, upiAccount, upiLink } from "@/lib/pricing";

/** Shown after the advocate has read the case and asked for her fee. The client pays by UPI and gives the transaction ID. */
export default function PayBox({ rec }: { rec: CaseRecord }) {
  const pay = rec.submission?.payment;
  const account = upiAccount();
  const [utr, setUtr] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  if (!pay || pay.verified || pay.amount <= 0) return null;

  if (pay.utr) {
    return (
      <div className="pay-box">
        <h3>Waiting for the advocate to confirm your payment</h3>
        <p>You told us you paid {rupees(pay.amount)} (transaction ID <code>{pay.utr}</code>). She confirms it when it shows in her account, then signs your notice and sends it to the company.</p>
      </div>
    );
  }
  if (!account) {
    return (
      <div className="pay-box">
        <h3>The advocate has asked for {rupees(pay.amount)}</h3>
        <p>She will email you how to pay.</p>
      </div>
    );
  }

  const link = upiLink(account, pay.amount, pay.ref);
  async function submit() {
    setBusy(true);
    setProblem(null);
    const r = await reportPayment(rec, utr.trim());
    if (!r.ok) setProblem(r.message);
    setBusy(false);
  }
  return (
    <div className="pay-box">
      <h3>Pay {rupees(pay.amount)} to go ahead</h3>
      <p>
        The advocate has read your case and can take it.
        {pay.items.length > 0 && <> The fee includes: {pay.items.map((i) => i.label.toLowerCase()).join(", ")}.</>}
      </p>
      <div className="pay-grid">
        <UpiQr link={link} />
        <div>
          <p>Scan the code with any UPI app, or pay to <strong>{account.id}</strong>.</p>
          <p>Put this in the payment note: <code>{pay.ref}</code></p>
          <p className="fine">On a phone, <a href={link}>open your UPI app</a>.</p>
        </div>
      </div>
      <label className="side-label" htmlFor="adv-utr">After paying, enter the 12-digit UPI transaction ID from your app</label>
      <input id="adv-utr" inputMode="numeric" maxLength={12} value={utr} onChange={(e) => setUtr(e.target.value.replace(/\D/g, ""))} aria-invalid={utr !== "" && !UTR.test(utr)} />
      <p className="fine">The advocate checks the payment in her account before she signs. If she can&apos;t go ahead with your case, you get a full refund.</p>
      {problem && <p className="callout warn" role="alert">{problem}</p>}
      <button type="button" className="primary" onClick={submit} disabled={busy || !UTR.test(utr)}>{busy ? "Sending…" : `I've paid ${rupees(pay.amount)}`}</button>
    </div>
  );
}
