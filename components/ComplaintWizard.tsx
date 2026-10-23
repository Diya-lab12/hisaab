"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CheckingSteps from "./CheckingSteps";
import EvidenceSlots from "./EvidenceSlots";
import Field from "./Field";
import { IssuePicker } from "./SituationCards";
import Stepper from "./Stepper";
import WriteHelper from "./WriteHelper";
import { notCoveredMatch } from "@/lib/analyze";
import { blankInput, makeEvent, newId, saveCase, type CaseEvent, type CaseRecord, type StorageKind } from "@/lib/cases";
import { formatDate, formatRupees, parseAmount, type ComplaintInput } from "@/lib/checks";
import { NEW_SCOPE, forScope, rescopeEvidence, summarise, useAllEvidence } from "@/lib/evidence";
import { getIssue } from "@/lib/issues";
import { QUESTIONS, RESOLUTIONS, answerLines, resolutionLabel } from "@/lib/questions";
import type { Result } from "@/lib/types";
import { timingCheck } from "@/lib/timing";
import { STEP_FIELDS, checkAnswer, checkField, type FieldKey } from "@/lib/validate";
import { longDate } from "@/lib/deadlines";

const ALL_KEYS: FieldKey[] = ["issueType", "company", "legalName", "companyAddress", "companyCin", "companyEmail", "amount", "incidentDate", "resolution", "resolutionOther", "description", "name", "address", "contact"];
const STEP_KEYS: FieldKey[][] = [STEP_FIELDS.complaint, [], STEP_FIELDS.details, []];
const todayIso = () => new Date().toISOString().slice(0, 10);

type Saved = { where: "device" | "session" | "memory"; at: number } | null;

