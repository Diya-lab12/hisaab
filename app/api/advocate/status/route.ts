import { hashToken } from "@/lib/server/auth";
import { backendReady } from "@/lib/server/env";
import { json, limited } from "@/lib/server/http";
import { getSubmission } from "@/lib/server/store";


/** The client checks on their own submission. The secret token proves it is theirs. */
export async function GET(req: Request) {
  if (!backendReady().ok) return json({ error: "not_configured" }, 503);
  if (limited(req, "status", 60, 10 * 60 * 1000)) return json({ error: "Too many requests." }, 429);
  const u = new URL(req.url);
  const sub = await getSubmission(u.searchParams.get("id") ?? "");
  const token = u.searchParams.get("token") ?? "";
  if (!sub || !token || sub.tokenHash !== hashToken(token)) return json({ error: "Not found." }, 404);
  return json({ status: sub.status, advocateNote: sub.advocateNote, updatedAt: sub.updatedAt, history: sub.history });
}
