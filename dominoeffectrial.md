# Domino Effect Trial — archived animation

Archived on removal from the live Bruz homepage. This file is the complete,
self-contained record of the `YOU BUILD THE BUSINESS.` domino interaction and the
"missing puzzle piece" ball that fed into the **BRUZ® INTELLIGENCE** card.

Nothing here is wired into the site any more. `index.html`, `styles.css` and
`app.js` were reverted to a plain, static headline. Everything below is kept
verbatim so the effect can be lifted into another project without rebuilding it.

---

## 1. Purpose

The headline reads `WE BUILD TECH.` / `YOU BUILD THE BUSINESS.` The intent was to
make the second line behave like a physical row of dominoes, and then let the
full stop of `BUSINESS.` become a literal object that travels down the page and
completes the product card below it.

Two ideas were being sold at once:

- **Chain reaction.** "You build the business" is a sequence of consequences, so
  each word physically pushes the next.
- **The missing piece.** The period detaches, rolls down, and drops into a
  circular dent cut out of the top edge of the Intelligence card. The visual
  claim: *this product is the missing piece of your business.*

---

## 2. What the viewer sees

Scrolling **down**:

1. The heading fades and slides in (separate, pre-existing entrance animation).
2. Once that entrance finishes, `YOU` tips forward on its bottom-left corner.
3. `BUILD`, `THE`, `BUSINESS` tip in turn — each starting **before** the previous
   one has finished falling, so the row reads as one wave, not a queue.
4. Each word springs back upright behind the wave.
5. Mid-tip of `BUSINESS`, its period breaks loose and rolls a short distance on
   its own momentum, while `BUSINESS` is still settling back.
6. From there scroll takes over: the ball rolls right to the horizontal centre of
   the Intelligence card, then descends into the semicircular dent in the card's
   top border.
7. The ball's centre lands exactly on the card's top edge, so half of it sits in
   the dent and half stands above the card. The dent's outline fades out
   underneath it so only one circle is ever visible.

Scrolling **up**: everything runs in reverse. The ball unwinds out of the dent
and back up its path, then rolls the last stretch home under its own power and
hands its position back to the real period. The word cascade then plays backward,
right to left, and the sentence ends upright exactly as it began.

---

## 3. Architecture — who owns what

The final shape was driven by one rule: **for any property, exactly one thing may
write it at a time.** Every bug in this feature's history was a violation of that.

| Concern | Owner | Mechanism |
|---|---|---|
| Word tilt / nudge | one paused `sentence` timeline | one ScrollTrigger, `toggleActions: 'play none none reverse'` |
| The period → ball handoff | `detachBall()` | called from inside the `sentence` timeline, guarded to forward playback |
| Short autonomous release | `breakawayTween` | fixed-time tween, not scroll-linked |
| Long journey to the card | `flightTimeline` | its own ScrollTrigger with `scrub`, created *after* release |
| Rolling return home | `homeRollTween` | fixed-time tween; blocks scroll input via `returning` |
| Reversal detection | one persistent section ScrollTrigger | `onUpdate: watchReversal` |
| Dent + ball diameter | one measured value | `--piece-size` / `--piece-radius` written by JS |

### Coordinate system

The ball lives in `.manifesto__fx`, an absolutely positioned overlay pinned to
`.manifesto`. Two different measuring functions exist on purpose:

- `offsetWithin()` uses `offsetLeft`/`offsetTop`, which **ignore CSS transforms**.
  Used for layout anchors (card centre, card top) that must stay stable while the
  cards' own entrance animation is mid-flight.
- `visualDotPosition()` uses `getBoundingClientRect()`, which **includes
  transforms**. Used only at the handoff frame, so the ball appears on the exact
  rendered pixel the tilted period occupied.

Verified handoff error: **0.001–0.006px**.

### Rolling is derived, never invented

`rollFor(distance)` converts travel into rotation:

```js
const rollFor = (distance) => (distance / (Math.PI * pieceSize())) * 360;
```

