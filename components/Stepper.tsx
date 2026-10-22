export const STEPS = ["The problem", "Evidence", "Your details", "Review"] as const;

export default function Stepper({ current, onJump }: { current: number; onJump: (i: number) => void }) {
  const pct = ((current + 1) / STEPS.length) * 100;
  return (
    <nav aria-label="Progress" className="stepper">
      <p className="stepcount">Step {current + 1} of {STEPS.length}: <strong>{STEPS[current]}</strong></p>
      <div className="bar" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={current + 1} aria-label="Progress">
        <span style={{ width: `${pct}%` }} />
      </div>
      <ol>
        {STEPS.map((s, i) => (
          <li key={s} className={i < current ? "done" : i === current ? "now" : ""}>
            <button type="button" onClick={() => onJump(i)} disabled={i > current} aria-current={i === current ? "step" : undefined}>
              <span className="dot" aria-hidden="true">
                {i < current ? (
                  <svg width="12" height="12" viewBox="0 0 16 16"><path d="M3 8.5l3.2 3L13 4.5" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                ) : (
                  i + 1
                )}
              </span>
              <span className="lbl">{s}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
