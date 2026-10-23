"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import EvidenceDialog from "./EvidenceDialog";
import EvidenceSlots, { type EvidenceChange } from "./EvidenceSlots";
import RealDecisions from "./RealDecisions";
import {
  STATUS_LABEL, deleteCase, followUpLabel, makeEvent, mutateCase, nextAction,
  type CaseRecord, type CaseStatus, type EventKind,
} from "@/lib/cases";
import { formatRupees, parseAmount } from "@/lib/checks";
import { NOTICE_DEADLINE_DAYS } from "@/lib/config";
import { addDays, longDate, toIso } from "@/lib/deadlines";
import { forScope, useAllEvidence } from "@/lib/evidence";
import {
  advocateMailto, downloadDocx, downloadEvidencePdf, downloadIcs, downloadPdf, safeName,
} from "@/lib/export";
import { ROUTES, SECTOR } from "@/lib/escalation";
import { ADVOCATE } from "@/lib/advocate";
import { forgetRequest, sendToAdvocate, syncAdvocate } from "@/lib/advocateClient";
import PayBox from "./PayBox";
import ExplainInLanguage from "./ExplainInLanguage";
import CaseProgress from "./CaseProgress";
import { ADDONS, TIERS, quote, rupees } from "@/lib/pricing";
import { timingCheck, type Timing } from "@/lib/timing";
import { getIssue } from "@/lib/issues";
import { resolutionLabel } from "@/lib/questions";

