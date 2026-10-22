import type { Result } from "@/lib/types";

export default function CaseTab({ r }: { r: Result }) {
  return (
    <div className="tab-body">
      {r.source === "rules" && (
        <p className="callout warn">Answered with basic rules because the AI was unavailable. Treat this as a rough guide.</p>
      )}
      {!!r.removedCitations && (
        <p className="callout warn">
          {r.removedCitations} legal citation{r.removedCitations > 1 ? "s were" : " was"} removed because{" "}
          {r.removedCitations > 1 ? "they are" : "it is"} not in our checked list.
        </p>
      )}

      <p className="lede">{r.explanation}</p>

      <h2>Sections that apply</h2>
      <p className="fine">Based only on what you wrote. Check these match your situation.</p>
      <ul className="plain">
        {r.sections?.map((s) => (
          <li key={s.id}><strong>Section {s.id}</strong> {s.why}</li>
        ))}
      </ul>

      <h2>What you can claim</h2>
      <ul>{r.relief?.map((x, i) => <li key={i}>{x}</li>)}</ul>

      <h2>Step by step</h2>
      <ol>{r.steps?.map((x, i) => <li key={i}>{x}</li>)}</ol>

      {r.filing && (
        <>
          <h2>Where to file</h2>
          <p>{r.filing.forum} {r.filing.fee}</p>
        </>
      )}
    </div>
  );
}
