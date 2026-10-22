export const DISTRICT_LIMIT_RUPEES = 5_000_000; // ₹50 lakh (2021 pecuniary rules)
export const FREE_FILING_LIMIT_RUPEES = 500_000; // ₹5 lakh
export const LIMITATION_YEARS = 2; // Section 69
export const NOTICE_DEADLINE_DAYS = 15;

export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
export const DEFAULT_MODEL = "google/gemini-2.5-flash"; // allowed by this account guardrail; override with OPENROUTER_MODEL
export const MAX_TOKENS = 2500;
export const REQUEST_TIMEOUT_MS = 40_000;
