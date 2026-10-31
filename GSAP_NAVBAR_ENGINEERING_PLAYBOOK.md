# GSAP Navbar Engineering Playbook

> Portable AI reference for building, debugging, and validating a semantic floating navbar with an elemental GSAP entrance, a full-to-compact scroll morph, section-aware active state, responsive behavior, and safe interruption handling.

## 1. How an AI agent should use this file

Read this document before changing an animated navbar. Treat **Non-negotiable invariants** as constraints, not suggestions.

Before editing:

1. Record a rollback point and inspect the existing workspace state.
2. Identify the semantic anchors, decorative descendants, active-state owner, root-motion owner, and every breakpoint.
3. Reproduce the reported problem in a real browser before forming a theory.
4. Measure element rectangles, computed transforms, GSAP channels, media state, and console errors.
5. Change the smallest responsible ownership layer.
6. Validate the fix using rendered frames and actual interaction sequences.
7. Remove temporary harnesses and screenshots.

Do not report “should work.” Report what was measured.

---

## 2. Target behavior

The reference implementation has:

- One fixed semantic header.
- One brand link and exactly three destination links: HOME, SERVICES, TEAM.
- One shared active indicator behind the destination links.
- A full desktop shell that morphs into a compact centered command bar.
- A descendant-only elemental GSAP intro: frame edges, seams, cell panels, content, and indicator.
- Mobile/tablet layouts that remain open.
- Reduced-motion mode with no decorative entrance or shell-closing motion.
- Native anchor behavior, stable tab order, and exactly one `aria-current="location"` destination.

### Current scroll rule

The desktop shell follows one rule with a hysteresis band:

- `scrollY <= 120`: open.
- `scrollY >= 200`: compact.
- Between 120 and 200: keep the existing state.

No direction tracking, velocity accumulation, or first-visit latch is used. Cursor movement, focus, and clicks never expand the desktop shell. Mobile and reduced-motion profiles remain open.

---

## 3. Non-negotiable invariants

### 3.1 Semantics

- Keep all authored links as real `<a>` elements.
- Never replace links with decorative spans or canvas hit areas.
- Keep accessible names and DOM order unchanged.
- Maintain exactly one destination with `aria-current="location"`.
- Decorative layers use `aria-hidden="true"` and `pointer-events: none`.
- Never call `preventDefault()` merely to coordinate animation.

### 3.2 Ownership

| Concern | Sole owner | Allowed writes |
|---|---|---|
| Semantic current destination | `setCurrent()` | `.is-current`, `aria-current`, current-change event |
| Root shell vertical transform | Scroll/shell controller | Root `y` only; current design keeps it at `0` |
| Root shell full/compact geometry | Scroll/shell controller | Root width, height, radius during a bounded fixed-shell morph |
| Elemental intro | Unfurl controller | Registered descendants only |
| Active indicator position | Geometry/current synchronizer | Indicator pixel `x`; always force `xPercent: 0` |
| Hover micro-motion | Hover handlers | Dedicated badge/label children only |
| Responsive geometry | CSS plus geometry synchronizer | Authored layout and measured seam/indicator values |

Never allow two systems to write the same transform channel.

### 3.3 Intro target rules

The elemental intro must never animate the header root. It may animate only registered descendants:

- Surface veil: opacity and local `xPercent`.
- Four frame edges: local translation, tangential scale, opacity.
- Three seams: `scaleY`, opacity.
- Four cell panels: local `x`, `scaleX`, opacity.
- Brand/badge/label motion wrappers: local `x` or `y`, opacity.
- Shared indicator: local `scaleX`, opacity. Current-state synchronization owns its `x`.

Reject selector strings, root targets, raw `transform`, layout properties, `autoAlpha`, and `visibility` in the intro tween validator.

### 3.4 Cleanup

- Snapshot only properties owned by the current animation.
- Preserve exact inline value, absence, and `!important` priority.
- Restore detached targets defensively.
- Invalidate GSAP’s transform cache after direct inline transform restoration.
- Never use `clearProps: "all"` on shared navbar elements.
- Never clear the complete root transform when only one owner uses root `y`.

---

## 4. Reference DOM contract

