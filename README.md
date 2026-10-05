# Prism Workshop Kit, v2

A creator's kit for running a Prism design thinking workshop without the core design team in the room. It has a guide
(the path), a catalog (the building blocks), a copilot (drafts an agenda and runs the review checks), a kit (the
files to take away) and My plan (a wall to mix and match all of it). The core team's only job is a review at the end.

Source: *(Cohort 3) Prism: Workshop ME.pdf*, the Monsoon Edition deck (215 slides).

Live: https://prineethr.com/prism-workshop/ (GitHub Pages, deployed from `main` by `.github/workflows/deploy.yml`).

## Run it

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static site in dist/
```

No backend. The copilot runs in the browser, and plans are saved in the browser's localStorage.

## Where things live

| Path | What it holds |
| --- | --- |
| `src/pages/index.astro`, `wall.astro`, `workshop.astro` | The simple kit's three tabs: Reference, Planning wall, Workshop. Layout in `src/layouts/Simple.astro`. |
| `src/data/formula.ts` | The ready-made one-day and two-day workshops (fixed copilot answers). |
| `src/pages/diy.astro` | Home of the DIY kit (the full v2 site). Its other pages keep their URLs. |
| `src/components/Wall.astro` | The planning wall markup and styles, shared by the Planning wall tab and My plan. |
| `src/data/phases.ts` | The Double Diamond phases: tagline, why/what/how, cheat sheet, quote. Plus the module pattern every phase follows. |
| `src/data/catalog.ts` | The item type, labels and lookups. The items themselves live in `src/data/items/`. |
| `src/data/items/*.ts` | Activities, methods, cases and templates (141 in all). Deck items keep their `slides`; v2 additions carry a `source`, and cases added outside the deck are marked `verify: true`. |
| `src/data/guide.ts` | The 10 guide steps and the review checklist. |
| `src/data/kit.ts` | Deck template, toolkit and guidebook, plus the perspective cards. **Paste Figma share links here.** |
| `src/data/editions.ts` | The Monsoon Edition write-up: programme, agendas, quotes. |
| `src/scripts/copilot/engine.ts` | The planner: answers in; agenda, checks, outcomes and the prep countdown out. Pure functions. |
| `src/scripts/copilot/ui.ts` | The copilot conversation and the live plan panel. |
| `src/scripts/board.ts` | My plan: the planning wall (cards, stickies, frames, pan and zoom, starting points). Saved in localStorage. |
| `scripts/extract_assets.py` | Pulls illustrations, photos, templates and slides out of the deck PDF into `public/img/`. |
| `scripts/make_templates.mjs` | Draws the SVG preview for every template the deck doesn't have (`node scripts/make_templates.mjs`). |

## Embedding Figma files

Every template in `catalog.ts` and every kit item in `kit.ts` has a `figma: ''` field. Paste a Figma share link
(e.g. `https://www.figma.com/design/abc123/Prism-Toolkit?node-id=…`) and the page swaps the poster for a live embed.

## Adding a past workshop

Add an object to `src/data/editions.ts` and a page under `src/pages/editions/`. New activities, methods or cases go in
`src/data/items/`. They show up in the catalog and its filters. In the copilot, activities appear in the matching
dropdown by `role` (icebreaker, opener, energiser, shareout, closer), and methods appear as tools for their phase.
