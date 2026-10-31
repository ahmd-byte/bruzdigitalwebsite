# Bruz Digital namecard website review

- Review ID: `20261031-bruz-namecard`
- Workflow: Design Arc 0.3.0, Codex
- Project: `https://github.com/ahmd-byte/bruzdigitalwebsite`
- Status: paused at Direction Gate

## Setup

- Evidence mode: Guidelines only; current-request one-run override from the user's choice. No project preference file exists; the override does not create one.
- Approval mode: Guided; first-use selection recorded in this review. No saved project preference exists. The user later delegated direction selection; direction A is selected as a one-run follow-recommendation override. The Visual Proposal Gate remains active.
- Mobbin: unavailable on the connected account's current plan; user selected the one-run Guidelines only path. No benchmark claim is made.
- Graph: no project-scoped graph is used in this review.

## Objective

Make the website function as Bruz Digital's shareable online namecard: visitors arriving from a business-card referral should understand Bruz quickly, see credible proof, and have a clear route to the company website/contact.

Success means the first screen communicates who Bruz is and what it does, the next steps are easy on a phone, and the contact route uses confirmed details only.

## Current journey

- Surface: public static website, currently mirrored at `https://bruzdigital.sarvind.chatgpt.site/` and sourced from this repository.
- Entry: homepage from a shared link or card/QR referral.
- Observed sequence: homepage hero and animated System Lab → recognition ribbon → studio/products pathways → case study → product explorer → team preview → contact CTA → contact page with email and project brief form.
- Exits: Work, Studio, Products, Team, Contact navigation; email link; project form.
- Verified content: “We build tech. You build business.”; two build paths; Johor Plantations Hackathon 2026 2nd runner-up; five-person team; product statuses; confirmed email `hello@bruzdigital.com`.
- Friction: the first screen presents a broad studio pitch rather than a compact, shareable company card; multiple navigation items and a long sequence increase the effort before contact. This is a product-specific judgment based on the stated objective.
- Contact preference: the user prefers central WhatsApp. The number is not present in the repository, so the visual proposal keeps confirmed email visible and marks WhatsApp as pending number confirmation. Social handles and vCard details are also unverified. The hosted Netlify-style form is not verified on the current ChatGPT Sites host.
- Viewport evidence: live desktop was observed at 1348×911. Mobile viewport behavior remains unverified.

## Evidence

### First-party web guidance

- [WCAG 2.2](https://www.w3.org/TR/wcag/) covers contrast, keyboard access, target size, and other web accessibility criteria; it constrains interaction and implementation QA, not the content strategy.
- [WAI form notifications](https://www.w3.org/WAI/tutorials/forms/notifications/) and [form labels](https://www.w3.org/WAI/tutorials/forms/labels/) support clear form feedback and explicit control labels if the brief form remains.

### UI UX Pro Max local database

- `--design-system` query: `B2B digital business card software studio landing page lead generation`; generated general hero/features/CTA structure. The database recommended a conflicting blue/orange palette and Poppins/Open Sans, so those recommendations are not adopted over the approved Signal Blue palette and Plus Jakarta Sans.
- Landing query `digital business card contact led studio`: no match. Retry `lead magnet form CTA landing`: nearest results included a simple value-first landing form pattern, but this is not a direct fit for a company namecard.
- UX query `mobile primary action touch target`: returned mobile-first touch guidance and WCAG target-size guidance.
- These are packaged dataset recommendations, not inspected product benchmarks or compliance findings.

## Directions

### A — Selected: namecard first

- Journey: share/QR referral → compact brand and offer → WhatsApp when the central number is confirmed (otherwise verified email) → concise proof and pathways → deeper work and team details on the same homepage.
- Keep approved Signal Blue identity and Plus Jakarta Sans. Put the BRUZ wordmark, exact tagline, short plain-language offer, confirmed contact route, and one route to selected work near the top. Consolidate Studio, Work, Products, and Team into clear homepage sections; retain Privacy and 404 as utility routes. Preserve old deep links with redirects to the matching sections. Keep verified proof and product status below the hero.
- Benefits: best fit for referral context and fast understanding; no new contact details required.
- Trade-offs: reduces the prominence of the full-service portfolio story; deeper work content moves below the first screen or to a secondary route.
- Motion: remove the large illustrative hero sequence from the entry path; use restrained native hover/focus feedback and anchor navigation. Purpose is quick orientation. Under reduced motion, avoid animated scrolling and transition effects. Current System Lab sequence is existing behavior; retaining it would compete with the namecard goal.
- Risk/complexity: low to moderate in static HTML; mobile composition and the exact top-screen hierarchy need rendered review.

### B — Compact studio portfolio

- Journey: referral → studio hero → two pathways (custom studio/products) → verified work and team → contact page/email.
- Retain the multi-page structure but simplify the homepage and reduce repeated sections. Keep the existing System Lab animation only if its static mobile fallback is clear.
- Benefits: preserves more project and studio context for customers who want detail.
- Trade-offs: slower to scan than a namecard and more navigation before contact.
- Motion: keep only the existing one-run hero sequence after a static first render; reduced-motion users see the final static diagram. Timing and device behavior are unverified.
- Risk/complexity: moderate because the existing paths and generated page source must remain coherent.

### C — Product showcase

- Journey: referral → interactive system/product preview → product status and use cases → case study → contact.
- Make the System Lab and product explorer the dominant story.
- Benefits: strongest product-led visual impression.
- Trade-offs: weakest fit for a company namecard; the products are at different maturity levels and the concept risks obscuring the studio offer.
- Motion: retain product-tab interaction and one-run System Lab; avoid adding new scroll choreography. Reduced-motion mode presents static illustrations. Current mobile fit is unverified.
- Risk/complexity: moderate to high; more state coverage and additional accessibility QA are needed.

## Visual proposal

- Renderer: Codex-only static SVG boards; no Stitch renderer is available in this session.
- Screens/states: complete desktop home composition; mobile home frame at a 390×844 viewBox; mobile menu open with visible focus; content path for Studio, Work, Products, Team, Contact, Privacy and 404; product maturity labels; email fallback if no mail app opens.
- Motion: static hero and illustration; no custom scroll choreography. Use reduced-motion-aware native anchor scrolling and brief focus/hover feedback in implementation.
- Render critique: the initial mobile title overflow and recognition label collision were corrected after inspecting the rendered boards. Current mobile title fits and the recognition panel has separated labels.
- Asset fidelity: the System Lab drawing is an illustration, not a product screenshot. SVG board rendering used a system font fallback; implementation will retain the repository's approved local Plus Jakarta Sans font.
- Proof remaining: static boards do not prove browser behavior, actual viewport breakpoints, keyboard flow, final contrast, or contact routing. Those need implementation and deployment checks.
- WhatsApp: preferred primary contact after the central number is confirmed; until then, show only `hello@bruzdigital.com` as the working contact.
- Contact form: do not rely on a Netlify form until delivery is confirmed on the selected host. Recommendation is direct WhatsApp/email contact for this namecard experience.

## Gates

- Objective Confirmation: confirmed by the user in the prior conversation.
- Direction Gate: resolved by the user's request to fully redesign and ask for suggestions; selected direction A using the marked recommendation.
- Visual Proposal Gate: pending approval.
- Implementation and deployment: the user requested a redesign and publishing earlier; pause source changes until the user approves the complete visual proposal under Guided mode.
