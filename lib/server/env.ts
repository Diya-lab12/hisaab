// Server-only. Reads configuration. Nothing here is ever sent to the browser.

export const isProd = process.env.NODE_ENV === "production";

export const smtpConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const redisUrl = () => process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
const redisToken = () => process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";
export const redisConfigured = () => Boolean(redisUrl() && redisToken());
export const redis = { url: redisUrl, token: redisToken };

export const advocateAuthConfigured = () => Boolean(process.env.ADVOCATE_PASSPHRASE && process.env.SESSION_SECRET);

/**
 * In production the real services must be set up. On a developer's computer, emails are written to a
 * local .outbox folder and submissions to a local .data file, so the whole flow can be tried safely.
 */
export function backendReady(): { ok: boolean; missing: string[] } {
  if (!isProd) return { ok: true, missing: [] };
  const missing: string[] = [];
  if (!smtpConfigured()) missing.push("email (SMTP_HOST, SMTP_USER, SMTP_PASS)");
  if (!redisConfigured()) missing.push("storage (UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN)");
  return { ok: missing.length === 0, missing };
}