```html
<header class="site-header" data-nav-root>
  <span class="nav-unfurl__surface" aria-hidden="true"></span>
  <span class="nav-unfurl__frame" aria-hidden="true">
    <span data-frame-edge="top"></span>
    <span data-frame-edge="right"></span>
    <span data-frame-edge="bottom"></span>
    <span data-frame-edge="left"></span>
  </span>
  <span class="nav-unfurl__seams" aria-hidden="true">
    <span data-seam="brand-home"></span>
    <span data-seam="home-services"></span>
    <span data-seam="services-team"></span>
  </span>

  <a class="brand nav-cell" data-nav-cell="brand" href="#top">...</a>

  <nav class="site-nav" aria-label="Primary navigation">
    <span class="nav-active-indicator" aria-hidden="true"></span>
    <a class="nav-item nav-cell" data-nav-cell="home" href="#top">...</a>
    <a class="nav-item nav-cell" data-nav-cell="services" href="#services">...</a>
    <a class="nav-item nav-cell" data-nav-cell="team" href="#team">...</a>
  </nav>
</header>
```

Cardinality guards:

- 4 frame edges.
- 3 seams.
- 4 cells/panels: brand plus 3 destinations.
- 3 destination links.
- 3 badge wrappers and 3 label wrappers before responsive filtering.
- 1 shared indicator.
- 1 current destination.

Abort decorative animation before applying concealed state if the contract is invalid. Navigation must fail open and remain interactive.

---

## 5. Choreography reference

### 5.1 Profiles

| Value | Desktop ≥901px | Mobile ≤900px |
|---|---:|---:|
| Frame duration | 280ms | 280ms |
| First seam start | 42ms | 42ms |
| Seam duration | 360ms | 320ms |
| Seam stagger | 75ms | 50ms |
| Destination starts | 168, 243, 318, 393, 468ms | 154, 204, 254, 304, 354ms |
| Cell clock | 1000ms | 1000ms |
| Content duration | 240ms | 180ms |
| Total cycle | 1468ms | 1354ms |

### 5.2 Material motion

- Frame edges begin 6px inward.
- Opposing edge pair starts are separated by 40ms.
- All four edges reach one `1.04` scale peak at 80ms.
- Use explicit monotonic tween segments for rise and settlement; do not use elastic easing where exactly one extremum is required.
- Seams begin at `scaleY: 0.10` with a top transform origin.
- Cell panels begin at `x: -8`, `scaleX: 0.96`, then reach one `1.03` peak and settle to `1`.
- Hidden responsive content is excluded before any start-state write.
- The timeline must contain a real child tween ending at the approved total duration.

---

## 6. Reusable implementation patterns

### 6.1 Semantic current-state authority

```js
function setCurrent(activeItem, navItems, root) {
  const next = navItems.includes(activeItem) ? activeItem : navItems[0];

  navItems.forEach((item) => {
    const current = item === next;
    item.classList.toggle('is-current', current);
    if (current) item.setAttribute('aria-current', 'location');
    else item.removeAttribute('aria-current');
  });

  root.dispatchEvent(new CustomEvent('navcurrentchange', {
    detail: Object.freeze({ item: next })
  }));
}
```

No other function should directly normalize current semantics.

### 6.2 Use one pixel channel for a measured active indicator

```js
function syncIndicator({ indicator, currentItem, geometry, animated, gsap }) {
  const x = geometry?.xByItem.get(currentItem);
  if (!Number.isFinite(x)) return false;

  if (animated) {
    gsap.to(indicator, {
      x,
      xPercent: 0,
      duration: 0.08,
      ease: 'power2.out',
      overwrite: 'auto'
    });
  } else {
    gsap.killTweensOf(indicator, 'x,xPercent');
    gsap.set(indicator, { x, xPercent: 0 });
  }

  return true;
}
```

Do not alternate between `x` and `xPercent` across layout profiles. CSSPlugin can preserve both channels and combine them.

### 6.3 Validate every translated indicator target

```js
const xValues = itemRects.map((rect) => rect.left - firstRect.left);
const targetsFit = xValues.every((x) => {
  const targetLeft = baseLeft + x;
  return targetLeft >= -1 && targetLeft + baseWidth <= navRect.width + 1;
});
```

If any target fails, remove the shared-indicator-ready class and use the current link’s local pseudo-element fallback.

### 6.4 Exact inline restoration

