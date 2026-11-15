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

  /* ---- Orbit hero: scroll story around the Bruz mark ----
     Scroll progress p (0..1) through the 540vh section drives every layer:
       0.02–0.14 intro copy leaves, ring opens   0.12–0.84 six cards turn past the front
       0.84–0.97 ring closes into a halo          0.88–0.98 finale copy arrives            */
  const orbit = document.querySelector('.orbit-hero');
  if (orbit) initOrbit(orbit);

  function initOrbit(section) {
    const stage = section.querySelector('[data-orbit-stage]');
    const q = sel => section.querySelector(sel);
    const intro = q('.orbit-intro'), side = q('.orbit-side'), mark = q('.orbit-mark');
    const glow = q('.orbit-glow'), halo = q('.orbit-halo'), bigword = q('.orbit-bigword');
    const detail = q('.orbit-detail'), ticksEl = q('.orbit-ticks'), finale = q('.orbit-finale');
    const pathBack = q('[data-orbit-path="back"]'), pathFront = q('[data-orbit-path="front"]');
    const lines = [...section.querySelectorAll('.orbit-line')];
    const dial = q('[data-orbit-dial]'), label = q('[data-orbit-label]');
    const field = name => q(`[data-detail="${name}"]`);
    const orbs = [...section.querySelectorAll('.orb')].map(el => ({ el, w: 0, h: 0 }));
    const ticks = [...section.querySelectorAll('.orbit-ticks i')];
    const N = orbs.length;
    if (!stage || !mark || N < 2) return;

    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const smooth = t => t * t * (3 - 2 * t);
    const lerp = (a, b, t) => a + (b - a) * t;
    const seg = (p, a, b) => clamp((p - a) / (b - a));
    // Rotation that eases into each card and lingers while it faces front.
    const stepped = t => {
      const s = t * (N - 1), f = s - Math.floor(s);
      return (Math.floor(s) + f - Math.sin(2 * Math.PI * f) / (2 * Math.PI)) / (N - 1);
    };

    section.classList.add('is-live');

    let W = 0, H = 0, S = 0, baseY = 0, raisedY = 0, mobile = false;
    let target = 0, prog = 0, mx = 0, my = 0, tmx = 0, tmy = 0;
    let active = -1, running = false, visible = true, swapTimer = 0;

    const measure = () => {
      W = stage.clientWidth;
      H = stage.clientHeight;
      mobile = W <= 900;
      if (mobile) {
        side.style.top = `${intro.offsetTop + intro.offsetHeight + 18}px`;
        const sideBottom = side.offsetTop + side.offsetHeight;
        S = Math.max(140, Math.min(W * 0.56, H * 0.34));
        baseY = Math.max(H * 0.68, sideBottom + S / 2 + 20);
        raisedY = baseY;
      } else {
        side.style.top = '';
        S = Math.min(H * 0.4, W * 0.27);
        // Starts low under the headline, rises as the intro copy leaves so the ring clears the detail panel.
        baseY = H * 0.56;
        raisedY = H * 0.46;
      }
      mark.style.setProperty('--mark', `${S.toFixed(1)}px`);
      lines.forEach(svg => svg.setAttribute('viewBox', `0 0 ${W} ${H}`));
      orbs.forEach(o => { o.w = o.el.offsetWidth; o.h = o.el.offsetHeight; });
    };

    const readScroll = () => {
      const span = Math.max(1, section.offsetHeight - H);
      target = clamp(-section.getBoundingClientRect().top / span);
    };

    const fillDetail = index => {
      const card = orbs[index].el.dataset;
      field('num').textContent = String(index + 1).padStart(2, '0');
      field('kind').textContent = card.kind;
      const accent = document.createElement('em');
      accent.textContent = card.accent;
      field('title').replaceChildren(`${card.title} `, accent);
      field('text').textContent = card.text;
      field('tags').replaceChildren(...card.tags.split('|').map(tag => {
        const chip = document.createElement('span');
        chip.textContent = tag;
        return chip;
      }));
      field('body').classList.remove('is-out');
    };

    const setActive = index => {
      if (index === active) return;
      const first = active === -1;
      active = index;
      orbs.forEach((o, i) => o.el.classList.toggle('is-on', i === index));
      ticks.forEach((t, i) => t.classList.toggle('is-on', i === index));
      if (first) { fillDetail(index); return; }
      field('body').classList.add('is-out');
      clearTimeout(swapTimer);
      swapTimer = setTimeout(() => fillDetail(active), 260);
    };

    const fade = (el, k, dy) => {
      el.style.opacity = k.toFixed(3);
      el.style.transform = `translateY(${dy.toFixed(1)}px)`;
      el.style.pointerEvents = k > 0.5 ? 'auto' : 'none';
    };

    const render = now => {
      prog += (target - prog) * (reduceMotion ? 1 : 0.09);
      if (Math.abs(target - prog) < 1e-5) prog = target;
      mx += (tmx - mx) * 0.06;
      my += (tmy - my) * 0.06;
      const p = prog;
      const kIn = smooth(seg(p, 0.02, 0.14));
      const kOrbit = seg(p, 0.12, 0.84);
      const kOut = smooth(seg(p, 0.84, 0.97));
      const kDet = smooth(seg(p, 0.1, 0.17)) * (1 - smooth(seg(p, 0.8, 0.86)));
      const kFin = smooth(seg(p, 0.88, 0.98));
      const still = mobile || reduceMotion;
      const px = still ? 0 : mx * 10, py = still ? 0 : my * 6;

      // The Bruz mark plays the role of the figure the ring circles.
      const lift = mobile ? H * 0.26 * smooth(seg(p, 0.08, 0.16)) * (1 - smooth(seg(p, 0.84, 0.95))) : 0;
      const markScale = 1 + kIn * 0.02 - kOut * (mobile ? 0.04 : 0.1);
      const mcx = W / 2 + px, mcy = lerp(baseY, raisedY, kIn) - lift + Math.max(0, py);
      mark.style.transform = `translate(${(mcx - S / 2).toFixed(1)}px, ${(mcy - S / 2).toFixed(1)}px) scale(${markScale.toFixed(4)})`;

      const cx = mcx + px * 0.4;
      const cy = mcy + S * (mobile ? 0.12 : 0.06) * markScale;
      const sway = reduceMotion ? 0 : Math.sin(now / 2600) * 0.07 * (1 - kIn);
      const rot = -stepped(kOrbit) * (N - 1) * 2 * Math.PI / N + sway + (still ? 0 : mx * 0.12);
      let Rx = mobile ? Math.min(S * lerp(0.72, 0.82, kIn), W / 2 - 64) : Math.min(S * lerp(1.05, 1.4, kIn), W * 0.36);
      let Ry = Rx * (lerp(0.24, 0.3, kIn) + (still ? 0 : my * 0.03));
      let ccx = cx, ccy = cy + Ry * lerp(0.8, 0.25, kIn);
      // Outro: the ring closes into a halo resting above the mark.
      const hx = mcx, hy = mcy - (S * markScale) / 2 - S * 0.06;
      const hRx = S * 0.42, hRy = hRx * 0.2;
      Rx = lerp(Rx, hRx, kOut); Ry = lerp(Ry, hRy, kOut);
      ccx = lerp(ccx, hx, kOut); ccy = lerp(ccy, hy, kOut);

      let best = -2, bestIndex = 0;
      orbs.forEach((o, i) => {
        const th = rot + (i * 2 * Math.PI) / N;
        const sx = Math.sin(th), cz = Math.cos(th);
        const d = (cz + 1) / 2;
        const x = ccx + Rx * sx, y = ccy + Ry * cz;
        const sc = (0.58 + 0.5 * d) * (1 - kOut * 0.9) * (mobile ? 0.92 : 1);
        o.el.style.transform = `translate3d(${(x - o.w / 2).toFixed(1)}px, ${(y - o.h / 2).toFixed(1)}px, 0) rotateY(${(-sx * 42).toFixed(1)}deg) scale(${sc.toFixed(3)})`;
        o.el.style.opacity = ((0.5 + 0.5 * d) * (1 - kOut)).toFixed(3);
        // Front half of the orbit passes in front of the mark (z 20), back half behind it.
        o.el.style.zIndex = cz > 0 ? 30 + Math.round(d * 9) : 4 + Math.round(d * 9);
        if (cz > best) { best = cz; bestIndex = i; }
      });
      if (p > 0.08 && p < 0.86) setActive(bestIndex);
      else if (active === -1) setActive(0);

      pathBack.setAttribute('d', `M ${ccx - Rx} ${ccy} A ${Rx} ${Ry} 0 0 1 ${ccx + Rx} ${ccy}`);
      pathFront.setAttribute('d', `M ${ccx - Rx} ${ccy} A ${Rx} ${Ry} 0 0 0 ${ccx + Rx} ${ccy}`);
      const lineAlpha = (1 - kOut) * (0.4 + 0.6 * (1 - kIn * 0.3));
      lines.forEach(svg => { svg.style.opacity = lineAlpha.toFixed(3); });

      halo.style.width = `${hRx * 2}px`;
      halo.style.height = `${hRy * 2}px`;
      halo.style.transform = `translate(${hx - hRx}px, ${hy - hRy - (1 - kOut) * 30}px) rotate(${-6 + (reduceMotion ? 0 : Math.sin(now / 1800) * 2)}deg)`;
      halo.style.opacity = kOut.toFixed(3);
      glow.style.left = `${cx}px`;
      glow.style.top = `${mcy - S * 0.1}px`;
      glow.style.opacity = (kOut * 0.85).toFixed(3);

      fade(intro, 1 - kIn, -kIn * 50);
      fade(side, 1 - kIn, -kIn * 40);
      fade(detail, kDet, (1 - kDet) * 24);
      ticksEl.style.opacity = kDet.toFixed(3);
      fade(finale, kFin, (1 - kFin) * 40);

      bigword.style.transform = `translateX(calc(-50% + ${((0.5 - p) * W * 0.16 - px * 0.6).toFixed(1)}px))`;
      bigword.style.opacity = (1 - kOut * 0.6).toFixed(3);
      dial.style.strokeDashoffset = (125.66 * (1 - p)).toFixed(2);
      label.textContent = p > 0.97 ? 'Keep scrolling' : 'Scroll to orbit';
    };

    const frame = now => {
      if (!running) return;
      render(now);
      requestAnimationFrame(frame);
    };
    const start = () => {
      if (running || !visible || document.hidden) return;
      running = true;
      requestAnimationFrame(frame);
    };

    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start(); else running = false;
    }).observe(section);
    document.addEventListener('visibilitychange', () => { if (document.hidden) running = false; else start(); });
    window.addEventListener('scroll', () => { readScroll(); start(); }, { passive: true });
    window.addEventListener('pointermove', event => {
      tmx = event.clientX / window.innerWidth - 0.5;
      tmy = event.clientY / window.innerHeight - 0.5;
    }, { passive: true });
    window.addEventListener('resize', () => { measure(); readScroll(); render(performance.now()); });

    const boot = () => { measure(); readScroll(); prog = target; render(performance.now()); start(); };
    boot();
    // Web fonts change card and headline sizes; measure again once they are in.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot);
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