export default function ComplaintWizard({ initial, existing }: { initial?: Partial<ComplaintInput>; existing?: CaseRecord | null }) {
  const router = useRouter();
  const [v, setV] = useState<ComplaintInput>({ ...blankInput(), ...initial, answers: { ...(initial?.answers ?? {}) } });
  const [rec, setRec] = useState<CaseRecord | null>(existing ?? null);
  const [step, setStep] = useState(existing ? (existing.result ? 3 : Math.min(existing.step, 3)) : 0);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [storage, setStorage] = useState<StorageKind>(existing?.storage ?? "device");
  const [loading, setLoading] = useState(false);
  const [more, setMore] = useState<string[] | null>(null);
  const [extra, setExtra] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [outside, setOutside] = useState<Result | null>(null);
  const [saved, setSaved] = useState<Saved>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const scope = rec?.id ?? NEW_SCOPE;
  const all = useAllEvidence();
  const pictures = useMemo(() => forScope(all, scope), [all, scope]);

  useEffect(() => {
    heading.current?.focus();
  }, [step, outside]);

  const issue = getIssue(v.issueType);
  const checks = useMemo(() => {
    const out = {} as Record<FieldKey, ReturnType<typeof checkField>>;
    for (const k of ALL_KEYS) out[k] = checkField(k, v);
    return out;
  }, [v]);
  const timing = useMemo(() => timingCheck(v), [v]);
  const questions = useMemo(() => (issue ? QUESTIONS[issue.id] : []), [issue]);
  const answerErrors = useMemo(() => {
    const out: Record<string, string | null> = {};
    for (const q of questions) out[q.id] = checkAnswer(q, v.answers?.[q.id] ?? "").error;
    return out;
  }, [questions, v.answers]);

  const touch = (...ks: string[]) => setTouched((t) => new Set([...t, ...ks]));
  const shown = (k: FieldKey) => (touched.has(k) ? checks[k] : { error: null, note: null });
  const isValid = (k: FieldKey) => touched.has(k) && !checks[k].error && ((v[k] as string | undefined) ?? "").trim() !== "";
  const text = (k: FieldKey) => ({
    value: (v[k] as string | undefined) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value }),
    onBlur: () => touch(k),
  });
  const setAnswer = (id: string, value: string) => setV({ ...v, answers: { ...v.answers, [id]: value } });

  function pickIssue(id: string) {
    const keep = new Set(QUESTIONS[id as keyof typeof QUESTIONS].map((q) => q.id));
    const answers = Object.fromEntries(Object.entries(v.answers ?? {}).filter(([k]) => keep.has(k)));
    setV({ ...v, issueType: id, answers });
    touch("issueType");
  }

  function focusField(k: string) {
    if (k === "issueType") document.querySelector<HTMLInputElement>('input[name="issue"]')?.focus();
    else if (k === "resolution") document.querySelector<HTMLInputElement>('input[name="resolution"]')?.focus();
    else document.getElementById(k.startsWith("a:") ? `a-${k.slice(2)}` : `f-${k}`)?.focus();
  }

  /** Saves (or updates) this case, without running the analysis. */
  function persist(patch: Partial<CaseRecord>, events: CaseEvent[] = []): CaseRecord {
    const id = rec?.id ?? newId();
    const now = new Date().toISOString();
    const base: CaseRecord =
      rec ?? {
        id, createdAt: now, updatedAt: now, storage, issue: v.issueType ?? "", input: v, result: null, noticeText: "",
        status: "draft", followUpDate: "", events: [makeEvent("created", "Case started")], evidence: {}, step,
      };
    const mem = summarise(rec?.id ?? NEW_SCOPE);
    const next: CaseRecord = {
      ...base, ...patch, id, storage, issue: v.issueType ?? "", input: patch.input ?? v, step: Math.max(base.step, step),
      evidence: { ...base.evidence, ...mem }, events: [...base.events, ...events],
    };
    const where = saveCase(next);
    rescopeEvidence(NEW_SCOPE, id);
    setRec(next);
    setSaved({ where, at: Date.now() });
    return next;
  }

  function saveDraft() {
    if (!v.issueType) {
      touch("issueType");
      setStep(0);
      setTimeout(() => focusField("issueType"), 50);
      return;
    }
    persist({});
  }

  async function submit(opts: { extra?: string; proceed?: boolean } = {}) {
    setLoading(true);
    setMore(null);
    setError(null);
    // Anything the person adds in answer to the AI's questions becomes part of their description.
    const payload: ComplaintInput = opts.extra?.trim() ? { ...v, description: `${v.description.trim()}\n\nMore detail: ${opts.extra.trim()}` } : v;
    if (payload !== v) {
      setV(payload);
      setExtra("");
    }
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, proceed: opts.proceed === true }), // text fields only: pictures never leave the browser
      });
      const data = (await res.json()) as Result & { error?: string };
      if (!res.ok) setError(data.error ?? "Something went wrong. Your answers are still here, so try again.");
      else if (data.status === "need_more_info") setMore(data.missing ?? []);
      else if (data.status === "not_covered") setOutside(data);
      else {
        const regenerated = Boolean(rec?.result);
        const saved = persist(
          {
            input: payload,
            result: data,
            noticeText: data.notice ?? "",
            status: rec && rec.status !== "draft" && rec.status !== "ready" ? rec.status : "ready",
            step: 3,
          },
          [makeEvent(regenerated ? "regenerated" : "generated", regenerated ? "Complaint regenerated from your updated answers" : "Notice drafted. An advocate reviews and signs it before it is sent")],
        );
        router.push(`/case?id=${saved.id}`);
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
    touch(...keys, ...(step === 0 ? questions.map((q) => `a:${q.id}`) : []));
    const badField = keys.find((k) => checks[k].error);
    const badAnswer = step === 0 ? questions.find((q) => answerErrors[q.id]) : undefined;
    const first = badField ?? (badAnswer ? `a:${badAnswer.id}` : undefined);
    if (first) {
      focusField(first);
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

  if (outside) {
    return (
      <div className="wizard">
        <div className="panel">
          <h2 ref={heading} tabIndex={-1}>This looks outside the Consumer Protection Act</h2>
          <p className="lede">{outside.not_covered_reason || outside.explanation}</p>
          {!!outside.alternatives?.length && (
            <>
              <h3>Where else you could go</h3>
              <ul>{outside.alternatives.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </>
          )}
          <p className="fine">This is general information based on what you wrote. If you think we misunderstood, edit your answers.</p>
          <div className="nav">
            <button type="button" className="ghost" onClick={() => setOutside(null)}>Edit my answers</button>
            <Link href="/" className="button primary">Start something else</Link>
          </div>
        </div>
      </div>
    );
  }

  const issueError = shown("issueType").error;
  const nextLabel = step === 1 && pictures.length === 0 ? "Skip for now" : step === 2 ? "Review" : "Continue";
  const dateLabel = issue?.dateLabel ?? "When did it happen?";
  const wanted = resolutionLabel(v.resolution, v.resolutionOther);

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
            <h2 ref={heading} tabIndex={-1}>{issue ? "Tell us about it" : "What happened?"}</h2>
            <p className="help">Pick the closest match. The questions below change to fit it.</p>
            <IssuePicker value={v.issueType ?? ""} onChange={pickIssue} error={issueError} />

            {issue && (
              <>
                <h3 className="group">The basics</h3>
                <Field id="f-company" label="Company name" error={shown("company").error} valid={isValid("company")} hint="The company you paid, for example Swiggy or IndiGo.">
                  {(b) => <input {...b} {...text("company")} placeholder="e.g. Swiggy" autoComplete="organization" />}
                </Field>
                <fieldset className="company-details">
                  <legend>Who exactly is the company?</legend>
                  <p className="fine">
                    For companies. A brand name (like Zara) is often not the legal entity. If you bought from a person or a small shop, put their name and address in the fields below instead.
                  </p>
                  <Field id="f-legalName" label="Legal name of the company" note={shown("legalName").note} valid={isValid("legalName")} hint="For example “… Private Limited”. Leave it blank if you can't find it. The advocate will check.">
                    {(b) => <input {...b} {...text("legalName")} placeholder="as on your invoice or the company's Terms page" autoComplete="off" />}
                  </Field>
                  <Field id="f-companyAddress" label="Registered office address (optional)" hint="A notice can go to a company's registered office by registered post, speed post or courier (Companies Act, 2013, Section 20).">
                    {(b) => <textarea {...b} {...text("companyAddress")} rows={2} />}
                  </Field>
                  <div className="row">
                    <Field id="f-companyCin" label="CIN (optional)" note={shown("companyCin").note} hint="21 characters, printed on the company's bills and letters.">
                      {(b) => <input {...b} {...text("companyCin")} autoComplete="off" />}
                    </Field>
                    <Field id="f-companyEmail" label="Company email (optional)" error={shown("companyEmail").error} hint="A grievance or legal contact.">
                      {(b) => <input {...b} {...text("companyEmail")} type="email" autoComplete="off" />}
                    </Field>
                  </div>
                  <details className="more">
                    <summary>Where do I find these?</summary>
                    <p className="fine">
                      Look at your invoice, the order confirmation, or the company&apos;s Terms and Contact pages. A company must print its name, registered office address and CIN on its bills and letters (Companies Act, 2013, Section 12), and online platforms must show their legal name, address and a grievance officer (Consumer Protection (E-Commerce) Rules, 2020). A registered company&apos;s name ends in &ldquo;Limited&rdquo; or &ldquo;Private Limited&rdquo; (Section 4). The Ministry of Corporate Affairs also lets you look up company details by name on its website.
                    </p>
                  </details>
                </fieldset>

                <div className="row">
                  <Field
                    id="f-amount"
                    label="Amount involved (₹)"
                    error={shown("amount").error}
                    valid={isValid("amount")}
                    hint={parseAmount(v.amount) > 0 ? `That's ${formatRupees(parseAmount(v.amount))}.` : "Just the number, like 1200."}
                  >
                    {(b) => <input {...b} {...text("amount")} inputMode="numeric" placeholder="1200" />}
                  </Field>
                  <Field id="f-incidentDate" label={dateLabel} error={shown("incidentDate").error} note={shown("incidentDate").note} valid={isValid("incidentDate")} hint={issue.dateHint}>
                    {(b) => <input {...b} {...text("incidentDate")} type="date" max={todayIso()} />}
                  </Field>
                </div>

                <h3 className="group">A few specifics <span>(optional, but they make your complaint clearer)</span></h3>
                {questions.map((q) => {
                  const val = v.answers?.[q.id] ?? "";
                  const err = touched.has(`a:${q.id}`) ? answerErrors[q.id] : null;
                  const common = { value: val, onBlur: () => touch(`a:${q.id}`) };
                  return (
                    <Field key={q.id} id={`a-${q.id}`} label={q.label} error={err} valid={Boolean(val) && !err && touched.has(`a:${q.id}`)} hint={q.hint}>
                      {(b) =>
                        q.type === "select" ? (
                          <select {...b} {...common} onChange={(e) => setAnswer(q.id, e.target.value)}>
                            <option value="">Choose…</option>
                            {q.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        ) : q.type === "textarea" ? (
                          <textarea {...b} {...common} rows={3} placeholder={q.placeholder} onChange={(e) => setAnswer(q.id, e.target.value)} />
                        ) : (
                          <input {...b} {...common} type={q.type} max={q.type === "date" ? todayIso() : undefined} placeholder={q.placeholder} onChange={(e) => setAnswer(q.id, e.target.value)} />
                        )
                      }
                    </Field>
                  );
                })}

                {timing.state === "too_early" && timing.dueIso && (
                  <p className="callout warn" role="status">
                    <strong>It may be too early for a notice.</strong> {timing.basis} That gives the company until {longDate(timing.dueIso)} ({timing.daysLeft === 0 ? "today is its last day" : `${timing.daysLeft} day${timing.daysLeft === 1 ? "" : "s"} left`}). You can still prepare everything now. Hisaab will hold the advocate review until then, unless they have already refused in writing.
                  </p>
                )}
                {timing.state === "ready" && timing.dueIso && (
                  <p className="callout" role="status">
                    <strong>The company&apos;s time has passed.</strong> {timing.basis} It ended on {longDate(timing.dueIso)}, so a notice is reasonable now.
                  </p>
                )}
                {timing.state === "refused" && (
                  <p className="callout" role="status"><strong>No waiting needed.</strong> {timing.basis}</p>
                )}

                <fieldset className="seg" aria-describedby="res-msg">
                  <legend>What would you like the company to do?</legend>
                  <div className="seg-row">
                    {RESOLUTIONS.map((r) => (
                      <label key={r.value} className={v.resolution === r.value ? "on" : ""}>
                        <input
                          type="radio"
                          name="resolution"
                          value={r.value}
                          checked={v.resolution === r.value}
                          onChange={() => { setV({ ...v, resolution: r.value }); touch("resolution"); }}
                        />
                        {r.label}
                      </label>
                    ))}
                  </div>
                  <p id="res-msg" className={shown("resolution").error ? "msg error" : "msg"} role={shown("resolution").error ? "alert" : undefined}>
                    {shown("resolution").error ?? "This is your request. Asking for it doesn't mean you're legally entitled to it."}
                  </p>
                </fieldset>
                {v.resolution === "other" && (
                  <Field id="f-resolutionOther" label="What would you like instead?" error={shown("resolutionOther").error} valid={isValid("resolutionOther")}>
                    {(b) => <input {...b} {...text("resolutionOther")} placeholder="e.g. cancel the extra charge" />}
                  </Field>
                )}

                <h3 className="group">In your own words</h3>
                <Field
                  id="f-description"
                  label="What happened?"
                  error={shown("description").error}
                  valid={isValid("description")}
                  hint={v.description.trim().length >= 10 ? `${v.description.trim().length} characters. Add what the company said, if you can.` : "What you bought, what went wrong, and what the company said."}
                >
                  {(b) => <textarea {...b} {...text("description")} rows={5} placeholder={issue.example} />}
                </Field>
                <WriteHelper value={v.description} issueLabel={issue.label} onUse={(t) => setV((cur) => ({ ...cur, description: t }))} />
                <p className="fine">What you write here and in the answers above is sent to an AI to check your case. Your name, address, contact details and pictures are not. (A picture is sent only if you choose &ldquo;Check with AI&rdquo; for it.)</p>
              </>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <h2 ref={heading} tabIndex={-1}>Build your evidence</h2>
            <p className="help">
              Add a picture for each item you have. You can check your case without them, but the email button unlocks only once you&apos;ve added at least one.
            </p>
            <EvidenceSlots issue={v.issueType ?? "other"} scope={scope} saved={rec?.evidence} context={{ company: v.company, amount: v.amount }} />
          </>
        )}

        {step === 2 && (
          <>
            <h2 ref={heading} tabIndex={-1}>Your details</h2>
            <p className="help">These go on your complaint so the company knows who is writing. They are not sent to the AI.</p>
            <Field id="f-name" label="Full name" error={shown("name").error} valid={isValid("name")}>
              {(b) => <input {...b} {...text("name")} autoComplete="name" />}
            </Field>
            <Field id="f-address" label="Address" error={shown("address").error} valid={isValid("address")} hint="House or flat, area, city and PIN code.">
              {(b) => <textarea {...b} {...text("address")} rows={3} autoComplete="street-address" />}
            </Field>
            <Field id="f-contact" label="Email or mobile number" error={shown("contact").error} valid={isValid("contact")} hint="So the company can reply to you.">
              {(b) => <input {...b} {...text("contact")} autoComplete="email" />}
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <h2 ref={heading} tabIndex={-1}>Check everything</h2>
            <p className="help">When it looks right, we&apos;ll read your complaint against the Consumer Protection Act, 2019 and draft it for you to review.</p>
            <dl className="review">
              {[
                { label: "Problem", value: issue?.situation ?? "", to: 0 },
                { label: "Brand or trade name", value: v.company, to: 0 },
                { label: "Legal name", value: v.legalName?.trim() || "Not provided. The advocate will confirm it.", to: 0 },
                { label: "Registered office", value: v.companyAddress?.trim() || "Not provided", to: 0 },
                { label: "Amount", value: v.amount ? formatRupees(parseAmount(v.amount)) : "", to: 0 },
                { label: dateLabel, value: v.incidentDate ? formatDate(v.incidentDate) : "", to: 0 },
                ...answerLines(v.issueType ?? "", v.answers).map((l) => ({ label: l.label, value: l.value, to: 0 })),
                { label: "You'd like", value: wanted, to: 0 },
                { label: "What happened", value: v.description, to: 0 },
                { label: "Evidence", value: pictures.length ? `${pictures.length} picture${pictures.length > 1 ? "s" : ""}, kept on your device` : "None yet. Email stays locked until you add one.", to: 1 },
                { label: "Name", value: v.name, to: 2 },
                { label: "Address", value: v.address, to: 2 },
                { label: "Contact", value: v.contact, to: 2 },
              ].map((r, i) => (
                <div key={r.label + i} className="rv-row">
                  <dt>{r.label}</dt>
                  <dd>{r.value || <em>Missing</em>}</dd>
                  <button type="button" className="link" onClick={() => setStep(r.to)} aria-label={`Edit ${r.label}`}>Edit</button>
                </div>
              ))}
            </dl>

            <fieldset className="store">
              <legend>Where should we keep this case?</legend>
              <label className={storage === "device" ? "on" : ""}>
                <input type="radio" name="storage" checked={storage === "device"} onChange={() => setStorage("device")} />
                <span><strong>Save on this device</strong><br /><span className="fine">Reopen it later from My cases. Stored in this browser only: it doesn&apos;t sync to other devices, and clearing browser data deletes it. Avoid this on a shared computer.</span></span>
              </label>
              <label className={storage === "session" ? "on" : ""}>
                <input type="radio" name="storage" checked={storage === "session"} onChange={() => setStorage("session")} />
                <span><strong>This session only</strong><br /><span className="fine">Nothing is kept once you close this tab.</span></span>
              </label>
              <p className="fine">Pictures are never saved, either way.</p>
            </fieldset>

            {rec?.result && rec.noticeText !== rec.result.notice && (
              <p className="callout warn">You edited your complaint earlier. Checking again writes a new draft and replaces those edits.</p>
            )}
            {more && (
              <div className="callout warn" role="status">
                <strong>The AI would like a little more detail</strong>
                <p className="fine">Answer below if you can, or carry on without. Either way is fine, and the advocate checks everything before it goes out.</p>
                <ul>{more.map((m, i) => <li key={i}>{m}</li>)}</ul>
                <label className="side-label" htmlFor="more-extra">Your answer (optional)</label>
                <textarea id="more-extra" rows={4} value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="Type whatever you know. Short is fine." />
                <div className="stack-row">
                  <button type="button" className="button small primary" disabled={!extra.trim() || loading} onClick={() => void submit({ extra })}>Add this and check again</button>
                  <button type="button" className="button small" disabled={loading} onClick={() => void submit({ proceed: true })}>Continue without answering</button>
                  <button type="button" className="link" onClick={() => setStep(0)}>Edit my answers</button>
                </div>
              </div>
            )}
          </>
        )}

        {error && <p className="error" role="alert">{error}</p>}
        {loading && <CheckingSteps />}
      </div>

      <div className="nav">
        {step > 0 ? <button type="button" className="ghost" onClick={() => setStep(step - 1)} disabled={loading}>Back</button> : <span />}
        <button type="submit" className="cta" disabled={loading}>
          {step === 3 ? (loading ? "Checking…" : "Check my case") : nextLabel}
        </button>
      </div>

      <div className="draftbar">
        <button type="button" className="link" onClick={saveDraft} disabled={loading}>Save draft</button>
        <span className="fine" role="status">
          {saved
            ? saved.where === "memory"
              ? "Couldn't save in this browser. Your draft is kept only while this tab is open."
              : saved.where === "session"
                ? "Draft saved for this session only."
                : <>Draft saved on this device. <Link href="/cases">See My cases</Link></>
            : "Saves on this device (choose session-only on the last step)."}
        </span>
      </div>
    </form>
  );
}
