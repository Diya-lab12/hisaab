# Hisaab

Describe what a company did wrong. Hisaab tells you whether the Consumer Protection Act, 2019 covers it, explains what you can claim, gives a step-by-step script, and drafts a legal notice you can copy.

General legal information only, not legal advice. Review the notice before sending it.

## Run it

```bash
npm install
cp .env.example .env.local   # then put your OpenRouter key in it
npm run dev                  # http://localhost:3000
```

Without a key the app still works using built-in keyword rules (`lib/analyze.ts`).

## How it works

| Part | File |
|---|---|
| Screen | `app/page.tsx`, `components/` |
| Server route (key stays server-side) | `app/api/analyze/route.ts` |
| AI call via OpenRouter | `lib/llm.ts`, `lib/prompt.ts` |
| Keyword fallback | `lib/analyze.ts` |
| Required fields, limits, forum, fee, time limit | `lib/checks.ts` |
| Notice assembly (name, address, date, deadline filled by code) | `lib/notice.ts` |
| The only law the AI may cite | `lib/legal-sources.ts` |

Safeguards: required-field checks run before any AI call; any section not in `legal-sources.ts` is deleted from the answer; a notice containing placeholders is rejected; if the AI call fails the keyword rules answer instead.

## Before real use

`lib/legal-sources.ts` is an unverified draft. Check every section against the official Act and the 2021 pecuniary-jurisdiction rules.

## Deploy

Set `OPENROUTER_API_KEY` (and optionally `OPENROUTER_MODEL`) in the host's environment settings. Never commit `.env.local`.

Tests: see `test-cases.md`.