```js
const OWNED = ['transform', 'opacity', 'will-change', 'transform-origin'];

function capture(elements) {
  return elements.map((element) => ({
    element,
    properties: OWNED.map((property) => ({
      property,
      present: [...element.style].includes(property),
      value: element.style.getPropertyValue(property),
      priority: element.style.getPropertyPriority(property)
    }))
  }));
}

function restore(snapshot, gsap) {
  snapshot.forEach(({ element, properties }) => {
    if (!element.isConnected) return;

    properties.forEach(({ property, present, value, priority }) => {
      if (present) element.style.setProperty(property, value, priority);
      else element.style.removeProperty(property);
    });

    gsap.core.getCache(element).uncache = 1;
  });
}
```

### 6.5 Prefer absolute position over deltas

ScrollTrigger refreshes and layout changes can report updates without meaningful movement, and trackpads emit tiny alternating deltas. Reading absolute `window.scrollY` avoids both problems, because the same position always yields the same decision. If a design truly needs direction, require a large accumulated distance and expect boundary flicker.

### 6.6 One positional rule with a dead band

```js
const OPEN_BELOW = 120;
const CLOSE_ABOVE = 200;

function onScroll() {
  const y = window.scrollY;
  if (y <= OPEN_BELOW) setShellClosed(false);
  else if (y >= CLOSE_ABOVE) setShellClosed(true);
  // Between the two values, keep the current state.
}
```

Scroll direction is deliberately not consulted. Reversal-driven rules flicker; a positional dead band cannot.

---

## 7. Incident catalog

Each incident uses: **Symptom → Root cause → Tell → Fix → Guard → Generalizes to**.

### Incident 1 — New HTML rendered with stale navbar CSS

**Symptom.** The new semantic navbar appeared raw or malformed on localhost even though the files looked correct.

**Root cause.** The browser reused an older stylesheet while rendering newer HTML. The server supplied `Last-Modified` but no explicit cache-control policy.

**Tell.** Local and served HTML/CSS/JS hashes matched byte-for-byte, but a fresh query-string URL rendered correctly.

**Fix.** Add versioned CSS/JS URLs during active development and use deterministic cache behavior in the local server.

**Guard.** Compare served bytes and response headers before blaming layout code.

**Generalizes to.** Any static site where HTML and cached assets update at different times.

### Incident 2 — Custom cursor obscured a navigation item

**Symptom.** The cursor’s expanded “HELLO” state covered the TEAM link.

**Root cause.** Navbar anchors participated in a broad custom-cursor activation selector.

**Tell.** The link geometry was correct; the cursor overlay occupied the same visual region.

**Fix.** Exclude navbar command items from expanded cursor states and keep decorative cursor layers non-blocking.

**Guard.** Test every navigation target with the custom cursor directly over it.

**Generalizes to.** Magnetic cursors, tooltips, drag overlays, and pointer-following decorations.

### Incident 3 — Navbar entrance felt like basic CSS

**Symptom.** The entire capsule merely scaled/faded, so the entrance did not feel materially constructed.

**Root cause.** One root-level transform attempted to represent frame, seams, cells, and content simultaneously.

**Tell.** Only the header root changed transform; no independent measurable regions existed.

**Fix.** Add dedicated descendant layers and sequence frame → seams → panels → content → indicator.

**Guard.** Require at least four independently measurable motion event types and a single timing source.

**Generalizes to.** Any interface where a “crafted” animation is attempted with one container tween.

### Incident 4 — Root intro and scroll visibility fought over transform

**Symptom.** The bar snapped, drifted, or failed to hide/reveal reliably.

**Root cause.** The intro wrote root scale/skew/opacity while scroll behavior wrote root `y`; both were serialized into one CSS transform.

**Tell.** `buildNavUnfurl` and `quickTo(header, 'y')` targeted the same root.

**Fix.** Move every intro transform to registered descendants. Keep root vertical motion under one scroll/shell controller.

**Guard.** A tween validator must reject the root as an intro target.

**Generalizes to.** Any element controlled by independent intro, hover, drag, scroll, or route-transition systems.

### Incident 5 — Scroll cleanup erased unrelated transform state

**Symptom.** Breakpoint cleanup caused root jumps or lost motion state.

**Root cause.** Cleanup called `clearProps: 'transform'`, removing the entire transform rather than only the owner’s channel.

**Tell.** A media-query cleanup cleared `transform` after a root `quickTo(y)`.

**Fix.** Give root motion one owner, kill only its tween, preserve its explicit target, and never clear the full root transform.

**Guard.** Search navbar lifecycle code for `clearProps: 'transform'` and `clearProps: 'all'`.

