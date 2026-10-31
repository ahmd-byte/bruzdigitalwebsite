(() => {
  const heroVisual = document.querySelector('.hero-visual');
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
  if (heroVisual && !reduceMotion) {
    document.body.classList.add('hero-intro');
    heroVisual.classList.add('is-animating');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.body.classList.add('hero-intro-active');
      heroVisual.classList.add('is-active');
    }));
  }

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
