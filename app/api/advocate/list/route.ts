import { isAdvocate } from "@/lib/server/auth";
import { json } from "@/lib/server/http";
import { listSubmissions } from "@/lib/server/store";


export async function GET() {
  if (!(await isAdvocate())) return json({ error: "Not signed in." }, 401);
  const all = await listSubmissions();
  return json({ submissions: all.map(({ tokenHash, ...rest }) => { void tokenHash; return rest; }) });
}
