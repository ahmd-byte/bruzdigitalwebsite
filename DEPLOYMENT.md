# Bruz Digital deployment

The public site is generated into `dist/`. Do not publish the repository root because it contains source material and older website files.

## Build and verify

```powershell
python tools/build_production.py
python tools/audit_production.py
```

Preview `dist/` locally:

```powershell
python -m http.server 8766 --directory dist
```

## Netlify setup

1. Import the GitHub repository into Netlify.
2. Netlify reads `netlify.toml`, builds with `python tools/build_production.py`, and publishes `dist/`.
3. Add `bruzdigital.com` as the production domain and verify HTTPS before launch.
4. In **Forms → Form notifications**, send new `project-brief` submissions to `hello@bruzdigital.com`.
5. Enable Netlify Analytics if server-side, cookie-free traffic measurement is wanted.
6. Deploy a preview first and run the smoke checks below before promoting it.

## Launch smoke checks

- Open every navigation link on desktop and mobile.
- Submit one test project brief and confirm delivery to `hello@bruzdigital.com`.
- Check the social preview image with the deployment URL.
- Confirm `/robots.txt`, `/sitemap.xml`, an unknown URL, and all older `/services/*.html` links.
- Run Lighthouse for performance, accessibility, best practices, and SEO.
- Confirm the production response includes the security headers from `netlify.toml`.

## Rollback

Keep the last successful Netlify production deploy available. If the launch has broken navigation, form delivery, or serious visual regressions, publish that previous deploy from Netlify's deploy history. This restores the prior static site without changing Git history.
