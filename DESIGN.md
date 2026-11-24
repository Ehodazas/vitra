# DESIGN.md – [Client]

> Single source of truth. Keep ≤100 lines. Claude reads this instead of re-running design skills.

## Business
- Offer / city or area:
- Site goal (calls, leads, bookings, sales) + primary CTA wording:
- Audience (who, device, main worries):
- Competitors to look different from (URLs):
- Content status: real | partly demo | demo site  (demo items marked [DEMO] in copy; qa.config.json mode: client | demo)

## Business functionality
| Feature | Behaviour | Data / integration | Test tag (in qa.config.json) |
|---|---|---|---|
| Contact form | fields, validation, success/error messages, consent | sends to: email / CRM / Formspree… | @contact-form (+ @integration) |
| Navigation | desktop menu, mobile menu, anchor links | – | @navigation |
| e.g. Price calculator | inputs, formula, rounding, output format | formula source: client | @calculator |
| e.g. Gallery / filters / booking / map / language switch | | | @gallery / @filters / … |
| Analytics + cookie consent | which tools, consent before tracking | | @consent |

## Acceptance criteria (testable, used by QA final)
- [ ] `npm run gate:final` exits 0 (all required feature tests pass, none skipped; production build; Lighthouse thresholds).
- [ ] Real integrations verified once with a marked [QA TEST] submission; receipt confirmed in client inbox/CRM.
- [ ] Full-page mobile and desktop screenshots of every page reviewed.
- [ ] No horizontal scroll at 360–1920px; tap targets ≥44px.
- [ ] Only the main LCP image has fetchpriority="high"; no above-the-fold image lazy-loaded; all images sized.
- [ ] No [DEMO] markers left (unless content status = demo site); no broken links.
- [ ] Concept reviewed against the design registry; overlaps with recent sites are deliberate and justified (guidance, not a hard rule).
- [ ] Client-specific: …

## Brand
- 3 adjectives:
- Tone of voice (yes/no example phrases; jūs/tu):
- Assets (logo, photos, existing colors):

## Concept (original to this project)
- Concept in one sentence:
- Differentiator vs generic templates and our registry:
- Hero approach:
- Structure / grid idea:
- Signature element:

## Tokens
| Token | Value | Note |
|---|---|---|
| --color-bg / surface / text / muted | | |
| --color-accent / accent-contrast | | contrast ≥4.5:1 |
| --font-display / --font-body | | Lithuanian diacritics |
| --step-0…5 (clamp) | | |
| --space-1…8, --radius, --shadow | | |

## Layout, motion, imagery
- Breakpoints: 390 base, 768, 1024, 1440. First mobile screen must show:
- Motion: none / subtle / expressive (CSS / Lenis / GSAP); respect prefers-reduced-motion.
- Imagery: real business photos preferred; never generic stock.

## Pages & sections
- 

## Decisions log
- YYYY-MM-DD – decision – reason
