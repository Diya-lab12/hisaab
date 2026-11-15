import { NextResponse } from "next/server";
import type { AiFail } from "./gemini";

/** Turns a failed AI call into a clear message the person can act on (with a retry). Never includes key details. */
export function aiError(f: AiFail, what: string) {
  const msg =
    f.reason === "not_configured"
      ? `We can't ${what} right now because the AI service isn't set up. Nothing was lost. Please try again later.`
      : f.reason === "unsafe"
        ? `We couldn't ${what} safely this time: the draft didn't pass our checks. Your answers are still here, so please try again.`
        : f.reason === "busy"
          ? `The AI service is busy, so we couldn't ${what}. Your answers are still here. Please try again in a moment.`
          : `Something went wrong while we tried to ${what}. Your answers are still here. Please try again.`;
  const status = f.reason === "not_configured" ? 503 : f.reason === "busy" ? 503 : 502;
  return NextResponse.json({ error: msg, retry: true, code: `ai_${f.reason}` }, { status, headers: { "Cache-Control": "no-store" } });
}
