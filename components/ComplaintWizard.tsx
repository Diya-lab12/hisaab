"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import EvidenceUploader from "./EvidenceUploader";
import Field from "./Field";
import IssueCards from "./IssueCards";
import Stepper from "./Stepper";
import { notCoveredMatch } from "@/lib/analyze";
import { INDUSTRIES, industryFor } from "@/lib/categories";
import { formatDate, formatRupees, parseAmount, type ComplaintInput } from "@/lib/checks";
import { useEvidence } from "@/lib/evidence";
import { ISSUES, issueLabel } from "@/lib/issues";
import { saveCase } from "@/lib/session";
import type { Result } from "@/lib/types";
import { STEP_FIELDS, checkField, type FieldKey } from "@/lib/validate";

export const EMPTY_INPUT: ComplaintInput = {
  name: "", address: "", contact: "", company: "", amount: "", incidentDate: "", description: "", issueType: "",
};

const ALL_KEYS: FieldKey[] = ["issueType", "company", "amount", "incidentDate", "description", "name", "address", "contact"];
const STEP_KEYS: FieldKey[][] = [STEP_FIELDS.complaint, [], STEP_FIELDS.details, []];
const todayIso = () => new Date().toISOString().slice(0, 10);

export default function ComplaintWizard({ initial, startStep }: { initial?: ComplaintInput; startStep: number }) {
  const router = useRouter();
  const images = useEvidence();
  const [v, setV] = useState<ComplaintInput>({ ...EMPTY_INPUT, ...initial });
  const [step, setStep] = useState(startStep);
  const [touched, setTouched] = useState<Set<FieldKey>>(new Set());
  const [loading, setLoading] = useState(false);
  const [more, setMore] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  // Move focus to the new step's heading so keyboard and screen-reader users land in the right place.
  useEffect(() => {
    heading.current?.focus({ preventScroll: false });
  }, [step]);

  const checks = useMemo(() => {
    const out = {} as Record<FieldKey, ReturnType<typeof checkField>>;
    for (const k of ALL_KEYS) out[k] = checkField(k, v);
    return out;
  }, [v]);

  const shown = (k: FieldKey) => (touched.has(k) ? checks[k] : { error: null, note: null });
  const isValid = (k: FieldKey) => touched.has(k) && !checks[k].error && (v[k] ?? "").trim() !== "";
  const touch = (...ks: FieldKey[]) => setTouched((t) => new Set([...t, ...ks]));
  const bind = (k: FieldKey) => ({
    value: v[k] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value }),
    onBlur: () => touch(k),
  });

  const issue = ISSUES.find((i) => i.id === v.issueType);
  const industry = INDUSTRIES[industryFor(v.company, v.description, issue?.fallbackIndustry ?? "other")];

  function focusField(k: FieldKey) {
    if (k === "issueType") document.querySelector<HTMLInputElement>('input[name="issue"]')?.focus();
    else document.getElementById(`f-${k}`)?.focus();
  }

  async function submit() {
    setLoading(true);
    setMore(null);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v), // text fields only: pictures never leave the browser
      });
      const data = (await res.json()) as Result & { error?: string };
      if (!res.ok) setError(data.error ?? "Something went wrong. Your answers are still here, so try again.");
      else if (data.status === "need_more_info") setMore(data.missing ?? []);
      else {
        saveCase({ input: v, result: data });
        router.push("/case");
      }
    } catch {
      setError("Network problem. Your answers are still here, so try again.");
    }
    setLoading(false);
  }

  function next() {
    // A complaint that is clearly not a consumer matter (a neighbour, an employer) gets its answer straight away.
    if (step === 0 && v.description.trim() && notCoveredMatch(v.description)) {
      void submit();
      return;
    }
    const keys = STEP_KEYS[step];
    touch(...keys);
    const bad = keys.find((k) => checks[k].error);
    if (bad) {
      focusField(bad);
      return;
    }
    setStep(step + 1);
  }

  function finish() {
    touch(...ALL_KEYS);
    for (let s = 0; s < STEP_KEYS.length; s++) {
      const bad = STEP_KEYS[s].find((k) => checks[k].error);
      if (bad) {
        setStep(s);
        setTimeout(() => focusField(bad), 50);
        return;
      }
    }
    void submit();
  }

  const issueError = shown("issueType").error;
  const nextLabel = step === 1 && images.length === 0 ? "Skip for now" : step === 2 ? "Review" : "Continue";

  return (
    <form
      className="wizard"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (loading) return;
        if (step === 3) finish();
        else next();
      }}
    >
      <Stepper current={step} onJump={(i) => i < step && setStep(i)} />

      <div className="panel" key={step}>
        {step === 0 && (
          <>
            <h2 ref={heading} tabIndex={-1}>What happened?</h2>
            <p className="help">Pick the closest match, then tell us the details. You can change it later.</p>
            <IssueCards value={v.issueType ?? ""} onChange={(id) => { setV({ ...v, issueType: id }); touch("issueType"); }} error={issueError} />

            <Field id="f-company" label="Company name" error={shown("company").error} valid={isValid("company")} hint="The company you paid, for example Swiggy or IndiGo.">
              {(b) => <input {...b} {...bind("company")} placeholder="e.g. Swiggy" autoComplete="organization" />}
            </Field>
            <div className="row">
              <Field
                id="f-amount"
                label="Amount paid (₹)"
                error={shown("amount").error}
                valid={isValid("amount")}
                hint={parseAmount(v.amount) > 0 ? `That's ${formatRupees(parseAmount(v.amount))}.` : "Just the number, like 1200."}
              >
                {(b) => <input {...b} {...bind("amount")} inputMode="numeric" placeholder="1200" />}
              </Field>
              <Field
                id="f-incidentDate"
                label="When did it happen?"
                error={shown("incidentDate").error}
                note={shown("incidentDate").note}
                valid={isValid("incidentDate")}
                hint="An approximate date is fine."
              >
                {(b) => <input {...b} {...bind("incidentDate")} type="date" max={todayIso()} />}
              </Field>
            </div>
            <Field
              id="f-description"
              label="What happened, in your own words"
              error={shown("description").error}
              valid={isValid("description")}
              hint={
                v.description.trim().length >= 10
                  ? `${v.description.trim().length} characters. Add what the company said, if you can.`
                  : "What you bought, what went wrong, and what the company said."
              }
            >
              {(b) => <textarea {...b} {...bind("description")} rows={5} placeholder={issue?.example ?? "Swiggy charged me ₹1,200 for an order that never arrived and refuses to refund."} />}
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <h2 ref={heading} tabIndex={-1}>Add your evidence</h2>
            <p className="help">
              Pictures make your notice much harder to ignore. You can check your case without them, but the email button unlocks only once you&apos;ve added at least one.
            </p>
            <EvidenceUploader suggestions={industry.evidence} suggestionsLabel={industry.label} />
          </>
        )}

        {step === 2 && (
          <>
            <h2 ref={heading} tabIndex={-1}>Your details</h2>
            <p className="help">These go on your notice so the company knows who is writing. They are not sent to the AI.</p>
            <Field id="f-name" label="Full name" error={shown("name").error} valid={isValid("name")}>
              {(b) => <input {...b} {...bind("name")} autoComplete="name" />}
            </Field>
            <Field id="f-address" label="Address" error={shown("address").error} valid={isValid("address")} hint="House or flat, area, city and PIN code.">
              {(b) => <textarea {...b} {...bind("address")} rows={3} autoComplete="street-address" />}
            </Field>
            <Field id="f-contact" label="Email or mobile number" error={shown("contact").error} valid={isValid("contact")} hint="So the company can reply to you.">
              {(b) => <input {...b} {...bind("contact")} autoComplete="email" />}
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <h2 ref={heading} tabIndex={-1}>Check everything</h2>
            <p className="help">When it looks right, we&apos;ll read your complaint against the Consumer Protection Act, 2019.</p>
            <dl className="review">
              {[
                { label: "Problem", value: issueLabel(v.issueType) ?? "", to: 0 },
                { label: "Company", value: v.company, to: 0 },
                { label: "Amount", value: formatRupees(parseAmount(v.amount)), to: 0 },
                { label: "Date", value: v.incidentDate ? formatDate(v.incidentDate) : "", to: 0 },
                { label: "What happened", value: v.description, to: 0 },
                { label: "Evidence", value: images.length ? `${images.length} picture${images.length > 1 ? "s" : ""}, kept on your device` : "None yet. Email stays locked until you add one.", to: 1 },
                { label: "Name", value: v.name, to: 2 },
                { label: "Address", value: v.address, to: 2 },
                { label: "Contact", value: v.contact, to: 2 },
              ].map((r) => (
                <div key={r.label} className="rv-row">
                  <dt>{r.label}</dt>
                  <dd>{r.value || <em>Missing</em>}</dd>
                  <button type="button" className="link" onClick={() => setStep(r.to)} aria-label={`Edit ${r.label}`}>Edit</button>
                </div>
              ))}
            </dl>
            {more && (
              <div className="callout warn" role="status">
                <strong>We need a bit more information</strong>
                <ul>{more.map((m, i) => <li key={i}>{m}</li>)}</ul>
                <button type="button" className="link" onClick={() => setStep(0)}>Edit my complaint</button>
              </div>
            )}
          </>
        )}

        {error && <p className="error" role="alert">{error}</p>}

        {loading && (
          <div className="checking" role="status" aria-live="polite">
            <span className="spin" aria-hidden="true" />
            <div>
              <strong>Reading the Consumer Protection Act…</strong>
              <p>This takes a few seconds.</p>
            </div>
          </div>
        )}
      </div>

      <div className="nav">
        {step > 0 ? (
          <button type="button" className="ghost" onClick={() => setStep(step - 1)} disabled={loading}>Back</button>
        ) : <span />}
        <button type="submit" className="cta" disabled={loading}>
          {step === 3 ? (loading ? "Checking…" : "Check my case") : nextLabel}
        </button>
      </div>
    </form>
  );
}
