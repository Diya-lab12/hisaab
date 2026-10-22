import { NextResponse } from "next/server";
import { analyze, notCoveredMatch } from "@/lib/analyze";
import type { Analysis } from "@/lib/analyze";
import { analyzeWithLLM } from "@/lib/llm";
import { ComplaintInput, filingInfo, invalidFields, missingFields, parseAmount } from "@/lib/checks";
import { assembleNotice } from "@/lib/notice";
import { COMMON_TIP, INDUSTRIES, detectIndustry } from "@/lib/categories";

// The AI call can take several seconds; give the serverless function room (Vercel).
export const maxDuration = 60;

const FIELDS = ["name", "address", "contact", "company", "amount", "incidentDate", "description"] as const;

export async function POST(req: Request) {
  let raw: Partial<Record<(typeof FIELDS)[number], unknown>>;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const input = Object.fromEntries(
    FIELDS.map((k) => [k, typeof raw[k] === "string" ? (raw[k] as string) : ""]),
  ) as ComplaintInput;

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
  const industryId = detectIndustry(input.company, input.description);
  const industry = INDUSTRIES[industryId];
  return NextResponse.json({
    ...rest,
    source,
    removedCitations,
    industry: { id: industryId, label: industry.label },
    evidence: industry.evidence,
    tips: [...industry.tips, COMMON_TIP],
    filing: filingInfo(parseAmount(input.amount)),
    notice: assembleNotice(input, noticeBody, result.sections.map((s) => s.id)),
  });
}
