"""Verify Playwright can launch, render the local site, and capture measurable signals."""
import sys
from playwright.sync_api import sync_playwright

# Windows consoles default to cp1252 and choke on non-ASCII page content.
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

URL = "http://localhost:8000/index.html"

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    console_errors = []
    failed_requests = []
    page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
    page.on("requestfailed", lambda r: failed_requests.append(r.url))

    page.goto(URL, wait_until="load", timeout=30000)
    page.wait_for_timeout(2500)

    title = page.title()
    h1 = page.locator("h1").first.inner_text()

    # Confirm the custom font actually applied (not a fallback)
    font = page.evaluate("getComputedStyle(document.querySelector('h1')).fontFamily")

    videos = page.evaluate("""
        Array.from(document.querySelectorAll('video')).map(v => ({
            readyState: v.readyState, paused: v.paused
        }))
    """)
    playing = sum(1 for v in videos if v["readyState"] >= 2 and not v["paused"])

    page.screenshot(path="artifacts/local_home.png", full_page=False)

    print(f"title            : {title}")
    print(f"h1               : {h1[:60]!r}")
    print(f"h1 fontFamily    : {font}")
    print(f"videos playing   : {playing}/{len(videos)}")
    print(f"console errors   : {len(console_errors)}")
    for e in console_errors[:5]:
        print(f"   ! {e[:110]}")
    print(f"failed requests  : {len(failed_requests)}")
    for r in failed_requests[:5]:
        print(f"   ! {r}")

    browser.close()
