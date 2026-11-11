(() => {
  const labVisual = document.querySelector('.lab-visual');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const revealTargets = [...document.querySelectorAll('.section-head, .pathway, .case-layout, .product-explorer, .person, .content-card, .detail-list li, .case-method li, .cta-band > *, .footer-directory, .footer-wordmark')];
    revealTargets.forEach((target, index) => {
      target.dataset.reveal = index % 3 === 0 ? 'soft' : '';
    });
    document.documentElement.classList.add('motion-ready');
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealTargets.forEach(target => revealObserver.observe(target));
  }
  /* ---- System Lab: play the schematic → product UI sequence when it scrolls into view ---- */
  if (labVisual && !reduceMotion && 'IntersectionObserver' in window) {
    labVisual.classList.add('is-animating');
    const labObserver = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      labVisual.classList.add('is-active');
      labObserver.disconnect();
    }, { threshold: 0.35 });
    labObserver.observe(labVisual);
  }

  /* ---- Orbit hero: cards circle the Bruz mark as the pinned hero is scrolled ---- */
  const orbit = document.querySelector('.orbit-hero');
  if (orbit && window.gsap && window.ScrollTrigger) initOrbit(orbit);

  function initOrbit(section) {
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);

    const pin = section.querySelector('.orbit-pin');
    const ring = section.querySelector('.orbit-ring');
    const core = section.querySelector('.orbit-core');
    const coreMark = section.querySelector('.orbit-core__mark');
    const coreSpin = section.querySelector('.orbit-core__spin');
    const watermark = section.querySelector('.orbit-watermark');
    const cardList = section.querySelector('.orbit-cards');
    const cards = gsap.utils.toArray('.orbit-card', section);
    const ticks = gsap.utils.toArray('.orbit-progress i', section);
    const progress = section.querySelector('.orbit-progress');
    const detail = section.querySelector('.orbit-detail');
    const detailBody = section.querySelector('.orbit-detail__body');
    const field = name => section.querySelector(`[data-detail="${name}"]`);
    const fields = { num: field('num'), kind: field('kind'), title: field('title'), desc: field('desc'), tags: field('tags') };
    const count = cards.length;
    const step = (Math.PI * 2) / count;
    if (!pin || !ring || !detail || count < 2) return;

    const fillDetail = index => {
      const card = cards[index];
      fields.num.textContent = String(index + 1).padStart(2, '0');
      fields.kind.textContent = card.dataset.kind;
      fields.title.textContent = card.querySelector('strong').textContent;
      fields.desc.textContent = card.querySelector('.orbit-card__desc').textContent;
      fields.tags.replaceChildren(...card.dataset.tags.split('|').map(tag => {
        const item = document.createElement('li');
        item.textContent = tag;
        return item;
      }));
    };

    const mm = gsap.matchMedia();
    mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
      section.classList.add('is-live');
      const state = { turn: 0 };
      let radiusX = 0;
      let radiusY = 0;
      let active = 0;

      const measure = () => {
        radiusX = ring.offsetWidth / 2;
        radiusY = ring.offsetHeight / 2;
      };

      const setActive = (index, animate) => {
        active = index;
        cards.forEach((card, i) => card.classList.toggle('is-front', i === index));
        ticks.forEach((tick, i) => tick.classList.toggle('is-active', i === index));
        fillDetail(index);
        if (!animate) return;
        gsap.fromTo(detailBody, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out', overwrite: true });
        gsap.fromTo(coreMark, { scale: 0.93 }, { scale: 1, duration: 0.6, ease: 'back.out(2.2)', overwrite: true });
      };

      // Angle π/2 is the bottom of the ellipse: the point nearest the viewer.
      const render = () => {
        cards.forEach((card, i) => {
          const angle = Math.PI / 2 + (i - state.turn) * step;
          const depth = (Math.sin(angle) + 1) / 2;
          gsap.set(card, {
            x: Math.cos(angle) * radiusX,
            y: Math.sin(angle) * radiusY,
            xPercent: -50,
            yPercent: -50,
            scale: 0.66 + 0.44 * depth,
            opacity: 0.32 + 0.68 * depth,
            filter: `blur(${((1 - depth) * 1.6).toFixed(2)}px)`,
            zIndex: Math.round(depth * 100),
          });
        });
        const front = Math.min(count - 1, Math.max(0, Math.round(state.turn)));
        if (front !== active) setActive(front, true);
      };

      measure();
      setActive(0, false);
      render();

      // Timeline: 0 → INTRO swaps the headline for the detail panel, INTRO → 1 turns the orbit.
      const INTRO = 0.14;
      const snaps = [0, ...cards.map((_, i) => INTRO + (i * (1 - INTRO)) / (count - 1))];
      gsap.set([ring, core, watermark], { xPercent: -50, yPercent: -50, x: 0, y: 0 });
      gsap.set(watermark, { yPercent: -30 });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          pin,
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * 5.4)}`,
          scrub: 0.7,
          invalidateOnRefresh: true,
          onRefresh: () => { measure(); render(); },
          // inertia: false snaps to the nearest card; velocity-based snapping skipped cards on quick flicks.
          snap: { snapTo: snaps, inertia: false, duration: { min: 0.2, max: 0.6 }, delay: 0.1, ease: 'power1.inOut' },
        },
      });
      tl.to(section.querySelectorAll('.orbit-copy, .orbit-aside'), { autoAlpha: 0, y: -48, duration: INTRO }, 0)
        .fromTo(detail, { autoAlpha: 0, y: 32 }, { autoAlpha: 1, y: 0, duration: INTRO * 0.75 }, INTRO * 0.35)
        .fromTo(progress, { autoAlpha: 0 }, { autoAlpha: 1, duration: INTRO * 0.75 }, INTRO * 0.35)
        .to(state, { turn: count - 1, duration: 1 - INTRO, onUpdate: render }, INTRO)
        .to(coreSpin, { rotation: 300, duration: 1 }, 0)
        .to(watermark, { x: () => -window.innerWidth * 0.08, duration: 1 }, 0);

      // One-off entrance on page load; targets differ from the scrubbed ones so they never fight.
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from(section.querySelectorAll('.orbit-copy > *, .orbit-aside > *'), { y: 28, autoAlpha: 0, duration: 0.8, stagger: 0.08 })
        .from(core, { scale: 0.7, autoAlpha: 0, duration: 1 }, 0.1)
        .from(ring, { scale: 0.6, autoAlpha: 0, duration: 1.1 }, 0.15)
        .from(cardList, { scale: 0.55, autoAlpha: 0, duration: 1.1 }, 0.25)
        .from(section.querySelector('.orbit-foot'), { autoAlpha: 0, duration: 0.6 }, 0.6);

      return () => {
        // Per-frame gsap.set calls run in callbacks, outside this context, so clear them by hand.
        gsap.set(cards, { clearProps: 'transform,opacity,filter,zIndex,visibility' });
        section.classList.remove('is-live');
        setActive(0, false);
      };
    });

    // Fonts change card widths and headline height; re-measure once they settle.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');

  /* ---- Sticky header: hide on scroll down, show on scroll up ---- */
  const header = document.querySelector('.site-header');
  if (header) {
    let lastY = window.scrollY;
    let ticking = false;
    const threshold = 5;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentY = window.scrollY;
          if (Math.abs(currentY - lastY) > threshold) {
            if (currentY > lastY && currentY > 120) {
              header.classList.add('header--hidden');
            } else {
              header.classList.remove('header--hidden');
            }
            lastY = currentY;
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  if (toggle && nav) {
    const close = () => {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = 'Menu';
      nav.classList.remove('is-open');
    };
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Close' : 'Menu';
      nav.classList.toggle('is-open', open);
    });
    nav.addEventListener('click', event => {
      if (event.target.closest('a')) close();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') close();
    });
    window.matchMedia('(min-width: 681px)').addEventListener('change', close);
  }

  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const selectTab = tab => {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(item.getAttribute('aria-controls'));
      if (panel) panel.hidden = !selected;
    });
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let nextIndex;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = tabs.length - 1;
      if (nextIndex === undefined) return;
      event.preventDefault();
      selectTab(tabs[nextIndex]);
      tabs[nextIndex].focus();
    });
  });

  const briefForm = document.querySelector('[data-brief-form]');
  const localPreview = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
  if (briefForm && localPreview) {
    briefForm.addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(briefForm);
      const name = String(data.get('name') || '').trim();
      const subject = `Project brief from ${name || 'Bruz Digital website'}`;
      const body = [
        `Name: ${name}`,
        `Email: ${String(data.get('email') || '').trim()}`,
        `Challenge: ${String(data.get('challenge') || '').trim()}`,
        `Timeline: ${String(data.get('timeline') || '').trim()}`,
        '',
        String(data.get('context') || '').trim()
      ].join('\n');
      window.location.href = `mailto:hello@bruzdigital.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }
})();
