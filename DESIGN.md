# DESIGN.md – VITRA (demo brand)

> Single source of truth. ≤100 lines. Product facts: PRODUCT.md.

## Business
- Offer: windows and doors (PVC, timber, aluminium) – manufacture + installation, Lithuania. Demo brand.
- Goal: quote requests carrying a configured window. Site-wide CTA „Užsakyti matavimą“; configurator CTA „Apskaičiuoti kainą“; form „Siųsti užklausą“.
- Audience: homeowners building/renovating, small architects/contractors; mobile-first, afraid of hidden costs and bad fitting.
- Content status: demo site – every fact/price/project marked [DEMO]; qa.config.json mode: demo.

## Business functionality
| Feature | Behaviour | Data / integration | Test tag |
|---|---|---|---|
| Navigation | header + mobile menu (Esc, focus return), current page, skip link | – | @navigation |
| Configurator | width/height mm (field + stepper), material, colour per material, opening type per sash (1–3), glazing 2/3, quantity; scale-true SVG elevation with dimension chains + 1,75 m figure; limits per material with LT errors; state in URL + localStorage | `js/catalog.js` [DEMO] | @configurator |
| Price estimate | pure `estimate()`; area (min billable) × material rate + sash/opening extras + colour % + triple-glazing/m² + installation/unit; VAT 21 % shown; range ±15 % rounded to 10 €; „Kaip skaičiuojame“ breakdown + exclusions | `js/pricing.js` [DEMO] rates | @pricing |
| Materials comparison | one `<table>` PVC/mediena/aliuminis, qualitative rows; mobile: pick two to compare; „Konfigūruoti iš …“ links preselect material | – | @materials |
| Project gallery | all projects in HTML; filters material/product/building (aria-pressed, URL), live count, empty state + reset, `<dialog>` detail with focus return | static HTML [DEMO] | @gallery |
| Quote form | config summary (edit/remove) + hidden fields; name, phone or email, city, stage, message, consent; fetch to Formspree; success **only** on confirmed OK; error keeps data + retry + phone/email; no-JS native POST. Endpoint unconfigured → honest „neprijungta“ error, nothing sent | Formspree (ID pending) | @quote-form |
| Config hand-off | configurator → quote carries exact config; schedule/materials links prefill configurator | URL params | @config-handoff |
| Mobile usability | no horizontal scroll 360–1920, targets ≥44 px, sticky compact preview | – | @mobile |
| Analytics/consent | none → no banner | – | – |

## Acceptance criteria
- [x] `npm run gate:final` exits 0; all tags above have passing tests in mobile + desktop.
- [x] Pricing unit tests: fixed inputs → expected totals; range contains total; invalid sizes → no price.
- [x] Pasted configurator URL restores the identical configuration and price.
- [x] Quote form never shows success without a confirmed 2xx from the endpoint (tested with mocked OK and mocked failure; unconfigured shows error).
- [ ] Real [QA TEST] submission once Formspree ID exists (manual, own inbox) – DEFERRED, see log.
- [x] Keyboard-only: configure, filter, open/close dialog, submit. Visible focus everywhere.
- [x] No horizontal scroll 360–1920 px; tap targets ≥44 px; contrast ≥4.5:1.
- [x] Only the LCP image per page has fetchpriority="high"; nothing above the fold lazy; all images sized.
- [x] Lighthouse ≥ 90/90/90/90 (perf/a11y/bp/seo) on every page.
- [x] Registry reviewed; overlaps justified below.

## Brand
- Adjectives: exact, calm, candid. Voice: „jūs“, plain facts, no slogans, no exclamation marks.
- Assets: none real. Photos: licensed stock (Unsplash/Pexels), credited on `saltiniai.html`, marked [DEMO].

## Concept – Architect's drawing set
- One sentence: the site is a set of construction drawings for your window – elevations, dimension chains and a window schedule are the layout, not decoration.
- First viewport: a full-width elevation of a three-part window; its glazing holds the house photo. The dimension figures on the drawing **are the inputs** – type a width, the drawing and estimate redraw. H1 + material + price sit in the sheet's title block (bottom right on desktop, below the drawing on mobile).
- Structure: home = elevation sheet → window schedule (real table, rows draw their type mini-elevation, „Konfigūruoti šį tipą“) → material hatch legend (hatch swatch + one trade-off line) → projects as photo + key elevation pairs at unequal sizes → lead-time dimension line (time measured like length) → title-block close.
- Signature: editable dimension chains; opening-type symbols (hinge chevrons, tilt triangles, slide arrows) drawn per sash exactly as in drawings.
- Line language: three weights (cut 3 px, view 1.5 px, dimension 1 px) + solid poché graphite fields. No uniform hairline rules between rows, no monospace anywhere. Annotations in Sofia Sans Condensed, used only inside drawings and table heads.
- Registry: differs from Ąžuolo v2 (no split hero, no ruled fact rows, no serif) and Terasų (no full-bleed photo, no numbered chapters, no dot ratings, cross-sections only on materials page as profile details). Type marks (L-1, D-1) appear only where functional (schedule, project keys). Warm-white + graphite palette is user-pinned; no earthy accent.

## Tokens
| Token | Value | Note |
|---|---|---|
| --paper / --sheet | #F3F0EA / #FCFBF8 | drawing paper / sheet |
| --ink / --ink-2 | #222528 / #565B60 | graphite text 13.5:1 / 6.0:1 on paper |
| --poche | #2C3034 | solid cut fields, primary button |
| --pencil-blue | #1F4C99 | links, focus, selection, live dims only; 7.2:1 |
| --line-cut / view / dim | 3px / 1.5px / 1px | drawing weights |
| --font-display | Sofia Sans Extra Condensed 700–800 | latin-ext, self-hosted |
| --font-body | Sofia Sans 400–600 | latin-ext |
| --font-note | Sofia Sans Condensed 500–600 | drawing annotations, table heads |
| --step-0…6 | clamp(), base 1.0625rem body | display up to ~7rem |
| --space-1…8 | 4·8·12·16·24·40·64·104 px | radius 0 (sheets), 2px inputs |

## Layout, motion, imagery
- Breakpoints 390 / 768 / 1024 / 1440. Sheet grid: 12 columns with a 2-column title-block lane on wide screens.
- First mobile screen: H1, elevation with editable width/height, „Apskaičiuoti kainą“.
- Motion: none beyond preview redraw; prefers-reduced-motion respected.
- Imagery: architecture only (facades, openings, interiors with light); no workers, no stock smiles.

## Pages
index · konfiguratorius · medziagos · projektai · uzklausa · privatumas · saltiniai · 404

## Decisions log
- 2026-11-24 – Architect's drawing set chosen over Kaunas facade – user decision.
- 2026-11-24 – Static multi-page, Formspree unconfigured, mode demo – user decision.
- 2026-11-24 – Real Formspree submission deferred: endpoint intentionally unconfigured (user); form shows honest „neišsiųsta“ error.
- 2026-11-24 – Desktop hero keeps H1 in a top band (finish review): a 4-col title block would shrink the display heading.
- 2026-11-24 – Impeccable hook left unwired (needs project settings write); manual `detect` run instead.
