/** The path a case takes after it is sent, greyed out until it is real. */
const STEPS = [
  "You send your case to the advocate",
  "She reads it and tells you if she can take it",
  "She quotes a fee for your case, and you pay only then",
  "She signs the notice and sends it to the company",
  "The company's reply, and your follow-up date",
];

export default function TrackingPreview() {
  return (
    <section className="tracking-preview" aria-labelledby="track-h">
      <h3 id="track-h">What happens after you send</h3>
      <ol aria-label="Steps after sending, not started yet">
        {STEPS.map((s) => <li key={s}><span className="tp-dot" aria-hidden="true" />{s}</li>)}
      </ol>
      <p className="fine">Your real progress appears here once you send your case.</p>
    </section>
  );
}
