import { isAdvocate } from "@/lib/server/auth";
import { advocateAuthConfigured, backendReady } from "@/lib/server/env";
import { json } from "@/lib/server/http";


export async function GET() {
  return json({ configured: advocateAuthConfigured(), authed: await isAdvocate(), backend: backendReady() });
}
