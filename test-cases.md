# Test cases

Run in the app (`npm run dev`). Use your real name, address and contact.

| # | Input | Expect |
|---|---|---|
| 1 | Swiggy, 1200, 2026-10-02, "Swiggy charged me ₹1,200 for an order that never arrived and refuses to refund. Ordered on 2 October 2026." | Green "covered" in under 20s, sections from the list, numbered steps, notice with name, address, Swiggy, ₹1,200, 2 October 2026, demand, deadline, no placeholders. "Draft written by AI" label shown. |
| 2 | Tap Copy on #1, paste in Notes | Whole notice pastes. If the browser blocks copying, the notice is selected and a message says to press Ctrl/Cmd+C. |
| 3a | Only type "my neighbour is noisy" (leave company and amount empty) | Grey "Not covered" with reason and alternatives; no notice. |
| 3b | "bad service", company and amount empty | Yellow card listing exactly what is missing; no notice. |
| 3c | "bad service", everything filled | Yellow "need more info" with questions; no notice. |
| 3d | Run 3a, then submit an empty form | Old result disappears; only the missing-fields message shows. |
| 4 | Airline cancelled flight, refund refused (₹18,500) | Covered; notice does not call the incident date the payment date. |
| 5 | Blank `OPENROUTER_API_KEY`, run #1 | Covered, with the "basic rules" tag and "basic template" notice label. |

Terminal lines "AI analysis failed" or "Section guard removed" mean the prompt needs another look.
