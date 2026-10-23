"use client";
import { useEffect, useRef } from "react";

const TARGET = 13.4; // lakh complaints reached the National Consumer Helpline in 2024
const DOTS = Array.from({ length: 100 }, (_, i) => i);

/**
 * A side panel for the home page with two real figures and a gentle animation.
 * The numbers are rounded from public sources, named under the card. The falling dots only show the pace.
 */
export default function HeroStats() {
  const num = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = num.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1600);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (TARGET * eased).toFixed(1);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <aside className="hero-stats" aria-label="Consumer complaints in India, in numbers">
      <div className="hs-block">
        <p className="hs-big"><span ref={num}>{TARGET.toFixed(1)}</span> lakh</p>
        <p className="hs-label">complaints reached the National Consumer Helpline in 2024. That is about 2.5 every minute.</p>
        <div className="hs-lane" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((i) => <span key={i} style={{ ["--d" as string]: `${i * 0.5}s` }} />)}
        </div>
      </div>

      <div className="hs-block">
        <div className="hs-grid" aria-hidden="true">
          {DOTS.map((i) => <span key={i} className={i < 35 ? "wait" : ""} style={{ ["--d" as string]: `${0.4 + i * 0.012}s` }} />)}
        </div>
        <p className="hs-label"><strong>About 1 in 3</strong> cases in the consumer commissions has been waiting for more than three years.</p>
      </div>

      <p className="hs-foot">Many people never start, because the first step is hard. Hisaab makes it easier.</p>
      <p className="hs-src fine">
        Sources: Ministry of Consumer Affairs reply in Parliament (2025), rounded; India Justice Report, Consumer Justice Report 2026, as reported by{" "}
        <a href="https://www.theweek.in/news/india/2026/03/18/vacancies-backlog-choke-consumer-courts-1-in-3-cases-pending-over-three-years-ijr-report.amp.html" target="_blank" rel="noreferrer">The Week</a>. The dots on top only show the pace.
      </p>
    </aside>
  );
}
