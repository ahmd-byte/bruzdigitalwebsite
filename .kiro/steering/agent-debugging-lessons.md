---
inclusion: always
---

# Agent Debugging Lessons

A running log of real mistakes made in this workspace, why they happened, and the
diagnostic habits that caught them. Read the **Diagnostic Principles** first when
something is broken — they generalise. The incidents are worked examples.

---

## Diagnostic Principles

**1. Compare against a known-good reference.**
Guessing ends the moment you diff against something you trust. If a local file
misbehaves, fetch the original and compare bytes. If a page renders wrong, compare
with production. Get a reference before forming theories.

**2. Read the raw bytes.**
File sizes and "it looks fine in the editor" both lie. Bytes do not. Every binary
format has a signature at a known offset:

| Format | Signature | Offset |
|---|---|---|
| MP4 | `ftyp` | bytes 4–7 |
| PNG | `\x89PNG\r\n\x1a\n` | 0 |
| WEBP | `RIFF` (+ `WEBP` at 8) | 0 |
| GIF | `GIF8` | 0 |
| JPEG | `\xFF\xD8\xFF` | 0 |
| PDF | `%PDF` | 0 |
| ZIP/DOCX | `PK\x03\x04` | 0 |
| TTF | `\x00\x01\x00\x00` | 0 |
| WOFF2 | `wOF2` | 0 |

Checking a signature takes seconds and is definitive. Use `tools/hexpeek.py`.

**3. Distinguish "broken" from "blocked."**
Before declaring a defect, check whether the thing simply was not *allowed* to run.
A video with `readyState: ENOUGH`, a real duration, a real resolution, and
`error: null` is fully loaded — if it sits at `t=0` it is being throttled, not
damaged. Same class of trap: permissions, feature flags, autoplay policy, lazy
loading, viewport gating, rate limits, disabled accounts.

**4. Identical damage means one shared cause.**
Six files with byte-identical corruption but different sizes is not six bad
downloads. Coincidence is a weak hypothesis. Look for the single upstream step
every affected item passed through.

**5. Let evidence redirect you; do not stop at the first plausible theory.**
Multiple real bugs often stack. Confirming one does not clear the others.

**6. Verify the fix by measurement, not by reasoning.**
"It should work now" is not a result. Re-run the check and read the numbers.

**7. Do not trust your own assumptions about available capability.**
Check before claiming something is impossible. See Incident 4.

**8. Establish a rollback point before multi-file or multi-agent changes.**
`git init` + a baseline commit costs seconds. Without it there is no undo.

---

## Incident 1 — Binary files written as text (silent corruption)

**Symptom.** Videos would not play. Browser reported `requestfailed` on several
`.mp4` files. Favicon and avatar images silently missing. No errors during
download; every file looked present and plausibly sized.

**Root cause.** The download script used a text writer on binary HTTP responses:

```powershell
# WRONG - stringifies the byte array
[System.IO.File]::WriteAllText($path, $content)

# RIGHT
[System.IO.File]::WriteAllBytes($path, $response.RawContentStream.ToArray())
```

`WriteAllText` expects a string. Handed a byte array it does not throw — it calls
`.ToString()`, and PowerShell renders a byte array as space-separated decimals.
The byte `0x66` (102) was written as the three characters `1`,`0`,`2`.

**The tell.** Corrupted files are *larger* than the originals, by roughly 3x:

| | real | mangled | ratio |
|---|---|---|---|
| 8-byte demo | 8 B | 24 B | 3.0x |
| vid1.mp4 | 1,919,773 B | 6,844,230 B | 3.57x |

Header comparison made it unambiguous:

```
live  : 00 00 00 20 66 74 79 70   -> ....ftyp   (valid MP4)
local : 30 20 30 20 30 20 33 32   -> "0 0 0 32 102 116 121 112"
```

**Why it hid.** HTML, CSS, JS and SVG genuinely *are* text, so they survived
untouched. Only PNG/WEBP/MP4 broke — 11 of 38 assets. A partial failure looks
like a network problem rather than a code problem.

