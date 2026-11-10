import Image from "next/image";
import Link from "next/link";

/** The Claimatic logo: a gavel with a refund arrow, and the name set in type. */
export default function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="logo" aria-label="Claimatic home">
      <Image src="/logo-mark.png" alt="" width={365} height={296} priority className="logo-mark" />
      <span className="logo-word">CLAIMATIC</span>
    </Link>
  );
}
