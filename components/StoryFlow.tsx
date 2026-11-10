"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CaseCard from "./CaseCard";
import CheckingSteps from "./CheckingSteps";
import DataNote from "./DataNote";
import EvidenceStep from "./EvidenceStep";
import Field from "./Field";
import NoticeDoc from "./NoticeDoc";
import { STORY_KEY } from "./StoryBox";
import Stepper from "./Stepper";
import WriteHelper from "./WriteHelper";
import { makeEvent, newId, saveCase, type CaseEvent, type CaseRecord, type StorageKind } from "@/lib/cases";
import { filingInfo, parseAmount, type ComplaintInput } from "@/lib/checks";
import { NEW_SCOPE, forScope, rescopeEvidence, summarise, useAllEvidence } from "@/lib/evidence";
import { BLANK_DEFS, EMPTY_FACTS, STARTERS, type Facts } from "@/lib/facts";
import { cleanIssue, getIssue } from "@/lib/issues";
import { lookupCompany } from "@/lib/companies";
import { buildNoticeTemplate, emptyBlanks, fillTemplate } from "@/lib/noticeBlanks";
import type { Result } from "@/lib/types";
import { checkField } from "@/lib/validate";

const LAST = 4;
const TITLES = ["Tell us what happened", "Here's your case", "Your notice", "Add your evidence", "Send it to the advocate"];
const BUTTONS = ["Check my case", "Draft my notice", "Add evidence", "Continue", "Save and send"];

type Saved = { where: "device" | "session" | "memory"; at: number } | null;

function factsFromInput(i: ComplaintInput): Facts {
  return { issueType: cleanIssue(i.issueType) || "other", company: i.company, amount: i.amount.replace(/[^\d]/g, ""), incidentDate: i.incidentDate, resolution: i.resolution ?? "", orderRef: "" } as Facts;
}

function hasKeptStory(): boolean {
  try {
    return (sessionStorage.getItem(STORY_KEY) ?? "").trim().length >= 15;
  } catch {
    return false;
  }
}

function startingStory(issue?: string): string {
  try {
    const kept = sessionStorage.getItem(STORY_KEY);
    if (kept) return kept;
  } catch {
    /* storage can be blocked */
  }
  const i = issue ? getIssue(issue) : undefined;
  return i ? STARTERS[i.id] : "";
}