**Guard.** `tools/verify_assets.py` hashes every local asset against the live
original and specifically fingerprints this signature (a header of only ASCII
digits and spaces). `--fix` re-downloads offenders.

**Generalises to.** Any language with separate text/binary write paths: Python
`open(p,'w')` vs `'wb'`, Node `fs.writeFile` with a default utf8 encoding,
`curl` on Windows without `--output`, copy-pasting binary through a terminal.
Also base64 handling and DB blob columns typed as text.

---

## Incident 2 — Static server could not stream video

**Symptom.** Even with valid files, `<video>` elements failed to reach
`readyState >= 2`. Requests aborted.

**Root cause, two parts.**

*No HTTP Range support.* Browsers do not fetch media whole. They send
`Range: bytes=0-1023` and expect `206 Partial Content`. Python's stock
`SimpleHTTPRequestHandler` ignores `Range` and returns `200` with the full body.
Chrome treats the broken contract as a failure and aborts.

*Single-threaded.* `socketserver.TCPServer` serves one connection at a time. Six
concurrent video streams queue and time out. Needs `socketserver.ThreadingMixIn`.

**Fix.** See `run-server.py` — implements `206`, `Content-Range`,
`Accept-Ranges`, `416` for unsatisfiable ranges, and threading. Also swallows
client-disconnect exceptions, which are routine when a browser aborts a media
range on pause or teardown.

**Verify.**
```powershell
$r = [System.Net.HttpWebRequest]::Create("http://localhost:8000/video.mp4")
$r.AddRange(0, 1023); $r.GetResponse().StatusCode   # expect PartialContent (206)
```

**Generalises to.** Audio streaming, PDF viewers with lazy page loading, resumable
downloads, `Accept-Ranges` behind proxies and CDNs.

---

## Incident 3 — Misreading throttling as corruption

**Mistake.** Reported "4/6 videos playing" as an outstanding defect after the
real bugs were fixed. The user correctly pushed back that all six worked.

**What was actually happening.** The hero slider is a 5000px-wide flex track
inside `overflow-hidden`. At a 1440px viewport, videos 5 and 6 are physically
offscreen, and Chromium suppresses autoplay for offscreen media. `scrollIntoView`
could not reveal them because the track moves by CSS transform, not scroll
position. Testing at a 5600px viewport gave 6/6 playing immediately.

**The evidence had already said so.** Both "failing" videos reported
`readyState: ENOUGH`, correct duration, correct resolution, `err: None`. That is
a loaded video awaiting permission, not a broken one.

**Lesson.** Read *all* the fields before judging, and make the test environment
fair to the thing being tested. A test that cannot see the element cannot
evaluate it. See `tools/check_videos_wide.py`.

---

## Incident 4 — Asserting a capability limit without checking

**Mistake.** Told the user that subagent critics "cannot see pixels," so
screenshot-based visual comparison was impossible, and proposed a weaker
code-only review as a substitute.

**Reality.** Playwright with headless Chromium was installed and working in the
workspace. Real screenshots, computed styles, console errors, network failures
and per-element state were all available the whole time.

**Lesson.** Check the environment before declaring a limitation. An unverified
"can't" wastes more time than a failed attempt, and it quietly narrows the
solution space for the user. Probe first, then report.

---

## Tooling in this workspace

| Tool | Purpose |
|---|---|
| `tools/verify_assets.py` | Byte-for-byte SHA compare of every asset vs live; `--fix` repairs |
| `tools/check_media.py` | Walks MP4 box structure; separates truncated from intact |
| `tools/hexpeek.py` | Hex + ASCII header dump — the tool that cracked Incident 1 |
| `tools/check_videos_wide.py` | Playback state with a viewport wide enough to be fair |
| `tools/verify_render.py` | Page render smoke test: fonts, console errors, failed requests |
| `tools/demo_the_bug.ps1` | Minimal reproduction of the text-vs-binary write bug |

