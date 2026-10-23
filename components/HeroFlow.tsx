/** A quiet loop showing how a case moves. It is illustrative only, so it is hidden from screen readers. */
const STEPS = ["Describe what happened", "Law check", "Notice drafted", "Signed by an advocate"];

export default function HeroFlow() {
  return (
    <ol className="flow" aria-hidden="true">
      {STEPS.map((s, i) => (
        <li key={s} style={{ ["--i" as string]: i }}>
          <span className="flow-dot" />
          {s}
        </li>
      ))}
    </ol>
  );
}
