"""Fail when the production package has broken local references or missing launch metadata."""

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import base64
import hashlib
import re

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
HTML_FILES = sorted(DIST.glob("*.html"))
failures: list[str] = []


class PageAudit(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids: list[str] = []
        self.refs: list[tuple[str, str]] = []
        self.h1 = 0
        self.canonical = False
        self.og_image = False
        self.description = False

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if "id" in values:
            self.ids.append(values["id"])
        if tag == "h1":
            self.h1 += 1
        for attribute in ("href", "src", "action"):
            if attribute in values:
                self.refs.append((attribute, values[attribute]))
        if tag == "link" and values.get("rel") == "canonical":
            self.canonical = values.get("href", "").startswith("https://bruzdigital.com")
        if tag == "meta" and values.get("property") == "og:image":
            self.og_image = values.get("content", "").endswith("/assets/social/bruz-social-card.png")
        if tag == "meta" and values.get("name") == "description":
            self.description = bool(values.get("content"))


if not HTML_FILES:
    failures.append("dist contains no HTML files")

for page in HTML_FILES:
    audit = PageAudit()
    text = page.read_text(encoding="utf-8")
    audit.feed(text)
    duplicates = sorted({item for item in audit.ids if audit.ids.count(item) > 1})
    if audit.h1 != 1:
        failures.append(f"{page.name}: expected one h1, found {audit.h1}")
    if duplicates:
        failures.append(f"{page.name}: duplicate ids {duplicates}")
    if not audit.canonical:
        failures.append(f"{page.name}: missing production canonical URL")
    if not audit.og_image:
        failures.append(f"{page.name}: missing social image metadata")
    if not audit.description:
        failures.append(f"{page.name}: missing meta description")
    if "fonts.googleapis.com" in text or "localhost" in text:
        failures.append(f"{page.name}: contains a development-only external reference")
    for attribute, reference in audit.refs:
        parsed = urlsplit(reference)
        if parsed.scheme in {"http", "https", "mailto", "data"} or reference.startswith("#"):
            continue
        local_path = parsed.path
        if not local_path:
            continue
        target = DIST / local_path.lstrip("/") if local_path.startswith("/") else page.parent / local_path
        if not target.exists():
            failures.append(f"{page.name}: broken {attribute} reference {reference}")

required = (
    DIST / "robots.txt",
    DIST / "sitemap.xml",
    DIST / "assets" / "brand" / "favicon.svg",
    DIST / "assets" / "social" / "bruz-social-card.png",
)
for path in required:
    if not path.exists():
        failures.append(f"missing required production file: {path.relative_to(DIST)}")

index_text = (DIST / "index.html").read_text(encoding="utf-8")
schema_match = re.search(r'<script type="application/ld\+json">(.*?)</script>', index_text)
if not schema_match:
    failures.append("index.html: missing organization structured data")
else:
    digest = base64.b64encode(hashlib.sha256(schema_match.group(1).encode()).digest()).decode()
    if f"'sha256-{digest}'" not in (ROOT / "netlify.toml").read_text(encoding="utf-8"):
        failures.append("netlify.toml: Content Security Policy hash does not match structured data")

if failures:
    raise SystemExit("\n".join(failures))

print(f"Production audit passed: {len(HTML_FILES)} HTML pages checked")
