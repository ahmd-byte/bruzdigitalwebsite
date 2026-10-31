"""Per-video playback detail, with a longer settle time to rule out lazy-load timing."""
import sys
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

STATES = {0: "NOTHING", 1: "METADATA", 2: "CURRENT", 3: "FUTURE", 4: "ENOUGH"}

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://localhost:8000/index.html", wait_until="load", timeout=30000)

    # Scroll through the page so any offscreen/deferred media gets a chance to start
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    page.wait_for_timeout(1500)
    page.evaluate("window.scrollTo(0, 0)")
    page.wait_for_timeout(4000)

    vids = page.evaluate("""
        Array.from(document.querySelectorAll('video')).map(v => ({
            src: v.currentSrc.split('/').pop(),
            readyState: v.readyState,
            paused: v.paused,
            currentTime: Math.round(v.currentTime * 100) / 100,
            duration: isFinite(v.duration) ? Math.round(v.duration * 10) / 10 : null,
            w: v.videoWidth, h: v.videoHeight,
            err: v.error ? v.error.code : null
        }))
    """)

    print(f"{'src':<12} {'readyState':<12} {'paused':<7} {'t':>6} {'dur':>6} {'res':>11} err")
    print("-" * 68)
    playing = 0
    for v in vids:
        if v["readyState"] >= 2 and not v["paused"]:
            playing += 1
        res = f"{v['w']}x{v['h']}"
        print(f"{v['src']:<12} {STATES.get(v['readyState'],'?'):<12} "
              f"{str(v['paused']):<7} {v['currentTime']:>6} {str(v['duration']):>6} "
              f"{res:>11} {v['err']}")
    print("-" * 68)
    print(f"playing: {playing}/{len(vids)}")
    b.close()
