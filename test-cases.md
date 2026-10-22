# Test cases

Run in the app (`npm run dev`). Use your real name, address and contact.

| # | Do this | Expect |
|---|---|---|
| 1 | Page 1: Swiggy, 1200, 2026-10-02, "Swiggy charged me ₹1,200 for an order that never arrived and refuses to refund. Ordered on 2 October 2026." Click Check my case | Goes to page 2 in under 20s. "Yes, this is covered", sections from the checked list, numbered steps |
| 2 | Notice tab | Notice has your name, address, Swiggy, ₹1,200, 2 October 2026, demand, 15-day deadline, no placeholders. "Draft written by AI" label |
| 3 | Edit a word, click Copy, paste into Notes | Pasted text includes your edit. "Undo my edits" restores the original |
| 4 | Download PDF and Download Word | Both files open and contain the notice (PDF shows "Rs." for the rupee sign) |
| 5 | Type an email, click Open in my email app | Mail app opens with To, subject and the (edited) notice. Button is disabled until the email looks valid |
| 6 | Next steps tab | Reply-due date is 15 days after the send date you choose. Add a reminder downloads a .ics file. "Last day to file" is 2 years after the incident, then practical tips |
| 7 | Page 1: type a company and complaint, look at "Your evidence" | Suggested pictures change with the kind of complaint (airline, delivery app, restaurant...). Privacy guide is shown |
| 7b | Add a picture (JPG/PNG) and a .txt file | Picture appears as a thumbnail with a remove button; the .txt gets a plain error. Max 8 pictures |
| 7c | Notice tab with no pictures | Email button is locked with a message. Add a picture and a valid company email to unlock it. Removing all pictures locks it again |
| 7d | With pictures, click Download evidence pack | One PDF with each picture on its own page |
| 7e | Reload page 2 | Pictures are gone (they only live in the open tab) and the email is locked again |
| 8 | Edit my details | Page 1 shows everything you typed and the button works |
| 9 | Run an airline, a restaurant, a phone and a gym complaint | Suggested pictures (page 1) and tips (Next steps) change for each kind |
| 10 | Page 1: only type "my neighbour is noisy" | Page 2: grey "Not covered" with reasons, no tabs, no notice |
| 11 | Page 1: "bad service" with other fields empty | Stays on page 1; yellow card listing what is missing |
| 12 | Submit an empty form | Red message listing every missing field; old results are cleared |
| 13 | Open /case directly in a new tab | Sent back to page 1 |
| 14 | Blank `OPENROUTER_API_KEY`, run #1 | Covered with the "basic rules" notice |

Terminal lines "AI analysis failed" or "Section guard removed" mean the prompt needs another look.