A fixed `rotation: 360` over an arbitrary distance looks like sliding. Turning
once per circumference is what makes it read as rolling, and it unwinds correctly
in reverse for free.

---

## 4. Engineering lessons (why the code looks like this)

These were all real, diagnosed failures. Anyone reviving this should read them
before "simplifying" anything.

**The straighten must not overlap its own tip.**
Originally each word tipped over `.28s` but began straightening at `tipAt + .21`.
The straighten tween captured the rotation mid-fall and dragged it back, so words
peaked at **~2.5°** instead of the specified **9°**. The chain-reaction overlap
has to happen *between* words (`TIP_STAGGER < TIP_DURATION`), never inside one.

**Never scrub a long journey that was armed before the user scrolled.**
While the `.86s` word cascade played, a pre-existing flight ScrollTrigger was
already banking the scroll distance the user had travelled. The moment the ball
appeared it snapped forward to catch up — the "huge gap after one scroll". Fix:
the flight trigger is not created until the release tween completes, and its
`start` is the scroll position *at that moment*.

**Do not hand-roll scrub smoothing.**
An attempt to smooth progress with a `0.4s` tween retargeted on every scroll
event accumulated lag instead of removing it — the ball crawled `36px` across 24
wheel steps. GSAP's own `scrub` interpolates toward the true scroll position
rather than restarting, and must be used instead.

**A ScrollTrigger created while already at its `start` never fires `onLeaveBack`.**
This silently broke the entire upward return: the trigger stayed alive and the
ball froze. Reversal detection had to move to a persistent trigger's `onUpdate`
(`watchReversal`) comparing against a stored `launchScrollValue`.

**Two visuals that must fit exactly cannot live in different coordinate spaces.**
The dent was first drawn in the section-level overlay while the card had its own
scroll transform, producing a detached black "smile" floating above the card. The
cutout had to become a **child of the card** and derive its diameter from the
same measured `--piece-size` as the ball.

**A permanent resting transform reads as a rendering bug.**
An early version parked the words at `rotation: -8/-5/-7/-4` and `xPercent: -4`
as their idle state. It looked like broken text rather than a design. The final
version rests perfectly upright and only moves during the cascade.

**Guard callbacks inside reversible timelines.**
`sentence.call()` fires on reverse playback too, so the detach is wrapped in
`if (!sentence.reversed())`.

### Known limitation, unresolved

In the Bruz layout the period and the card's top-centre are genuinely close —
measured **~37px** horizontally and **~186px** vertically at 1440×900. The
"journey" therefore has little room to breathe, which is part of why the motion
never felt as substantial as intended. Any reuse should either place the source
and destination further apart, or add a deliberate detour path.

---

## 5. Tuning reference

| Constant | Value | Meaning |
|---|---|---|
| `TIP_DURATION` | `.26s` | how long one word takes to fall |
| `TIP_STAGGER` | `.15s` | gap between consecutive words (must be `<` tip duration) |
| tip angle | `9°`, `11°` for `BUSINESS` | peak tilt |
| tip nudge | `7px`, `10px` for `BUSINESS` | horizontal shove |
| straighten | `.5s`, `back.out(1.4)` | spring back upright, starts at `tipAt + .26 + .05` |
| detach point | `tipAt + TIP_DURATION * .75` | period breaks loose before `BUSINESS` peaks |
| release distance | `12–18px` (`1vw` clamped) | autonomous roll after detach |
| release timing | `.42s`, `power1.out` | overlaps the word settling |
| flight scrub | `.8` | ScrollTrigger smoothing |
| minimum runway | `min(520px, 55vh)` | guarantees scroll distance to the card |
| landing anchor | card top `34%` of viewport | end of the scrubbed range |
| return roll | `distance / 460`, clamped `.5–1.6s` | `power2.inOut` |
| hysteresis | `16px` | scroll reversal dead band |

Sentence timeline total duration: **1.21s**.

---

