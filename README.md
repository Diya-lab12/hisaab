# Claimatic

Describe what a company did wrong. Claimatic tells you whether the Consumer Protection Act, 2019 covers it, explains what you can claim, and drafts a legal notice you can edit, copy, download (PDF or Word) or open in your email app. It also tracks the 15-day deadline, and suggests which evidence pictures to add for your kind of complaint. Pictures stay in the browser tab. Claimatic reads the text in each one on the device to check it fits the checklist item (warning, never blocking), and a picture goes to the AI only if you choose "Check with AI" for that one picture. The email button stays locked until at least one is added.

Pages: **Home** (one box: tell us what happened, in any language, with the issue cards as shortcuts), **Example cases** (three clearly labelled, fictional walkthroughs), a 5-step **story-first flow** (your story, your case with a preliminary verdict and the facts we pulled out, your notice with highlighted blanks, evidence with a strength meter, and send, where your name, address and contact are asked last), **Pricing**, **Privacy**, **Terms**, **Contact**, **My cases** (cases saved in this browser), and a **case workspace** (evidence checklist, editable complaint, activity timeline, next step, and notes you record yourself such as sent, replies and a follow-up date).

What it does not do: send a notice to a company (it goes to an advocate for review, signature and sending, by email, outside the app), file anywhere, remind you in the background, or sync across devices. Cases live in this browser (or only in the tab, if you choose). Pictures are never saved.

## Run it

```bash
npm install
cp .env.example .env.local   # add GEMINI_API_KEY and the SMTP email settings
npm run dev                  # http://localhost:3000
```

`GEMINI_API_KEY` is required: Gemini reads the story in any language, writes an English account for the person to confirm, decides whether the Act appears to cover it, and drafts the notice body. There is no keyword fallback: if the AI fails, the person sees an error with a retry. `GET /api/health` returns `aiConfigured` and `emailConfigured` (booleans only). For testing email, set `MAIL_TEST_TO` so every email goes to that address.

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
| Picture checks: on-device reading and rules | `lib/ocr.ts`, `lib/pictureCheck.ts`, `lib/pictureReview.ts` |
| Deadlines, calendar reminder, PDF/Word/email helpers | `lib/deadlines.ts`, `lib/export.ts` |
| Server route (key stays server-side) | `app/api/analyze/route.ts` |
| AI calls (story read, verdict, notice draft) | `lib/server/gemini.ts` |
| Required fields, limits, forum, fee, time limit | `lib/checks.ts` |
| Notice assembly (name, address, date, deadline filled by code) | `lib/notice.ts` |
| The only law the check may cite | `lib/legal-sources.ts` |

Safeguards: the check can only cite sections listed in `legal-sources.ts`; the notice is built in code, and any fact the story does not give is left as a blank; nothing is sent to the company without the advocate signing it.

## Before real use

`lib/legal-sources.ts` is an unverified draft. Check every section against the official Act and the 2021 pecuniary-jurisdiction rules.

## Deploy

Set `OPENROUTER_API_KEY` (and optionally `OPENROUTER_MODEL`) in the host's environment settings. Never commit `.env.local`.

Tests: see `test-cases.md`.

## Advocate review

The notice is drafted in an advocate's voice and marked as an unsigned draft. A client cannot send it to the company from the app. Instead they pick the advocate (details in `lib/advocate.ts`), tick a consent box and press send. The notice and an evidence pack are emailed straight to the advocate, and a record is kept so the client's status can update.

The advocate signs in at `/advocate` (a passphrase), reviews each request, then approves it (optionally uploading the signed PDF), marks it sent to the company, or asks for changes. Each decision emails the client and updates the status in their Claimatic case. The advocate signs and sends the notice herself, outside the app. There is no signature image in the code.

### Setting it up for real
Step 1, to make sending work: an SMTP email account in the hosting settings (see `.env.example`). With only that, a case is emailed straight to the advocate and the client hears back by email, but nothing is tracked. Step 2, to add status updates and the `/advocate` approval page: a Redis database (Upstash) plus `ADVOCATE_PASSPHRASE` and `SESSION_SECRET`. Without step 1, sending says it isn't switched on yet and offers a manual email instead. On a developer's computer, emails are written to a local `.outbox` folder and requests to `.data`, so the whole flow can be tried safely.


## The story-first flow

`/api/intake` sends the person's story to the AI, which returns the English account, facts and verdict. The AI calls live in `lib/server/gemini.ts`: `readStory` (English account, facts, verdict, sections) and `draftNotice` (body paragraphs). Sections outside `legal-sources.ts` are stripped; drafts that cite other sections, court cases or other laws, or that state amounts or dates other than the confirmed ones, are rejected. The person's name, address and contact are never sent to the AI. `/api/draft` drafts the notice; `/api/advocate/submit` builds the notice PDF on the server (`lib/server/noticePdf.ts`) and emails it with the evidence pack. It is rate-limited per visitor (shared Redis when connected, in-memory otherwise). The notice frame (letterhead, addressee, deadline, signature) is built in code (`lib/noticeBlanks.ts`) around the AI-drafted body: any fact the person didn't give becomes a `{{blank}}` shown as a highlighted field in the document. `lib/companies.json` holds brands whose legal name, registered office and grievance email were read from the company's own pages (with the source URL). It is deliberately short and TODO to extend: leave a field `null` unless you have read it on an official page.
