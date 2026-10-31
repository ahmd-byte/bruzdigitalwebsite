"""
Confirm all 6 hero videos reach playback once they actually enter the viewport.

vid5/vid6 sit far right inside a 5000px-wide slider track. Chromium throttles
autoplay for offscreen elements, so a fair test must bring each video into view
before judging it. Reports viewport intersection alongside playback state.
"""
import sys
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

STATES = {0: "NOTHING", 1: "METADATA", 2: "CURRENT", 3: "FUTURE", 4: "ENOUGH"}

PROBE = """
Array.from(document.querySelectorAll('video')).map(v => {
    const r = v.getBoundingClientRect();
    const inView = r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight;
    return {
        src: v.currentSrc.split('/').pop(),
        readyState: v.readyState,
        paused: v.paused,
        t: Math.round(v.currentTime * 100) / 100,
        dur: isFinite(v.duration) ? Math.round(v.duration * 10) / 10 : null,
        res: v.videoWidth + 'x' + v.videoHeight,
        err: v.error ? v.error.code : null,
        inView
    };
});
"""


def report(label, vids):
    print(f"\n--- {label} ---")
    print(f"{'src':<12} {'readyState':<11} {'paused':<7} {'t':>6} {'dur':>6} {'res':>10} {'inView':<7} err")
    print("-" * 76)
    playing = 0
    for v in vids:
        if v["readyState"] >= 2 and not v["paused"]:
            playing += 1
        print(f"{v['src']:<12} {STATES.get(v['readyState'], '?'):<11} {str(v['paused']):<7} "
              f"{v['t']:>6} {str(v['dur']):>6} {v['res']:>10} {str(v['inView']):<7} {v['err']}")
    print("-" * 76)
    print(f"playing: {playing}/{len(vids)}   decoded (readyState>=2): "
          f"{sum(1 for v in vids if v['readyState'] >= 2)}/{len(vids)}")
    return playing


with sync_playwright() as p:
    b = p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
    page = b.new_page(viewport={"width": 1440, "height": 900})

    failed = []
    page.on("requestfailed", lambda r: failed.append(r.url.split("/")[-1]))

    page.goto("http://localhost:8000/index.html", wait_until="load", timeout=30000)
    page.wait_for_timeout(3000)
    report("initial load", page.evaluate(PROBE))

    # Walk each video into view via its own scrollIntoView, then let it spin up.
    count = page.locator("video").count()
    for i in range(count):
        page.evaluate(
            "i => document.querySelectorAll('video')[i]"
            ".scrollIntoView({block:'center', inline:'center'})", i
        )
        page.wait_for_timeout(900)

    page.wait_for_timeout(2500)
    vids = page.evaluate(PROBE)
    playing = report("after bringing each video into view", vids)

    print(f"\nfailed requests: {len(failed)} {failed if failed else ''}")
    print("VERDICT:", "all 6 play" if playing == 6 else f"{playing}/6 playing")

    page.screenshot(path="artifacts/videos_verified.png", full_page=False)
    b.close()
