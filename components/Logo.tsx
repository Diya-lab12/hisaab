import Link from "next/link";
import LogoMark from "./LogoMark";

/** The Claimatic logo: the gavel mark and the name set in type. */
export default function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="logo" aria-label="Claimatic home">
      <LogoMark className="logo-mark" />
      <span className="logo-word">Claimatic</span>
    </Link>
  );
}
