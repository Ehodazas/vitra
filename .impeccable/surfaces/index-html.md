---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["langai.html","durys.html","konfiguratorius.html","projektai.html","uzklausa.html"]
---

Scope: VITRA v2, all pages; Persuade (home, langai, durys, series pages, projects), Operate (configurator, quote).
Audience/job: homeowners and small architects choose a window/door line, colour and type, see an indicative price, request a measured quote.

## Direction contract
THESIS: A Nordic manufacturer's product catalogue you can touch: calm photography, product spreads, windows you recolour and open. Refuses both the category template (photo slider + icon cards + FAQ wall) and v1's drawing-sheet look.
OWN-WORLD: Cool white #F6F6F3 with stone plinths #E9E9E4, anthracite #1D2023 / #23272B bands, glass green #2B6A5C only for live/selected/links. Hedvig Letters Serif display, Albert Sans UI. Square image edges, real frame profiles drawn in CSS/SVG, opening-type symbols as icons, colour swatches as controls.
STORY: Visitor sees a real window holding a calm interior, recolours its frame, picks Langai or Durys, compares three series, opens one, recolours its render, configures it with an honest price, sends the configuration.
FIRST VIEWPORT: Large serif H1 top-left (cols 1–8) overlapping the stone wall (cols 5–12, bleeding to the edge) that holds a real-looking window frame with the interior photo and a sill; swatch row under the frame recolours it; Langai/Durys entries bottom-left; CTA in header. Mobile: H1, wall + frame, swatches, intro, entries. Amended after finish review: overlap is with the wall, not the jamb, so the frame stays unobstructed.
FORM: Manufacturer's product catalogue (direction B, IMPECCABLE'S PICK chosen by user) + direction A swatches and image transitions. seed:bf0ab2e949b466da
SIGNATURE: tilt-and-turn sash on hero (Web Animations API – a two-step timeline needs no GSAP; once per session; skipped under reduced motion), swatch clip-path wipes, series render → product page view transition, opening-direction mask reveals.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
