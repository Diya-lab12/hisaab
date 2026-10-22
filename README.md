# Hisaab

Describe what a company did wrong. Hisaab tells you whether the Consumer Protection Act, 2019 covers it, explains what you can claim, and drafts a legal notice you can edit, copy, download (PDF or Word) or open in your email app. It also tracks the 15-day deadline, and suggests which evidence pictures to add for your kind of complaint. Pictures stay in the browser tab. Hisaab reads the text in each one on the device to check it fits the checklist item (warning, never blocking), and a picture goes to the AI only if you choose "Check with AI" for that one picture. The email button stays locked until at least one is added.

Pages: **Home** (situation cards), **Example cases** (three clearly labelled, fictional walkthroughs), a 4-step **guided flow** that adapts to the problem (the problem, evidence, your details, review), **My cases** (cases saved in this browser), and a **case workspace** (evidence checklist, editable complaint, activity timeline, next step, and notes you record yourself such as sent, replies and a follow-up date).

What it does not do: send a notice to a company (it goes to an advocate for review, signature and sending, by email, outside the app), file anywhere, remind you in the background, or sync across devices. Cases live in this browser (or only in the tab, if you choose). Pictures are never saved.

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
| Picture checks: on-device reading, rules, opt-in AI | `lib/ocr.ts`, `lib/pictureCheck.ts`, `lib/pictureReview.ts`, `app/api/describe/route.ts` |
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

## Advocate review

The notice is drafted in an advocate's voice and marked as an unsigned draft. A client cannot send it to the company from the app. Instead they pick the advocate (details in `lib/advocate.ts`), tick a consent box and press send. The notice and an evidence pack are emailed straight to the advocate, and a record is kept so the client's status can update.

The advocate signs in at `/advocate` (a passphrase), reviews each request, then approves it (optionally uploading the signed PDF), marks it sent to the company, or asks for changes. Each decision emails the client and updates the status in their Hisaab case. The advocate signs and sends the notice herself, outside the app. There is no signature image in the code.

### Setting it up for real
Step 1, to make sending work: an SMTP email account in the hosting settings (see `.env.example`). With only that, a case is emailed straight to the advocate and the client hears back by email, but nothing is tracked. Step 2, to add status updates and the `/advocate` approval page: a Redis database (Upstash) plus `ADVOCATE_PASSPHRASE` and `SESSION_SECRET`. Without step 1, sending says it isn't switched on yet and offers a manual email instead. On a developer's computer, emails are written to a local `.outbox` folder and requests to `.data`, so the whole flow can be tried safely.