**Generalizes to.** Shared elements using multiple GSAP transform aliases.

### Incident 6 — Elemental controller existed but never ran

**Symptom.** The layer registry and timeline code existed, but the navbar showed no unfurl.

**Root cause.** `navbarUnfurlController` remained `null`; geometry and indicator callbacks were never wired.

**Tell.** `runIntro()` guarded on a controller that had no construction site.

**Fix.** Initialize navbar controllers before starting the loader, then let loader completion start exactly one load cycle.

**Guard.** Test the controller debug snapshot and assert one completed load generation.

**Generalizes to.** Feature code that is implemented but disconnected from application startup.

### Incident 7 — Schedule mapped content to the wrong cell

**Symptom.** HOME content followed the brand panel clock, SERVICES followed HOME, and TEAM followed SERVICES.

**Root cause.** Four panel start entries were indexed with three destination content entries.

**Tell.** `cellStarts[index]` was reused across arrays with different semantic cardinalities.

**Fix.** Build keyed destination records (`home`, `services`, `team`) and derive badge/label/indicator starts from each destination key.

**Guard.** Never align semantically different arrays solely by numeric index.

**Generalizes to.** Lists containing a special leading item plus a homogeneous set of destinations.

### Incident 8 — Seam and indicator layers had no measured geometry

**Symptom.** All seams stacked at the left edge and the shared indicator had zero width.

**Root cause.** CSS provided placeholder values, but no runtime measurement synchronized authored cell boundaries.

**Tell.** Every seam retained `--seam-x: 0px`; indicator width remained `0`.

**Fix.** Batch-read root/nav/cell rectangles, then write seam custom properties and indicator base geometry.

**Guard.** Geometry synchronization must return false and preserve local fallback styling when measurements are invalid.

**Generalizes to.** Absolute decorative layers that must follow responsive grid tracks.

### Incident 9 — Responsive compact labels were assigned by `nth-child`

**Symptom.** Compact navigation displayed SERVICES / TEAM / MEET THE TEAM instead of HOME / SERVICES / TEAM.

**Root cause.** The shared indicator is the first child of `.site-nav`, shifting every `nth-child()` index.

**Tell.** The DOM had an indicator before the anchors; CSS assumed the first anchor was child one.

**Fix.** Select compact labels using semantic attributes such as `[data-nav-cell="services"]` and `[data-nav-cell="team"]`.

**Guard.** Never use structural child indices when decorative siblings may be inserted.

**Generalizes to.** Lists containing indicators, separators, portals, or animated overlays.

### Incident 10 — Reduced motion was read only once

**Symptom.** Changing reduced-motion preference during an active intro did not settle immediately.

**Root cause.** A startup boolean was reused instead of observing the live media query.

**Tell.** The initial state worked, but dynamic emulation left an active timeline.

**Fix.** Listen to the live query, synchronously cancel/restore descendants when reduction activates, and remain settled when it deactivates until explicit replay.

**Guard.** Validate both initial and dynamic reduced-motion modes.

**Generalizes to.** Color scheme, contrast, pointer capability, orientation, and breakpoint-dependent animation.

### Incident 11 — Canceling an intro left stale GSAP transform cache

**Symptom.** Activation during an intro restored DOM inline transforms, but a later indicator/content tween inherited concealed scale or translation.

**Root cause.** Direct style restoration changed the DOM but did not invalidate CSSPlugin’s cached transform components.

**Tell.** Computed style looked restored until the next GSAP transform tween, which resurrected an old component.

**Fix.** After direct transform restoration, set `gsap.core.getCache(element).uncache = 1`.

**Guard.** Test cancel at several timeline percentages, then immediately tween another transform channel on the same target.

**Generalizes to.** Any system mixing direct style restoration with later GSAP transforms.

### Incident 12 — Direction flags opened the shell without meaningful scroll

**Symptom.** The shell opened too quickly on tiny upward movement and could appear to react to unrelated cursor/layout activity.

**Root cause.** Logic trusted ScrollTrigger’s direction callback without measuring actual document displacement.

**Tell.** State changed even when `window.scrollY` was unchanged or moved only slightly.

**Fix.** Compare actual scroll positions and ignore deltas below 0.5px. Later, replace generic direction behavior with the explicit first-hero state machine.

**Guard.** Simulate pointer movement with zero scroll and verify shell state remains unchanged.

**Generalizes to.** Scroll libraries that refresh after layout changes or report direction independently of meaningful travel.