export default function StoryFlow({ existing, issue }: { existing?: CaseRecord | null; issue?: string }) {
  const router = useRouter();
  const f0 = existing?.flow;
  const [story, setStory] = useState(() => f0?.story ?? (existing ? existing.input.description : startingStory(issue)));
  const [facts, setFacts] = useState<Facts>(() => f0?.facts ?? (existing ? factsFromInput(existing.input) : EMPTY_FACTS));
  const [result, setResult] = useState<Result | null>(f0?.result ?? null);
  const [noticeBody, setNoticeBody] = useState(f0?.noticeBody ?? "");
  const [blanks, setBlanks] = useState<Record<string, string>>(f0?.blanks ?? {});
  const [override, setOverride] = useState<string | null>(null);
  const [checkedStory, setCheckedStory] = useState(f0?.result ? f0.story : "");
  const [step, setStep] = useState(f0?.result ? Math.min(Math.max(existing?.step ?? 1, 1), LAST) : 0);
  const [rec, setRec] = useState<CaseRecord | null>(existing ?? null);
  const [storage] = useState<StorageKind>(existing?.storage ?? "device");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outside, setOutside] = useState<Result | null>(null);
  const [touched, setTouched] = useState(false);
  const [saved, setSaved] = useState<Saved>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const scope = rec?.id ?? NEW_SCOPE;
  const all = useAllEvidence();
  const pictureCount = useMemo(() => forScope(all, scope).length, [all, scope]);

  // Arriving from the home page with a story: run the check straight away, so the person sees the verdict first.
  const auto = useRef(!existing && hasKeptStory());
  useEffect(() => {
    if (auto.current) {
      auto.current = false;
      void runCheck();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A case made with the older long form already has its notice, so it opens as a case.
  const oldCase = Boolean(existing?.result && !existing.flow);
  useEffect(() => {
    if (oldCase && existing) router.replace(`/case?id=${existing.id}`);
  }, [oldCase, existing, router]);
  useEffect(() => {
    heading.current?.focus();
  }, [step, outside]);

  const company = useMemo(() => lookupCompany(facts.company), [facts.company]);
  const template = useMemo(
    () => (result?.status === "covered" ? buildNoticeTemplate(facts, company, noticeBody, (result.sections ?? []).map((s) => s.id)) : ""),
    [facts, company, noticeBody, result],
  );
  const plain = useMemo(() => fillTemplate(template, blanks), [template, blanks]);
  const missing = useMemo(() => emptyBlanks(template, blanks).filter((k) => !["client_name", "client_address", "client_contact"].includes(k)), [template, blanks]);

  const toInput = (): ComplaintInput => {
    const date = facts.incidentDate || (/^\d{4}-\d{2}-\d{2}$/.test(blanks.incident_date ?? "") ? blanks.incident_date : "");
    return {
      name: blanks.client_name?.trim() ?? "",
      address: blanks.client_address?.trim() ?? "",
      contact: blanks.client_contact?.trim() ?? "",
      company: facts.company.trim() || blanks.company_name?.trim() || "",
      amount: facts.amount || (blanks.amount ?? "").replace(/[^\d]/g, ""),
      incidentDate: date,
      description: story,
      issueType: facts.issueType,
      resolution: facts.resolution,
      answers: {},
    };
  };
  const detailChecks = (["name", "address", "contact"] as const).map((k) => ({ k, ...checkField(k, toInput()) }));
  const flowState = () => ({ story, facts, result, noticeBody, blanks });

  /** Saves (or updates) this case. Pictures are moved over to it, and stay only in this tab. */
  function persist(patch: Partial<CaseRecord>, events: CaseEvent[] = []): CaseRecord {
    const id = rec?.id ?? newId();
    const now = new Date().toISOString();
    const input = patch.input ?? toInput();
    const base: CaseRecord =
      rec ?? {
        id, createdAt: now, updatedAt: now, storage, issue: facts.issueType, input, result: null, noticeText: "",
        status: "draft", followUpDate: "", events: [makeEvent("created", "Case started")], evidence: {}, step,
      };
    const mem = summarise(rec?.id ?? NEW_SCOPE);
    const next: CaseRecord = {
      ...base, ...patch, id, storage, issue: facts.issueType, input, flow: flowState(), step: Math.max(base.step, step),
      evidence: { ...base.evidence, ...mem }, events: [...base.events, ...events],
    };
    const where = saveCase(next);
    rescopeEvidence(NEW_SCOPE, id);
    setRec(next);
    setSaved({ where, at: Date.now() });
    return next;
  }

  function saveDraft() {
    persist({});
  }

  async function runCheck() {
    if (story.trim().length < 15) {
      setError("Tell us a little more: what you bought, what went wrong, and what the company said.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/intake", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ story, issue }) });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Something went wrong. Your story is still here, so try again.");
      else if (data.result?.status === "not_covered") setOutside(data.result);
      else {
        setFacts(data.facts);
        setResult(data.result);
        setNoticeBody(data.noticeBody ?? "");
        setCheckedStory(story);
        setOverride(null);
        try {
          sessionStorage.removeItem(STORY_KEY);
        } catch {
          /* ignore */
        }
        setStep(1);
      }
    } catch {
      setError("Network problem. Your story is still here, so try again.");
    }
    setLoading(false);
  }

  function finish() {
    setTouched(true);
    const bad = detailChecks.find((c) => c.error);
    if (bad) {
      document.getElementById(`f-${bad.k}`)?.focus();
      return;
    }
    if (!result || result.status !== "covered") return;
    const text = override ?? plain;
    const input = toInput();
    const amount = parseAmount(input.amount);
    const final: Result = { ...result, notice: text, filing: amount > 0 ? filingInfo(amount) : result.filing };
    const savedCase = persist(
      { input, result: final, noticeText: text, status: rec && rec.status !== "draft" && rec.status !== "ready" ? rec.status : "ready", step: LAST },
      [makeEvent(rec?.result ? "regenerated" : "generated", rec?.result ? "Notice updated from your latest answers" : "Notice drafted. An advocate reviews and signs it before it is sent")],
    );
    router.push(`/case?id=${savedCase.id}&send=1`);
  }

  function next() {
    if (step === 0) {
      if (result && story === checkedStory) setStep(1);
      else void runCheck();
      return;
    }
    if (step === LAST) {
      finish();
      return;
    }
    setStep(step + 1);
  }

  if (oldCase) return <p className="status">Opening your case…</p>;

  if (outside) {
    return (
      <div className="wizard">
        <div className="panel">
          <h1 className="wiz-h" ref={heading} tabIndex={-1}>This looks outside the Consumer Protection Act</h1>
          <p className="lede">{outside.not_covered_reason || outside.explanation}</p>
          {!!outside.alternatives?.length && (
            <>
              <h3>Where else you could go</h3>
              <ul>{outside.alternatives.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </>
          )}
          <p className="fine">This is general information based on what you wrote. If you think we misunderstood, edit your story.</p>
          <div className="nav">
            <button type="button" className="ghost" onClick={() => { setOutside(null); setStep(0); }}>Edit my story</button>
            <Link href="/" className="button primary">Start something else</Link>
          </div>
        </div>
      </div>
    );
  }

  const blankValue = (k: string) => blanks[k] ?? "";
  const setBlank = (k: string, v: string) => setBlanks((b) => ({ ...b, [k]: v }));
  const nextLabel = step === 3 && pictureCount === 0 ? "Skip for now" : BUTTONS[step];

  return (
    <form
      className="wizard"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!loading) next();
      }}
    >
      <Stepper current={step} onJump={(i) => i < step && setStep(i)} />

      <div className="panel" key={step}>
        <h1 className="wiz-h" ref={heading} tabIndex={-1}>{TITLES[step]}</h1>

        {step === 0 && (
          <>
            <p className="help">Write it the way you&apos;d tell a friend. Hindi, Kannada, English or a mix is fine. We&apos;ll check it against the Act first, and ask for your details only at the end.</p>
            <Field id="f-story" label="Your story" required hint={story.trim().length >= 15 ? `${story.trim().length} characters. Add what the company said, if you can.` : "What you bought, what went wrong, and what the company said."} error={error && !loading && story.trim().length < 15 ? error : null}>
              {(b) => <textarea {...b} value={story} onChange={(e) => { setStory(e.target.value); setError(null); }} rows={8} placeholder={getIssue(facts.issueType)?.example} />}
            </Field>
            <WriteHelper value={story} issueLabel={getIssue(facts.issueType)?.label ?? "consumer complaint"} onUse={setStory} />
            <DataNote line="What you write here is checked by an AI. Please leave out your name, address and phone number for now." />
          </>
        )}

        {step === 1 && result && <CaseCard facts={facts} result={result} onFacts={setFacts} />}

        {step === 2 && (
          <>
            <p className="help">This is your draft notice, already written from your story. The highlighted blanks are facts we still need. Fill them in and the notice updates.</p>
            <NoticeDoc template={template} values={blanks} onValue={setBlank} override={override} onOverride={setOverride} plain={plain} />
          </>
        )}

        {step === 3 && (
          <>
            <p className="help">Add receipts, messages with the company and screenshots. You can continue without them, but sending your case to the advocate needs at least one.</p>
            <EvidenceStep issue={facts.issueType} scope={scope} saved={rec?.evidence} company={facts.company} amount={facts.amount} />
          </>
        )}

        {step === 4 && (
          <>
            <p className="help">Last step. These go on the notice so the company knows who is writing. After this you&apos;ll choose how to send your case to {`the advocate`}.</p>
            <p className="req-note"><span aria-hidden="true">*</span> Required</p>
            <Field id="f-name" label="Full name" required error={touched ? detailChecks[0].error : null} valid={touched && !detailChecks[0].error && Boolean(blankValue("client_name").trim())}>
              {(b) => <input {...b} value={blankValue("client_name")} onChange={(e) => setBlank("client_name", e.target.value)} autoComplete="name" />}
            </Field>
            <Field id="f-address" label="Address" required error={touched ? detailChecks[1].error : null} hint="House or flat, area, city and PIN code." valid={touched && !detailChecks[1].error && Boolean(blankValue("client_address").trim())}>
              {(b) => <textarea {...b} value={blankValue("client_address")} onChange={(e) => setBlank("client_address", e.target.value)} rows={3} autoComplete="street-address" />}
            </Field>
            <Field id="f-contact" label="Email or mobile number" required error={touched ? detailChecks[2].error : null} hint="So the company can reply to you." valid={touched && !detailChecks[2].error && Boolean(blankValue("client_contact").trim())}>
              {(b) => <input {...b} value={blankValue("client_contact")} onChange={(e) => setBlank("client_contact", e.target.value)} autoComplete="email" />}
            </Field>
            {missing.length > 0 && (
              <p className="callout warn" role="status">
                Still blank in the notice: {missing.map((k) => BLANK_DEFS[k].label.toLowerCase()).join(", ")}. You can <button type="button" className="link" onClick={() => setStep(2)}>fill them in</button>, or leave them and the advocate will ask you.
              </p>
            )}
            <DataNote line="Your name, address and contact go on the notice. They are not sent to the AI." />
          </>
        )}

        {error && step !== 0 && <p className="error" role="alert">{error}</p>}
        {loading && <CheckingSteps />}
      </div>

      <p className="draft-status fine" role="status">
        {saved
          ? saved.where === "memory"
            ? "Couldn't save in this browser. If you close this tab, your answers are lost."
            : saved.where === "session"
              ? "Draft saved until you close this tab."
              : <>Draft saved in this browser. <Link href="/cases">See My cases</Link></>
          : "Save draft keeps your answers in this browser so you can finish later."}
      </p>

      <div className="wiz-bar">
        {step > 0 ? <button type="button" className="ghost" onClick={() => setStep(step - 1)} disabled={loading}>Back</button> : <span />}
        <button type="button" className="ghost save" onClick={saveDraft} disabled={loading}>Save draft</button>
        <button type="submit" className="cta" disabled={loading}>{loading ? "Checking…" : nextLabel}</button>
      </div>
    </form>
  );
}
