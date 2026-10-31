# Design system — working draft

## Status
Palette 01 — Signal Blue and the tagline are approved. Typography and component details remain in proposal status. This document is a planning reference, not permission to change website source files.

## Color tokens
```css
:root {
  --brand-blue: #163B8C;
  --brand-turquoise: #16B8C4;
  --brand-frost: #F3F7FB;
  --brand-ink: #10243A;
  --brand-orange: #F49A38;
}
```

Use Ink with Frost and Turquoise for readable text. Reserve Orange for emphasis. Check all combinations and interaction states before implementation.

## Typography proposals
The current site uses locally hosted Plus Jakarta Sans. Compare:
1. Plus Jakarta Sans for heading and body; IBM Plex Mono for brief technical labels.
2. Space Grotesk for display headings, Plus Jakarta Sans for body; IBM Plex Mono for technical labels.
3. Manrope for heading and body; DM Mono for brief labels.

The user has not selected a final system. See the standalone typography preview prepared during this design phase.

## Proposed responsive scale
Starting point for comparison only:
- Hero: `clamp(3rem, 6vw, 6.5rem)`, compact line height around 1.0.
- Page heading: `clamp(2.6rem, 5vw, 5.5rem)`.
- Section heading: `clamp(2rem, 3.4vw, 3.4rem)`.
- Body: 1rem to 1.2rem, line height 1.5–1.65.
- Technical labels: 0.7rem–0.8rem; do not use monospace for navigation or long copy by default.

## Existing layout and motion
Retain the existing 52/48 editorial hero as the starting layout. Preserve the System Lab’s single-run motion behavior and avoid looping motion. Any final values must be validated at mobile and desktop sizes before implementation.