### Incident 13 — Direction-based shell rules flickered and were deleted

**Symptom.** With direction rules, small trackpad movements near the end of the hero opened the shell, then closed it again repeatedly.

**Root cause.** Too many interacting rules owned one boolean: a first-visit latch, per-event direction, accumulated travel, pause resets, hero 38% eligibility, and an intent lock. Near the hero boundary these disagreed, so tiny opposite deltas produced opposite decisions.

**Tell.** Each rule passed in isolation, but toggling occurred only where two rules overlapped. Adding thresholds moved the flicker instead of removing it.

**Fix.** Replace all of it with one position rule plus hysteresis: open at `scrollY <= 120`, close at `scrollY >= 200`, hold state in between. Delete direction state entirely.

**Guard.** Jitter the scroll position by a few pixels at the top boundary, at the end of the hero, and deep in the page. Require zero state flips.

**Generalizes to.** Any binary UI state driven by scroll. Prefer one positional predicate with a dead band over velocity/direction heuristics.

### Incident 14 — Active indicator escaped the compact navbar at deep scroll

**Symptom.** At TEAM or page bottom, the acid active block detached to the right of the compact shell.

**Root cause.** Two GSAP translation channels accumulated. After a shell cycle, the indicator retained `x: 370.598px`; TEAM then added `xPercent: 204.291%`. CSSPlugin combined them into a `552.098px` translation.

**Tell.** Runtime probe showed:

```text
stale x       = 370.598px
TEAM xPercent = 204.291%
combined      = 552.098px
escape error  = 370.598px
```

**Fix.** Use measured pixel `x` exclusively; force `xPercent: 0` on every sync; kill both channels during nonanimated updates and teardown; exclude indicator transform from shell snapshots.

**Additional safeguards.** Validate every target fit, synchronize final shell geometry before reveal, and clip root overflow defensively.

**Guard.** Assert indicator left/right match HOME, SERVICES, and TEAM after repeated full/compact cycles and at page bottom.

**Generalizes to.** Any GSAP target that switches between pixel and percentage translation across responsive layouts.

### Incident 15 — Shell snapshot owned more than the shell animated

**Symptom.** Current-state changes during shell morphs could be replaced by an older indicator transform at completion.

**Root cause.** The shell transition snapshot included indicator transform even though the shell only needed to conceal indicator opacity.

**Tell.** Shell restoration wrote a broad transform snapshot, then depended on a separately queued geometry correction.

**Fix.** Exclude indicator transform from shell snapshots. Hide it with the transitioning class, synchronize current geometry, then reveal.

**Guard.** Snapshot only properties actually animated by that lifecycle owner.

**Generalizes to.** Overbroad state snapshots in component transitions.

### Incident 16 — Shared indicator geometry validation checked only HOME

**Symptom.** Invalid TEAM geometry could still enable the shared indicator and disable the safe local fallback.

**Root cause.** Validation checked only base-left plus base width, not every translated destination.

**Tell.** Increasing offsets were accepted even if the final translated right edge exceeded nav width.

**Fix.** Validate each `baseLeft + x + baseWidth` against the nav bounds.

**Guard.** Treat shared-indicator readiness as an all-destinations invariant.

**Generalizes to.** Carousels, tabs, segmented controls, and any shared moving highlight.

### Incident 17 — HOME copy disappeared while the shell reopened

**Symptom.** After deep scrolling and returning to the hero, HOME appeared to vanish while the shell expanded. The `01` badge could remain visible, making the defect look like removed text.

**Root cause.** Three failures overlapped. The shell controller wrote `y` and `opacity` to the same `.nav-label__motion` owned by the intro; it deliberately held labels at `opacity: 0` during part of opening. After removing that collision, the open desktop child grid was still applied while the root retained compact inline width, collapsing HOME's authored label clip to `0px`. Finally, the shared indicator was intentionally hidden during geometry changes while `.nav-indicator-ready` still suppressed the current link's local acid backing, allowing black current text to sit on the black shell.

**Tell.** The first Chromium probe measured HOME at `opacity: 0`, `y: 6px`, and zero clip overlap. The second measured `opacity: 1` and `y: 0`, but still zero clip overlap while `is-nav-transitioning` was present. The failure occurred only inside the shell-opening interval and recovered after settlement.

