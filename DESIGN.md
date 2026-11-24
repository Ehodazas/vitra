# DESIGN.md – VITRA (demo brand) · v2 „Product catalogue“

> Single source of truth. ≤100 lines. Product facts: PRODUCT.md. v1 (drawing set) replaced 2026-11-24.

## Business
- Offer: windows and doors (PVC, timber, aluminium) – manufacture + installation, Lithuania. Demo brand.
- Goal: quote requests carrying a configured window. Site-wide CTA „Užsakyti matavimą“; configurator CTA „Apskaičiuoti kainą“; form „Siųsti užklausą“.
- Audience: homeowners building/renovating, small architects; mobile-first; afraid of hidden costs and bad fitting.
- Content status: demo site – every fact/price/project/series name marked [DEMO]; qa.config.json mode: demo.

## Business functionality
| Feature | Behaviour | Data | Test tag |
|---|---|---|---|
| Navigation | Langai · Durys · Konfigūratorius · Projektai · Kontaktai + CTA; mobile menu (Esc, focus return), current page, skip link | – | @navigation |
| Catalogue | langai.html (3 window series, opening types, materials table), durys.html (3 door lines), product page per window series: swatches recolour the render (aria-pressed), specs, profile section, „Konfigūruoti“ preset | `js/products.js` [DEMO] | @catalog |
| Configurator | as v1: mm inputs + steppers, material, colour, opening per sash, glazing, qty; scale drawing + 1,75 m figure; URL + localStorage | `js/catalog.js` [DEMO] | @configurator |
| Price estimate | as v1, unchanged formula and breakdown | `js/pricing.js` [DEMO] | @pricing |
| Materials comparison | table moved to langai.html#palyginimas; mobile pick-two; medziagos.html forwards there | – | @materials |
| Project gallery | as v1: filters (URL), count, empty state, dialog | `js/data.js` [DEMO] | @gallery |
| Quote form | as v1 + optional product field from door/series pages; success only on confirmed 2xx; unconfigured → honest error | Formspree (ID pending) | @quote-form |
| Config hand-off | configurator ↔ quote, series/door → quote/configurator, „Jūsų langas“ strip | URL | @config-handoff |
| Motion | signature tilt-and-turn on home hero, swatch wipes, mask reveals; all off under reduced motion | Web Animations API, no library | @motion |
| Mobile usability | no horizontal scroll 360–1920, targets ≥44 px, sticky configurator preview | – | @mobile |

## Acceptance criteria
- [x] `npm run gate:final` exits 0; every tag above passes in mobile + desktop.
- [x] v1 functionality intact: pricing totals, URL restore, quote never fakes success, filters, dialog.
- [x] Swatch change updates render colour, aria-pressed and the „Konfigūruoti“ link colour parameter.
- [x] prefers-reduced-motion: no transforms/animations; content fully visible without JS.
- [x] Homepage JS ≤ 45 KB gzip (no animation library); Lighthouse ≥ 90/90/90/90 on main pages.
- [x] Only the LCP image per page has fetchpriority="high"; nothing above the fold lazy; all images sized.
- [ ] Real [QA TEST] submission once Formspree ID exists – DEFERRED (see log) (endpoint intentionally unconfigured).

## Brand
- Adjectives: calm, exact, tactile. Voice: „jūs“, plain facts, no slogans, no exclamation marks.
- Series names [DEMO]: langai Norma (PVC), Silva (mediena), Lumen (aliuminis); durys Porta (lauko), Terra (slankiojamos terasos), Aura (balkono).
- Photos: Unsplash (credited on saltiniai.html, origin embedded in files); product renders drawn from the configurator engine.

## Concept – Nordic manufacturer catalogue
- One sentence: a printed product catalogue brought to life – calm photography, product spreads, and windows you can recolour and open.
- First viewport: large serif H1 top-left overlapping the left jamb of a real-looking window frame (cols 6–12) that holds the interior photo; frame colour swatches (balta / antracitas / ąžuolas) under it recolour the frame; two category entries (Langai, Durys) bottom-left.
- Signature: tilt-and-turn – on first load the hero sash tilts in, turns and settles while the photo comes into focus (once per session). Same gesture, small, on product hover.
- From A: interactive colour/material swatches recolour product renders with a clip-path wipe; series renders morph into the product page (View Transitions).
- Structure: home = hero → series band (renders on plinths, unequal) → dark opening-type + configurator band → doors feature → project mosaic → contact strip. Technical drawings only in configurator + specs.
- Registry: differs from Juvelyrika (no clean split; H1 overlaps a literal sash, swatches) and from v1/Ąžuolo v2/Terasų (no hairline sheets, no numbered chapters, no full-bleed gradient hero). Cool white + anthracite + glass green, not warm paper + earthy accent.

## Tokens
| Token | Value | Note |
|---|---|---|
| --bg / --surface / --stone | #F6F6F3 / #FFFFFF / #E9E9E4 | cool white, plinth stone |
| --ink / --ink-2 | #1D2023 / #585D63 | 15.1:1 / 6.1:1 on bg |
| --dark / --on-dark-2 | #23272B / #B9BEC3 | anthracite bands |
| --glass / --glass-wash | #2B6A5C / #E2EEEA | accent: links, focus, selected; 5.8:1 |
| --font-display | Hedvig Letters Serif 400 | latin-ext, self-hosted |
| --font-ui | Albert Sans 400–700 | body, UI, figures (tabular) |
| --radius | 2px controls, 0 images | frames are square |
| --ease | cubic-bezier(.2,.7,.1,1) | motion 240–900 ms |

## Layout, motion, imagery
- Breakpoints 390 / 768 / 1024 / 1440. 12-col grid, generous outer margin, varied spans (no equal card rows).
- Motion: one signature (Web Animations API, home only), CSS for the rest; offscreen sections use content-visibility for speed; IntersectionObserver reveals once; parallax ≤ 12 px desktop only; no scroll hijack; reduced motion = static.
- Imagery: interiors with daylight, hardware details, doors as objects; no workers, no stock smiles.

## Pages
index · langai · langai-norma · langai-silva · langai-lumen · durys · konfiguratorius · projektai · uzklausa (Kontaktai) · privatumas · saltiniai · 404 · medziagos (forward)

## Decisions log
- 2026-11-24 – v1 drawing set built and published (GitHub Pages).
- 2026-11-24 – v2 redesign: direction B (catalogue) + A's swatches/transitions – user decision. Kept: configurator, pricing, hand-off, quote honesty, filters, tests.
- 2026-11-24 – Real Formspree submission deferred: endpoint intentionally unconfigured (user).
- 2026-11-24 – Impeccable hook left unwired; manual `detect` run instead.
