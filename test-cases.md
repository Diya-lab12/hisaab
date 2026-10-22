# Test cases

Run in the app (`npm run dev`). Pictures live in the open tab only, so reloading clears them.

## Home and navigation
| # | Do this | Expect |
|---|---|---|
| 1 | Open the site | "Customer support going in circles?", "Start my complaint", "Explore an example", five situation cards, "How Hisaab helps" with four items |
| 2 | Click each situation card | `/new?issue=...` opens with that card selected and questions that match it |
| 3 | Use the header | Home, Example cases, My cases work and show the current page |

## Guided flow
| # | Do this | Expect |
|---|---|---|
| 4 | Pick each of the five situations | Refund, order not delivered, faulty product, charged after cancelling and something else each show their own date label, questions and example text |
| 5 | Press Continue with nothing filled | Specific errors; focus moves to the first problem |
| 6 | Fill step 1, go Back and Forward | Everything you typed is still there |
| 7 | Evidence step | One checklist item per document, with a plain sentence about what to add next. Wrong file types are refused with a message |
| 8 | Review step | All answers listed with Edit links. Choose "Save on this device" or "This session only". Text explains what goes to the AI and what does not |
| 9 | Save draft, then open My cases | The draft appears with "Continue draft". Stored data has picture names and counts only, never image data |
| 10 | Type only "my neighbour is noisy", Continue | "This looks outside the Consumer Protection Act" with where else to go. No case is saved |

## Company names, timing and the advocate
| # | Do this | Expect |
|---|---|---|
| A1 | Start a refund case and open "Who exactly is the company?" | Legal name, registered office, CIN and company email fields, with a small note that this is for companies. A name without "Limited"/"Private Limited" gets advice only. A bad CIN gets advice only. A bad email blocks Continue |
| A2 | Return date a week ago, refund promised in "1 month" | A warning in the form and a "Too early to send a notice" card in the workspace with the date the company has until. The "Email the advocate" step is locked |
| A3 | Click "The company has already refused in writing" | The card changes to "No waiting needed" and the email step unlocks (with evidence). The timeline records it as recorded by you |
| A4 | Open the notice | "DRAFT FOR ADVOCATE REVIEW", "LEGAL NOTICE", the legal entity with the brand as its trade name, registered office and CIN, numbered paragraphs in the advocate's voice ("my client"), and the advocate's block marked as unsigned |
| A5 | Look for a way to send the notice to the company | There is none. The only option is the "Send to a lawyer for review" dropdown |
| A6 | Open the dropdown | The advocate's name, Bar Council and enrolment number. Ticks for evidence and timing. Your email (prefilled if you gave one). A consent box. "Send" stays locked until evidence is added, the timing is fine, the email is valid and consent is ticked |
| A7 | Send it (local test: emails go to `.outbox`) | The case becomes "With the advocate" with a reference. The advocate email has the client, company legal details, the full draft, and two PDFs. The client gets an acknowledgement |
| A8 | Open `/advocate` and sign in | Wrong passphrase is refused. Signed in, the request is listed with all details |
| A9 | "Ask for changes" with no note | Refused: a note is required |
| A10 | Approve, with a signed PDF | The client is emailed with the PDF attached. Reopen their case: status is "Approved by the advocate", with the advocate's note, and the log shows it as not "recorded by you" |
| A11 | "Mark as sent to the company" | Client emailed; their case shows it as sent |
| A12 | Open someone else's status link, or call the list or decide routes while signed out | Refused (404 or 401) |
| A13 | Production build with no email or storage configured | Send says it isn't switched on and offers downloads plus an email to the advocate. Nothing is stored. The case status is unchanged |
| A14 | Faulty product or subscription case | No waiting-period check (we can't work one out), and the page says so |
| A15 | Look at "What you can ask for and where to file", "If the company doesn't resolve it" and "Real decisions" | Each is a closed dropdown that opens on a click |

## Picture checks
| # | Do this | Expect |
|---|---|---|
| P1 | Add a screenshot of a real payment receipt to "Payment receipt" | After a few seconds: "Looks right", and "What we found" lists the amount, company and date it read. The first picture is slower because the text reader downloads once |
| P2 | Add a photo with no text, or a page of unrelated text, to "Payment receipt" | A warning ("Couldn't read text" or "Check this one") and a "Keep it anyway" button. The picture stays added |
| P3 | Add a receipt showing a different amount than your case | "Not sure": the amount in it doesn't match the amount in your case |
| P4 | Click "Check with AI" then Cancel | Nothing is sent. Check the Network tab: no request to /api/describe |
| P5 | Click "Check with AI" then "Send this picture" | One request to /api/describe; the AI's description appears with "AI can be wrong" |
| P6 | Add pictures in the saved workspace | They are checked the same way |
| P7 | Go offline, add a first picture | "We couldn't read this picture on your device". It is still added |

## Case workspace
| # | Do this | Expect |
|---|---|---|
| 11 | Check my case (Swiggy ₹1,200 not delivered) | Workspace in under 20s, status "Ready for review". The first card says "Yes, your case falls under the Consumer Protection Act, 2019" with the reason and the sections. Then the next step, the editable complaint and the activity timeline. No full evidence checklist on the page |
| 11b | Click "Add evidence" in the next step (or "Manage evidence") | A pop-up opens with the checklist. Add a picture inside it. Esc or Done closes it, and the page behind is unchanged |
| 12 | Edit the complaint, wait a second, reload | Your edit is still there and the timeline says "You edited the complaint" |
| 13 | Without pictures, look at the email section | "Evidence is required before you can email your complaint", with an "Add evidence" button; the email button is locked. Add a picture and a valid company email to unlock. Removing the last picture locks it again |
| 14 | Open in my email app | Nothing changes status. A prompt asks "Did you send it?" and only "Yes, I sent it" records it |
| 15 | Set a follow-up date; set one in the past | "Follow-up due in N days" / "overdue by N days". Resolved cases show neither |
| 16 | Record a reply and a follow-up | Both appear in the timeline as recorded by you. Empty notes are refused |
| 17 | Change status to Resolved | Timeline records it; next step becomes "Keep your records" |
| 18 | Reload the workspace | Checklist items show "Added earlier, add again"; the email stays locked until pictures are re-added |
| 19 | Edit details, check again | Opens on Review; a warning says edits to the complaint will be replaced |
| 20 | Delete a case | Asks to confirm, then it is gone from My cases |

## Examples, storage and failures
| # | Do this | Expect |
|---|---|---|
| 21 | Open each example | "Illustrative example" badge and a notice that it is fictional; timeline, sample evidence, missing information, an editable sample complaint, next action |
| 22 | Edit the sample, then "I have a similar problem" | A blank case with the right category. Nothing from the example is copied. Nothing is saved |
| 23 | Block storage (private window) and save a draft | "Couldn't save in this browser"; My cases lists it under "Only in this tab" |
| 24 | Open /case?id=nonsense | "We couldn't find this case" with ways forward |
| 25 | Blank `OPENROUTER_API_KEY`, run #11 | Complaint built from a template, labelled as basic rules |

Terminal lines "AI analysis failed" or "Section guard removed" mean the prompt needs another look.
