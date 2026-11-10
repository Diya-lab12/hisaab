"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ADVOCATE } from "@/lib/advocate";
import { STARTERS } from "@/lib/facts";

export const STORY_KEY = "claimatic-story";

/** The home page's one box: the person writes what happened, in any language, and the check starts. */
export default function StoryBox() {
  const router = useRouter();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [story, setStory] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Tapping an issue card puts a starter sentence in the box, unless the person has already written something.
  useEffect(() => {
    const on = (e: Event) => {
      const starter = (e as CustomEvent<string>).detail;
      setStory((cur) => (cur.trim() ? cur : starter));
      ref.current?.focus();
    };
    window.addEventListener("claimatic:prefill", on);
    return () => window.removeEventListener("claimatic:prefill", on);
  }, []);

  function go(e: React.FormEvent) {
    e.preventDefault();
    if (story.trim().length < 15) {
      setError("Tell us a little more: what you bought, what went wrong, and what the company said.");
      ref.current?.focus();
      return;
    }
    try {
      sessionStorage.setItem(STORY_KEY, story.trim());
    } catch {
      /* the check still works from the next page if storage is blocked, the person just retypes */
    }
    router.push("/new");
  }

  return (
    <form className="story-box" onSubmit={go} noValidate>
      <label htmlFor="home-story" className="story-label">Tell us what happened, in any language</label>
      <textarea
        id="home-story"
        ref={ref}
        value={story}
        rows={5}
        onChange={(e) => { setStory(e.target.value); setError(null); }}
        placeholder="For example: I returned a pair of shoes to a shop on 10 September. They promised a refund of ₹2,499 in 7 days, but nothing has come."
        aria-invalid={Boolean(error)}
        aria-describedby="home-story-msg"
      />
      <p id="home-story-msg" className={error ? "msg error" : "fine"} role={error ? "alert" : undefined}>{error ?? "Hindi, Kannada, English or a mix. Don't include your name or address yet."}</p>
      <div className="story-actions">
        <button type="submit" className="cta">Check my case</button>
        <Link href="/examples" className="link">or see an example</Link>
      </div>
      <ul className="proof" aria-label="Why you can trust the check">
        <li><strong>Verified sections only.</strong> The AI can only cite sections checked against the Act.</li>
        <li><strong>Real decisions, including losses.</strong> You see what happened in similar cases, good and bad.</li>
        <li><strong>Signed by a named advocate.</strong> {ADVOCATE.name}, Enrolment No. {ADVOCATE.enrolment}.</li>
      </ul>
    </form>
  );
}

export { STARTERS };
