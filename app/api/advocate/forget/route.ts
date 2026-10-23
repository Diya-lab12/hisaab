import { hashToken } from "@/lib/server/auth";
import { trackingReady } from "@/lib/server/env";
import { json, limited, str } from "@/lib/server/http";
import { deleteSubmission, getSubmission } from "@/lib/server/store";

/** The client deletes their own request, with their notice and details, from Hisaab's server. The advocate's email copy is hers to keep. */
export async function POST(req: Request) {
  if (!trackingReady().ok) return json({ error: "not_configured" }, 503);
  if (limited(req, "forget", 10, 60 * 60 * 1000)) return json({ error: "Too many requests." }, 429);
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  const sub = await getSubmission(str(b.id, 40));
  const token = str(b.token, 100);
  if (!sub || !token || sub.tokenHash !== hashToken(token)) return json({ error: "Not found." }, 404);
  await deleteSubmission(sub.id);
  return json({ ok: true });
}