**Fix.** Restrict the shell controller to root width, height, and radius; never snapshot or animate label descendants. Move hover `x` from `.nav-label__motion` to its non-intro `.nav-label__clip` parent. During opening, measure the full target but retain compact child geometry until root expansion completes, then atomically remove the compact class. While the shared indicator is hidden, explicitly restore the current link's local acid backing. Bump the script asset version so an already-open browser cannot retain the defective lifecycle code.

**Guard.** Sample every animation frame during repeated deep-scroll → HOME returns. Require nonzero HOME clip overlap, opacity `1`, no residual `y`, exactly one semantic current destination, `xPercent: 0`, and correct final indicator fit. Alternate hover overlap and include rapid direction reversals. The final regression ran eight cycles plus a reversal burst with zero invisible HOME frames and no browser errors.

**Rejected optimization.** Scaling the entire header as a FLIP avoided per-frame width layout but rasterized all header text and controls; under artificial 100ms reversals it performed worse than the bounded geometry morph. Do not replace a measured functional fix with a theoretically faster transform without comparing browser frame data and visual text quality.

**Generalizes to.** Responsive components whose parent and child layouts switch at different times, especially when intro, hover, shell, clipping, and shared-indicator systems overlap.

### Incident 18 — Approved cycle length was a constant, not a derivation

**Symptom.** After extending the navbar from three destinations to five, the elemental intro silently never played. No console error appeared, the phase read `settled`, and completed cycles stayed at `0`.

**Root cause.** The schedule compared the computed duration against a hard-coded `1.318s` (desktop) and `1.254s` (mobile). Those numbers were the *result* of a three-destination timeline, so a fifth cell pushed the real end to `1.468s` and the assertion threw.

**Tell.** Two signals had to be combined. The failure path called `clearRun('start-failed')` without emitting a diagnostic, so the event log looked empty; and the thrown message was swallowed by the `catch` around `start()`. Surfacing `lastError` in the debug snapshot printed it immediately: `Navbar desktop schedule duration must be 1.318s`.

**Fix.** Derive the approved total from the destination count instead of storing a literal:

```js
const approvedDuration = firstSeamStart
  + (registry.destinations.length - 1) * profile.seamStagger
  + profile.seamDuration * .35
  + profile.cellClockDuration;
```

Update the profile constants to match, widen the mobile range ceiling, and emit a cancel diagnostic plus `lastError` when a start fails.

**Guard.** Assert `completedCycles >= 1` after load, not merely `phase === 'settled'`. A settled phase is also what a failed start produces, so it proves nothing on its own.

**Generalizes to.** Any validation that hard-codes a value computed from a collection size. When the collection grows, the guard fires instead of the feature. Also: never swallow an error in a `catch` without recording it somewhere observable.

---

## 8. Accessibility and interaction rules

- All four links must remain in the accessibility tree during animation.
- Tab order must remain brand → HOME → SERVICES → TEAM.
- Focus must not be clipped by masks or root containment; leave enough shell padding for outlines.
- Anchor activation must occur in the same frame and must not wait for animation.
- Compact visual abbreviations belong in CSS pseudo-content; authored text remains in the DOM.
- Current semantics and visual indicator are related but separate: semantics remain authoritative if decorative geometry fails.
- On reduced motion, links must be interactive on the first visible frame.

---

## 9. Browser validation protocol

Use real Chromium with real GSAP and ScrollTrigger. Inject test mode before application code:

```js
window.__NAV_UNFURL_TEST__ = true;
```

Recommended debug API:

```js
window.__navUnfurlDebug = {
  replay(),
  cancel(),
  snapshot(),
  eventLog(),
  activeAnimationCount(),
  rootYTarget(),
  isClosed(),
  syncGeometry()
};
```

Do not expose live GSAP objects.

### 9.1 Reference viewports

- 1440 × 900
- 1024 × 768
- 768 × 1024
- 390 × 844
- 320 × 568

### 9.2 Frame assertions

During intro:

- Root scale error ≤0.001.
- Root skew error ≤0.1°.
- Root width/height drift ≤1px.
- Main-content top drift ≤0.5px.
- Document width ≤viewport +1px.
- All visible glyphs remain inside their cells.
- Four frame edges peak once around `1.04`.
- Four panels peak once around `1.03`.
- Desktop settles in 1000–1800ms.
- Mobile settles in 700–1300ms.
- At least 95% of sampled frame intervals are ≤20ms.
- Maximum attributable interval ≤50ms.
- No console, page, or request errors.

