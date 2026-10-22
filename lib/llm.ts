// Calls Claude through OpenRouter. Server-only: the key never reaches the browser.
import { DEFAULT_MODEL, MAX_TOKENS, OPENROUTER_URL, REQUEST_TIMEOUT_MS } from "./config";
import { ComplaintInput } from "./checks";
import { LEGAL_SECTION_IDS } from "./legal-sources";
import { buildSystemPrompt, buildUserMessage } from "./prompt";
import type { Analysis } from "./analyze";

function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

export async function analyzeWithLLM(
  input: ComplaintInput,
): Promise<{ analysis: Analysis; removedCitations: number }> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY not set");

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserMessage(input) },
      ],
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 300)}`);

  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Model reply had no JSON object");
  const raw = text.slice(start, end + 1);
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Lenient retry: drop trailing commas the model sometimes emits.
    parsed = JSON.parse(raw.replace(/,\s*([}\]])/g, "$1"));
  }

  // Section guard: drop any section not on the verified list.
  let removedCitations = 0;
  const sections = (Array.isArray(parsed.sections) ? parsed.sections : [])
    .map((s: { id?: unknown; why?: unknown }) => ({
      id: String(s?.id ?? "").replace(/^\s*(section|sec\.?|s\.?)\s*/i, "").trim(),
      why: String(s?.why ?? ""),
    }))
    .filter((s: { id: string }) => {
      const ok = LEGAL_SECTION_IDS.has(s.id);
      if (!ok) {
        removedCitations++;
        console.warn("Section guard removed unlisted section:", s.id);
      }
      return ok;
    });

  const noticeBody = typeof parsed.notice_body === "string" ? parsed.notice_body : "";

  if (parsed.status === "not_covered") {
    return {
      removedCitations,
      analysis: {
        status: "not_covered",
        not_covered_reason: typeof parsed.not_covered_reason === "string" ? parsed.not_covered_reason : "",
        alternatives: strArr(parsed.alternatives),
      },
    };
  }
  // A notice with bracketed placeholders is unusable, so treat it as a failed AI answer.
  if (parsed.status === "covered" && /\[[^\]]*\]/.test(noticeBody)) {
    throw new Error("Model notice contained placeholders");
  }
  if (parsed.status === "covered" && sections.length && noticeBody.trim()) {
    return {
      removedCitations,
      analysis: {
        status: "covered",
        explanation: typeof parsed.explanation === "string" ? parsed.explanation : "",
        sections,
        relief: strArr(parsed.relief),
        steps: strArr(parsed.steps),
        noticeBody,
      },
    };
  }
  const missing = strArr(parsed.missing);
  return {
    removedCitations,
    analysis: {
      status: "need_more_info",
      missing: missing.length ? missing : ["Please add more detail about what happened and what you want."],
    },
  };
}
