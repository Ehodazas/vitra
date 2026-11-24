# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Static HTML/CSS/vanilla JS on the existing V4.1 starter infrastructure (scripts/serve.mjs, gate.mjs, Playwright, Lighthouse). No framework.

## Users
Lithuanian homeowners building or renovating a private house, and small architects/contractors specifying windows for a client. Mostly on mobile while comparing several manufacturers; worried about price uncertainty, material choice (PVC vs timber vs aluminium), and whether the installer measures and fits correctly.

## Product Purpose
Demo website for VITRA, a (fictional) Lithuanian manufacturer and installer of windows and doors. Success = a visitor configures a window, understands an indicative price and its assumptions, and sends a quote request carrying that configuration.

## Positioning
Not decided by the client (demo brand). The site must earn trust through transparency (shown price assumptions, honest material trade-offs), not slogans.

## Operating Context
Typical journey: browse projects → compare materials → configure dimensions, material, colour, opening type → see indicative estimate → request a measured quote. Final price always depends on on-site measurement.

## Capabilities and Constraints
- Window configurator with visual preview; indicative price with visible demo formula/assumptions.
- PVC / timber / aluminium comparison.
- Filterable project gallery.
- Quote request form prefilled with the selected configuration; submits to a real Formspree endpoint controlled by the site owner; success shown only on a real successful response.
- Multi-page site: home, configurator, materials, projects, contact/quote.
- Language: Lithuanian, "jūs".

## Brand Commitments
- Name: VITRA (demo brand).
- User-pinned visual constraints: architectural editorial, warm whites, graphite, asymmetric layouts, architectural photography, distinctive typography. No generic hero, repetitive card grids, marketing slogans, unnecessary animation.

## Evidence on Hand
None. No real prices, years, certificates, U-values, warranties, addresses, phone numbers, projects or reviews. All such content is [DEMO] and must not be presented as real. Photos: licensed stock (Unsplash/Pexels), credited, marked [DEMO].

## Product Principles
- Show the working, not the claim: every number explains where it came from.
- Measured quote over instant sale: the estimate is a guide, the visit sets the price.
- Mobile configuration must be as complete as desktop.
- No fake success, no fake social proof.

## Accessibility & Inclusion
WCAG 2.2 AA: contrast ≥4.5:1, visible focus, keyboard-operable configurator and filters, 44px tap targets, prefers-reduced-motion respected.