## 6. Markup

Inside `<h2 class="manifesto__title">`, replacing the plain second line:

```html
<span class="manifesto__title-line manifesto__title-line--domino" aria-label="YOU BUILD THE BUSINESS.">
  <span class="manifesto__domino-word" aria-hidden="true">YOU</span>
  <span class="manifesto__domino-word" aria-hidden="true">BUILD</span>
  <span class="manifesto__domino-word" aria-hidden="true">THE</span>
  <span class="manifesto__domino-word manifesto__domino-word--business" aria-hidden="true">BUSINESS<span class="manifesto__domino-dot"></span></span>
</span>
```

Accessibility note: the visible words are split for animation only, so the whole
line carries a single `aria-label` and every fragment is `aria-hidden`. Screen
readers get one clean sentence instead of four disconnected words.

First child of the Intelligence card, `<article class="manifesto-card manifesto-card--grow">`:

```html
<span class="manifesto-card__dent" aria-hidden="true"></span>
```

---

## 7. CSS

```css
/* --- the sentence ------------------------------------------------------- */
.manifesto__title-line--domino { display: flex; flex-wrap: wrap; align-items: baseline; column-gap: .13em; }
.manifesto__domino-word { display: inline-block; transform-origin: left bottom; will-change: transform; }
.manifesto__domino-word--business { display: inline-flex; align-items: baseline; margin-left: .22em; }
.manifesto__domino-dot { display: inline-block; align-self: flex-end; width: .16em; aspect-ratio: 1; margin: 0 0 .08em .035em; flex: 0 0 auto; border-radius: 50%; background: radial-gradient(circle at 30% 28%, var(--paper) 0 13%, currentColor 15% 100%); transform-origin: center; will-change: transform; }

/* --- the card's missing piece ------------------------------------------- */
/* Added to the destination card's own rule. `border-top: 0` is essential:
   the dent element redraws that border so the cutout can interrupt it.     */
.manifesto-card--grow {
  --card-bg: var(--blue);
  --piece-size: clamp(1.1rem, 1.65vw, 1.75rem);
  --piece-radius: calc(var(--piece-size) * .5);
  --dent-stroke: 1;
  border-top: 0;
}

/* The Intelligence card owns its missing piece. Its native top border is
   replaced by two straight segments plus the lower half of one circle. The
   same --piece-size is assigned to the traveling ball by JS, so the landing
   circle and the cutout have one geometry rather than two approximations. */
.manifesto-card__dent {
  position: absolute;
  z-index: 4;
  top: 0;
  left: 0;
  width: 100%;
  height: calc(var(--piece-radius) + 2px);
  overflow: hidden;
  background:
    linear-gradient(var(--black), var(--black)) left top / calc(50% - var(--piece-radius)) 2px no-repeat,
    linear-gradient(var(--black), var(--black)) right top / calc(50% - var(--piece-radius)) 2px no-repeat;
  pointer-events: none;
}
.manifesto-card__dent::before {
  content: "";
  position: absolute;
  top: 0;
  left: 50%;
  width: var(--piece-size);
  height: var(--piece-size);
  border: 2px solid rgba(9, 9, 9, var(--dent-stroke));
  border-radius: 50%;
  background: var(--paper);
  transform: translate(-50%, -50%);
}

/* --- the traveling ball -------------------------------------------------- */
/* The FX layer contains only the one traveling ball. The missing piece itself
   belongs to the Intelligence card, so it inherits the card's movement. */
.manifesto__fx { position: absolute; z-index: 5; inset: 0; overflow: visible; pointer-events: none; }
.manifesto__ball {
  position: absolute;
  top: 0;
  left: 0;
  width: 1rem;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 28%, var(--paper) 0 13%, var(--blue) 15% 100%);
  opacity: 0;
  visibility: hidden;
  will-change: transform, opacity;
}
```

