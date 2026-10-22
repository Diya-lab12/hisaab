import { NextResponse } from "next/server";
import { analyze, notCoveredMatch } from "@/lib/analyze";
import type { Analysis } from "@/lib/analyze";
import { analyzeWithLLM } from "@/lib/llm";
import { ComplaintInput, filingInfo, invalidFields, missingFields, parseAmount } from "@/lib/checks";
import { assembleNotice } from "@/lib/notice";
import { COMMON_TIP, INDUSTRIES, industryFor } from "@/lib/categories";
import { cleanIssue, getIssue } from "@/lib/issues";
import { QUESTIONS, RESOLUTIONS } from "@/lib/questions";

// The AI call can take several seconds; give the serverless function room (Vercel).
export const maxDuration = 60;



/** Builds a clean input from whatever the browser sent: unknown fields are dropped, long text is trimmed. */
function sanitise(raw: Record<string, unknown>): ComplaintInput {
  const str = (v: unknown, max = 2000) => (typeof v === "string" ? v.slice(0, max) : "");
  const input: ComplaintInput = {
    name: str(raw.name),
    address: str(raw.address),
    contact: str(raw.contact),
    company: str(raw.company),
    amount: str(raw.amount),
    incidentDate: str(raw.incidentDate),
    description: str(raw.description),
    issueType: cleanIssue(raw.issueType),
    resolution: RESOLUTIONS.some((r) => r.value === raw.resolution) ? (raw.resolution as string) : "",
    resolutionOther: str(raw.resolutionOther, 200),
    answers: {},
  };
  // Only answers to the questions for this problem, each capped, are kept.
  const answers = raw.answers && typeof raw.answers === "object" ? (raw.answers as Record<string, unknown>) : {};
  for (const q of QUESTIONS[(input.issueType as keyof typeof QUESTIONS) || "other"]) {
    const v = str(answers[q.id], 500).trim();
    if (v) input.answers![q.id] = v;
  }
  return input;
}

export async function POST(req: Request) {
  let raw: Record<string, unknown>;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const input = sanitise(raw && typeof raw === "object" ? raw : {});


  // 1. Obvious non-consumer matters get a clear "not covered" even if other fields are blank.
  if (input.description.trim()) {
    const nc = notCoveredMatch(input.description);
    if (nc) return NextResponse.json({ status: "not_covered", ...nc, source: "precheck", removedCitations: 0 });
  }

  // 2. Required-field and sanity checks run before any AI call.
  const missing = missingFields(input);
  if (missing.length) {
    return NextResponse.json({ status: "need_more_info", missing: missing.map((m) => `Please provide ${m}.`) });
  }
  const invalid = invalidFields(input);
  if (invalid.length) {
    return NextResponse.json({ status: "need_more_info", missing: invalid.map((m) => `Please fix: ${m}.`) });
  }

  // 3. AI answer, with the keyword rules as a labelled fallback.
  let result: Analysis;
  let source: "ai" | "rules" = "ai";
  let removedCitations = 0;
  try {
    const out = await analyzeWithLLM(input);
    result = out.analysis;
    removedCitations = out.removedCitations;
  } catch (e) {
    console.error("AI analysis failed, using rule-based fallback:", e);
    result = analyze(input);
    source = "rules";
  }

  if (result.status !== "covered") return NextResponse.json({ ...result, source, removedCitations });

  const { noticeBody, ...rest } = result;
  const fallback = getIssue(input.issueType)?.fallbackIndustry ?? "other";
  const industryId = industryFor(input.company, input.description, fallback);
  const industry = INDUSTRIES[industryId];
  return NextResponse.json({
    ...rest,
    source,
    removedCitations,
    industry: { id: industryId, label: industry.label },
    tips: [...industry.tips, COMMON_TIP],
    filing: filingInfo(parseAmount(input.amount)),
    notice: assembleNotice(input, noticeBody, result.sections.map((s) => s.id)),
  });
}