---

## Adding to this file

When a non-obvious bug is fixed, append an incident with: **Symptom** (observable,
not interpreted) → **Root cause** → **The tell** (the specific signal that
identified it) → **Guard** (the check that prevents recurrence) → **Generalises
to**. Prefer the tell and the guard over narrative; those are what save time later.

---

## Incident 5 — Detached overlay could not remain aligned with an animated card

**Symptom.** A semicircular card dent appeared as a floating black “smile,” and the scrolling ball missed or overlapped it at landing.

**Root cause.** The ball and dent were independent children of a section-level FX layer, while the destination card had its own scroll-driven transform. The dent used transform-independent section offsets and a different diameter from the ball, so the visuals did not share either a coordinate system or geometry.

**The tell.** The dent moved separately from the card in screenshots. Browser measurement also showed that the implementation intentionally sized the dent at `2.6x` the source dot and the ball at `1.15x`, making an exact fit impossible by construction.

**Guard.** Make the missing-piece cutout a child of the destination card, remove the card’s native top border, and reconstruct the border around one shared `--piece-size`. Measure the source once and assign the same diameter to both cutout and ball. Verify the final frame numerically: one visible ball, zero detached notch nodes, equal diameters, ball center X equal to card center X, and ball center Y equal to card top.

**Generalises to.** Tooltips, badges, portals, masks, and drag targets attached to transformed elements. If two visuals must fit exactly, they must share an ancestor coordinate system or be measured against the same transformed reference, and they must derive dimensions from one source of truth.

---

## Incident 6 — One class name, two pages, one silent overwrite

**Symptom.** The `services/web-design.html` anti-manifesto section rendered as plain small black text on cream — no giant type, no red struck-through "NICE", no editorial three-column layout. The homepage looked correct.

**Root cause.** `.manifesto` is used by two completely different designs: the service pages' editorial anti-manifesto (`.manifesto__lead` / `__body` / `__note`, ~7.8rem type) and the homepage's product-card grid (`.manifesto__cards`, `.manifesto-card`). When the homepage manifesto was later redesigned into cards, its `str_replace` overwrote the shared `.manifesto*` rules in `styles.css` with the card layout. The service page's markup still referenced the old classes, which no longer had matching rules, so it fell back to unstyled defaults. Nothing errored; the CSS simply no longer existed.

**The tell.** `grep` for `manifesto__lead|manifesto__body|.strike|.boxed` in `styles.css` returned **no matches**, but `git show HEAD:styles.css` for the same patterns returned the full rule set. The styles existed in a prior committed state and were absent from the working tree, so a redesign of the *shared* selector had removed them — not a deletion commit.

**Same trap in JS.** `initManifesto()` in `app.js` had the identical fork. The original animated `.manifesto__lead` / `__body` / `__foot` / `__asterisk`; the homepage card redesign rewrote it to animate `.manifesto__title-line` / `.manifesto__cards`, silently dropping the service-page entrance. Restored as scoped, existence-guarded tweens (`select(..., section)` + `if (el)`) so both variants animate only where their elements exist. When a shared block forks, its **behavior** forks too — check the JS, not just the CSS.

**Guard.** Scope the two designs so they can never collide again: the service variant is now `#anti-manifesto ...` (the id already on the section), fully self-contained, reading none of the homepage card rules and vice versa. Verify both pages after any change to a shared class: homepage `.manifesto` stays `display: block` with a 3-column `.manifesto__cards`; `#anti-manifesto` is a 3-column grid with ~91px weight-900 lead and a red strike bar, and its lead/body/foot slide+fade in while the asterisk spins on scroll.

**Generalises to.** Any class name reused across templates/pages with divergent designs — cards vs. hero vs. list variants sharing a block name, shared BEM roots, utility classes redefined per section. If two unrelated layouts share a selector, one redesign silently strips the other. Prefer a distinguishing scope (id, modifier class, or data attribute) the moment a block's design forks by context.
