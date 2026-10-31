"""Load the locally served pages in a real browser and assert the encoding is fixed."""
import sys

from playwright.sync_api import sync_playwright

BASE = "http://localhost:8000"
PAGES = ["index.html", "about.html", "service.html", "ready.html"]

failures = []


def check(label, cond, detail=""):
    print(f"  [{'PASS' if cond else 'FAIL'}] {label}{(' -> ' + detail) if detail else ''}")
    if not cond:
        failures.append(f"{label} {detail}")


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        for name in PAGES:
            page.goto(f"{BASE}/{name}", wait_until="domcontentloaded")
            title = page.title()
            print(f"=== {name}")
            print(f"  title: {title!r}")
            check(f"{name} title has em-dash", "\u2014" in title)
            check(f"{name} title has no mojibake", "\u00e2" not in title, title)

            h1s = page.locator("h1")
            if h1s.count():
                h1 = h1s.first.inner_text().replace("\n", " ")
                print(f"  h1   : {h1!r}")
                check(f"{name} h1 has no mojibake", "\u00e2" not in h1, h1)
                if name == "index.html":
                    check("index h1 has don\u2019t", "don\u2019t" in h1, h1)
            else:
                print("  h1   : (none)")

            body = page.inner_text("body")
            bad = [c for c in ("\u00e2", "\u0080", "\u0099", "\u0094") if c in body]
            check(f"{name} body free of mojibake markers", not bad, str(bad))
        browser.close()

    print()
    if failures:
        print(f"{len(failures)} CHECK(S) FAILED")
        sys.exit(1)
    print("ALL CHECKS PASSED")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
