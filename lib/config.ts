export const DISTRICT_LIMIT_RUPEES = 5_000_000; // ₹50 lakh: from the 2021 Rules, NOT in the Act (s.34(1) says ₹1 crore)
export const FREE_FILING_LIMIT_RUPEES = 500_000; // ₹5 lakh: from the 2020 Rules, NOT in the Act (s.35(2) says "as prescribed")
export const LIMITATION_YEARS = 2; // Section 69 (verified against the Act)
export const NOTICE_DEADLINE_DAYS = 15;

export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
export const DEFAULT_MODEL = "google/gemini-2.5-flash"; // allowed by this account guardrail; override with OPENROUTER_MODEL
export const MAX_TOKENS = 2500;
export const REQUEST_TIMEOUT_MS = 40_000;
