import { COOKIE } from "@/lib/server/auth";
import { json } from "@/lib/server/http";

export async function POST() {
  const res = json({ ok: true });
  res.cookies.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
