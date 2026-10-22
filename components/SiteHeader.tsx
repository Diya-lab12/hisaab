"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

const LINKS = [
  { href: "/", label: "Home", match: (p: string) => p === "/" || p.startsWith("/new") },
  { href: "/examples", label: "Example cases", match: (p: string) => p.startsWith("/examples") },
  { href: "/cases", label: "My cases", match: (p: string) => p.startsWith("/cases") || p.startsWith("/case") },
];

export default function SiteHeader() {
  const path = usePathname() ?? "/";
  return (
    <header className="site-header">
      <div className="site-header-in">
        <Logo />
        <nav aria-label="Main">
          <ul>
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} aria-current={l.match(path) ? "page" : undefined}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
