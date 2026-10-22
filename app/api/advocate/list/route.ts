import { isAdvocate } from "@/lib/server/auth";
import { trackingReady } from "@/lib/server/env";
import { json } from "@/lib/server/http";
import { listSubmissions } from "@/lib/server/store";


export async function GET() {
  if (!(await isAdvocate())) return json({ error: "Not signed in." }, 401);
  if (!trackingReady().ok) return json({ error: "Storage isn't set up yet, so there are no requests to show." }, 503);
  const all = await listSubmissions();
  return json({ submissions: all.map(({ tokenHash, ...rest }) => { void tokenHash; return rest; }) });
}
