import NoticeBox from "./NoticeBox";

export type Result = {
  status: "covered" | "not_covered" | "need_more_info";
  missing?: string[];
  explanation?: string;
  sections?: { id: string; why: string }[];
  relief?: string[];
  steps?: string[];
  filing?: { timeWarning: string | null; forum: string; fee: string | null };
  notice?: string;
  not_covered_reason?: string;
  alternatives?: string[];
};

export default function ResultCard({ r }: { r: Result }) {
  if (r.status === "covered") {
    return (
      <>
        <article className="card covered">
          <h2>Yes, this is covered</h2>
          <p>{r.explanation}</p>
          <h3>Sections that apply</h3>
          <ul>{r.sections?.map((s) => <li key={s.id}><strong>Section {s.id}</strong>: {s.why}</li>)}</ul>
          <h3>What you can claim</h3>
          <ul>{r.relief?.map((x, i) => <li key={i}>{x}</li>)}</ul>
          <h3>Step by step</h3>
          <ol>{r.steps?.map((x, i) => <li key={i}>{x}</li>)}</ol>
          {r.filing && (
            <>
              <h3>Where to file</h3>
              <p>{r.filing.forum} {r.filing.fee}</p>
              {r.filing.timeWarning && <p className="warn">{r.filing.timeWarning}</p>}
            </>
          )}
        </article>
        {r.notice && <NoticeBox notice={r.notice} />}
      </>
    );
  }
  if (r.status === "not_covered") {
    return (
      <article className="card notcovered">
        <h2>Not covered</h2>
        <p>{r.not_covered_reason || r.explanation}</p>
        {!!r.alternatives?.length && (
          <>
            <h3>Where else you could go</h3>
            <ul>{r.alternatives.map((x, i) => <li key={i}>{x}</li>)}</ul>
          </>
        )}
      </article>
    );
  }
  return (
    <article className="card needinfo">
      <h2>We need a bit more information</h2>
      <ul>{r.missing?.map((x, i) => <li key={i}>{x}</li>)}</ul>
    </article>
  );
}
