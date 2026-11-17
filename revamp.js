(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ═══ SCROLL REVEAL ═══ */
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const targets = [...document.querySelectorAll('.scene-head, .tib-intro__head > *, .case-row, .case-copy, .case-visual, .product-explorer, .crew__head > *, .crew__card, .press__cta > *, .press-foot__dir, .person, .content-card, .detail-list li, .case-method li')];
    targets.forEach((el, i) => { el.dataset.reveal = i % 3 === 0 ? 'soft' : ''; });
    document.documentElement.classList.add('motion-ready');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(el => obs.observe(el));
  }

  /* ═══ CASE VISUAL ANIMATION ═══ */
  const caseVisual = document.querySelector('.case-visual');
  if (caseVisual && !reduceMotion && 'IntersectionObserver' in window) {
    caseVisual.classList.add('is-animating');
    const cvObs = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting)) return;
      caseVisual.classList.add('is-active');
      cvObs.disconnect();
    }, { threshold: 0.35 });
    cvObs.observe(caseVisual);
  }

  /* ═══ HERO ORBIT ═══ */
  const hero = document.querySelector('.hero');
  if (hero && window.gsap && window.ScrollTrigger) initOrbit(hero);
  // Created after the orbit so its pin spacer exists when these triggers measure the page.
  if (window.gsap && window.ScrollTrigger) initScenes();

  /* ═══ SCROLL SCENES: tilted cards settle, photos rise, footer capsule lifts ═══ */
  function initScenes() {
    const { gsap } = window;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.utils.toArray('.tib-card').forEach((card, i) => {
        const side = i % 2 ? 1 : -1;
        gsap.fromTo(card,
          { y: 140, rotation: side * 5, rotationX: 22, transformPerspective: 1200, transformOrigin: '50% 100%' },
          { y: 0, rotation: side * 0.6, rotationX: 0, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'top 55%', scrub: 0.8 } });
      });
      const glow = document.querySelector('.tib-stage__glow');
      if (glow) gsap.fromTo(glow, { scale: 0.7, autoAlpha: 0.25 }, { scale: 1.1, autoAlpha: 1, ease: 'none', scrollTrigger: { trigger: '.tib-stage', start: 'top bottom', end: 'center center', scrub: true } });

      const crew = document.querySelector('.crew__stage');
      if (crew) {
        gsap.fromTo('.crew__photo', { y: 120 }, { y: 0, ease: 'none', stagger: 0.08, scrollTrigger: { trigger: crew, start: 'top bottom', end: 'center center', scrub: 0.8 } });
        gsap.fromTo('.crew__word', { xPercent: -42 }, { xPercent: -58, ease: 'none', scrollTrigger: { trigger: crew, start: 'top bottom', end: 'bottom top', scrub: true } });
      }

      const capsule = document.querySelector('.press-foot__capsule');
      if (capsule) {
        const foot = capsule.closest('footer');
        gsap.fromTo(capsule, { yPercent: 45 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: foot, start: 'top bottom', end: 'bottom bottom', scrub: 0.8 } });
        gsap.fromTo('.press-foot__glow', { scale: 0.6, autoAlpha: 0.3 }, { scale: 1, autoAlpha: 1, ease: 'none', scrollTrigger: { trigger: foot, start: 'top bottom', end: 'bottom bottom', scrub: true } });
      }
    });
  }

  function initOrbit(section) {
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);

    const pin = section.querySelector('.hero-pin');
    const ring = section.querySelector('.hero-orbit-line');
    const mark = section.querySelector('.hero-mark');
    const markFace = section.querySelector('.hero-mark__face');
    const markRing = section.querySelector('.hero-mark__ring');
    const halo = section.querySelector('.hero-halo');
    const cardList = section.querySelector('.glass-ring');
    const cards = gsap.utils.toArray('.glass-card', section);
    const ticks = gsap.utils.toArray('.hero-progress i', section);
    const progress = section.querySelector('.hero-progress');
    const detail = section.querySelector('.hero-detail');
    const detailBody = section.querySelector('.hero-detail__body');
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
      fields.desc.textContent = card.querySelector('.glass-card__desc').textContent;
      fields.tags.replaceChildren(...card.dataset.tags.split('|').map(tag => {
        const li = document.createElement('li');
        li.textContent = tag;
        return li;
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
        cards.forEach((c, i) => c.classList.toggle('is-front', i === index));
        ticks.forEach((t, i) => t.classList.toggle('is-active', i === index));
        fillDetail(index);
        if (!animate) return;
        gsap.fromTo(detailBody, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out', overwrite: true });
        gsap.fromTo(markFace, { scale: 0.93 }, { scale: 1, duration: 0.6, ease: 'back.out(2.2)', overwrite: true });
      };

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

      const INTRO = 0.14;
      const snaps = [0, ...cards.map((_, i) => INTRO + (i * (1 - INTRO)) / (count - 1))];
      gsap.set([ring, mark], { xPercent: -50, yPercent: -50, x: 0, y: 0 });

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
          snap: { snapTo: snaps, inertia: false, duration: { min: 0.2, max: 0.6 }, delay: 0.1, ease: 'power1.inOut' },
        },
      });
      tl.to(section.querySelectorAll('.hero-content, .hero-aside'), { autoAlpha: 0, y: -48, duration: INTRO }, 0)
        .fromTo(detail, { autoAlpha: 0, y: 32 }, { autoAlpha: 1, y: 0, duration: INTRO * 0.75 }, INTRO * 0.35)
        .fromTo(progress, { autoAlpha: 0 }, { autoAlpha: 1, duration: INTRO * 0.75 }, INTRO * 0.35)
        .to(state, { turn: count - 1, duration: 1 - INTRO, onUpdate: render }, INTRO)
        .to(markRing, { rotation: 300, duration: 1 }, 0)
        .to(halo, { scale: 1.3, opacity: 0.7, duration: 1, ease: 'power1.inOut' }, 0);

      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from(section.querySelectorAll('.hero-content > *, .hero-aside > *'), { y: 28, autoAlpha: 0, duration: 0.8, stagger: 0.08 })
        .from(mark, { scale: 0.7, autoAlpha: 0, duration: 1 }, 0.1)
        .from(ring, { scale: 0.6, autoAlpha: 0, duration: 1.1 }, 0.15)
        .from(cardList, { scale: 0.55, autoAlpha: 0, duration: 1.1 }, 0.25)
        .from(halo, { scale: 0.4, autoAlpha: 0, duration: 1.4 }, 0.1)
        .from(section.querySelector('.hero-foot'), { autoAlpha: 0, duration: 0.6 }, 0.6);

      return () => {
        gsap.set(cards, { clearProps: 'transform,opacity,filter,zIndex,visibility' });
        section.classList.remove('is-live');
        setActive(0, false);
      };
    });

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  /* ═══ LINK SCRAMBLE: letters shuffle and resolve on hover ═══ */
  if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    const glyphs = '!<>-_/[]{}=+*^?#%&$@';
    document.querySelectorAll('[data-scramble]').forEach(el => {
      const text = el.textContent;
      let frame = 0;
      // Screen readers keep the real label while the visible letters shuffle.
      if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', text.replace(/[⟶↗↑→]/g, '').trim());
      el.addEventListener('mouseenter', () => {
        cancelAnimationFrame(frame);
        const start = performance.now();
        const tick = now => {
          const k = Math.min(1, (now - start) / 450);
          const shown = Math.floor(k * text.length);
          el.textContent = [...text].map((ch, i) => (i < shown || ch === ' ' ? ch : glyphs[(Math.random() * glyphs.length) | 0])).join('');
          if (k < 1) frame = requestAnimationFrame(tick);
          else el.textContent = text;
        };
        frame = requestAnimationFrame(tick);
      });
    });
  }

  /* ═══ STICKY HEADER ═══ */
  const header = document.querySelector('.site-header');
  if (header) {
    let lastY = window.scrollY;
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (Math.abs(y - lastY) > 5) {
          header.classList.toggle('header--hidden', y > lastY && y > 120);
          lastY = y;
        }
        ticking = false;
      });
      ticking = true;
    }, { passive: true });
  }

  /* ═══ MOBILE MENU ═══ */
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
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
    nav.addEventListener('click', e => { if (e.target.closest('a')) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    window.matchMedia('(min-width: 681px)').addEventListener('change', close);
  }

  /* ═══ PRODUCT TABS ═══ */
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const selectTab = tab => {
    tabs.forEach(t => {
      const sel = t === tab;
      t.setAttribute('aria-selected', String(sel));
      t.tabIndex = sel ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !sel;
    });
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', e => {
      let next;
      if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      e.preventDefault();
      selectTab(tabs[next]);
      tabs[next].focus();
    });
  });

  /* ═══ BRIEF FORM (localhost only) ═══ */
  const briefForm = document.querySelector('[data-brief-form]');
  const isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
  if (briefForm && isLocal) {
    briefForm.addEventListener('submit', e => {
      e.preventDefault();
      const d = new FormData(briefForm);
      const name = String(d.get('name') || '').trim();
      const subject = `Project brief from ${name || 'Bruz Digital website'}`;
      const body = [
        `Name: ${name}`,
        `Email: ${String(d.get('email') || '').trim()}`,
        `Challenge: ${String(d.get('challenge') || '').trim()}`,
        `Timeline: ${String(d.get('timeline') || '').trim()}`,
        '',
        String(d.get('context') || '').trim(),
      ].join('\n');
      window.location.href = `mailto:hello@bruzdigital.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }
})();
