import Link from "next/link";

/** Compact logo: a ledger page with a tick, plus the name. */
export default function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="logo" aria-label="Hisaab home">
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
        <rect width="28" height="28" rx="8" fill="var(--cobalt)" />
        <path d="M7 10h14M7 14.5h9" stroke="var(--cobalt-ink)" strokeWidth="1.8" strokeLinecap="round" opacity=".55" />
        <path d="M7.5 19.5l3.2 3 7.3-8.5" stroke="var(--cobalt-ink)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <span>Hisaab</span>
    </Link>
  );
}
