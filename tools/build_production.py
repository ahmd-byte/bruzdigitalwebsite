"""Generate a clean, deployment-only Bruz Digital site in dist/."""

from pathlib import Path
import runpy
import shutil

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"

if DIST.resolve().parent != ROOT.resolve():
    raise RuntimeError("Refusing to build outside the repository root")

runpy.run_path(str(ROOT / "tools" / "build_revamp_pages.py"))

if DIST.exists():
    shutil.rmtree(DIST)
DIST.mkdir()

for filename in (
    "index.html",
    "projects.html",
    "services.html",
    "team.html",
    "contact.html",
    "privacy.html",
    "thanks.html",
    "404.html",
    "revamp.css",
    "revamp.js",
    "robots.txt",
    "sitemap.xml",
):
    shutil.copy2(ROOT / filename, DIST / filename)

shutil.copytree(ROOT / "assets", DIST / "assets")
shutil.copytree(ROOT / "services", DIST / "services")

print(f"Built production site: {DIST}")
