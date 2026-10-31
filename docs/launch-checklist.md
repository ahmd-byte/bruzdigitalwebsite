# Launch checklist

Do not launch until the user explicitly requests the build and publishing phase.

## Before a future release
- [ ] Confirm final palette, type, page direction, and UX decisions.
- [ ] Build production output with `python tools/build_production.py`.
- [ ] Audit it with `python tools/audit_production.py`.
- [ ] Preview the generated `dist/` directory.
- [ ] Check navigation at desktop and mobile sizes.
- [ ] Submit a test project brief and confirm notification delivery to `hello@bruzdigital.com`.
- [ ] Check social sharing image, `robots.txt`, `sitemap.xml`, the 404 page, and legacy service routes.
- [ ] Verify the production security headers and HTTPS.
- [ ] Run Lighthouse and record measured results.
- [ ] Keep the last successful deployment available for rollback.

See `DEPLOYMENT.md` for the current Netlify procedure and rollback details.
