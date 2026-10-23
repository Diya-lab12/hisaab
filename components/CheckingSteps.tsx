"use client";
import { useEffect, useState } from "react";

const STEPS = ["Reading what you wrote…", "Checking it against the Consumer Protection Act, 2019…", "Choosing the sections that apply…", "Drafting your legal notice…"];

/** While the AI works, the message moves on every few seconds so the wait feels purposeful. It never claims more than is happening. */
export default function CheckingSteps() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => Math.min(n + 1, STEPS.length - 1)), 3500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="checking" role="status" aria-live="polite">
      <span className="spin" aria-hidden="true" />
      <div>
        <strong key={i} className="check-msg">{STEPS[i]}</strong>
        <p>This takes a few seconds.</p>
      </div>
    </div>
  );
}
