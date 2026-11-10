import Link from "next/link";
import { ADVOCATE } from "@/lib/advocate";

/** A short card on the home page: who reads and signs every notice. */
export default function AdvocateCard() {
  return (
    <aside className="advocate-card" aria-label="The reviewing advocate">
      <p className="ac-kicker">Reviewed and signed by</p>
      <p className="ac-name">{ADVOCATE.name}, {ADVOCATE.title}</p>
      <p className="ac-meta">{ADVOCATE.council}<br />Enrolment No. {ADVOCATE.enrolment}<br />{ADVOCATE.place}</p>
      <ul className="ac-points">
        <li>She reads your case and checks every line of the notice.</li>
        <li>She signs it and sends it to the company by registered post.</li>
        <li>You pay only if she takes your case.</li>
      </ul>
      <p className="fine"><Link href="/how-it-works" className="link">How it works</Link></p>
    </aside>
  );
}
