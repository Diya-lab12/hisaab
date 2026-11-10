import { NextResponse } from "next/server";
import { analyze, notCoveredMatch } from "@/lib/analyze";
import type { Analysis } from "@/lib/analyze";
import { COMMON_TIP, INDUSTRIES, industryFor } from "@/lib/categories";
import { filingInfo, parseAmount, type ComplaintInput } from "@/lib/checks";
import { extractRules } from "@/lib/extract";
import { getIssue } from "@/lib/issues";
import { cleanTokens } from "@/lib/noticeBlanks";
import { limited, str } from "@/lib/server/http";
import { bumpCounter } from "@/lib/server/store";

export const maxDuration = 60;

const NOT_YET = "Not provided yet";

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
 * "Verdict first": takes the person's story, pulls out the facts, and runs the law check (keyword rules over the verified
 * sections). The answer is preliminary: it is built before we have their details.
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

  const hint = typeof body.issue === "string" ? body.issue : "";
  const facts = extractRules(story);
  if (facts.issueType === "other" && hint && getIssue(hint)) facts.issueType = getIssue(hint)!.id;

  const nc = notCoveredMatch(story);
  if (nc) return NextResponse.json({ facts, result: { status: "not_covered", ...nc, source: "precheck", removedCitations: 0 } });

  const input: ComplaintInput = {
    name: NOT_YET,
    address: NOT_YET,
    contact: NOT_YET,
    company: facts.company,
    amount: facts.amount,
    incidentDate: facts.incidentDate,
    description: story,
    issueType: facts.issueType,
    resolution: facts.resolution,
    answers: {},
  };

  // The check is plain keyword rules matched against the verified sections. Nothing is sent to any outside service.
  const result: Analysis = analyze({ ...input, company: facts.company || "the company" }, { force: true });
  const source = "rules";
  const removedCitations = 0;

  if (result.status !== "covered") return NextResponse.json({ facts, result: { ...result, source, removedCitations } });

  const { noticeBody, ...rest } = result;
  const fallback = getIssue(facts.issueType)?.fallbackIndustry ?? "other";
  const industryId = industryFor(facts.company, story, fallback);
  const industry = INDUSTRIES[industryId];
  return NextResponse.json({
    facts,
    result: {
      ...rest,
      source,
      removedCitations,
      industry: { id: industryId, label: industry.label },
      tips: [...industry.tips, COMMON_TIP],
      filing: parseAmount(facts.amount) > 0 ? filingInfo(parseAmount(facts.amount)) : undefined,
    },
    noticeBody: cleanTokens(noticeBody),
  });
}