const STATUSES: CaseStatus[] = ["draft", "ready", "review", "approved", "sent", "awaiting", "resolved"];
const todayIso = () => toIso(new Date());
const stamp = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export default function CaseWorkspace({ rec }: { rec: CaseRecord }) {
  const router = useRouter();
  const all = useAllEvidence();
  const pictures = useMemo(() => forScope(all, rec.id), [all, rec.id]);
  const have = useMemo(() => new Set(pictures.map((p) => p.slot)), [pictures]);
  const issue = getIssue(rec.issue);
  const fu = rec.status === "resolved" ? null : followUpLabel(rec.followUpDate);
  const action = nextAction(rec, have);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [evOpen, setEvOpen] = useState(false);

  // A link like #escalation should open its dropdown.
  useEffect(() => {
    const open = () => {
      const el = location.hash ? document.getElementById(location.hash.slice(1)) : null;
      if (el instanceof HTMLDetailsElement) el.open = true;
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);

  // If this case was sent to the advocate, ask the server whether anything has changed.
  const subRef = rec.submission?.ref;
  useEffect(() => {
    if (subRef) void syncAdvocate(rec);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rec.id, subRef]);
  const result = rec.result;
  const amount = parseAmount(rec.input.amount);
  const wanted = resolutionLabel(rec.input.resolution, rec.input.resolutionOther);

  function record(kind: EventKind, text: string, at?: string) {
    mutateCase(rec.id, () => ({ events: [{ ...makeEvent(kind, text, true), ...(at ? { at } : {}) }] }));
  }

  function setStatus(s: CaseStatus) {
    if (s === rec.status) return;
    mutateCase(rec.id, () => ({ patch: { status: s }, events: [makeEvent("status", STATUS_LABEL[s], true)] }));
  }

  function onEvidence(c: EvidenceChange) {
    mutateCase(rec.id, (r) => {
      const ev = { ...r.evidence };
      if (c.count > 0) ev[c.slot] = { count: c.count, names: c.names };
      else delete ev[c.slot];
      return { patch: { evidence: ev }, events: c.kind === "add" ? [makeEvent("evidence", "Added evidence pictures")] : [] };
    });
  }

  return (
    <div className="workspace">
      <header className="ws-head">
        <div>
          <p className="crumbs"><Link href="/cases">My cases</Link></p>
          <h1 className="page-h">{rec.input.company || "Your case"}</h1>
          <p className="meta">
            {issue?.label ?? "Complaint"}{amount > 0 ? ` · ${formatRupees(amount)}` : ""}{wanted ? ` · You'd like: ${wanted.toLowerCase()}` : ""}
          </p>
        </div>
        <div className="ws-head-r">
          <span className={`badge st-${rec.status}`}>{STATUS_LABEL[rec.status]}</span>
          {fu && <span className={`fu ${fu.tone}`}>{fu.text}</span>}
          <span className="fine">{rec.unsaved ? "Only in this tab (couldn't be saved)" : rec.storage === "session" ? "Kept for this session only" : "Saved on this device"}</span>
        </div>
      </header>

      {result && <CaseProgress rec={rec} hasPictures={pictures.length > 0} early={timingCheck(rec.input).state === "too_early"} />}

      <div className="ws">
        <div className="ws-main">
          {result && (
            <section className="ws-card verdict" aria-labelledby="verdict-h">
              <h2 id="verdict-h">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M7.5 12.5l3 3 6-7" /></svg>
                Yes, your case falls under the Consumer Protection Act, 2019
              </h2>
              {result.source === "rules" && (
                <p className="callout warn">Answered with basic rules because the AI was unavailable. Treat this as a rough guide.</p>
              )}
              {!!result.removedCitations && (
                <p className="callout warn">
                  {result.removedCitations} legal citation{result.removedCitations > 1 ? "s were" : " was"} removed because {result.removedCitations > 1 ? "they are" : "it is"} not in our checked list.
                </p>
              )}
              <h3>Why</h3>
              <p className="lede">{result.explanation}</p>
              <h3>The sections that apply</h3>
              <ul className="plain">
                {result.sections?.map((s) => <li key={s.id}><strong>Section {s.id}</strong> {s.why}</li>)}
              </ul>
              <p className="fine">Based only on what you wrote. This isn&apos;t a legal decision, so check these match your situation.</p>
              <ExplainInLanguage result={result} />
            </section>
          )}

          {result && rec.status !== "resolved" && <TimingCard rec={rec} />}

          <section className="ws-card next" aria-labelledby="next-h">
            <h2 id="next-h">Your next step</h2>
            <h3>{action.title}</h3>
            <p>{action.body}</p>
            {action.anchor === "continue" ? (
              <Link href={`/new?case=${rec.id}`} className="button primary">{action.anchorLabel}</Link>
            ) : action.anchor === "evidence" ? (
              <button type="button" className="button primary" onClick={() => setEvOpen(true)}>{action.anchorLabel}</button>
            ) : action.anchor ? (
              <a href={`#${action.anchor}`} className="button primary">{action.anchorLabel}</a>
            ) : null}
          </section>

          {!result ? (
            <section className="ws-card">
              <h2>This is a draft</h2>
              <p>You haven&apos;t checked this case yet. Continue where you left off to check it and prepare your complaint.</p>
              <Link href={`/new?case=${rec.id}`} className="button primary">Continue draft</Link>
            </section>
          ) : (
            <>
              <ComplaintSection rec={rec} pictureCount={pictures.length} onOpenEvidence={() => setEvOpen(true)} />

              <details className="ws-card fold" id="ask">
                <summary><span className="fold-t">What you can ask for and where to file</span></summary>
                <div className="fold-body">
                <h3>What you can ask for</h3>
                <p className="fine">These are things you can ask the Commission for. They are not promised.</p>
                <ul>{result.relief?.map((x, i) => <li key={i}>{x}</li>)}</ul>
                {result.filing && <><h3>Where a complaint is filed</h3><p>{result.filing.forum} {result.filing.fee}</p></>}
                {!!result.tips?.length && (
                  <details className="more">
                    <summary>Practical tips</summary>
                    <p className="fine">General guidance, not part of the Act.</p>
                    <ul>{result.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
                  </details>
                )}
                </div>
              </details>

              <details className="ws-card fold" id="escalation">
                <summary><span className="fold-t">If the company doesn&apos;t resolve it</span></summary>
                <div className="fold-body">
                <p className="fine">Official routes. These sites change, so check each one for current steps. Most expect you to have complained to the company first.</p>
                <ol className="routes">
                  {ROUTES.map((r) => (
                    <li key={r.id}>
                      <h3>{r.title}</h3>
                      <p>{r.body}</p>
                      <p>{r.links.map((l) => <a key={l.url} href={l.url} target="_blank" rel="noreferrer">{l.label}</a>)}</p>
                    </li>
                  ))}
                </ol>
                <details className="more">
                  <summary>Complaints about banks, insurance, investments or airlines</summary>
                  <p className="fine">These sectors have their own regulators with complaint portals.</p>
                  <ul>
                    {SECTOR.map((s) => (
                      <li key={s.url}>{s.label}: <a href={s.url} target="_blank" rel="noreferrer">{s.name}</a></li>
                    ))}
                  </ul>
                </details>
                </div>
              </details>

              <RealDecisions issue={rec.issue} fold />
            </>
          )}
        </div>

        <aside className="ws-side">
          <section className="ws-card" id="record" aria-labelledby="rec-h">
            <h2 id="rec-h">Track what happens</h2>
            <p className="fine">Updates from the advocate appear here by themselves. Anything else, like the company&apos;s reply, is your own note.</p>
            <label className="side-label" htmlFor="status">Status</label>
            <select id="status" value={rec.status} onChange={(e) => setStatus(e.target.value as CaseStatus)}>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
            <FollowUp rec={rec} />
            <Recorder onRecord={record} />
          </section>

          <section className="ws-card" aria-labelledby="tl-h">
            <h2 id="tl-h">Activity</h2>
            <ol className="timeline compact">
              {[...rec.events].sort((a, b) => b.at.localeCompare(a.at)).map((e) => (
                <li key={e.id}>
                  <time>{stamp(e.at)}</time>
                  <p>{e.text}{e.byUser && e.kind !== "status" ? " (recorded by you)" : ""}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="ws-card" aria-labelledby="manage-h">
            <h2 id="manage-h">Manage this case</h2>
            <div className="stack">
              {result && <button type="button" className="button small" onClick={() => setEvOpen(true)}>Manage evidence</button>}
              <Link href={`/new?case=${rec.id}`} className="button small">Edit details</Link>
              {confirmDelete ? (
                <div>
                  <p className="fine">Delete this case from this device? This can&apos;t be undone.</p>
                  <button type="button" className="button small danger" onClick={() => { deleteCase(rec.id); router.push("/cases"); }}>Yes, delete it</button>{" "}
                  <button type="button" className="link" onClick={() => setConfirmDelete(false)}>Keep it</button>
                </div>
              ) : (
                <button type="button" className="link" onClick={() => setConfirmDelete(true)}>Delete case</button>
              )}
            </div>
          </section>
        </aside>
      </div>

      <EvidenceDialog open={evOpen} onClose={() => setEvOpen(false)}>
        <EvidenceSlots issue={rec.issue} scope={rec.id} saved={rec.evidence} context={{ company: rec.input.company, amount: rec.input.amount }} onChange={onEvidence} />
      </EvidenceDialog>
    </div>
  );
}

function FollowUp({ rec }: { rec: CaseRecord }) {
  const fu = rec.status === "resolved" ? null : followUpLabel(rec.followUpDate);
  function set(date: string) {
    mutateCase(rec.id, () => ({
      patch: { followUpDate: date },
      events: date ? [makeEvent("date", `Follow-up date set to ${longDate(date)}`, true)] : [],
    }));
  }
  return (
    <div id="followup" className="followup">
      <label className="side-label" htmlFor="fu-date">Follow-up date</label>
      <input id="fu-date" type="date" value={rec.followUpDate} min={todayIso()} onChange={(e) => set(e.target.value)} />
      {fu && <p className={`fu ${fu.tone}`}>{fu.text}</p>}
      <div className="stack-row">
        <button type="button" className="link" onClick={() => set(addDays(todayIso(), NOTICE_DEADLINE_DAYS))}>In {NOTICE_DEADLINE_DAYS} days</button>
        {rec.followUpDate && (
          <button
            type="button"
            className="link"
            onClick={() =>
              downloadIcs(
                {
                  title: `Hisaab: follow up with ${rec.input.company}`,
                  description: "Check whether the company replied to your complaint. Open your case in Hisaab on the same device to record what happened.",
                  dateIso: rec.followUpDate,
                },
                safeName(rec.input.company) + "-follow-up",
              )
            }
          >
            Add to my calendar
          </button>
        )}
      </div>
      <p className="fine">We only show whether it&apos;s due when you open Hisaab. We don&apos;t send reminders.</p>
    </div>
  );
}

function Recorder({ onRecord }: { onRecord: (kind: EventKind, text: string, at?: string) => void }) {
  const [kind, setKind] = useState<"reply" | "followup" | null>(null);
  const [date, setDate] = useState(todayIso());
  const [channel, setChannel] = useState("Email");
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (note.trim().length < 3) return setErr("Add a short note about what happened.");
    const label = kind === "reply" ? "Company reply" : "Follow-up";
    onRecord(kind!, `${label} (${channel.toLowerCase()}, ${longDate(date)}): ${note.trim()}`, date === todayIso() ? new Date().toISOString() : new Date(date + "T12:00:00").toISOString());
    setNote("");
    setErr(null);
    setKind(null);
  }

  return (
    <div className="recorder">
      <div className="stack-row">
        <button type="button" className="button small" onClick={() => { setKind("reply"); setErr(null); }}>Record a reply</button>
        <button type="button" className="button small" onClick={() => { setKind("followup"); setErr(null); }}>Record a follow-up</button>
      </div>
      {kind && (
        <form onSubmit={save} className="inline-form" noValidate>
          <p className="fine">{kind === "reply" ? "What did the company send you?" : "How did you follow up?"}</p>
          <label className="side-label" htmlFor="rc-date">Date</label>
          <input id="rc-date" type="date" value={date} max={todayIso()} onChange={(e) => setDate(e.target.value)} />
          <label className="side-label" htmlFor="rc-ch">How</label>
          <select id="rc-ch" value={channel} onChange={(e) => setChannel(e.target.value)}>
            {["Email", "Chat", "Phone call", "Letter", "Other"].map((c) => <option key={c}>{c}</option>)}
          </select>
          <label className="side-label" htmlFor="rc-note">Note</label>
          <textarea id="rc-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} aria-invalid={Boolean(err)} />
          {err && <p className="msg error" role="alert">{err}</p>}
          <div className="stack-row">
            <button type="submit" className="button small primary">Save</button>
            <button type="button" className="link" onClick={() => setKind(null)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

function ComplaintSection({ rec, pictureCount, onOpenEvidence }: { rec: CaseRecord; pictureCount: number; onOpenEvidence: () => void }) {
  const original = rec.result?.notice ?? "";
  const [text, setText] = useState(rec.noticeText || original);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<"pdf" | "docx" | "pack" | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const all = useAllEvidence();
  const mine = useMemo(() => forScope(all, rec.id), [all, rec.id]);
  const edited = text !== original;

  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + 2 + "px";
  }, [text]);

  function persist(value: string) {
    mutateCase(rec.id, (r) => {
      if (r.noticeText === value) return {};
      const last = r.events[r.events.length - 1];
      return { patch: { noticeText: value }, events: last?.kind === "edited" ? [] : [makeEvent("edited", "You edited the notice")] };
    });
  }

  function onChange(value: string) {
    setText(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => persist(value), 1200);
  }

  async function copy() {
    setMsg(null);
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      area.current?.select();
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      area.current?.select();
      setMsg("Couldn't copy automatically. The notice is selected: press Ctrl+C (Cmd+C on Mac).");
    }
  }

  const packImages = () => mine;

  async function make(kind: "pdf" | "docx" | "pack") {
    setMsg(null);
    setBusy(kind);
    try {
      const base = safeName(rec.input.company);
      if (kind === "pdf") await downloadPdf(text, base);
      else if (kind === "docx") await downloadDocx(text, base);
      else await downloadEvidencePdf(packImages(), rec.input.company, base.replace("Legal-notice", "Evidence-pack"));
    } catch {
      setMsg("Couldn't create the file. Use Copy and paste it into a document instead.");
    }
    setBusy(null);
  }

  return (
    <section className="ws-card" id="complaint" aria-labelledby="comp-h">
      <h2 id="comp-h">Your legal notice (draft)</h2>
      <p className="draft-banner">Draft for advocate review. It isn&apos;t signed and hasn&apos;t been sent.</p>
      <p className="fine">
        {rec.result?.source === "rules" ? "Built from a basic template." : "Written by AI from what you told us."} Read it, fix anything that isn&apos;t true, and edit it right here. Changes save automatically on this device. The advocate checks it again before signing.
      </p>
      <div className="toolbar" role="group" aria-label="Notice actions">
        <button type="button" onClick={copy}>{copied ? "Copied!" : "Copy"}</button>
        <button type="button" onClick={() => make("pdf")} disabled={busy !== null}>{busy === "pdf" ? "Making PDF…" : "Download PDF"}</button>
        <button type="button" onClick={() => make("docx")} disabled={busy !== null}>{busy === "docx" ? "Making Word file…" : "Download Word"}</button>
        {edited && <button type="button" className="quiet" onClick={() => { onChange(original); persist(original); }}>Undo my edits</button>}
      </div>
      {msg && <p className="callout warn" role="status">{msg}</p>}
      <div className="paper">
        <label className="sr-only" htmlFor="notice-text">Notice, editable</label>
        <textarea id="notice-text" ref={area} value={text} onChange={(e) => onChange(e.target.value)} onBlur={() => persist(text)} rows={16} spellCheck />
      </div>

      <AdvocatePanel rec={rec} text={text} images={packImages()} pictureCount={pictureCount} onOpenEvidence={onOpenEvidence} onDownload={make} busy={busy} />
    </section>
  );
}

const SERVER_LABEL: Record<string, string> = { submitted: "Waiting for the advocate to review it", quoted: "Approved to go ahead. Payment needed", approved: "Approved and signed by the advocate", sent: "Sent to the company by the advocate", declined: "The advocate asked for changes" };

/** One click to send the notice and evidence to the advocate, who reviews, signs and sends it. */
function AdvocatePanel({ rec, text, images, pictureCount, onOpenEvidence, onDownload, busy }: {
  rec: CaseRecord; text: string; images: { name: string; dataUrl: string; width: number; height: number }[]; pictureCount: number;
  onOpenEvidence: () => void; onDownload: (k: "pdf" | "pack") => void; busy: string | null;
}) {
  const isEmail = (v: string) => /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(v.trim());
  const [email, setEmail] = useState(isEmail(rec.input.contact) ? rec.input.contact.trim() : "");
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState<{ code: string; text: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const [again, setAgain] = useState(false);
  const [forgetting, setForgetting] = useState<"ask" | "busy" | null>(null);
  const [forgetError, setForgetError] = useState<string | null>(null);
  const [addons, setAddons] = useState<string[]>([]);
  const claim = parseAmount(rec.input.amount);
  const price = quote(claim, addons);
  const timing = timingCheck(rec.input);
  const early = timing.state === "too_early";
  const hasEvidence = pictureCount > 0;
  const sub = rec.submission;
  const emailOk = isEmail(email);
  const ready = hasEvidence && !early && emailOk && consent && !sending;
  const showForm = !sub || (again && sub.lastStatus === "declined");

  async function send() {
    setSending(true);
    setProblem(null);
    const res = await sendToAdvocate(rec, { email: email.trim(), noticeText: text, images, addons });
    if (res.ok) {
      mutateCase(rec.id, () => ({
        patch: { status: "review", submission: { ref: res.ref, token: res.token, email: email.trim(), sentAt: new Date().toISOString(), lastStatus: "submitted", tracked: res.tracked, addons } },
        events: [makeEvent("status", `Sent to the advocate for review (reference ${res.ref}).`, false)],
      }));
      setAgain(false);
      setConsent(false);
    } else {
      setProblem({ code: res.code, text: res.message });
    }
    setSending(false);
  }

  async function forget() {
    setForgetting("busy");
    const err = await forgetRequest(rec);
    if (err) {
      setForgetError(err);
      setForgetting("ask");
      return;
    }
    mutateCase(rec.id, () => ({
      patch: { status: "ready", submission: undefined },
      events: [makeEvent("status", "Deleted your request from Hisaab's server. The advocate's email copy is hers to keep.", false)],
    }));
    setForgetting(null);
  }

  async function check() {
    setChecking(true);
    await syncAdvocate(rec);
    setChecking(false);
  }

  return (
    <details className="advocate-panel" key={sub?.ref ?? "new"} open={Boolean(sub)}>
      <summary>
        <span className="sum-t">Send to a lawyer for review</span>
        <span className="sum-d">{ADVOCATE.name}, Advocate · {ADVOCATE.council}</span>
      </summary>

      {!showForm && sub ? (
        <div className="adv-sent">
          <p><strong>Sent to {ADVOCATE.name} on {new Date(sub.sentAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}.</strong> Reference <code>{sub.ref}</code>.</p>
          <p className={`adv-status ${sub.lastStatus}`}>{sub.tracked === false ? "Sent to the advocate by email" : SERVER_LABEL[sub.lastStatus] ?? "Waiting for the advocate"}</p>
          {sub.payment?.verified && sub.payment.amount > 0 && <p className="fine">Payment of {rupees(sub.payment.amount)} confirmed by the advocate.</p>}
          <PayBox rec={rec} />
          {sub.note && <p className="callout"><strong>Note from the advocate:</strong> {sub.note}</p>}
          {sub.tracked === false ? (
            <p className="fine">The advocate will reply to {sub.email}. In this setup this page can&apos;t update by itself, so when you hear back, record it using the status box on the right.</p>
          ) : (
            <p className="fine">We email {sub.email} when the advocate responds, and this page updates by itself.</p>
          )}
          <div className="stack-row">
            {sub.tracked !== false && <button type="button" className="button small" onClick={check} disabled={checking}>{checking ? "Checking…" : "Check for updates"}</button>}
            {sub.lastStatus === "declined" && <button type="button" className="button small primary" onClick={() => setAgain(true)}>Edit and send again</button>}
          </div>
          {sub.tracked !== false && sub.lastStatus !== "sent" && (
            forgetting ? (
              <div className="callout" role="group" aria-label="Delete my request">
                <p>Delete your request, notice and details from Hisaab&apos;s server? The advocate keeps the email she already received. This can&apos;t be undone.</p>
                {forgetError && <p className="msg error" role="alert">{forgetError}</p>}
                <div className="stack-row">
                  <button type="button" className="button small danger" onClick={forget} disabled={forgetting === "busy"}>{forgetting === "busy" ? "Deleting…" : "Yes, delete it"}</button>
                  <button type="button" className="link" onClick={() => { setForgetting(null); setForgetError(null); }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button type="button" className="link" onClick={() => setForgetting("ask")}>Delete my request from Hisaab&apos;s server</button>
            )
          )}
        </div>
      ) : (
        <div className="adv-form">
          <div className="adv-card">
            <strong>{ADVOCATE.name}, {ADVOCATE.title}</strong>
            <span>{ADVOCATE.council} · Enrolment No. {ADVOCATE.enrolment}</span>
            <span>{ADVOCATE.place}</span>
          </div>
          <p>You can&apos;t send this notice to the company yourself. The advocate reviews it, signs it and sends it to the company. She replies to you by email, and this page updates by itself when it can.</p>

          <ul className="checks">
            <li className={hasEvidence ? "ok" : "no"}>
              {hasEvidence ? `Evidence added (${pictureCount} picture${pictureCount > 1 ? "s" : ""}).` : "Evidence is required. Add at least one picture."}{" "}
              <button type="button" className="link" onClick={onOpenEvidence}>{hasEvidence ? "Manage" : "Add evidence"}</button>
            </li>
            <li className={early ? "no" : "ok"}>
              {early && timing.dueIso ? `It's too early: the company has until ${longDate(timing.dueIso)}. See the timing card above.` : "The timing is fine."}
            </li>
          </ul>

          <label htmlFor="adv-email" className="side-label">Your email, so the advocate can reach you</label>
          <input id="adv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" aria-invalid={email !== "" && !emailOk} />

          <fieldset className="pay-opts">
            <legend>The advocate&apos;s fee</legend>
            <p>
              <strong>Sending it to {ADVOCATE.name} costs nothing.</strong> She reads your case first. If she can take it and you want the notice signed and sent to the company, she tells you the fee for your case, and you pay only then. If she can&apos;t take it, you pay nothing.
            </p>
            <p className="fine">
              Her usual fee for a claim of {claim > 0 ? formatRupees(claim) : "this size"} is about <strong>{rupees(price.fee)}</strong>. By claim: {TIERS.map((t) => `${t.label}: ${rupees(t.fee)}`).join(" · ")}. The final fee can differ with your case.
            </p>
            <p className="fine">Extras you&apos;d like. She includes them in the fee she quotes:</p>
            {ADDONS.map((a) => (
              <label key={a.id} className="consent addon">
                <input type="checkbox" checked={addons.includes(a.id)} onChange={(e) => setAddons((cur) => (e.target.checked ? [...cur, a.id] : cur.filter((x) => x !== a.id)))} />
                <span><strong>{a.label}, about +{rupees(a.price)}.</strong> {a.detail}</span>
              </label>
            ))}
          </fieldset>

          <label className="consent">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>
              I agree to send my name, address, contact details, this notice and my evidence pictures to {ADVOCATE.name}, Advocate, so she can review it and act for me. They are sent by email. Hisaab also keeps my details and the notice so it can show my status.
            </span>
          </label>

          <button type="button" className="primary" onClick={send} disabled={!ready}>{sending ? "Sending…" : `Send to ${ADVOCATE.name}`}</button>
          {!ready && !sending && <p className="fine">{!hasEvidence ? "Add evidence first." : early ? "Locked until the company's time has passed, or it has refused in writing." : !emailOk ? "Enter a valid email." : "Tick the box to agree."}</p>}

          {problem && problem.code !== "not_configured" && <p className="callout warn" role="alert">{problem.text}</p>}
          {problem?.code === "not_configured" && (
            <div className="callout warn" role="alert">
              <p><strong>{problem.text}</strong> You can still email the advocate yourself: download the two files, then open the email and attach them.</p>
              <div className="stack-row">
                <button type="button" className="button small" onClick={() => onDownload("pdf")} disabled={busy !== null}>Download draft (PDF)</button>
                <button type="button" className="button small" onClick={() => onDownload("pack")} disabled={busy !== null}>Download evidence pack (PDF)</button>
                <a
                  className="button small primary"
                  href={advocateMailto(ADVOCATE.reviewEmail, {
                    subject: `Hisaab review request: ${rec.input.company}`,
                    summary: reviewSummary(rec, pictureCount),
                    draft: text,
                  })}
                >
                  Open an email to the advocate
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </details>
  );
}

function reviewSummary(rec: CaseRecord, pictureCount: number): string {
  const i = rec.input;
  const amt = parseAmount(i.amount);
  const lines = [
    "Please review, sign and send the attached draft legal notice.",
    "",
    `Client: ${i.name}`,
    `Contact: ${i.contact}`,
    `Client address: ${i.address}`,
    "",
    `Company (brand or trade name): ${i.company}`,
    `Company legal name: ${i.legalName?.trim() || "not provided"}`,
    `Registered office: ${i.companyAddress?.trim() || "not provided"}`,
    ...(i.companyCin?.trim() ? [`CIN: ${i.companyCin.trim()}`] : []),
    ...(i.companyEmail?.trim() ? [`Company email: ${i.companyEmail.trim()}`] : []),
    "",
    `Amount: ${amt > 0 ? formatRupees(amt) : i.amount}`,
    `Relevant date: ${i.incidentDate}`,
    `Client would like: ${resolutionLabel(i.resolution, i.resolutionOther) || "not stated"}`,
    `Evidence: ${pictureCount} picture${pictureCount === 1 ? "" : "s"} (evidence pack attached)`,
    `Hisaab case reference: ${rec.id}`,
  ];
  return lines.join("\n");
}

/** Whether it's too early to send a notice, and the last day to file. Advice only: it never decides the law. */
function TimingCard({ rec }: { rec: CaseRecord }) {
  const t: Timing = timingCheck(rec.input);
  const earlyOk = ["draft", "ready", "review"].includes(rec.status);
  function refused() {
    mutateCase(rec.id, (r) => ({
      patch: { input: { ...r.input, answers: { ...(r.input.answers ?? {}), refusedInWriting: "yes" } } },
      events: [makeEvent("date", "Recorded: the company has already refused in writing", true)],
    }));
  }
  const filing = t.filingLimitIso ? (
    <p className="fine">
      Last day to file a complaint with the Commission: <strong>{longDate(t.filingLimitIso)}</strong>{" "}
      {t.filingDaysLeft < 0 ? "(that date has passed, so a late complaint needs a good reason for the delay under Section 69)" : `(${t.filingDaysLeft} days from today; Section 69 allows two years)`}.
    </p>
  ) : null;

  if (t.state === "too_early" && t.dueIso && earlyOk) {
    return (
      <section className="ws-card timing" aria-labelledby="timing-h">
        <h2 id="timing-h">Too early to send a notice</h2>
        <p>{t.basis} So the company has until <strong>{longDate(t.dueIso)}</strong> ({t.daysLeft === 0 ? "today is its last day" : `${t.daysLeft} day${t.daysLeft === 1 ? "" : "s"} left`}). A notice sent before then may be premature, because the company hasn&apos;t yet broken its own promise.</p>
        <div className="stack-row">
          <button type="button" className="button small primary" onClick={() => mutateCase(rec.id, () => ({ patch: { followUpDate: addDays(t.dueIso!, 1) }, events: [makeEvent("date", `Follow-up date set to ${longDate(addDays(t.dueIso!, 1))}`, true)] }))}>
            Set my follow-up for {longDate(addDays(t.dueIso, 1))}
          </button>
          <button type="button" className="link" onClick={refused}>The company has already refused in writing</button>
        </div>
        {filing}
      </section>
    );
  }
  if (t.state === "ready" && t.dueIso && earlyOk) {
    return (
      <section className="ws-card timing ready" aria-labelledby="timing-h">
        <h2 id="timing-h">The company&apos;s time has passed</h2>
        <p>{t.basis} That ended on {longDate(t.dueIso)}, so a notice is reasonable now.</p>
        {filing}
      </section>
    );
  }
  if (t.state === "refused" && earlyOk) {
    return (
      <section className="ws-card timing refused" aria-labelledby="timing-h">
        <h2 id="timing-h">No waiting needed</h2>
        <p>{t.basis}</p>
        {filing}
      </section>
    );
  }
  return filing ? (
    <section className="ws-card timing ready" aria-labelledby="timing-h">
      <h2 id="timing-h">Time limits</h2>
      {filing}
    </section>
  ) : null;
}
