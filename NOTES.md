# Notes

## Decisions (v1, 2026-10-01)

- **Surfaces.** Home is expressive. Guide, catalog and kit are quiet. The copilot is a product surface with one
  motion vocabulary: 140 / 260 / 640 ms on a single ease-out curve, plus a small overshoot for things that pop.
- **The signature is the Double Diamond.** It draws itself in, a glint runs round the outline, and halves light up
  for the phase in play. On the home page it's navigation; in the copilot it's the phase picker.
- **Glass over pinstripes** reproduces the deck's activity dividers. Only `glass-loop` and `glass-chair` have real
  alpha. `glass-ribbon` has a white background and goes black under `multiply`, so it isn't used for that.
- **The copilot is rule-based, not an LLM.** It runs in the browser with no data leaving the machine. The rules are
  the review checklist, so "passes the copilot" and "passes review" mean the same thing.
- **Day lengths:** half day = 4h, one day = 7h, two days = 6.5h each. An earlier 6.5h one-day setting couldn't fit
  four phases without failing its own checks.
- **The practice ≥ theory check counts only why/what/how time, not cases.** Counting cases flagged the Monsoon
  Edition's own agenda, which ran well.
- **Breaks:** about every two hours. Any break needed after 11:45 becomes lunch. That reproduces the real Day 1
  (primers → coffee → Discover → lunch → Define).
- **Grids fill every row** (`fillGrids` in `scripts/chrome.ts`). Counts that don't divide get a few double-width
  cards; small sets drop to fewer columns.

## Decisions (v2, 2026-10-01)

- **Light mode only.** The dark palette is gone; `color-scheme: light` is set on the page and in a meta tag.
- **The copilot plans from the outcome backwards.** First what the workshop is for (teach the method, progress on a
  live problem, align leaders, kick off a project), then where the team is on the diamond. Those two set the
  phases, which one gets the most time (“Focus”), which tools are taught, and how much theory there is. Logistics
  come after. v1 started with logistics and asked novices to pick phases themselves.
- **Phases are recommended, not chosen.** The diamond is pre-filled with a recommendation and the reason for it.
  Changing it marks the plan as hand-edited; “Back to my recommendation” undoes that.
- **Theory time is the sum of the tools taught.** Each method has a `teach` time. Live-problem goals teach each tool
  at about 60–70% of that (“just enough theory”). When teaching the method, a one-day plan teaches 3 deck tools per
  phase, not 4. Four only fit over two days.
- **Every block can be tuned in place:** opener, tools, ±5 minutes, plus the icebreaker, share-out format and closer.
  The copilot gives its reasoning under each block.
- **New checks:** no theory over 25 minutes, hands-on after lunch, every diverge ends in a choice, real people in the
  loop (live problems only), built for a video call (remote only). Every recommended plan passes all of its checks.
- **Defaults adapt to the room:** gallery walk over 6 tables, remote-ready openers when remote, a postcard closer when
  there's a follow-up, Hopes & Fears to open alignment and kickoff sessions.
- **2½-hour sessions run straight through** with an energiser instead of a break.
- **Prep tab:** a countdown from 4 weeks before to the check-ins after, built from the plan (recruit real people only
  when the plan needs them, print counts from the template list). Turns into real dates once a date is set.
- **Print gives a facilitator's run sheet** (time, block, lead, what happens, materials, debrief line), not the panel.
- **Catalog filters by use, length and “works on a call”.** Facilitators search by job (“an energiser”) and
  constraint (“remote, under 10 minutes”) more than by phase.
- **Cases added in v2 are marked “check figures”.** Their sources are named, but the numbers weren't in the deck.
  The copilot prefers sourced deck cases when it picks one for a phase.

## Decisions (v2.1, 2026-10-01)

- **The home hero is the deck cover.** The glass ribbon sits on plain white and runs off the edge. Its background is
  pure white, so it needs no blend mode. In the deck the pinstripe is only ever a thin rail at the slide edge, so it
  is no longer used as a large block on the home page.
- **The Monsoon section shows the room** (`cohort-room`), not a second glass shape. A real session is more convincing
  than more abstract art.
- **Copilot is the last item in the nav.** As a filled button in the middle of the row, it looked like the current page.

## Decisions (v2.2, 2026-10-01)

- **My plan is a planning wall, not a second copilot.** It's the facilitator's wall of sticky notes and printouts:
  any piece of the kit goes on as a card (activities, methods, cases, templates, the three kit files and the four
  perspective cards), next to stickies, headings and frames. The copilot recommends; the wall is where you remix.
- **Frames are the unit of time.** A frame adds up the minutes of what's inside it, so a row of frames reads as a
  running order. A sticky that says “Lunch 45 min” counts too. Each card belongs to one frame (the topmost), so
  overlapping frames never count twice. Cards take ±5 minutes in place, like copilot blocks.
- **Three ways in:** the Double Diamond (a frame per phase with the deck's tools), the copilot plan (every block a
  frame, breaks and lunch as notes, times in the titles) and the pieces pinned with “Add to my plan” on catalog
  pages. Each lands to the right of what's already on the wall, so starting points can be mixed and nothing is lost.
