import { ISSUES } from "@/lib/issues";

const ICONS: Record<string, React.ReactNode> = {
  refund: <path d="M4 12a8 8 0 1 0 2.4-5.7M4 5v4h4" strokeLinecap="round" strokeLinejoin="round" />,
  faulty: <path d="M12 3l9 16H3L12 3zM12 10v4M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />,
  delivery: <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19.5a1.5 1.5 0 1 0 0-.01M17 19.5a1.5 1.5 0 1 0 0-.01" strokeLinecap="round" strokeLinejoin="round" />,
  other: <path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth="3" strokeLinecap="round" />,
};

export default function IssueCards({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (id: string) => void;
  error?: string | null;
}) {
  return (
    <fieldset className="issues" aria-describedby={error ? "issue-err" : undefined}>
      <legend>What kind of problem is it?</legend>
      <div className="cards">
        {ISSUES.map((i) => (
          <label key={i.id} className={`issue ${value === i.id ? "picked" : ""}`}>
            <input type="radio" name="issue" value={i.id} checked={value === i.id} onChange={() => onChange(i.id)} />
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              {ICONS[i.id]}
            </svg>
            <span className="t">{i.label}</span>
            <span className="d">{i.blurb}</span>
          </label>
        ))}
      </div>
      {error && <p id="issue-err" className="msg error" role="alert">{error}</p>}
    </fieldset>
  );
}
