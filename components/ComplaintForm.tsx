"use client";
import { useState } from "react";
import type { ComplaintInput } from "@/lib/checks";
import { missingFields } from "@/lib/checks";

export const EMPTY_INPUT: ComplaintInput = {
  name: "", address: "", contact: "", company: "", amount: "", incidentDate: "", description: "",
};

export default function ComplaintForm({
  initial,
  loading,
  onSubmit,
  onInvalid,
}: {
  initial: ComplaintInput;
  loading: boolean;
  onSubmit: (input: ComplaintInput) => void;
  onInvalid: () => void;
}) {
  const [v, setV] = useState<ComplaintInput>(initial);
  const [errors, setErrors] = useState<string[]>([]);
  const set = (k: keyof ComplaintInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setV({ ...v, [k]: e.target.value });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // Nothing to analyse: stop here and say exactly what is missing.
    // Otherwise the server decides (it can say "not covered" even if other fields are blank).
    if (!v.description.trim()) {
      setErrors(missingFields(v));
      onInvalid();
      return;
    }
    setErrors([]);
    onSubmit(v);
  }

  return (
    <form onSubmit={submit} noValidate className="sheet form">
      <fieldset>
        <legend>About you</legend>
        <p className="fine">These go into your notice. They are not sent to the AI.</p>
        <label>Your name<input value={v.name} onChange={set("name")} autoComplete="name" /></label>
        <label>Your address<textarea rows={2} value={v.address} onChange={set("address")} autoComplete="street-address" /></label>
        <label>Email or phone<input value={v.contact} onChange={set("contact")} /></label>
      </fieldset>

      <fieldset>
        <legend>The complaint</legend>
        <label>Company name<input value={v.company} onChange={set("company")} placeholder="e.g. Swiggy" /></label>
        <div className="row">
          <label>Amount paid (₹)<input inputMode="numeric" value={v.amount} onChange={set("amount")} placeholder="1200" /></label>
          <label>Incident date<input type="date" value={v.incidentDate} onChange={set("incidentDate")} /></label>
        </div>
        <label>What happened?
          <textarea rows={5} value={v.description} onChange={set("description")}
            placeholder="Swiggy charged me ₹1,200 for an order that never arrived and refuses to refund." />
        </label>
      </fieldset>

      {errors.length > 0 && <p className="error" role="alert">Please fill in: {errors.join(", ")}.</p>}
      <button type="submit" className="primary" disabled={loading}>{loading ? "Checking…" : "Check my case"}</button>
    </form>
  );
}
