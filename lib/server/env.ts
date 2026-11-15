// Server-only. Reads configuration. Nothing here is ever sent to the browser.

export const isProd = process.env.NODE_ENV === "production";

const SMTP_VARS = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"] as const;
/** The email settings that are missing, by variable name (never their values). Empty means email is set up. */
export const emailMissing = (): string[] => SMTP_VARS.filter((k) => !process.env[k]);
export const smtpConfigured = () => emailMissing().length === 0;

const redisUrl = () => process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
const redisToken = () => process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";
export const redisConfigured = () => Boolean(redisUrl() && redisToken());
export const redis = { url: redisUrl, token: redisToken };

export const advocateAuthConfigured = () => Boolean(process.env.ADVOCATE_PASSPHRASE && process.env.SESSION_SECRET);

/**
 * Sending a case to the advocate needs only an email account. Tracking (status updates, the approval page)
 * also needs storage. Email must be set up everywhere (SMTP_HOST, SMTP_USER, SMTP_PASS); use MAIL_TEST_TO to test
 * without emailing real people. On a developer's computer, requests are stored in a local .data file;
 * HISAAB_NO_STORAGE=1 turns that off, to test.
 */
export function sendReady(): { ok: boolean; missing: string[] } {
  // Email is required everywhere now, including on a developer's computer: no silent local outbox.
  const missing = emailMissing();
  return { ok: missing.length === 0, missing };
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
