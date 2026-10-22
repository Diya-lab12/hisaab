# Test cases

Run in the app (`npm run dev`). Use your real name, address and contact.

## The guided flow (page 1)
| # | Do this | Expect |
|---|---|---|
| 1 | Open the site | "Your money. Your right. Let's get it back." and a "Start your complaint" button |
| 2 | Click Start, press Continue with nothing filled | Specific errors under each field, focus moves to the first problem, still on step 1 |
| 3 | Pick a complaint card; type `abc` as the amount and a future date | "Enter just the number, like 1200." and "That date is in the future." |
| 4 | Fix them; use a date over 2 years ago | Green ticks, "That's ₹1,200." hint, and an amber note about Section 69 (not a blocker) |
| 5 | Step 2 Evidence | Suggested pictures match the company (airline, delivery app...). Drop or choose pictures: previews appear, remove works, .txt files are refused. Button says "Skip for now" until a picture is added |
| 6 | Step 3 Your details with `12345` as contact | "Enter a valid email, or a 10-digit mobile number." |
| 7 | Step 4 Review | Every answer is listed with an Edit link. Check my case shows "Reading the Consumer Protection Act…" |

## The result (page 2)
| # | Do this | Expect |
|---|---|---|
| 8 | Swiggy ₹1,200, 2026-10-02, "Swiggy charged me ₹1,200 for an order that never arrived and refuses to refund." | Page 2 within 20s: "Yes, this is covered", sections from the checked list, steps, "Draft written by AI" notice with your details and no placeholders |
| 9 | Edit the notice, Copy, paste into Notes | Pasted text includes your edit. "Undo my edits" restores the original |
| 10 | Download PDF and Word | Both open with the notice |
| 11 | Notice tab with no pictures | Email button locked with a message. Add a picture and a valid company email to unlock |
| 12 | Download evidence pack | One PDF, one picture per page |
| 13 | Next steps | Reply-due date is 15 days after your chosen send date; the reminder downloads a .ics; last day to file is 2 years after the incident |
| 14 | Edit my details | Page 1 reopens on Review with everything you typed |

## Not covered, vague, and failures
| # | Do this | Expect |
|---|---|---|
| 15 | Start, type only "my neighbour is noisy", Continue | Goes straight to a grey "Not covered" page with reasons. No tabs, no notice |
| 16 | "Check another complaint" on that page | Back to the opening screen, blank |
| 17 | Type only "bad service", Continue | Stays on step 1 and asks for the type, company, amount and date |
| 18 | Fill everything with description "bad service" | Review step shows "We need a bit more information" with questions. No notice |
| 19 | Reload page 2 | Pictures are gone (they live only in the open tab); email locked again |
| 20 | Blank `OPENROUTER_API_KEY`, run #8 | Covered, with the "basic rules" notice |
| 21 | Open /case directly | Sent back to page 1 |

Terminal lines "AI analysis failed" or "Section guard removed" mean the prompt needs another look.
