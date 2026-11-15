import { formatDate, formatRupees, parseAmount } from "@/lib/checks";
import { LEGAL_SECTION_IDS } from "@/lib/legal-sources";
import { cleanTokens } from "@/lib/noticeBlanks";
import { resolutionLabel } from "@/lib/questions";
import { aiError } from "@/lib/server/aiErrors";
import { draftNotice } from "@/lib/server/gemini";
import { json, limited, str } from "@/lib/server/http";

export const maxDuration = 60;

/**
 * Drafts the body of the notice with the AI, from the facts the person confirmed and the English account.
 * The person's name, address and contact are never part of this request: they stay as blanks filled in the browser.
 * Missing facts become {{blanks}}. Sections outside the allowlist, case citations, other laws, and amounts or dates that
 * don't match the confirmed facts are rejected by the server checks in lib/server/gemini.ts.
 */
export async function POST(req: Request) {
  if (limited(req, "draft", 20, 60 * 60 * 1000)) return json({ error: "Too many drafts from this connection. Please try again in a while." }, 429);
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  const english = str(b.english, 3000).trim();
  if (english.length < 15) return json({ error: "Your story is needed to draft the notice." }, 400);
  const f = (b.facts ?? {}) as Record<string, unknown>;
  const amount = parseAmount(str(f.amount, 12));
  const date = str(f.incidentDate, 10);
  const sectionIds = (Array.isArray(b.sections) ? b.sections : []).map((x) => str(x, 20)).filter((id) => LEGAL_SECTION_IDS.has(id)).slice(0, 6);

  const r = await draftNotice({
    english,
    company: str(f.company, 80).trim(),
    amount: amount > 0 ? formatRupees(amount) : "",
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date)) ? formatDate(date) : "",
    orderRef: str(f.orderRef, 40).replace(/[^A-Za-z0-9-]/g, ""),
    resolution: resolutionLabel(str(f.resolution, 20)),
    sectionIds,
  });
  if (!r.ok) return aiError(r, "draft your notice");
  return json({ noticeBody: cleanTokens(r.body), source: "ai" });
}
