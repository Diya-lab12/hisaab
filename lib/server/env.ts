// Server-only. Reads configuration. Nothing here is ever sent to the browser.

export const isProd = process.env.NODE_ENV === "production";

export const smtpConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const redisUrl = () => process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
const redisToken = () => process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";
export const redisConfigured = () => Boolean(redisUrl() && redisToken());
export const redis = { url: redisUrl, token: redisToken };

export const advocateAuthConfigured = () => Boolean(process.env.ADVOCATE_PASSPHRASE && process.env.SESSION_SECRET);

/**
 * Sending a case to the advocate needs only an email account. Tracking (status updates, the approval page)
 * also needs storage. On a developer's computer both work without setup: emails are written to a local
 * .outbox folder and requests to a local .data file. HISAAB_NO_STORAGE=1 turns the local storage off, to test.
 */
export function sendReady(): { ok: boolean; missing: string[] } {
  if (!isProd) return { ok: true, missing: [] };
  return smtpConfigured() ? { ok: true, missing: [] } : { ok: false, missing: ["email (SMTP_HOST, SMTP_USER, SMTP_PASS)"] };
}

export function trackingReady(): { ok: boolean; missing: string[] } {
  if (process.env.HISAAB_NO_STORAGE === "1") return { ok: false, missing: ["storage (UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN)"] };
  if (!isProd) return { ok: true, missing: [] };
  return redisConfigured() ? { ok: true, missing: [] } : { ok: false, missing: ["storage (UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN)"] };
}

/** Kept for the pages that report on both. */
export function backendReady(): { ok: boolean; missing: string[] } {
  const a = sendReady();
  const b = trackingReady();
  return { ok: a.ok && b.ok, missing: [...a.missing, ...b.missing] };
}
