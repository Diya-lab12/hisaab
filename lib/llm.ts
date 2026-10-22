// Calls Claude through OpenRouter. Server-only: the key never reaches the browser.
import { DEFAULT_MODEL, MAX_TOKENS, OPENROUTER_URL, REQUEST_TIMEOUT_MS } from "./config";
import { ComplaintInput } from "./checks";
import { LEGAL_SECTION_IDS } from "./legal-sources";
import { buildSystemPrompt, buildUserMessage } from "./prompt";
import type { Analysis } from "./analyze";

function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

export async function analyzeWithLLM(input: ComplaintInput): Promise<Analysis> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY not set");

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
      max_tokens: MAX_TOKENS,
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
  const parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));

  // Section guard: drop any section not on the verified list.
  const sections = (Array.isArray(parsed.sections) ? parsed.sections : [])
    .map((s: { id?: unknown; why?: unknown }) => ({ id: String(s?.id ?? ""), why: String(s?.why ?? "") }))
    .filter((s: { id: string }) => {
      const ok = LEGAL_SECTION_IDS.has(s.id);
      if (!ok) console.warn("Section guard removed unlisted section:", s.id);
      return ok;
    });

  const noticeBody = typeof parsed.notice_body === "string" ? parsed.notice_body : "";

  if (parsed.status === "not_covered") {
    return {
      status: "not_covered",
      not_covered_reason: typeof parsed.not_covered_reason === "string" ? parsed.not_covered_reason : "",
      alternatives: strArr(parsed.alternatives),
    };
  }
  if (parsed.status === "covered" && sections.length && noticeBody.trim()) {
    return {
      status: "covered",
      explanation: typeof parsed.explanation === "string" ? parsed.explanation : "",
      sections,
      relief: strArr(parsed.relief),
      steps: strArr(parsed.steps),
      noticeBody,
    };
  }
  const missing = strArr(parsed.missing);
  return {
    status: "need_more_info",
    missing: missing.length ? missing : ["Please add more detail about what happened and what you want."],
  };
}
