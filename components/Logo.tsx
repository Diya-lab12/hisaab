import Link from "next/link";

/** The Claimatic logo: the gavel and the name, as supplied by the founder (public/logo.png). */
export default function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="logo" aria-label="Claimatic home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="logo-img" src="/logo.png" alt="Claimatic" width={1852} height={453} />
    </Link>
  );
}
