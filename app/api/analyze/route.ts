import { NextResponse } from "next/server";
import { analyze } from "@/lib/analyze";
import { ComplaintInput, filingInfo, missingFields, parseAmount } from "@/lib/checks";
import { assembleNotice } from "@/lib/notice";

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

  const missing = missingFields(input);
  if (missing.length) {
    return NextResponse.json({ status: "need_more_info", missing: missing.map((m) => `Please provide ${m}.`) });
  }

  const result = analyze(input);
  if (result.status !== "covered") return NextResponse.json(result);

  const { noticeBody, ...rest } = result;
  return NextResponse.json({
    ...rest,
    filing: filingInfo(parseAmount(input.amount), input.incidentDate),
    notice: assembleNotice(input, noticeBody, result.sections.map((s) => s.id)),
  });
}