The overlay deliberately sits **outside** the card. Cards use `overflow: hidden`,
which would clip both the ball and the border-covering dent. Both card
pseudo-elements were already occupied (`::before` = giant ghost letter,
`::after` = grid texture), which is why the dent is a real element.

---

## 8. JavaScript

Verbatim, as it ran inside `initManifesto()` in `app.js`.

**Requires from the enclosing scope:**

- `gsap` and `ScrollTrigger` (registered; built against GSAP `3.13.0`, core only —
  no paid plugins)
- `select(selector, scope)` / `selectAll(selector, scope)` helpers
- `section` — the `.manifesto` element, which must be `position: relative`
- an early return for `prefersReducedMotion` and for a missing ScrollTrigger

**Element references collected before the block:**

```js
const dominoWords = selectAll('.manifesto__domino-word', section);
const dominoDot   = select('.manifesto__domino-dot', section);
const dominoLine  = select('.manifesto__title-line--domino', section);
const productCard = select('.manifesto-card--grow', section);
const productDent = productCard ? select('.manifesto-card__dent', productCard) : null;
```

```js
if (dominoWords.length) {
  // The sentence sits upright at rest. Its only movement is the cascade
  // below, so nothing can leave the words parked at an odd angle.
  gsap.set(dominoWords, { rotation: 0, x: 0, xPercent: 0, transformOrigin: 'left bottom' });
  if (dominoDot) gsap.set(dominoDot, { x: 0, y: 0, rotation: 0 });

  // Assigned once the traveling-ball layer is built below. Resolved at
  // playback time, so setup order does not matter.
  let detachBall = () => {};

  // One timeline owns every word, and one ScrollTrigger plays or reverses
  // it. A single timeline cannot fight itself, so direction changes and
  // scroll jitter are resolved by GSAP's playhead instead of by flags.
  const TIP_DURATION = .26;
  const TIP_STAGGER = .15;
  const sentence = gsap.timeline({ paused: true });
  dominoWords.forEach((word, index) => {
    const tipAt = index * TIP_STAGGER;
    const isBusiness = word.classList.contains('manifesto__domino-word--business');
    sentence
      // Tip into the next word, pivoting on the bottom-left corner.
      .to(word, {
        rotation: isBusiness ? 11 : 9,
        x: isBusiness ? 10 : 7,
        duration: TIP_DURATION,
        ease: 'power2.in'
      }, tipAt)
      // Straighten only after this word's own tip has completed. The chain
      // reaction comes from the next word starting while this one is still
      // falling (stagger < tip duration), not from clipping the tip short.
      .to(word, {
        rotation: 0,
        x: 0,
        duration: .5,
        ease: 'back.out(1.4)'
      }, tipAt + TIP_DURATION + .05);

    if (isBusiness) {
      sentence.call(() => {
        // Reverse playback crosses this point too, but the period should
        // only break loose on the way forward.
        if (!sentence.reversed()) detachBall();
      }, [], tipAt + TIP_DURATION * .75);
    }
  });

  window.ScrollTrigger.create({
    trigger: dominoLine || '.manifesto__title-line--domino',
    // Starts after the heading's own entrance has finished, so the cascade
    // is never mixed with the fade/slide that introduces the line.
    start: 'top 72%',
    end: 'bottom 20%',
    animation: sentence,
    toggleActions: 'play none none reverse'
  });

  // Droplet absorption: the period detaches as a ball, runs horizontally,
  // dips into the blue PRODUCT card and remains visible as the plug inside
  // its permanent dent. This single scrub-reversible timeline is anchored
  // to the card, so scrolling back up breaks the ball free and carries it
  // home along the same two-leg path.
  if (dominoDot && dominoLine && productCard && productDent) {
    const existingFx = select('.manifesto__fx', section);
    if (existingFx) existingFx.remove();

    const fx = document.createElement('div');
    fx.className = 'manifesto__fx';
    fx.setAttribute('aria-hidden', 'true');
    const ball = document.createElement('span');
    ball.className = 'manifesto__ball';
    fx.appendChild(ball);
    section.appendChild(fx);

    // offsetLeft/offsetTop ignore CSS transforms, so these measurements are
    // stable even while the knock or the cards' entrance is mid-animation.
    const offsetWithin = (el, ancestor) => {
      let x = 0;
      let y = 0;
      let node = el;
      while (node && node !== ancestor) {
        x += node.offsetLeft;
        y += node.offsetTop;
        node = node.offsetParent;
        if (node === document.body) break;
      }
      return { x, y };
    };

    const geo = () => {
      const dotPos = offsetWithin(dominoDot, section);
      const cardPos = offsetWithin(productCard, section);
      const size = Math.max(dominoDot.getBoundingClientRect().width, 10);
      return {
        size,
        homeX: dotPos.x,
        homeY: dotPos.y,
        cardCenterX: cardPos.x + productCard.offsetWidth / 2,
        cardTopY: cardPos.y
      };
    };
    const pieceSize = () => geo().size;

    // One measured diameter owns both visuals: the moving ball and the
    // card's clipped circular cutout. Refresh keeps them identical after
    // responsive reflow or font loading.
    const layoutFx = () => {
      const size = pieceSize();
      ball.style.width = size + 'px';
      ball.style.height = size + 'px';
      productCard.style.setProperty('--piece-size', size + 'px');
      productCard.style.setProperty('--piece-radius', (size / 2) + 'px');
    };
    layoutFx();

    // A real ball turns once per circumference travelled. Every rotation in
    // this interaction is derived from distance, which is what makes the
    // motion read as rolling instead of sliding — in both directions.
    const rollFor = (distance) => (distance / (Math.PI * pieceSize())) * 360;

    const launch = { x: geo().homeX, y: geo().homeY, rotation: 0 };
    let flightTimeline = null;
    let flightTrigger = null;
    let breakawayTween = null;
    let homeRollTween = null;
    let detached = false;
    let returning = false;
    let releaseScroll = null;
    let launchScrollValue = null;

    // Unlike offsetLeft/offsetTop, this captures the dot after BUSINESS has
    // been translated/rotated. The proxy therefore appears on the exact
    // rendered pixel occupied by the attached dot at the handoff frame.
    const visualDotPosition = () => {
      const sectionRect = section.getBoundingClientRect();
      const dotRect = dominoDot.getBoundingClientRect();
      return {
        x: dotRect.left - sectionRect.left,
        y: dotRect.top - sectionRect.top
      };
    };
    const landingScrollFor = (launchScroll) => {
      const sectionTop = window.scrollY + section.getBoundingClientRect().top;
      const cardTop = sectionTop + offsetWithin(productCard, section).y;
      const naturalLanding = cardTop - window.innerHeight * .34;
      const minimumRunway = Math.min(520, window.innerHeight * .55);
      return Math.max(naturalLanding, launchScroll + minimumRunway);
    };
    const stopFlight = () => {
      const trigger = flightTrigger;
      const timeline = flightTimeline;
      flightTrigger = null;
      flightTimeline = null;
      launchScrollValue = null;
      if (trigger) trigger.kill(false);
      if (timeline) timeline.kill();
    };
    // Used only when the whole section is out of view, where an instant
    // restore cannot be seen. Anything visible rolls instead.
    const hardReset = () => {
      if (!detached && !breakawayTween && !flightTrigger && !homeRollTween) return;
      if (breakawayTween) breakawayTween.kill();
      breakawayTween = null;
      if (homeRollTween) homeRollTween.kill();
      homeRollTween = null;
      stopFlight();
      detached = false;
      returning = false;
      releaseScroll = null;
      const home = visualDotPosition();
      gsap.set(ball, { x: home.x, y: home.y, rotation: 0, autoAlpha: 0 });
      gsap.set(dominoDot, { autoAlpha: 1 });
      gsap.set(productCard, { '--dent-stroke': 1 });
    };

    // The upward gesture's whole point is the ball rolling back. It keeps
    // ownership of its own motion here: scroll no longer drives it, it rolls
    // the entire remaining distance home and turns once per circumference.
    const rollBallHome = () => {
      if (returning) return;
      if (!detached && !breakawayTween) return;
      if (breakawayTween) breakawayTween.kill();
      breakawayTween = null;
      stopFlight();
      returning = true;
      releaseScroll = null;
      gsap.to(productCard, { '--dent-stroke': 1, duration: .25, ease: 'none' });

      const currentX = Number(gsap.getProperty(ball, 'x'));
      const currentY = Number(gsap.getProperty(ball, 'y'));
      const currentRotation = Number(gsap.getProperty(ball, 'rotation'));
      const home = visualDotPosition();
      const distance = Math.hypot(home.x - currentX, home.y - currentY);

      homeRollTween = gsap.to(ball, {
        x: home.x,
        y: home.y,
        // Negative: rolling back the way it came, unwinding every turn.
        rotation: currentRotation - rollFor(distance),
        duration: Math.min(1.6, Math.max(.5, distance / 460)),
        ease: 'power2.inOut',
        overwrite: 'auto',
        onComplete: () => {
          homeRollTween = null;
          returning = false;
          detached = false;
          // Re-measure at the swap frame: the words may have finished
          // re-leaning after this roll began, which moves the socket.
          const socket = visualDotPosition();
          gsap.set(ball, { x: socket.x, y: socket.y, rotation: 0, autoAlpha: 0 });
          gsap.set(dominoDot, { autoAlpha: 1 });
        }
      });
    };
    // The persistent watcher below owns reversal detection. A ScrollTrigger
    // created while the page is already at its start never registers an
    // enter, so its onLeaveBack cannot be relied on for the return.
    const watchReversal = () => {
      if (returning) return;
      const scroll = window.scrollY;
      // Reversing before the release finishes ends in a roll home, so a
      // pending flight is never armed behind the user's back.
      if (breakawayTween && releaseScroll !== null && scroll < releaseScroll - 16) {
        rollBallHome();
        return;
      }
      if (detached && launchScrollValue !== null && scroll < launchScrollValue - 16) {
        rollBallHome();
      }
    };

    const armScrollFlight = () => {
      if (!detached) return;
      stopFlight();
      layoutFx();
      launch.x = Number(gsap.getProperty(ball, 'x'));
      launch.y = Number(gsap.getProperty(ball, 'y'));
      launch.rotation = Number(gsap.getProperty(ball, 'rotation'));
      const launchScroll = window.scrollY;
      launchScrollValue = launchScroll;

      flightTimeline = gsap.timeline({ paused: true })
        .fromTo(ball,
          {
            x: () => launch.x,
            y: () => launch.y,
            scale: 1,
            rotation: () => launch.rotation
          },
          {
            x: () => geo().cardCenterX - pieceSize() / 2,
            y: () => launch.y,
            scale: 1,
            // Hundreds of pixels of travel means many full turns. Reversing
            // this leg by scrolling up unwinds every one of them.
            rotation: () => launch.rotation +
              rollFor(Math.abs((geo().cardCenterX - pieceSize() / 2) - launch.x)),
            duration: .62,
            ease: 'power1.inOut'
          }, 0)
        .to(ball, {
          y: () => geo().cardTopY - pieceSize() / 2,
          scale: 1,
          rotation: () => '+=' +
            (rollFor(Math.abs((geo().cardTopY - pieceSize() / 2) - launch.y)) * .6),
          duration: .38,
          ease: 'power2.inOut'
        }, '>')
        .to(productCard, {
          '--dent-stroke': 0,
          duration: .08,
          ease: 'none'
        }, .92);

      // Native scrub does the smoothing. Hand-rolled per-event tweens
      // accumulate lag under fast wheel input; ScrollTrigger interpolates
      // toward the true scroll position instead of restarting each time.
      flightTrigger = window.ScrollTrigger.create({
        animation: flightTimeline,
        trigger: section,
        start: launchScroll,
        end: () => landingScrollFor(launchScroll),
        scrub: .8,
        invalidateOnRefresh: true,
        onRefresh: layoutFx,
        // Scrolling up first unwinds the entire flight through scrub, then
        // this hands the last stretch to the autonomous roll home.
        onLeaveBack: rollBallHome
      });
    };

    // Watches only for a reversal during the brief release window. The
    // flight itself is owned by its own scrubbed trigger.
    window.ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: watchReversal,
      onLeaveBack: hardReset,
      onRefresh: layoutFx
    });

    detachBall = () => {
      if (detached || returning) return;
      detached = true;
      stopFlight();
      if (homeRollTween) homeRollTween.kill();
      homeRollTween = null;
      if (breakawayTween) breakawayTween.kill();
      layoutFx();
      releaseScroll = window.scrollY;
      const start = visualDotPosition();
      const momentum = Math.min(18, Math.max(12, window.innerWidth * .01));
      const rollDegrees = rollFor(momentum);

      gsap.set(ball, {
        x: start.x,
        y: start.y,
        scale: 1,
        rotation: 0,
        autoAlpha: 1
      });
      gsap.set(dominoDot, { autoAlpha: 0 });
      breakawayTween = gsap.to(ball, {
        x: start.x + momentum,
        y: start.y + 2,
        rotation: rollDegrees,
        duration: .42,
        ease: 'power1.out',
        overwrite: 'auto',
        onComplete: () => {
          breakawayTween = null;
          releaseScroll = null;
          armScrollFlight();
        }
      });
    };
  }
}
```