### 9.3 Active-indicator assertions

For every destination and shell profile:

```js
Math.abs(indicatorRect.left - currentRect.left) <= 1;
Math.abs(indicatorRect.right - currentRect.right) <= 1;
gsap.getProperty(indicator, 'xPercent') === 0;
```

Run:

1. HOME open.
2. HOME compact.
3. SERVICES compact.
4. TEAM compact.
5. TEAM at page bottom.
6. Return to hero/open HOME.
7. Close again and return to TEAM.
8. Repeat several cycles.

The measured reference fix produced 0px fit error in every state.

### 9.4 Shell position assertions

| Scroll position | Expected shell |
|---:|---|
| 0 | Open |
| 400 | Compact |
| back to 0 | Open |
| 1500 | Compact |
| back to 0 | Open |
| ±6px jitter deep in the page | Zero state flips |
| ±15px jitter at the end of the hero | Zero state flips |
| Jitter across 140–180px | Zero state flips |

### 9.5 Accessibility assertions

- One primary navigation landmark.
- Four authored links.
- Exactly one current destination.
- Every link has `tabIndex === 0` unless intentionally changed by product requirements.
- Focus outline remains inside viewport and visible in open/compact states.
- Enter activation preserves native hash navigation.
- Activation during intro settles descendants without incrementing completed-cycle count.
- Reduced-motion replay is a no-op.

---

## 10. Porting checklist for a new project

1. Copy this playbook into the new repository.
2. Tell the AI agent to read it before modifying navigation.
3. Define semantic destination keys; do not rely on child indices.
4. Create dedicated decorative/motion descendants.
5. Establish the ownership table for root, intro, indicator, hover, and current semantics.
6. Implement and test the pure registry and schedule before wiring timelines.
7. Add exact snapshot/restore with GSAP cache invalidation.
8. Implement pixel-based indicator geometry and all-target fit validation.
9. Add local active-state fallback styling when shared geometry is not ready.
10. Initialize controllers before the load intro can run.
11. Implement responsive and dynamic reduced-motion cleanup.
12. Add only the product-specific shell state machine after the base navbar is stable.
13. Run browser measurements at all reference viewports.
14. Test repeated open/compact/current cycles, not only a fresh load.
15. Remove temporary validation artifacts and record any new non-obvious incident here.

---

## 11. AI review checklist

Before approving a navbar change, answer all questions with evidence:

- Is there exactly one semantic current-state owner?
- Is there exactly one root transform owner?
- Does the intro reject root targets?
- Are arrays mapped by semantic key rather than accidental index?
- Are hidden responsive layers excluded before start-state writes?
- Are direct style restorations followed by GSAP cache invalidation?
- Does the indicator use one translation coordinate system?
- Are every destination’s final indicator bounds validated?
- Can a stale transform channel survive breakpoint or shell changes?
- Can cursor movement change scroll state without real scroll displacement?
- Does dynamic reduced motion cancel within one media-change event?
- Does keyboard focus remain visible and native activation remain immediate?
- Do repeated cycles leave zero active timelines and one indicator?
- Were console errors, overflow, CLS, and frame intervals measured?

If any answer is unknown, the work is not validated.

---

## 12. Portable AI handoff prompt

Use this prompt with the file in a future project:

```text
Read GSAP_NAVBAR_ENGINEERING_PLAYBOOK.md before changing the navbar.
First map the current DOM, semantics, transform ownership, breakpoints,
current-state logic, and cleanup paths. Reproduce the issue in Chromium and
measure actual rects/transforms. Preserve native anchors and one aria-current.
Do not let intro, shell, hover, and indicator systems share transform channels.
Use semantic keys, exact snapshots, GSAP cache invalidation, pixel indicator x,
and all-target fit validation. After implementation, run the playbook's
responsive, interruption, repeated-cycle, reduced-motion, accessibility, and
indicator checks. Report measurements, not assumptions.
```

---

## 13. Maintenance rule

Whenever a non-obvious navbar defect is fixed, append an incident containing:

1. **Symptom** — observable behavior, not an interpretation.
2. **Root cause** — the actual ownership/data/geometry failure.
3. **Tell** — the measurement that isolated it.
4. **Fix** — the smallest responsible change.
5. **Guard** — the automated or manual check preventing recurrence.
6. **Generalizes to** — where the same failure pattern can recur.

Prefer measured values and reproduction sequences over long narrative.
