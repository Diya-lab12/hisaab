import Image from "next/image";
import Link from "next/link";

/** The Hisaab logo: a gavel with a refund arrow, and the name. */
export default function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="logo" aria-label="Hisaab home">
      <Image src="/logo.png" alt="Hisaab" width={1283} height={296} priority />
    </Link>
  );
}
