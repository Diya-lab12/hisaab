import Link from "next/link";
import IssueIcon from "@/components/IssueIcon";
import { EXAMPLES } from "@/lib/examples";

export const metadata = { title: "Example cases · Hisaab" };

export default function Examples() {
  return (
    <main className="page narrow-page">
      <h1 className="page-h">Example cases</h1>
      <p className="lede">
        See what a finished case looks like before you start. These are <strong>illustrative examples</strong>: fictional walkthroughs, not real customers and not results Hisaab achieved.
      </p>
      <ul className="ex-list">
        {EXAMPLES.map((e) => (
          <li key={e.slug}>
            <Link href={`/examples/${e.slug}`} className="ex-card">
              <span className="badge illus">Illustrative example</span>
              <span className="ex-icon"><IssueIcon id={e.issue} size={28} /></span>
              <span className="ex-t">{e.title}</span>
              <span className="ex-d">{e.teaser}</span>
              <span className="ex-go">Open the example</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