- **Times are live, not typed.** Frames side by side form a row, and a row is a running order. Only the first block
  has a fixed start (filled clock); every block after it starts when the one to its left ends, and timed notes
  between frames (breaks, lunch) count. Adding, moving, resizing or retiming a block moves everything after it.
  Duplicating one frame inserts the copy as the next block and pushes the rest of the row along. Set or clear a
  fixed start from the frame's “Starts” field. Walls saved before this had times typed into titles; they're lifted
  out on load (v2).
- **No connectors.** Left to right is the order; arrows would add a tool without adding meaning.
- **Dragging the wall selects; it doesn't pan.** With a mouse or pen, a drag on empty wall (or inside a frame's body)
  draws a selection box, as in FigJam. Cards it touches are picked; a frame only when the box takes in all of it, so a
  box inside a frame picks its cards. Shift or ⌘ adds. Moving around is scroll, pinch, space-drag or the middle
  button; on touch, one finger still pans. A one-time tip says so, since this replaced drag-to-pan.
- **A selection of several shows its count and minutes, and offers “Frame them”**: the quickest way from loose cards
  to a timed block. A frame's title bar moves it with everything inside.
- **One wall per browser.** Save a copy / Open a copy moves it to a co-facilitator; Copy as a list gives frame-by-
  frame text for a doc or chat. Sharing a live wall would need a backend.

## Decisions (phase 1, 2026-10-01, branch `phase-1`)

Feedback: too much to take in on first open. The full v2 kit is kept as is on the `full-kit` branch.

- **Phase 1 is one-day and two-day workshops only.** The format is ours, and teams fit it to their room; there's
  little room to tailor beyond that yet. The copilot offers One day and Two days. Plans saved with a 2½-hour or
  half-day length open as one day. The engine still supports the shorter lengths for a later phase.
- **The copilot and My plan are the product. Everything else is reference.** The nav shows My plan and Copilot. Guide,
  Catalog, Kit and the Monsoon Edition sit in a Reference menu (listed under the two tools on a phone).
- **The home page keeps the full-kit content.** Cutting it to one screen lost the spine, pattern, chai example and
  Monsoon section, which the user wanted back. The fix: the four doors become two large cards (Copilot, My plan) right
  under the hero, the hero's second button opens My plan, and a quiet reference row closes the page.
- **Copilot fixes no longer shorten the workshop.** "Give it more time" becomes "Make it two days". The remote warning
  now offers "Spread it over two days" instead of "Make it a half day".

## Decisions (simple kit, 2026-10-05, branch `phase-1`)

Feedback: people should take a ready-made format, not design one. The full site stays, renamed the DIY kit.

- **Three tabs, in this order: Reference, Planning wall, Workshop.** Reference (`/`) is the shelf: the three files,
  the method on one page, every template, perspective cards, past workshops. Planning wall (`/wall/`) is the same
  wall as My plan. Workshop (`/workshop/`) is the formula.
- **The formula is the copilot's engine with fixed answers** (`src/data/formula.ts`): teach the method, the whole
  diamond, 24 people in a room, the chai example. So it passes the same checks, and changing the answers here
  changes the Workshop tab and the wall together. Nothing on the Workshop tab can be edited; that's the DIY kit's job.
- **The Workshop tab walks through four steps:** get ready (the prep countdown, as a checklist saved in the browser),
  run the day (the agenda, a block per phase that opens to show its parts and why it's there), what teams leave with,
  follow up. Then what to print and pack. "Put it on the planning wall" opens `/wall/?start=day|two`.
- **One wall for both kits.** The Planning wall and My plan share storage, so a co-facilitator moving between the
  two never loses work. The simple wall's starting points are the two formulas and the Double Diamond.
- **The DIY kit is one click away, not gone.** Its home moved to `/diy/`; guide, catalog, kit, copilot, My plan and
  the Monsoon page keep their URLs. The header says "DIY kit" and has a link back to the simple kit. Template and
  method links from the simple kit open DIY catalog pages, which is the intended way in.

## Rejected

- Multiplying the hero glass over the stripes: it turned into a black scribble.
- Glass over a large pinstripe block with floating phase tags in the home hero. It read as a barcode, and the tags
  didn't point to anything.
- A free-text chat box for the copilot: there's nothing behind it in v1. Questions with chips are honest about that.

## Open

- Figma links for the deck template, toolkit, guidebook and each worksheet (`src/data/kit.ts`, `src/data/catalog.ts`).
- What "Spaceship!" means as a norm. It's on slide 18 with no explanation, so the guide just repeats it.
- Answers to the fill-in-the-blank lines. They're revealed on the slides, not in the PDF text.
- Write-ups for the other internal workshops (only Monsoon is in so far).
- A real AI copilot later (needs a backend and a data-approval decision).
- Check the figures on every case marked `verify: true` (`src/data/items/cases.ts`) before they go on a slide.
- Figma links for the 25 new templates.
- A shared, live My plan wall for co-facilitators (needs a backend, same decision as the AI copilot).
