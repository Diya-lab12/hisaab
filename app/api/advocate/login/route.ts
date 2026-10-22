import { COOKIE, makeSession, passphraseOk } from "@/lib/server/auth";
import { advocateAuthConfigured, isProd } from "@/lib/server/env";
import { json, limited, str } from "@/lib/server/http";


export async function POST(req: Request) {
  if (!advocateAuthConfigured()) return json({ error: "not_configured" }, 503);
  if (limited(req, "login", 8, 15 * 60 * 1000)) return json({ error: "Too many attempts. Try again in a few minutes." }, 429);
  let b: Record<string, unknown> = {};
  try {
    b = await req.json();
  } catch {
    /* empty */
  }
  if (!passphraseOk(str(b.passphrase, 200))) {
    await new Promise((r) => setTimeout(r, 700));
    return json({ error: "That passphrase isn't right." }, 401);
  }
  const s = makeSession();
  const res = json({ ok: true });
  res.cookies.set(COOKIE, s.value, { httpOnly: true, secure: isProd, sameSite: "lax", path: "/", maxAge: s.maxAge });
  return res;
}
