(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  if (!toggle || !nav) return;

  const closeMenu = (returnFocus = false) => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
    nav.classList.remove('is-open');
    if (returnFocus) toggle.focus();
  };

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    nav.classList.toggle('is-open', isOpen);
  });

  nav.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      closeMenu(true);
    }
  });

  const desktopQuery = window.matchMedia('(min-width: 761px)');
  desktopQuery.addEventListener?.('change', event => {
    if (event.matches) closeMenu();
  });
})();

(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.hero');
  const heroVisual = document.querySelector('.hero-visual');
  const progress = document.querySelector('.scroll-progress');

  if (hero && !reduceMotion.matches) {
    requestAnimationFrame(() => hero.classList.add('is-ready'));
  }

  if (heroVisual && !reduceMotion.matches && window.matchMedia('(pointer: fine)').matches) {
    heroVisual.addEventListener('pointermove', event => {
      const box = heroVisual.getBoundingClientRect();
      heroVisual.style.setProperty('--pointer-x', `${((event.clientX - box.left) / box.width * 100).toFixed(1)}%`);
      heroVisual.style.setProperty('--pointer-y', `${((event.clientY - box.top) / box.height * 100).toFixed(1)}%`);
    });
    heroVisual.addEventListener('pointerleave', () => {
      heroVisual.style.removeProperty('--pointer-x');
      heroVisual.style.removeProperty('--pointer-y');
    });
  }

  const revealTargets = document.querySelectorAll('.recognition, .section-heading, .offer-card, .work-feature, .product-card, .person, .team-card, .steps-list li, .process-grid li, .capability-grid article, .contact-band > div, .contact-band > a');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: .08, rootMargin: '0px 0px -30px 0px' });
    revealTargets.forEach(target => {
      target.classList.add('motion-reveal');
      observer.observe(target);
    });
  }

  let ticking = false;
  const updateScroll = () => {
    const remaining = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = remaining > 0 ? Math.min(1, Math.max(0, window.scrollY / remaining)) : 0;
    progress?.style.setProperty('--scroll-progress', ratio);
    document.body.classList.toggle('has-scrolled', window.scrollY > 28);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateScroll);
  }, { passive: true });
  window.addEventListener('resize', updateScroll, { passive: true });
  updateScroll();

  const stages = [
    { phase: '01 / Capture', title: 'Field signal comes in.', description: 'Bring relevant field information into a consistent starting point.', icon: '↗' },
    { phase: '02 / Review', title: 'Quality gets a closer look.', description: 'Give the information a clear place for inspection and human judgment.', icon: '◎' },
    { phase: '03 / Act', title: 'The next decision is visible.', description: 'Make the next action clear to the people responsible for it.', icon: '↗' }
  ];
  document.querySelectorAll('[data-tower-demo]').forEach(demo => {
    const buttons = [...demo.querySelectorAll('[data-tower-step]')];
    const select = index => {
      const stage = stages[index];
      if (!stage) return;
      buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
      demo.querySelector('[data-tower-phase]').textContent = stage.phase;
      demo.querySelector('[data-tower-title]').textContent = stage.title;
      demo.querySelector('[data-tower-description]').textContent = stage.description;
      demo.querySelector('.tower-screen-icon').textContent = stage.icon;
      demo.dataset.stage = String(index);
    };
    buttons.forEach((button, index) => button.addEventListener('click', () => select(index)));
  });
})();