---

## 9. Reinstatement checklist

1. Add the two markup blocks from section 6.
2. Add the CSS from section 7. Confirm the destination card gets `border-top: 0`
   and that its ancestor section is `position: relative`.
3. Collect the five element references, then paste the JS from section 8 inside a
   scope that has `gsap`, `ScrollTrigger`, `select`/`selectAll`, and `section`.
4. Bump any asset cache key so the browser picks the change up.
5. Re-verify numerically, not by eye — the failure modes here are all silent:
   - exactly one visible ball on every frame
   - handoff gap < 1px
   - ball diameter == `--piece-size`
   - ball centre X == card centre X, ball centre Y == card top
   - zero detached notch elements
   - forward peak tilt per word ≈ `9°` / `11°`, settling to `0°`
   - reverse plays and returns to progress `0` with all words at `0°`

Last verified in Chromium at 1440×900: alignment error `0.003px` horizontal,
`0.2px` vertical, diameter delta `0.006px`, no console errors.

---

## 10. Measurement snippet

Useful for re-checking a revived version quickly:

```js
(() => {
  const section = document.querySelector('.manifesto');
  const ball = document.querySelector('.manifesto__ball');
  const dot = document.querySelector('.manifesto__domino-dot');
  const card = document.querySelector('.manifesto-card--grow');
  const b = ball.getBoundingClientRect();
  const c = card.getBoundingClientRect();
  const seen = (el) => {
    const s = getComputedStyle(el);
    return s.visibility !== 'hidden' && Number(s.opacity) > .01;
  };
  const piece = parseFloat(getComputedStyle(card).getPropertyValue('--piece-size'));
  return {
    visibleBalls: Number(seen(ball)) + Number(seen(dot)),
    centerDeltaX: +((b.left + b.width / 2) - (c.left + c.width / 2)).toFixed(3),
    centerDeltaY: +((b.top + b.height / 2) - c.top).toFixed(3),
    diameterDelta: +(b.width - piece).toFixed(3),
    detachedNotches: document.querySelectorAll('.manifesto__notch').length,
    words: [...document.querySelectorAll('.manifesto__domino-word')].map((w) => {
      const m = new DOMMatrix(getComputedStyle(w).transform);
      return +(Math.atan2(m.b, m.a) * 180 / Math.PI).toFixed(2);
    })
  };
})();
```
