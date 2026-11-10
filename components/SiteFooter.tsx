import Link from "next/link";
import Logo from "./Logo";
import { ADVOCATE } from "@/lib/advocate";

const LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-in">
        <div className="sf-brand">
          <Logo />
          <p>AI-drafted legal notices, reviewed and signed by {ADVOCATE.name}, {ADVOCATE.title}, {ADVOCATE.council}, Enrolment No. {ADVOCATE.enrolment}.</p>
        </div>
        <nav aria-label="Footer" className="sf-nav">
          <ul>
            {LINKS.map((l) => <li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}
          </ul>
        </nav>
      </div>
      <p className="sf-disclaimer">Claimatic gives general information and not legal advice. An advocate reviews every notice before it is sent.</p>
    </footer>
  );
}
