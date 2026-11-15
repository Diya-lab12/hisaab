"use client";
import { useEffect, useState } from "react";

const STEPS = {
  check: ["Reading what you wrote…", "Writing it out in clear English…", "Checking it against the Consumer Protection Act, 2019…", "Choosing the verified sections that apply…"],
  draft: ["Drafting your notice from the facts you confirmed…", "Leaving blanks for anything you didn't tell us…", "Checking the draft cites only verified sections…"],
};

/** While the check runs, the message moves on every few seconds so the wait feels purposeful. It never claims more than is happening. */
export default function CheckingSteps({ mode = "check" }: { mode?: "check" | "draft" }) {
  const steps = STEPS[mode];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => Math.min(n + 1, steps.length - 1)), 3500);
    return () => clearInterval(t);
  }, [steps.length]);
  return (
    <div className="checking" role="status" aria-live="polite">
      <span className="spin" aria-hidden="true" />
      <div>
        <strong key={i} className="check-msg">{steps[i]}</strong>
        <p>This takes a few seconds.</p>
      </div>
    </div>
  );
}
