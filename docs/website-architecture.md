# Website architecture

## Current site
- Static HTML; no JavaScript framework is currently used for the main site.
- `tools/build_revamp_pages.py` generates the five primary pages.
- `revamp.css` contains the current shared visual styling.
- `revamp.js` controls the mobile navigation and existing interactions.
- `tools/build_production.py` assembles the deployable `dist/` folder.
- `tools/audit_production.py` validates production output.
- Netlify configuration is in `netlify.toml`.

## Main pages
Home, Work/Projects, Studio/Services, Team, and Contact. Supporting pages include Privacy, Thanks, and a branded 404 page. Older service URLs redirect to the consolidated Studio page.

## Asset notes
- Plus Jakarta Sans is stored locally under `assets/fonts/`.
- The favicon and social card are existing assets that need a future palette review.
- Verified team portraits are stored under `assets/team/`.
- Product previews are illustrations, not verified deployed product screenshots.
- The repository also contains an archived copy of a prior site under `downloaded-site/`; do not treat it as current brand guidance.

## Deployment boundary
Follow `DEPLOYMENT.md`. Deploy only the generated `dist/` directory after the user explicitly authorizes a build and release.
