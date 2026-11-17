"""Copy the deployable Bruz Digital site into dist/.

The HTML pages in the repository root are the source of truth and are copied as-is.
"""

from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"

if DIST.resolve().parent != ROOT.resolve():
    raise RuntimeError("Refusing to build outside the repository root")

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
