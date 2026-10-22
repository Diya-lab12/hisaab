import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { advocateAuthConfigured } from "./env";

export const COOKIE = "hisaab_advocate";
const DAY = 24 * 60 * 60;

const sign = (payload: string) => createHmac("sha256", process.env.SESSION_SECRET ?? "").update(payload).digest("base64url");

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function passphraseOk(given: string): boolean {
  const expected = process.env.ADVOCATE_PASSPHRASE ?? "";
  // Compare hashes so the length of the passphrase isn't revealed by timing.
  return advocateAuthConfigured() && safeEqual(createHash("sha256").update(given).digest("hex"), createHash("sha256").update(expected).digest("hex"));
}

export function makeSession(): { value: string; maxAge: number } {
  const exp = Math.floor(Date.now() / 1000) + 7 * DAY;
  const payload = `${exp}.${randomBytes(8).toString("hex")}`;
  return { value: `${payload}.${sign(payload)}`, maxAge: 7 * DAY };
}

export async function isAdvocate(): Promise<boolean> {
  if (!advocateAuthConfigured()) return false;
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v) return false;
  const i = v.lastIndexOf(".");
  const payload = v.slice(0, i);
  const exp = Number(payload.split(".")[0]);
  return Number.isFinite(exp) && exp > Date.now() / 1000 && safeEqual(v.slice(i + 1), sign(payload));
}

export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");
export const newToken = () => randomBytes(24).toString("hex");
export const newRef = () => randomBytes(4).toString("hex").toUpperCase();
