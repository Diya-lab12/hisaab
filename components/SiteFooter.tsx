import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-in">
        <p>Hisaab gives general information, not legal advice. An advocate reviews every notice before it is sent.</p>
        <Link href="/how-it-works">How it works and who reviews it</Link>
      </div>
    </footer>
  );
}
