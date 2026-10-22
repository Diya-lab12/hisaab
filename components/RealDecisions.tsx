import { LIMIT_CASES, casesFor, type RealCase } from "@/lib/realCases";

function Item({ c }: { c: RealCase }) {
  return (
    <li className="decision">
      <h4>{c.title}</h4>
      <p className="where">{c.where}</p>
      <p>{c.summary}</p>
      <p><strong>Outcome:</strong> {c.outcome}</p>
      <p className="fine">Source: <a href={c.source.url} target="_blank" rel="noreferrer">{c.source.name}</a></p>
    </li>
  );
}

/** Real, reported decisions for context, with the honest limits next to them. */
export default function RealDecisions({ issue, fold = false }: { issue: string; fold?: boolean }) {
  const similar = casesFor(issue);
  const body = (
    <>
      <p className="fine">
        These are reported decisions, shown for context. They come from news reports of the orders, not the full orders, and appeals weren&apos;t checked. Every case depends on its own facts, so they don&apos;t predict yours.
      </p>
      {similar.length > 0 && <ul className="decisions">{similar.map((c) => <Item key={c.id} c={c} />)}</ul>}
      <details className="more">
        <summary>When complaints don&apos;t succeed</summary>
        <ul className="decisions">{LIMIT_CASES.map((c) => <Item key={c.id} c={c} />)}</ul>
      </details>
    </>
  );
  if (fold) {
    return (
      <details className="ws-card fold">
        <summary><span className="fold-t">Real decisions on similar problems</span></summary>
        <div className="fold-body">{body}</div>
      </details>
    );
  }
  return (
    <section className="ws-card" aria-labelledby="real-h">
      <h2 id="real-h">Real decisions on similar problems</h2>
      {body}
    </section>
  );
}
