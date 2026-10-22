"use client";
import { useCallback, useEffect, useState } from "react";
import { ADVOCATE } from "@/lib/advocate";

type Sub = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: "submitted" | "approved" | "sent" | "declined";
  client: { name: string; email: string; contact: string; address: string };
  company: { brand: string; legalName: string; address: string; cin: string; email: string };
  issue: string;
  amount: string;
  date: string;
  resolution: string;
  noticeText: string;
  evidenceCount: number;
  advocateNote: string;
  payment?: { ref: string; utr: string; total: number; fee: number; items: { id: string; label: string; price: number }[]; verified: boolean };
  history: { at: string; text: string }[];
};

const LABEL: Record<Sub["status"], string> = { submitted: "Waiting for review", approved: "Approved and signed", sent: "Sent to the company", declined: "Changes requested" };
const stamp = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(new Error("read"));
    r.readAsDataURL(file);
  });
}

export default function AdvocateDashboard() {
  const [phase, setPhase] = useState<"loading" | "setup" | "login" | "in" | "nostorage">("loading");
  const [missing, setMissing] = useState<string[]>([]);
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [pdf, setPdf] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/advocate/list");
    if (r.status === 401) return setPhase("login");
    if (r.status === 503) {
      setMissing(["storage (UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN)"]);
      return setPhase("nostorage");
    }
    const d = await r.json();
    setSubs(d.submissions ?? []);
    setPhase("in");
  }, []);

  useEffect(() => {
    (async () => {
      const me = await (await fetch("/api/advocate/me")).json();
      setMissing(me.backend?.missing ?? []);
      if (!me.configured) return setPhase("setup");
      if (!me.authed) return setPhase("login");
      await load();
    })().catch(() => setPhase("setup"));
  }, [load]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const r = await fetch("/api/advocate/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ passphrase: pass }) });
    if (!r.ok) return setErr((await r.json()).error ?? "Couldn't sign in.");
    setPass("");
    await load();
  }

  async function decide(id: string, action: "approve" | "sent" | "decline" | "paid") {
    setBusy(true);
    setMsg(null);
    try {
      let signedPdf = "";
      if (pdf) {
        if (pdf.size > 2_400_000) throw new Error("That PDF is over 2.4 MB. Compress it and try again.");
        signedPdf = await toBase64(pdf);
      }
      const r = await fetch("/api/advocate/decide", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action, note, signedPdf }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Something went wrong.");
      setMsg(action === "paid" ? "Marked as received." : (d.warning ?? "Done. The client has been emailed and their Hisaab case will update."));
      setNote("");
      setPdf(null);
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Something went wrong.");
    }
    setBusy(false);
  }

  if (phase === "loading") return <p className="status">Loading…</p>;
  if (phase === "setup") {
    return (
      <div className="panel narrow">
        <h2>Approvals aren&apos;t set up yet</h2>
        <p className="help">To use this page, set these in your hosting settings: <code>ADVOCATE_PASSPHRASE</code> and <code>SESSION_SECRET</code>.</p>
        {missing.length > 0 && <p className="help">Also still missing: {missing.join("; ")}.</p>}
      </div>
    );
  }
  if (phase === "nostorage") {
    return (
      <div className="panel narrow">
        <h2>No storage connected yet</h2>
        <p className="help">Requests still reach your email, but this page can&apos;t list them or update clients until storage is set up. Add <code>UPSTASH_REDIS_REST_URL</code> and <code>UPSTASH_REDIS_REST_TOKEN</code> in your hosting settings (Vercel Marketplace, Upstash Redis).</p>
        <p className="help">Until then, answer each client by replying to the request email: the reply goes straight to them.</p>
      </div>
    );
  }
  if (phase === "login") {
    return (
      <form className="panel narrow" onSubmit={login}>
        <h2>Advocate sign-in</h2>
        <p className="help">{ADVOCATE.name}, Advocate. This page is only for reviewing client requests.</p>
        <div className="field">
          <label htmlFor="pp">Passphrase</label>
          <input id="pp" type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" />
          {err && <p className="msg error" role="alert">{err}</p>}
        </div>
        <button type="submit" className="primary" disabled={!pass}>Sign in</button>
      </form>
    );
  }

  const open = subs.find((s) => s.id === openId) ?? null;
  return (
    <div className="adv">
      <div className="adv-head">
        <h1 className="page-h">Review requests</h1>
        <button type="button" className="link" onClick={async () => { await fetch("/api/advocate/logout", { method: "POST" }); setPhase("login"); }}>Sign out</button>
      </div>
      {subs.length === 0 ? (
        <p className="help">No requests yet. They also arrive in your email.</p>
      ) : (
        <div className="adv-grid">
          <ul className="adv-list" aria-label="Requests">
            {subs.map((s) => (
              <li key={s.id}>
                <button type="button" className={s.id === openId ? "on" : ""} onClick={() => { setOpenId(s.id); setNote(""); setPdf(null); setMsg(null); }}>
                  <strong>{s.company.brand}</strong> · ₹{s.amount}{s.payment && !s.payment.verified ? " · unpaid?" : ""}{s.payment?.items.some((i) => i.id === "priority") ? " · priority" : ""}
                  <span className={`badge st-${s.status === "submitted" ? "review" : s.status === "declined" ? "ready" : s.status}`}>{LABEL[s.status]}</span>
                  <span className="fine">{s.client.name} · ref {s.id} · {stamp(s.updatedAt)}</span>
                </button>
              </li>
            ))}
          </ul>

          <section className="adv-detail" aria-live="polite">
            {!open ? (
              <p className="help">Choose a request to review it.</p>
            ) : (
              <>
                <h2>{open.company.brand} · ₹{open.amount} <span className={`badge st-${open.status === "submitted" ? "review" : open.status === "declined" ? "ready" : open.status}`}>{LABEL[open.status]}</span></h2>
                <dl className="review">
                  {[
                    ["Reference", open.id],
                    ["Client", `${open.client.name} · ${open.client.email} · ${open.client.contact}`],
                    ["Client address", open.client.address],
                    ["Company legal name", open.company.legalName || "not provided"],
                    ["Registered office", open.company.address || "not provided"],
                    ["CIN / email", `${open.company.cin || "no CIN"} · ${open.company.email || "no email"}`],
                    ["Relevant date", open.date],
                    ["Client would like", open.resolution || "not stated"],
                    ["Evidence", `${open.evidenceCount} picture(s). The evidence pack was attached to the email.`],
                  ].map(([k, v]) => (
                    <div key={k} className="rv-row"><dt>{k}</dt><dd>{v}</dd><span /></div>
                  ))}
                </dl>
                {open.payment && (
                  <div className={`callout ${open.payment.verified ? "" : "warn"}`}>
                    <p>
                      <strong>{open.payment.verified ? "Payment received" : "Check your UPI app"}: ₹{open.payment.total.toLocaleString("en-IN")}</strong>
                    </p>
                    <p className="fine">
                      Payment note <code>{open.payment.ref}</code> · UPI transaction ID <code>{open.payment.utr}</code>. Review fee ₹{open.payment.fee}
                      {open.payment.items.map((i) => ` · ${i.label} ₹${i.price}`).join("")}.
                    </p>
                    {!open.payment.verified && (
                      <button type="button" className="button small primary" disabled={busy} onClick={() => decide(open.id, "paid")}>Payment received</button>
                    )}
                  </div>
                )}
                <h3>Draft notice</h3>
                <div className="paper"><textarea readOnly rows={18} value={open.noticeText} aria-label="Draft notice" style={{ overflow: "auto", resize: "vertical" }} /></div>
                <p className="fine">Edit and sign it on your own letterhead using the PDF in your email, then upload the signed PDF below.</p>

                <h3>Your response</h3>
                <label className="side-label" htmlFor="adv-note">Note to the client (required if you ask for changes)</label>
                <textarea id="adv-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
                <label className="side-label" htmlFor="adv-pdf">Signed notice (PDF, optional, up to about 2.4 MB)</label>
                <input id="adv-pdf" type="file" accept="application/pdf" onChange={(e) => setPdf(e.target.files?.[0] ?? null)} />
                <div className="stack-row">
                  <button type="button" className="button primary" disabled={busy} onClick={() => decide(open.id, "approve")}>Approve and notify client</button>
                  <button type="button" className="button" disabled={busy} onClick={() => decide(open.id, "sent")}>Mark as sent to the company</button>
                  <button type="button" className="button" disabled={busy} onClick={() => decide(open.id, "decline")}>Ask for changes</button>
                </div>
                {msg && <p className="callout" role="status">{msg}</p>}

                <h3>History</h3>
                <ol className="timeline compact">
                  {[...open.history].reverse().map((h, i) => <li key={i}><time>{stamp(h.at)}</time><p>{h.text}</p></li>)}
                </ol>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
