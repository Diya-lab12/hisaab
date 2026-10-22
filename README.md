# Hisaab

Describe what a company did wrong. Hisaab tells you whether the Consumer Protection Act, 2019 covers it, explains what you can claim, and drafts a legal notice you can edit, copy, download (PDF or Word) or open in your email app. It also tracks the 15-day deadline, and suggests which evidence pictures to add for your kind of complaint. Pictures stay in the browser tab (never uploaded or sent to the AI), and the email button stays locked until at least one is added.

Pages: **Home** (situation cards), **Example cases** (three clearly labelled, fictional walkthroughs), a 4-step **guided flow** that adapts to the problem (the problem, evidence, your details, review), **My cases** (cases saved in this browser), and a **case workspace** (evidence checklist, editable complaint, activity timeline, next step, and notes you record yourself such as sent, replies and a follow-up date).

What it does not do: send anything for you, file anywhere, remind you in the background, or sync across devices. Cases live in this browser (or only in the tab, if you choose). Pictures are never saved.

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
| Home, header | `app/page.tsx`, `components/SiteHeader.tsx`, `components/SituationCards.tsx` |
| Guided flow | `app/new/page.tsx`, `components/ComplaintWizard.tsx`, `lib/questions.ts`, `lib/issues.ts` |
| Examples (fictional) | `app/examples/`, `components/ExampleWorkspace.tsx`, `lib/examples.ts` |
| Saved cases and workspace | `app/cases/page.tsx`, `app/case/page.tsx`, `components/CaseWorkspace.tsx`, `lib/cases.ts` |
| Real reported decisions and official routes | `lib/realCases.ts`, `lib/escalation.ts` |
| Field checks and feedback | `lib/validate.ts`, `lib/issues.ts` |
| Page 2: case, notice, next steps | `app/case/page.tsx`, `components/CaseTab.tsx`, `NoticeTab.tsx`, `NextStepsTab.tsx` |
| Industry advice and evidence suggestions | `lib/categories.ts` |
| Evidence checklist and pictures (in-browser only) | `lib/evidenceItems.ts`, `lib/evidence.ts`, `components/EvidenceSlots.tsx` |
| Deadlines, calendar reminder, PDF/Word/email helpers | `lib/deadlines.ts`, `lib/export.ts` |
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
