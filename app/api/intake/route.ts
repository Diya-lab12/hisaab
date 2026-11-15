import { NextResponse } from "next/server";
import { COMMON_TIP, INDUSTRIES, industryFor } from "@/lib/categories";
import { filingInfo, parseAmount } from "@/lib/checks";
import { NOTICE_DEADLINE_DAYS } from "@/lib/config";
import { getIssue } from "@/lib/issues";
import { limited, str } from "@/lib/server/http";
import { bumpCounter } from "@/lib/server/store";
import { aiError } from "@/lib/server/aiErrors";
import { readStory } from "@/lib/server/gemini";

export const maxDuration = 60;

/** Per-visitor limit. Uses the shared database when it is connected, and falls back to a weaker in-memory count. */
async function tooMany(req: Request): Promise<boolean> {
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  try {
    const n = await bumpCounter(`claimatic:rl:intake:${ip}`, 3600);
    if (n !== null) return n > 12;
  } catch {
    /* fall through to the in-memory count */
  }
  return limited(req, "intake", 12, 60 * 60 * 1000);
}

/**
 * "Verdict first": the AI reads the story (any language), writes a clear English account for the person to confirm,
 * pulls out the facts, and decides whether the Act appears to cover it. Sections outside the verified list are stripped
 * in lib/server/gemini.ts. If the AI fails, the person gets a clear error and can retry: there is no keyword fallback.
 * Only the story is sent to the AI. The person's name, address and contact are asked for later and never sent to it.
 */
export async function POST(req: Request) {
  if (await tooMany(req)) return NextResponse.json({ error: "Too many checks from this connection. Please try again in a while." }, { status: 429 });
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const story = str(body.story, 2000).trim();
  if (story.length < 15) return NextResponse.json({ error: "Tell us a little more: what you bought, what went wrong, and what the company said." }, { status: 400 });

  const r = await readStory(story);
  if (!r.ok) return aiError(r, "check your case");
  const { read } = r;
  const facts = { ...read.facts };
  const hint = typeof body.issue === "string" ? body.issue : "";
  if (facts.issueType === "other" && hint && getIssue(hint)) facts.issueType = getIssue(hint)!.id;
  const base = { source: "ai" as const, removedCitations: read.removedCitations };
  const english = { language: read.language, english: read.english };

  if (read.verdict === "not_covered") {
    return NextResponse.json({ facts, ...english, result: { ...base, status: "not_covered", not_covered_reason: read.reason, alternatives: read.alternatives } });
  }
  if (read.verdict === "need_more_info") {
    return NextResponse.json({ facts, ...english, result: { ...base, status: "need_more_info", explanation: read.reason, missing: read.missing } });
  }

  const company = facts.company || "the company";
  const fallback = getIssue(facts.issueType)?.fallbackIndustry ?? "other";
  const industryId = industryFor(facts.company, read.english, fallback);
  const industry = INDUSTRIES[industryId];
  return NextResponse.json({
    facts,
    ...english,
    result: {
      ...base,
      status: "covered",
      explanation: read.reason,
      sections: read.sections,
      relief: ["Refund of the amount paid, with interest", "Compensation for harassment and inconvenience", "The cost of filing the case"],
      steps: [
        `Collect your proof: the payment receipt or order ID, screenshots of your chats with ${company}, and any emails.`,
        `Complain to ${company}'s customer support or grievance officer in writing and keep the complaint number.`,
        "Send the legal notice by email and by registered post. A notice is a smart first step, not a legal requirement before filing.",
        `Wait ${NOTICE_DEADLINE_DAYS} days for a reply.`,
        "If there is no fair reply, file a complaint online at e-Jagriti (e-jagriti.gov.in) with the District Commission where you live or work.",
      ],
      industry: { id: industryId, label: industry.label },
      tips: [...industry.tips, COMMON_TIP],
      filing: parseAmount(facts.amount) > 0 ? filingInfo(parseAmount(facts.amount)) : undefined,
    },
  });
}
