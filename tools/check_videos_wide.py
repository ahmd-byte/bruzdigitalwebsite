"""
Decisive test: give the browser a viewport wide enough that the entire 5000px
slider track is on screen, so no video is subject to offscreen autoplay
throttling. If all 6 play here, the files and server are fully correct and the
earlier 4/6 was purely a visibility artifact.
"""
import sys
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

STATES = {0: "NOTHING", 1: "METADATA", 2: "CURRENT", 3: "FUTURE", 4: "ENOUGH"}

PROBE = """
Array.from(document.querySelectorAll('video')).map(v => {
    const r = v.getBoundingClientRect();
    return {
        src: v.currentSrc.split('/').pop(),
        readyState: v.readyState,
        paused: v.paused,
        t: Math.round(v.currentTime * 100) / 100,
        dur: isFinite(v.duration) ? Math.round(v.duration * 10) / 10 : null,
        res: v.videoWidth + 'x' + v.videoHeight,
        err: v.error ? v.error.code : null,
        inView: r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight
    };
});
"""

with sync_playwright() as p:
    b = p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
    # 5600px wide comfortably contains the 5000px slider track.
    page = b.new_page(viewport={"width": 5600, "height": 1200})

    failed = []
    page.on("requestfailed", lambda r: failed.append(r.url.split("/")[-1]))

    page.goto("http://localhost:8000/index.html", wait_until="load", timeout=45000)
    page.wait_for_timeout(6000)

    vids = page.evaluate(PROBE)

    print(f"{'src':<12} {'readyState':<11} {'paused':<7} {'t':>6} {'dur':>6} {'res':>10} {'inView':<7} err")
    print("-" * 76)
    playing = 0
    for v in vids:
        if v["readyState"] >= 2 and not v["paused"]:
            playing += 1
        print(f"{v['src']:<12} {STATES.get(v['readyState'], '?'):<11} {str(v['paused']):<7} "
              f"{v['t']:>6} {str(v['dur']):>6} {v['res']:>10} {str(v['inView']):<7} {v['err']}")
    print("-" * 76)

    decoded = sum(1 for v in vids if v["readyState"] >= 2)
    errors = [v["src"] for v in vids if v["err"] is not None]

    print(f"playing        : {playing}/{len(vids)}")
    print(f"decoded        : {decoded}/{len(vids)}")
    print(f"decode errors  : {errors if errors else 'none'}")
    print(f"failed requests: {len(failed)} {failed if failed else ''}")
    print("\nVERDICT:", "ALL 6 PLAYING" if playing == 6 else f"{playing}/6 playing")

    b.close()
