import type { ReactNode } from "react";

type Bind = { id: string; "aria-invalid": boolean; "aria-describedby": string };

/** A labelled field with live feedback: hint, error, advice note and a tick when valid. */
export default function Field({
  id,
  label,
  hint,
  error,
  note,
  valid,
  children,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string | null;
  note?: string | null;
  valid?: boolean;
  children: (bind: Bind) => ReactNode;
}) {
  const describedBy = `${id}-msg`;
  return (
    <div className={`field ${error ? "has-error" : ""} ${valid ? "is-valid" : ""}`}>
      <label htmlFor={id}>
        {label}
        {valid && (
          <svg className="tick" width="16" height="16" viewBox="0 0 16 16" aria-label="Looks good" role="img">
            <path d="M3 8.5l3.2 3L13 4.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      <p id={describedBy} className={error ? "msg error" : note ? "msg note" : "msg"} role={error ? "alert" : undefined}>
        {error ?? note ?? hint}
      </p>
    </div>
  );
}
