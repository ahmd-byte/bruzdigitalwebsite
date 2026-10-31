# Bruz Digital website project guidance

## Working boundaries
- This project is in design and planning mode. Do not alter website implementation or publish the site until the user explicitly asks to build it.
- Design documents and clearly labelled visual previews are in scope when requested.
- Work on the exact branch `ahmad-branch`. Keep `main` unchanged.
- Preserve existing source files, assets, and user changes. Review the current state before modifying it.

## Approved decisions
- Tagline: “We build tech. You build business.”
- Approved brand palette: Signal Blue `#163B8C`, Turquoise `#16B8C4`, Frost `#F3F7FB`, Ink `#10243A`, Orange `#F49A38`.
- The current approved visual identity is Palette 01 — Signal Blue.
- Typography options remain proposals until the user selects one.

## Project source of truth
- Read `REVAMP_NOTES.md`, `DEPLOYMENT.md`, and relevant content in `GSAP_NAVBAR_ENGINEERING_PLAYBOOK.md` before design or implementation work.
- The five primary pages are generated from `tools/build_revamp_pages.py`; styles are in `revamp.css`; navigation behavior is in `revamp.js`.
- Do not edit generated pages as the source of truth.
- The site is static HTML. Do not introduce a framework or component library without a clear need and user agreement.
- Treat provided repository copy and assets as authoritative. Do not invent services, customer outcomes, metrics, product status, contact details, or team credentials.
- Product interface imagery is illustrative unless a real product screenshot is supplied. Label illustrations accurately.

## Design principles
- Keep Plus Jakarta Sans as the known current font while typography proposals are reviewed.
- Use technical monospace faces sparingly for short system labels and diagram annotations.
- Preserve responsive behavior, keyboard access, visible focus, semantic navigation, and reduced-motion support in any future implementation.
- Keep motion intentional and consistent with the existing non-looping System Lab direction.
