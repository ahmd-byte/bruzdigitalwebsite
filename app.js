(() => {
  'use strict';

  const body = document.body;
  const hasGSAP = typeof window.gsap !== 'undefined';
  const hasScrollTrigger = typeof window.ScrollTrigger !== 'undefined';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  body.classList.add('is-loading');

  const revealWithoutAnimation = () => {
    body.classList.remove('is-loading');
    const loader = document.querySelector('.loader');
    if (loader) loader.remove();
  };

  if (!hasGSAP) {
    revealWithoutAnimation();
    return;
  }

  const { gsap } = window;
  if (hasScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  const select = (selector, scope = document) => scope.querySelector(selector);
  const selectAll = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  function runLoader() {
    const loader = select('.loader');
    if (!loader || prefersReducedMotion) {
      revealWithoutAnimation();
      runIntro(false);
      return;
    }

    // The percentage screen is a first-arrival and refresh moment only. On
    // internal navigation the head script marks the document, so drop the
    // loader immediately but still play the navbar and hero entrance.
    if (document.documentElement.classList.contains('skip-loader')) {
      revealWithoutAnimation();
      runIntro(true);
      return;
    }

    const counter = { value: 0 };
    const number = select('[data-loader-count]');
    const track = select('.loader__track span');
    const timeline = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      onComplete: () => {
        loader.remove();
        body.classList.remove('is-loading');
        runIntro(true);
      }
    });

    timeline
      .to(counter, {
        value: 100,
        duration: 1.45,
        ease: 'power2.inOut',
        onUpdate: () => { number.textContent = String(Math.round(counter.value)).padStart(2, '0'); }
      }, 0)
      .to(track, { scaleX: 1, duration: 1.45, ease: 'power2.inOut' }, 0)
      .to('.loader__top span', { yPercent: -130, duration: .45, stagger: .05 }, 1.5)
      .to('.loader__number', { yPercent: -140, rotate: -4, duration: .7 }, 1.46)
      .to(loader, { yPercent: -100, duration: .8, ease: 'power4.inOut' }, 1.78);
  }

  const navReducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const INTRO_PROPERTIES = Object.freeze(['transform', 'opacity', 'will-change', 'transform-origin']);
  // Every element the orb reaction is allowed to write. `.hero__orb` itself is
  // absent on purpose: the intro and scroll tweens already own its transform.
  const ORB_REACTION_LAYER_SELECTORS = Object.freeze([
    '.orb__reaction',
    '.orb__glow',
    '.orb__blade--one',
    '.orb__blade--two',
    '.orb__ring--one',
    '.orb__ring--two',
    '.orb__label-motion'
  ]);
  // One entry per blade wrapper. Opposite signs and unequal magnitudes are both
  // load-bearing: the signs give counter-rotation, the difference is what the
  // convergence measurement reads. Idle and engaged share a sign per blade, so
  // the tweened signed velocity can never cross zero.
  // Full-intensity profile: each blade reaches exactly 16x its idle speed while
  // staying well below the 260 deg/s safety ceiling.
  const ORB_BLADE_MOTION = Object.freeze([
    Object.freeze({ selector: '.orb__blade--one', idleVelocity: 9, engagedVelocity: 144 }),
    Object.freeze({ selector: '.orb__blade--two', idleVelocity: -11, engagedVelocity: -176 })
  ]);
  // Fast mechanical wind-up, followed by a longer coast back to idle.
  const ORB_RAMP_UP_DURATION = .32;
  const ORB_EASE_DOWN_DURATION = .90;
  const ORB_RAMP_UP_SETTLE_FRACTION = .9;
  const ORB_EASE_DOWN_SETTLE_FRACTION = .1;
  const ORB_RAMP_UP_MAX_MS = 420;
  // Clamp long/stalled frames locally without changing GSAP's global ticker.
  const ORB_MAX_FRAME_DELTA_MS = 50;
  // Engaged layers spread much wider and flare harder for a deliberately hostile
  // reaction, while release still lands on the authored idle values exactly.
  const ORB_ANGRY_LAYERS = Object.freeze([
    Object.freeze({
      selector: '.orb__ring--one',
      channels: Object.freeze([
        Object.freeze({ property: 'scaleX', idle: .3, engaged: .72 }),
        Object.freeze({ property: 'opacity', idle: .7, engaged: 1 })
      ])
    }),
    Object.freeze({
      selector: '.orb__ring--two',
      channels: Object.freeze([
        Object.freeze({ property: 'scaleY', idle: .3, engaged: .72 }),
        Object.freeze({ property: 'opacity', idle: .7, engaged: 1 })
      ])
    }),
    Object.freeze({
      selector: '.orb__glow',
      channels: Object.freeze([
        Object.freeze({ property: 'scale', idle: 1, engaged: 1.4 }),
        Object.freeze({ property: 'opacity', idle: .55, engaged: .98 })
      ])
    })
  ]);
  const ORB_ANGRY_EASE = 'power2.out';
  // Snap into the hostile signature quickly; coast out slowly for contrast.
  const ORB_ANGRY_ENGAGE_DURATION = .22;
  const ORB_ANGRY_RELEASE_DURATION = .90;
  const ORB_REDUCED_MOTION_DURATION = .15;
  const ORB_TAU = Math.PI * 2;
  // The label stays completely still; the whole visible orb owns the chaos.
  const ORB_LABEL_AGITATION_HZ = 0;
  const ORB_LABEL_AGITATION_PEAK_PX = 0;
  const ORB_LABEL_AGITATION_PEAK_MOBILE_PX = 0;
  const ORB_MOBILE_LAYOUT_QUERY = '(max-width: 900px)';
  // The four Engagement_Source flags, in the order the debug hook reports them.
  const ORB_ENGAGEMENT_SOURCES = Object.freeze(['hover', 'contact', 'keyboard', 'hold']);
  // Straight-line travel in CSS pixels that reclassifies a contact as a scroll
  // gesture. Past it the contact source clears and the pan stays the browser's.
  const ORB_CONTACT_CANCEL_DISTANCE_PX = 12;
  // Keep a short tap engaged long enough to finish the .5s spin and drop.
  const ORB_MINIMUM_ENGAGEMENT_HOLD_MS = 1200;
  // Keyboard_Engagement_Window, restarted from full on every accepted keydown.
  const ORB_KEYBOARD_ENGAGEMENT_WINDOW_MS = 1200;
  // `'Spacebar'` is the legacy key name older engines report for Space.
  const ORB_ENGAGEMENT_KEYS = new Set(['Enter', ' ', 'Spacebar']);
  const NAVBAR_DESTINATION_KEYS = Object.freeze(['home', 'projects', 'services', 'team', 'contact']);
  const NAVBAR_PROFILE_VALUES = Object.freeze({
    desktop: Object.freeze({
      frameDuration: .280,
      seamDuration: .360,
      seamStagger: .075,
      cellClockDuration: 1,
      cellStagger: .075,
      badgeDelay: .050,
      labelDelay: .080,
      indicatorDelay: .060,
      contentDuration: .240,
      totalDuration: 1.468
    }),
    mobile: Object.freeze({
      frameDuration: .280,
      seamDuration: .320,
      seamStagger: .050,
      cellClockDuration: 1,
      cellStagger: .050,
      badgeDelay: .050,
      labelDelay: .070,
      indicatorDelay: .050,
      contentDuration: .180,
      totalDuration: 1.354
    })
  });
  const ALLOWED_TWEEN_KEYS = new Set([
    'x', 'y', 'xPercent', 'yPercent', 'scale', 'scaleX', 'scaleY',
    'rotation', 'rotationX', 'rotationY', 'skewX', 'skewY', 'opacity',
    'transformOrigin', 'duration', 'ease', 'stagger', 'overwrite',
    'immediateRender', 'onComplete'
  ]);

  let navbarUnfurlController = null;
  let scrollVisibilityController = null;
  let orbReactionController = null;

  function getNavbarProfile() {
    const width = window.innerWidth;
    const layout = width >= 901 ? 'desktop' : 'mobile';
    return Object.freeze({
      layout,
      compact: width <= 560,
      reduceMotion: navReducedMotionQuery.matches,
      ...NAVBAR_PROFILE_VALUES[layout]
    });
  }

  function isAuthoredVisible(element, root) {
    if (!element) return false;
    let current = element;
    while (current && current !== root) {
      const style = window.getComputedStyle(current);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      current = current.parentElement;
    }
    return true;
  }

  function collectNavbarLayers(root, profile) {
    if (!root) throw new Error('Navbar root is missing');
    if (!profile || (profile.layout !== 'desktop' && profile.layout !== 'mobile')) {
      throw new Error('Navbar profile is invalid');
    }

    const frameEdges = selectAll('[data-frame-edge]', root);
    const seams = selectAll('[data-seam]', root);
    const unorderedCells = selectAll('[data-nav-cell]', root);
    const unorderedNavItems = selectAll('.nav-item', root);
    const unorderedPanels = selectAll('.nav-cell__panel', root);
    const allBadges = selectAll('.nav-badge__motion', root);
    const allLabels = selectAll('.nav-label__motion', root);
    const indicators = selectAll('.nav-active-indicator', root);
    const currentLinks = unorderedNavItems.filter((item) => item.hasAttribute('aria-current'));

    if (frameEdges.length !== 4 || seams.length !== 5 || unorderedCells.length !== 6 ||
        unorderedNavItems.length !== 5 || unorderedPanels.length !== 6 ||
        allBadges.length !== 5 || allLabels.length !== 5 || indicators.length !== 1 ||
        currentLinks.length !== 1) {
      throw new Error('Navbar decorative layer cardinality is invalid');
    }

    const cellsByKey = {};
    unorderedCells.forEach((cell) => {
      const key = cell.dataset.navCell;
      if (!['brand', ...NAVBAR_DESTINATION_KEYS].includes(key) || cellsByKey[key]) {
        throw new Error('Navbar cell keys must be unique and complete');
      }
      cellsByKey[key] = cell;
    });
    if (!cellsByKey.brand || NAVBAR_DESTINATION_KEYS.some((key) => !cellsByKey[key])) {
      throw new Error('Navbar cell keys must include brand and every destination');
    }

    const panelForCell = (cell) => {
      const matches = selectAll('.nav-cell__panel', cell);
      if (matches.length !== 1) throw new Error('Each navbar cell must own exactly one panel');
      return matches[0];
    };
    const brandCell = cellsByKey.brand;
    const brandPanel = panelForCell(brandCell);
    const brandMotion = select('.nav-brand__motion', brandCell);
    const surface = select('.nav-unfurl__surface', root);
    if (!brandMotion || !surface) throw new Error('Navbar motion wrappers are incomplete');

    const destinations = NAVBAR_DESTINATION_KEYS.map((key, index) => {
      const cell = cellsByKey[key];
      const navItem = unorderedNavItems.find((item) => item === cell);
      const badges = selectAll('.nav-badge__motion', cell);
      const labels = selectAll('.nav-label__motion', cell);
      if (!navItem || badges.length !== 1 || labels.length !== 1) {
        throw new Error(`Navbar destination mapping is incomplete: ${key}`);
      }
      return Object.freeze({
        key,
        index,
        cell,
        panel: panelForCell(cell),
        navItem,
        badge: badges[0],
        label: labels[0]
      });
    });
    const destinationPanels = destinations.map(({ panel }) => panel);
    if (new Set([brandPanel, ...destinationPanels]).size !== unorderedPanels.length) {
      throw new Error('Navbar panels must map one-to-one with navbar cells');
    }

    const visibleBadgeDestinations = destinations.filter(({ badge }) => isAuthoredVisible(badge, root));
    const visibleLabelDestinations = destinations.filter(({ label }) => isAuthoredVisible(label, root));
    const badges = visibleBadgeDestinations.map(({ badge }) => badge);
    const labels = visibleLabelDestinations.map(({ label }) => label);
    const excluded = [
      ...destinations.filter(({ badge }) => !isAuthoredVisible(badge, root)).map(({ badge }) => badge),
      ...destinations.filter(({ label }) => !isAuthoredVisible(label, root)).map(({ label }) => label)
    ];
    const currentLink = currentLinks[0];
    const currentDestination = destinations.find(({ navItem }) => navItem === currentLink);
    if (!currentDestination) throw new Error('Current navbar link has no destination mapping');

    const indicator = indicators[0];
    const cells = [brandCell, ...destinations.map(({ cell }) => cell)];
    const panels = [brandPanel, ...destinationPanels];
    const navItems = destinations.map(({ navItem }) => navItem);
    const participating = [
      surface,
      ...frameEdges,
      ...seams,
      ...panels,
      brandMotion,
      ...badges,
      ...labels,
      indicator
    ];

    if (new Set(participating).size !== participating.length ||
        participating.some((target) => target === root || !root.contains(target)) ||
        excluded.some((target) => participating.includes(target))) {
      throw new Error('Navbar intro targets must be unique registered descendants');
    }

    const destinationByKey = Object.freeze(destinations.reduce((mapping, destination) => {
      mapping[destination.key] = destination;
      return mapping;
    }, {}));
    const indicatorBinding = Object.freeze({
      indicator,
      key: currentDestination.key,
      cell: currentDestination.cell,
      navItem: currentDestination.navItem
    });

    return Object.freeze({
      root,
      profile: Object.freeze({ ...profile }),
      surface,
      frameEdges: Object.freeze(frameEdges),
      seams: Object.freeze(seams),
      cells: Object.freeze(cells),
      navItems: Object.freeze(navItems),
      panels: Object.freeze(panels),
      brandMotion,
      badges: Object.freeze(badges),
      labels: Object.freeze(labels),
      indicator,
      excluded: Object.freeze(excluded),
      participating: Object.freeze(participating),
      destinations: Object.freeze(destinations),
      destinationByKey,
      badgeDestinations: Object.freeze(visibleBadgeDestinations),
      labelDestinations: Object.freeze(visibleLabelDestinations),
      currentLink,
      currentDestination,
      indicatorBinding
    });
  }

  function assertFiniteNonnegative(name, value) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`Navbar schedule value must be finite and nonnegative: ${name}`);
    }
  }

  function assertInRange(name, value, minimum, maximum) {
    assertFiniteNonnegative(name, value);
    if (value < minimum || value > maximum) {
      throw new Error(`Navbar schedule value is outside its approved range: ${name}`);
    }
  }

  function deriveTimelineSchedule(profile, registry) {
    if (!profile || !registry || (profile.layout !== 'desktop' && profile.layout !== 'mobile')) {
      throw new Error('Navbar schedule inputs are invalid');
    }
    if (!Array.isArray(registry.seams) || registry.seams.length !== 5 ||
        !Array.isArray(registry.destinations) || registry.destinations.length !== 5 ||
        !registry.currentDestination) {
      throw new Error('Navbar schedule registry mapping is incomplete');
    }

    [
      'frameDuration', 'seamDuration', 'seamStagger', 'cellClockDuration',
      'cellStagger', 'badgeDelay', 'labelDelay', 'indicatorDelay',
      'contentDuration', 'totalDuration'
    ].forEach((key) => assertFiniteNonnegative(`profile.${key}`, profile[key]));
    assertInRange('profile.seamStagger', profile.seamStagger, .045, .130);
    assertInRange(
      'profile.cellStagger',
      profile.cellStagger,
      profile.layout === 'desktop' ? .055 : .040,
      profile.layout === 'desktop' ? .120 : .090
    );
    assertInRange('profile.contentDuration', profile.contentDuration, .120, .320);
    assertInRange(
      'profile.totalDuration',
      profile.totalDuration,
      profile.layout === 'desktop' ? 1 : .7,
      profile.layout === 'desktop' ? 1.8 : 1.45
    );
    const approvedProfile = NAVBAR_PROFILE_VALUES[profile.layout];
    Object.keys(approvedProfile).forEach((key) => {
      if (Math.abs(profile[key] - approvedProfile[key]) > 1e-9) {
        throw new Error(`Navbar ${profile.layout} profile value is not approved: ${key}`);
      }
    });

    const frameStart = 0;
    const firstSeamStart = profile.frameDuration * .15;
    const seamStarts = registry.seams.map((_, index) => firstSeamStart + index * profile.seamStagger);
    const destinationStarts = registry.destinations.map((_, index) => (
      seamStarts[index] + profile.seamDuration * .35
    ));
    const panelStarts = [destinationStarts[0], ...destinationStarts];
    const startByDestination = Object.freeze(registry.destinations.reduce((starts, destination, index) => {
      starts[destination.key] = destinationStarts[index];
      return starts;
    }, {}));
    const badgeStarts = registry.badgeDestinations.map(({ key }) => (
      startByDestination[key] + .350 + profile.badgeDelay
    ));
    const labelStarts = registry.labelDestinations.map(({ key }) => (
      startByDestination[key] + .350 + profile.badgeDelay + profile.labelDelay
    ));
    const indicatorStart = startByDestination[registry.currentDestination.key] + .700 + profile.indicatorDelay;
    destinationStarts.slice(1).forEach((start, index) => {
      if (Math.abs(start - destinationStarts[index] - profile.cellStagger) > 1e-9) {
        throw new Error('Navbar destination cell starts do not match the approved stagger');
      }
    });
    badgeStarts.forEach((start, index) => {
      const key = registry.badgeDestinations[index].key;
      if (Math.abs(start - startByDestination[key] - .400) > 1e-9) {
        throw new Error(`Navbar badge start is invalid: ${key}`);
      }
    });
    labelStarts.forEach((start, index) => {
      const key = registry.labelDestinations[index].key;
      const badgeStart = startByDestination[key] + .400;
      if (Math.abs(start - badgeStart - profile.labelDelay) > 1e-9) {
        throw new Error(`Navbar label start is invalid: ${key}`);
      }
    });
    if (Math.abs(
      indicatorStart - startByDestination[registry.currentDestination.key] - .700 - profile.indicatorDelay
    ) > 1e-9) {
      throw new Error('Navbar indicator start is invalid');
    }

    const decorativeFade = profile.layout === 'desktop' ? 1.02 : .88;
    const contentFinishes = [
      ...badgeStarts.map((start) => start + profile.contentDuration),
      ...labelStarts.map((start) => start + profile.contentDuration),
      indicatorStart + profile.contentDuration
    ];
    const finalCellClockEnd = destinationStarts[destinationStarts.length - 1] + profile.cellClockDuration;
    const duration = Math.max(finalCellClockEnd, ...contentFinishes);

    const scheduleNumbers = [
      frameStart,
      firstSeamStart,
      decorativeFade,
      indicatorStart,
      finalCellClockEnd,
      duration,
      ...seamStarts,
      ...destinationStarts,
      ...panelStarts,
      ...badgeStarts,
      ...labelStarts,
      ...contentFinishes
    ];
    scheduleNumbers.forEach((value, index) => assertFiniteNonnegative(`derived[${index}]`, value));
    assertInRange(
      'duration',
      duration,
      profile.layout === 'desktop' ? 1 : .7,
      profile.layout === 'desktop' ? 1.8 : 1.45
    );

    // The cycle ends when the last destination cell finishes its clock, so the
    // approved total follows the number of destinations rather than a constant.
    const approvedDuration = firstSeamStart
      + (registry.destinations.length - 1) * profile.seamStagger
      + profile.seamDuration * .35
      + profile.cellClockDuration;
    if (Math.abs(profile.totalDuration - approvedDuration) > 1e-9 ||
        Math.abs(duration - approvedDuration) > 1e-9) {
      throw new Error(
        `Navbar ${profile.layout} schedule duration must be ${approvedDuration.toFixed(3)}s`
      );
    }

    const events = [
      Object.freeze({ label: 'frame', start: frameStart, duration: profile.frameDuration }),
      ...registry.seams.map((target, index) => Object.freeze({
        label: `seam:${registry.destinations[index].key}`,
        target,
        start: seamStarts[index],
        duration: profile.seamDuration
      })),
      Object.freeze({ label: 'cell:brand', target: registry.panels[0], start: panelStarts[0], duration: profile.cellClockDuration }),
      ...registry.destinations.map((destination, index) => Object.freeze({
        label: `cell:${destination.key}`,
        target: destination.panel,
        start: destinationStarts[index],
        duration: profile.cellClockDuration
      })),
      ...registry.badgeDestinations.map((destination, index) => Object.freeze({
        label: `badge:${destination.key}`,
        target: destination.badge,
        start: badgeStarts[index],
        duration: profile.contentDuration
      })),
      ...registry.labelDestinations.map((destination, index) => Object.freeze({
        label: `label:${destination.key}`,
        target: destination.label,
        start: labelStarts[index],
        duration: profile.contentDuration
      })),
      Object.freeze({
        label: `indicator:${registry.currentDestination.key}`,
        target: registry.indicator,
        start: indicatorStart,
        duration: profile.contentDuration
      })
    ];

    const frozenSeamStarts = Object.freeze(seamStarts);
    const frozenDestinationStarts = Object.freeze(destinationStarts);
    const frozenPanelStarts = Object.freeze(panelStarts);
    return Object.freeze({
      frameStart,
      firstSeamStart,
      seamStarts: frozenSeamStarts,
      destinationStarts: frozenDestinationStarts,
      startByDestination,
      panelStarts: frozenPanelStarts,
      cellStarts: frozenPanelStarts,
      badgeStarts: Object.freeze(badgeStarts),
      labelStarts: Object.freeze(labelStarts),
      indicatorStart,
      decorativeFade,
      finalCellClockEnd,
      duration,
      events: Object.freeze(events)
    });
  }

  function captureIntroProperties(elements) {
    return Object.freeze(elements.map((element) => {
      const authoredProperties = Array.from(
        { length: element.style.length },
        (_, index) => element.style.item(index)
      );
      const properties = INTRO_PROPERTIES.map((property) => Object.freeze({
        property,
        present: authoredProperties.includes(property),
        value: element.style.getPropertyValue(property),
        priority: element.style.getPropertyPriority(property)
      }));
      return Object.freeze({ element, properties: Object.freeze(properties) });
    }));
  }

  function restoreIntroProperties(snapshot) {
    snapshot.forEach(({ element, properties }) => {
      if (!element || !element.isConnected) return;
      properties.forEach(({ property, present, value, priority }) => {
        if (present) element.style.setProperty(property, value, priority);
        else element.style.removeProperty(property);
      });
      // Direct inline restoration is authoritative; make CSSPlugin re-read it on
      // the next channel-specific tween instead of reusing concealed-state data.
      if (gsap.core && typeof gsap.core.getCache === 'function') {
        gsap.core.getCache(element).uncache = 1;
      }
    });
  }

  function assertTweenSpec(registry, targets, vars) {
    if (typeof targets === 'string') {
      throw new Error('Navbar intro selector targets are not allowed');
    }
    const list = Array.isArray(targets) ? targets : [targets];
    if (!list.length || list.some((target) => typeof target === 'string')) {
      throw new Error('Navbar intro targets must be registered elements');
    }
    list.forEach((target) => {
      if (!target || target === registry.root || !registry.participating.includes(target)) {
        throw new Error('Navbar intro attempted to animate an unregistered or root target');
      }
    });
    if (!vars || typeof vars !== 'object' || Array.isArray(vars)) {
      throw new Error('Navbar intro tween vars must be an object');
    }
    Object.keys(vars).forEach((key) => {
      if (!ALLOWED_TWEEN_KEYS.has(key)) throw new Error(`Navbar intro property is not allowed: ${key}`);
    });
  }

  function safeSet(timeline, registry, targets, vars, position) {
    assertTweenSpec(registry, targets, vars);
    timeline.set(targets, vars, position);
  }

  function safeTo(timeline, registry, targets, vars, position) {
    assertTweenSpec(registry, targets, vars);
    timeline.to(targets, vars, position);
  }

  function buildNavbarUnfurlTimeline({ registry, schedule, onComplete }) {
    const timeline = gsap.timeline({ paused: true, onComplete });

    try {
      safeSet(timeline, registry, registry.surface, { xPercent: -28, opacity: 0 }, 0);
      registry.frameEdges.forEach((edge) => {
        const side = edge.dataset.frameEdge;
        if (side === 'top' || side === 'bottom') {
          safeSet(timeline, registry, edge, {
            x: side === 'top' ? -6 : 6,
            scaleX: .06,
            opacity: 0,
            transformOrigin: side === 'top' ? 'left center' : 'right center'
          }, 0);
        } else {
          safeSet(timeline, registry, edge, {
            y: side === 'left' ? -6 : 6,
            scaleY: .06,
            opacity: 0,
            transformOrigin: side === 'left' ? 'center top' : 'center bottom'
          }, 0);
        }
      });
      safeSet(timeline, registry, registry.seams, {
        scaleY: .10, opacity: 0, transformOrigin: 'center top'
      }, 0);
      safeSet(timeline, registry, registry.panels, { x: -8, scaleX: .96, opacity: 0 }, 0);
      safeSet(timeline, registry, registry.brandMotion, { x: -8, opacity: 0 }, 0);
      if (registry.badgeDestinations.length) {
        safeSet(
          timeline,
          registry,
          registry.badgeDestinations.map(({ badge }) => badge),
          { y: -10, opacity: 0 },
          0
        );
      }
      if (registry.labelDestinations.length) {
        safeSet(
          timeline,
          registry,
          registry.labelDestinations.map(({ label }) => label),
          { y: 12, opacity: 0 },
          0
        );
      }
      safeSet(timeline, registry, registry.indicator, { scaleX: .22, opacity: 0 }, 0);

      safeTo(timeline, registry, registry.surface, {
        xPercent: 0, opacity: 1, duration: registry.profile.frameDuration, ease: 'power3.out'
      }, schedule.frameStart);

      registry.frameEdges.forEach((edge) => {
        const side = edge.dataset.frameEdge;
        const horizontal = side === 'top' || side === 'bottom';
        const start = schedule.frameStart + ((side === 'bottom' || side === 'right') ? .040 : 0);
        safeTo(timeline, registry, edge, {
          ...(horizontal ? { x: 0, scaleX: 1.04 } : { y: 0, scaleY: 1.04 }),
          opacity: 1,
          duration: .080 - start,
          ease: 'power2.out'
        }, start);
        safeTo(timeline, registry, edge, {
          [horizontal ? 'scaleX' : 'scaleY']: 1,
          duration: .200,
          ease: 'power2.inOut'
        }, .080);
      });

      registry.seams.forEach((seam, index) => {
        safeTo(timeline, registry, seam, {
          scaleY: 1,
          opacity: 1,
          duration: registry.profile.seamDuration,
          ease: 'power3.out'
        }, schedule.seamStarts[index]);
      });

      registry.panels.forEach((panel, index) => {
        const start = schedule.panelStarts[index];
        safeTo(timeline, registry, panel, {
          x: 0, scaleX: 1.03, opacity: 1, duration: .350, ease: 'power3.out'
        }, start);
        safeTo(timeline, registry, panel, {
          scaleX: 1, duration: .220, ease: 'power2.inOut'
        }, start + .350);
      });

      safeTo(timeline, registry, registry.brandMotion, {
        x: 0,
        opacity: 1,
        duration: registry.profile.contentDuration,
        ease: 'circ.out'
      }, schedule.panelStarts[0] + .150);

      registry.badgeDestinations.forEach((destination, index) => {
        safeTo(timeline, registry, destination.badge, {
          y: 0,
          opacity: 1,
          duration: registry.profile.contentDuration,
          ease: 'circ.out'
        }, schedule.badgeStarts[index]);
      });

      registry.labelDestinations.forEach((destination, index) => {
        safeTo(timeline, registry, destination.label, {
          y: 0,
          opacity: 1,
          duration: registry.profile.contentDuration,
          ease: 'power3.out'
        }, schedule.labelStarts[index]);
      });

      safeTo(timeline, registry, registry.indicator, {
        scaleX: 1,
        opacity: 1,
        duration: registry.profile.contentDuration,
        ease: 'circ.out'
      }, schedule.indicatorStart);

      const decorativeFadeDuration = schedule.duration - schedule.decorativeFade;
      [registry.surface, ...registry.frameEdges, ...registry.seams, ...registry.panels].forEach((target) => {
        safeTo(timeline, registry, target, {
          opacity: 0,
          duration: decorativeFadeDuration,
          ease: 'power2.inOut'
        }, schedule.decorativeFade);
      });

      return timeline;
    } catch (error) {
      timeline.kill();
      throw error;
    }
  }

  function createScrollVisibilityController({
    root,
    gsap: gsapInstance,
    ScrollTrigger,
    onLayoutChange,
    beforeClose
  } = {}) {
    let destroyed = false;
    let rootYTarget = 0;
    let shellTimeline = null;
    let shellSnapshot = null;
    let shellTargetClosed = false;
    let layoutReleaseFrame = 0;
    let scrollTrigger = null;
    // One rule owns the shell: it is open near the top of the document and
    // compact everywhere else. Hysteresis prevents flutter at the boundary.
    const openBelow = 120;
    const closeAbove = 200;
    const desktopQuery = window.matchMedia('(min-width: 901px)');
    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const layoutProperties = Object.freeze(['width', 'height', 'border-radius']);

    const addMediaListener = (query, listener) => {
      if (typeof query.addEventListener === 'function') query.addEventListener('change', listener);
      else query.addListener(listener);
    };

    const removeMediaListener = (query, listener) => {
      if (typeof query.removeEventListener === 'function') query.removeEventListener('change', listener);
      else query.removeListener(listener);
    };

    const canClose = () => Boolean(ScrollTrigger) && desktopQuery.matches && !reducedQuery.matches;

    const notifyLayoutChange = () => {
      if (typeof onLayoutChange !== 'function') return;
      try {
        onLayoutChange();
      } catch (error) {
        // Shell visibility must remain fail-open if optional geometry work fails.
      }
    };

    const captureInlineProperties = (element, properties) => {
      const authoredProperties = Array.from(
        { length: element.style.length },
        (_, index) => element.style.item(index)
      );
      return Object.freeze(properties.map((property) => Object.freeze({
        property,
        present: authoredProperties.includes(property),
        value: element.style.getPropertyValue(property),
        priority: element.style.getPropertyPriority(property)
      })));
    };

    const restoreInlineProperties = (element, snapshot) => {
      if (!element || !snapshot) return;
      snapshot.forEach(({ property, present, value, priority }) => {
        if (present) element.style.setProperty(property, value, priority);
        else element.style.removeProperty(property);
      });
      if (gsapInstance.core && typeof gsapInstance.core.getCache === 'function') {
        gsapInstance.core.getCache(element).uncache = 1;
      }
    };

    const measureShell = () => {
      const bounds = root.getBoundingClientRect();
      return Object.freeze({
        width: bounds.width,
        height: bounds.height,
        borderRadius: window.getComputedStyle(root).borderRadius
      });
    };

    const restoreShellSnapshot = () => {
      const capturedSnapshot = shellSnapshot;
      shellSnapshot = null;
      if (!capturedSnapshot) return;
      restoreInlineProperties(root, capturedSnapshot.layout);
    };

    const cancelLayoutRelease = () => {
      if (!layoutReleaseFrame) return;
      cancelAnimationFrame(layoutReleaseFrame);
      layoutReleaseFrame = 0;
    };

    const killShellTimeline = () => {
      cancelLayoutRelease();
      const activeTimeline = shellTimeline;
      shellTimeline = null;
      if (activeTimeline) activeTimeline.kill();
      restoreShellSnapshot();
      root.classList.remove('is-nav-transitioning');
    };

    const setRootYZero = () => {
      rootYTarget = 0;
      gsapInstance.set(root, { y: 0 });
    };

    const completeShellTransition = (activeTimeline) => {
      if (destroyed || shellTimeline !== activeTimeline) return;
      shellTimeline = null;
      root.classList.toggle('is-nav-closed', shellTargetClosed);
      restoreShellSnapshot();
      setRootYZero();
      notifyLayoutChange();
      // scheduleGeometrySync is queued by the callback above. Keep the indicator
      // concealed until that frame has synchronized its final target geometry.
      layoutReleaseFrame = requestAnimationFrame(() => {
        layoutReleaseFrame = 0;
        if (!destroyed) root.classList.remove('is-nav-transitioning');
      });
    };

    const transitionShell = (closed) => {
      if (destroyed || !canClose()) return;
      const currentlyTargetsClosed = shellTimeline
        ? shellTargetClosed
        : root.classList.contains('is-nav-closed');
      if (currentlyTargetsClosed === closed) return;

      if (closed && typeof beforeClose === 'function') {
        try {
          beforeClose();
        } catch (error) {
          // An optional unfurl settlement failure must not hide the navigation.
          return;
        }
      }

      // Capture the rendered box before killing a reversed transition. Snapshot
      // restoration and the new start values happen synchronously before paint.
      const currentShell = measureShell();
      killShellTimeline();

      const layoutSnapshot = captureInlineProperties(root, layoutProperties);
      shellSnapshot = Object.freeze({ layout: layoutSnapshot });

      // Measure the class-authored target without inline layout values.
      layoutProperties.forEach((property) => root.style.removeProperty(property));
      root.classList.toggle('is-nav-closed', closed);
      shellTargetClosed = closed;
      const targetShell = measureShell();
      // During opening, retain compact child geometry until the root reaches
      // full width so HOME's authored label clip never collapses to zero.
      if (!closed) root.classList.add('is-nav-closed');
      notifyLayoutChange();

      root.style.setProperty('width', `${currentShell.width}px`);
      root.style.setProperty('height', `${currentShell.height}px`);
      root.style.setProperty('border-radius', currentShell.borderRadius);
      root.classList.add('is-nav-transitioning');
      setRootYZero();

      const activeTimeline = gsapInstance.timeline({
        paused: true,
        onComplete: () => completeShellTransition(activeTimeline)
      });
      shellTimeline = activeTimeline;
      activeTimeline.to(root, {
        width: targetShell.width,
        height: targetShell.height,
        borderRadius: targetShell.borderRadius,
        duration: .5,
        ease: 'expo.inOut'
      }, 0);
      activeTimeline.play(0);
    };

    const forceOpen = () => {
      if (destroyed) return;
      killShellTimeline();
      root.classList.remove('is-nav-closed', 'is-nav-transitioning');
      shellTargetClosed = false;
      setRootYZero();
      notifyLayoutChange();
    };

    const syncShellToSection = (reason) => {
      if (destroyed) return rootYTarget;
      if (!canClose()) forceOpen();
      else transitionShell(window.scrollY > openBelow);
      setRootYZero();
      return rootYTarget;
    };

    const requestVisible = (reason, holdMs = 0) => {
      if (destroyed) return rootYTarget;
      // On desktop the shell follows scroll position only; focus and clicks
      // never force it open.
      if (!canClose()) forceOpen();
      setRootYZero();
      return rootYTarget;
    };

    const requestHidden = (reason) => {
      if (destroyed) return rootYTarget;
      if (!canClose()) forceOpen();
      else transitionShell(true);
      setRootYZero();
      return rootYTarget;
    };

    const updateScrolledState = () => {
      root.classList.toggle('is-scrolled', window.scrollY > 40);
    };

    const handleScrollUpdate = () => {
      updateScrolledState();
      if (!canClose()) {
        forceOpen();
        return;
      }

      const y = window.scrollY;
      if (y <= openBelow) transitionShell(false);
      else if (y >= closeAbove) transitionShell(true);
      setRootYZero();
    };

    const handleFallbackScroll = () => handleScrollUpdate();

    const handleProfileChange = () => {
      if (destroyed) return;
      syncShellToSection('profile-change');
    };

    const handleResize = () => {
      if (destroyed) return;
      if (shellTimeline) killShellTimeline();
      if (!canClose()) forceOpen();
      else setRootYZero();
      notifyLayoutChange();
    };

    updateScrolledState();
    addMediaListener(desktopQuery, handleProfileChange);
    addMediaListener(reducedQuery, handleProfileChange);
    window.addEventListener('resize', handleResize, { passive: true });

    if (ScrollTrigger) {
      scrollTrigger = ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: handleScrollUpdate
      });
    } else {
      window.addEventListener('scroll', handleFallbackScroll, { passive: true });
    }

    handleProfileChange();

    const getRootYTarget = () => rootYTarget;
    const isClosed = () => root.classList.contains('is-nav-closed');

    const destroy = () => {
      if (destroyed) return;
      if (scrollTrigger) scrollTrigger.kill();
      scrollTrigger = null;
      window.removeEventListener('scroll', handleFallbackScroll);
      window.removeEventListener('resize', handleResize);
      removeMediaListener(desktopQuery, handleProfileChange);
      removeMediaListener(reducedQuery, handleProfileChange);
      killShellTimeline();
      root.classList.remove('is-nav-closed', 'is-nav-transitioning');
      shellTargetClosed = false;
      rootYTarget = 0;
      gsapInstance.set(root, { y: 0 });
      destroyed = true;
      notifyLayoutChange();
    };

    return { requestVisible, requestHidden, getRootYTarget, isClosed, destroy };
  }

  function createNavbarUnfurlController({ root, syncGeometry, syncIndicator, onEvent } = {}) {
    let phase = 'idle';
    let generation = 0;
    let completedCycles = 0;
    let timeline = null;
    let snapshot = null;
    let replayFrame = 0;
    let lastReason = null;
    let lastError = null;
    let loadStarted = false;

    const readTimelineMetric = (method) => {
      if (!timeline || typeof timeline[method] !== 'function') return null;
      try {
        const value = timeline[method]();
        return Number.isFinite(value) ? value : null;
      } catch (error) {
        return null;
      }
    };

    const createDiagnostic = (type, reason, details = {}) => Object.freeze({
      type,
      reason,
      time: performance.now(),
      phase,
      generation,
      completedCycles,
      activeAnimationCount: timeline ? 1 : 0,
      timelineDuration: readTimelineMetric('duration'),
      timelineProgress: readTimelineMetric('progress'),
      ...details
    });

    const emit = (type, reason, details) => {
      if (typeof onEvent !== 'function') return;
      try {
        onEvent(createDiagnostic(type, reason, details));
      } catch (error) {
        // Diagnostics are observational and must never affect navigation.
      }
    };

    const removeUnfurlingClass = () => {
      if (root && root.classList) root.classList.remove('is-unfurling');
    };

    const synchronizeIndicator = () => {
      if (typeof syncIndicator !== 'function') return;
      try {
        syncIndicator(false);
      } catch (error) {
        // Settling must remain fail-open if geometry has changed underneath the navbar.
      }
    };

    const restoreSnapshot = () => {
      const capturedSnapshot = snapshot;
      snapshot = null;
      if (!capturedSnapshot) return;
      try {
        restoreIntroProperties(capturedSnapshot);
      } catch (error) {
        // Continue to remove lifecycle state even if a descendant was externally replaced.
      }
    };

    const cancelPendingReplay = () => {
      if (!replayFrame) return;
      cancelAnimationFrame(replayFrame);
      replayFrame = 0;
    };

    const clearRun = (reason, { cancelReplay = true, emitCancel = false } = {}) => {
      if (cancelReplay) cancelPendingReplay();
      generation += 1;
      const activeTimeline = timeline;
      timeline = null;
      if (activeTimeline) {
        try {
          activeTimeline.kill();
        } catch (error) {
          // Snapshot restoration below is the authoritative cleanup path.
        }
      }
      restoreSnapshot();
      removeUnfurlingClass();
      synchronizeIndicator();
      phase = 'settled';
      lastReason = reason;
      if (emitCancel) emit('cancel', reason);
    };

    const complete = (activeGeneration, reason) => {
      if (activeGeneration !== generation || !timeline || phase !== 'running') return;
      timeline = null;
      restoreSnapshot();
      removeUnfurlingClass();
      synchronizeIndicator();
      completedCycles += 1;
      phase = 'settled';
      lastReason = reason;
      emit('complete', reason);
    };

    const cancel = (reason = 'cancel') => {
      if (phase === 'destroyed') return;
      clearRun(reason, { emitCancel: true });
    };

    const settle = (reason = 'settle') => {
      if (phase === 'destroyed') return;
      phase = 'settling';
      clearRun(reason, { emitCancel: true });
    };

    const start = (reason = 'load') => {
      if (phase === 'destroyed') return null;
      if (reason === 'load') {
        if (loadStarted) return null;
        loadStarted = true;
      }
      if (navReducedMotionQuery.matches) {
        settle('reduced-motion');
        return null;
      }

      cancelPendingReplay();
      if (timeline || snapshot || phase === 'running' || phase === 'preparing') {
        clearRun('replace', { cancelReplay: false, emitCancel: true });
      }

      const activeGeneration = ++generation;
      phase = 'preparing';
      lastReason = reason;

      let registry;
      let schedule;
      try {
        if (typeof syncGeometry === 'function') syncGeometry();
        registry = collectNavbarLayers(root, getNavbarProfile());
        schedule = deriveTimelineSchedule(registry.profile, registry);
        snapshot = captureIntroProperties(registry.participating);
        root.classList.add('is-unfurling');
        const activeTimeline = buildNavbarUnfurlTimeline({
          registry,
          schedule,
          onComplete: () => complete(activeGeneration, reason)
        });
        timeline = activeTimeline;
        phase = 'running';
        emit('start', reason);
        activeTimeline.play(0);
        return activeTimeline;
      } catch (error) {
        lastError = error && error.message ? error.message : String(error);
        clearRun('start-failed', { cancelReplay: false, emitCancel: true });
        return null;
      }
    };

    const replay = () => {
      if (phase === 'destroyed' || navReducedMotionQuery.matches) return null;
      if (replayFrame) return replayFrame;
      lastReason = 'replay';
      emit('replay', 'replay');
      replayFrame = requestAnimationFrame(() => {
        replayFrame = 0;
        if (phase !== 'destroyed' && !navReducedMotionQuery.matches) start('replay');
      });
      return replayFrame;
    };

    const destroy = () => {
      if (phase === 'destroyed') return;
      cancelPendingReplay();
      clearRun('destroy', { cancelReplay: false });
      phase = 'destroyed';
      lastReason = 'destroy';
      emit('destroy', 'destroy');
    };

    const getSnapshot = () => Object.freeze({
      phase,
      generation,
      completedCycles,
      activeAnimationCount: timeline ? 1 : 0,
      lastReason,
      lastError,
      timelineDuration: readTimelineMetric('duration'),
      timelineProgress: readTimelineMetric('progress')
    });

    return { start, replay, settle, cancel, destroy, getSnapshot };
  }

  function runIntro(animated) {
    if (!animated || navReducedMotionQuery.matches) {
      if (navbarUnfurlController) navbarUnfurlController.cancel('reduced-motion');
      gsap.set(['.hero-word', '.hero__statement', '.hero__scroll', '.hero__orb'], { clearProps: 'all' });
      return;
    }

    if (navbarUnfurlController) navbarUnfurlController.start('load');

    const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
    intro
      .from('.hero-word', { yPercent: 120, rotation: 4, duration: 1.15, stagger: .1 }, .05)
      .from('.hero__orb', { scale: 0, rotation: -90, duration: 1.1, ease: 'back.out(1.5)' }, .25)
      .from('.hero__statement > *', { y: 30, autoAlpha: 0, duration: .75, stagger: .1 }, .65)
      .from(['.hero__scroll', '.hero__serial'], { y: 20, autoAlpha: 0, duration: .6 }, .8);
  }

  function initMagneticLinks() {
    if (!window.matchMedia('(pointer: fine)').matches || prefersReducedMotion) return;

    selectAll('.magnetic').forEach((element) => {
      const xTo = gsap.quickTo(element, 'x', { duration: .5, ease: 'power3.out' });
      const yTo = gsap.quickTo(element, 'y', { duration: .5, ease: 'power3.out' });

      element.addEventListener('pointermove', (event) => {
        const bounds = element.getBoundingClientRect();
        xTo((event.clientX - bounds.left - bounds.width / 2) * .22);
        yTo((event.clientY - bounds.top - bounds.height / 2) * .22);
      });
      element.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  function initFloatingNav() {
    const header = select('.site-header[data-nav-root]');
    if (!header || navbarUnfurlController || scrollVisibilityController) return;

    const siteNav = select('.site-nav', header);
    const brand = select('.brand', header);
    const navItems = selectAll('.nav-item', header);
    const authoredLinks = selectAll('a', header);
    const seams = selectAll('[data-seam]', header);
    const indicators = siteNav ? selectAll('.nav-active-indicator', siteNav) : [];
    if (!siteNav || !brand || navItems.length !== 5 || authoredLinks.length < 6 ||
        seams.length !== 5 || indicators.length !== 1) return;

    const indicator = indicators[0];
    const sectionTriggers = [];
    const listenerCleanups = [];
    const hoverTweenTargets = [];
    const diagnosticEvents = [];
    const maxDiagnosticEntries = 36;
    let indicatorGeometry = null;
    let geometryFrame = 0;
    let tornDown = false;
    let debugHook = null;

    const setCurrent = (activeItem) => {
      const latestItem = navItems.includes(activeItem) ? activeItem : navItems[0];
      navItems.forEach((item) => {
        const isCurrent = item === latestItem;
        item.classList.toggle('is-current', isCurrent);
        if (isCurrent) item.setAttribute('aria-current', 'page');
        else item.removeAttribute('aria-current');
      });
      header.dispatchEvent(new CustomEvent('navcurrentchange', {
        detail: Object.freeze({ item: latestItem })
      }));
      return latestItem;
    };

    // Respect the page that marked itself current in markup; only fall back to
    // the first destination when nothing is authored.
    const authoredItem = navItems.find((item) => item.hasAttribute('aria-current'));
    const hashItem = window.location.hash
      ? navItems.find((item) => item.getAttribute('href') === window.location.hash)
      : null;
    setCurrent(hashItem || authoredItem || navItems[0]);

    const syncIndicator = (animated = false) => {
      const currentItems = navItems.filter((item) => item.hasAttribute('aria-current'));
      const currentItem = currentItems.length === 1 ? currentItems[0] : null;
      const x = indicatorGeometry && currentItem
        ? indicatorGeometry.xByItem.get(currentItem)
        : null;

      if (!Number.isFinite(x)) {
        header.classList.remove('nav-indicator-ready');
        return false;
      }

      if (animated && !navReducedMotionQuery.matches) {
        gsap.to(indicator, {
          x,
          xPercent: 0,
          duration: .08,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      } else {
        gsap.killTweensOf(indicator, 'x,xPercent');
        gsap.set(indicator, { x, xPercent: 0 });
      }
      header.classList.add('nav-indicator-ready');
      return true;
    };

    const syncGeometry = () => {
      // Read every box before writing CSS variables or inline indicator geometry.
      const rootBounds = header.getBoundingClientRect();
      const navBounds = siteNav.getBoundingClientRect();
      const brandBounds = brand.getBoundingClientRect();
      const itemBounds = navItems.map((item) => item.getBoundingClientRect());
      const firstBounds = itemBounds[0];
      const seamPositions = [brandBounds.right, itemBounds[0].right, itemBounds[1].right]
        .map((boundary) => boundary - rootBounds.left);
      const baseLeft = firstBounds.left - navBounds.left;
      const baseWidth = firstBounds.width;
      const xValues = itemBounds.map((bounds) => bounds.left - firstBounds.left);
      const measurements = [
        rootBounds.width,
        rootBounds.height,
        navBounds.width,
        navBounds.height,
        brandBounds.width,
        brandBounds.height,
        baseLeft,
        baseWidth,
        ...seamPositions,
        ...xValues
      ];
      const itemBoxesAreValid = itemBounds.every((bounds) => bounds.width > 0 && bounds.height > 0);
      const seamsAreOrdered = seamPositions.every((position, index) => (
        position > 0 && position < rootBounds.width &&
        (index === 0 || position > seamPositions[index - 1])
      ));
      const offsetsAreOrdered = xValues.every((value, index) => (
        index === 0 ? Math.abs(value) < .001 : value > xValues[index - 1]
      ));
      const indicatorTargetsFit = xValues.every((x) => {
        const targetLeft = baseLeft + x;
        return targetLeft >= -1 && targetLeft + baseWidth <= navBounds.width + 1;
      });
      const valid = rootBounds.width > 0 && rootBounds.height > 0 &&
        navBounds.width > 0 && navBounds.height > 0 &&
        brandBounds.width > 0 && brandBounds.height > 0 &&
        baseLeft >= 0 && baseWidth > 0 && baseLeft + baseWidth <= navBounds.width + 1 &&
        itemBoxesAreValid && seamsAreOrdered && offsetsAreOrdered && indicatorTargetsFit &&
        measurements.every(Number.isFinite);

      if (!valid) {
        indicatorGeometry = null;
        header.classList.remove('nav-indicator-ready');
        return false;
      }

      seams.forEach((seam, index) => {
        seam.style.setProperty('--seam-x', `${seamPositions[index]}px`);
      });
      indicator.style.left = `${baseLeft}px`;
      indicator.style.width = `${baseWidth}px`;
      indicatorGeometry = Object.freeze({
        baseLeft,
        baseWidth,
        xByItem: new Map(navItems.map((item, index) => [item, xValues[index]]))
      });
      return syncIndicator(false);
    };

    const scheduleGeometrySync = () => {
      if (geometryFrame || tornDown) return;
      geometryFrame = requestAnimationFrame(() => {
        geometryFrame = 0;
        if (!tornDown) syncGeometry();
      });
    };

    syncGeometry();

    scrollVisibilityController = createScrollVisibilityController({
      root: header,
      gsap,
      ScrollTrigger: hasScrollTrigger ? window.ScrollTrigger : null,
      onLayoutChange: syncGeometry,
      beforeClose: () => {
        if (!navbarUnfurlController) return;
        const snapshot = navbarUnfurlController.getSnapshot();
        if (snapshot.phase === 'preparing' || snapshot.phase === 'running' || snapshot.phase === 'settling') {
          navbarUnfurlController.settle('nav-close');
        }
      }
    });

    const recordDiagnostic = (diagnostic) => {
      const record = Object.freeze({
        generation: diagnostic.generation,
        event: diagnostic.type,
        reason: diagnostic.reason,
        time: diagnostic.time,
        phase: diagnostic.phase,
        completedCycles: diagnostic.completedCycles
      });
      diagnosticEvents.push(record);
      const generations = [...new Set(
        diagnosticEvents.filter(({ generation }) => generation > 0).map(({ generation }) => generation)
      )];
      if (generations.length > 6) {
        const retained = new Set(generations.slice(-6));
        for (let index = diagnosticEvents.length - 1; index >= 0; index -= 1) {
          if (diagnosticEvents[index].generation > 0 && !retained.has(diagnosticEvents[index].generation)) {
            diagnosticEvents.splice(index, 1);
          }
        }
      }
      if (diagnosticEvents.length > maxDiagnosticEntries) {
        diagnosticEvents.splice(0, diagnosticEvents.length - maxDiagnosticEntries);
      }
    };

    navbarUnfurlController = createNavbarUnfurlController({
      root: header,
      syncGeometry,
      syncIndicator,
      onEvent: recordDiagnostic
    });

    const handleCurrentChange = () => syncIndicator(true);
    header.addEventListener('navcurrentchange', handleCurrentChange);
    listenerCleanups.push(() => header.removeEventListener('navcurrentchange', handleCurrentChange));

    const handleFocusIn = (event) => {
      if (authoredLinks.includes(event.target)) {
        scrollVisibilityController.requestVisible('focus');
      }
    };
    header.addEventListener('focusin', handleFocusIn, true);
    listenerCleanups.push(() => header.removeEventListener('focusin', handleFocusIn, true));

    const handleActivation = (event) => {
      scrollVisibilityController.requestVisible('shell-activation', 2600);
      const eventElement = event.target instanceof Element ? event.target : event.target.parentElement;
      const link = eventElement ? eventElement.closest('a') : null;
      if (!link || !header.contains(link) || !authoredLinks.includes(link)) return;
      navbarUnfurlController.settle('activation');
      setCurrent(link === brand ? navItems[0] : link);
    };
    header.addEventListener('click', handleActivation, true);
    listenerCleanups.push(() => header.removeEventListener('click', handleActivation, true));

    if (!navReducedMotionQuery.matches && window.matchMedia('(pointer: fine)').matches) {
      navItems.forEach((item) => {
        const index = select('.nav-item__index', item);
        const labelClip = select('.nav-label__clip', item);
        if (!index || !labelClip) return;
        hoverTweenTargets.push(index, labelClip);
        const handlePointerEnter = () => {
          gsap.to(index, { rotation: 360, scale: 1.08, duration: .55, ease: 'back.out(1.7)', overwrite: 'auto' });
          gsap.to(labelClip, { x: 3, duration: .35, ease: 'power3.out', overwrite: 'auto' });
        };
        const handlePointerLeave = () => {
          gsap.to(index, { rotation: 0, scale: 1, duration: .5, ease: 'power3.out', overwrite: 'auto' });
          gsap.to(labelClip, { x: 0, duration: .4, ease: 'power3.out', overwrite: 'auto' });
        };
        item.addEventListener('pointerenter', handlePointerEnter);
        item.addEventListener('pointerleave', handlePointerLeave);
        listenerCleanups.push(() => {
          item.removeEventListener('pointerenter', handlePointerEnter);
          item.removeEventListener('pointerleave', handlePointerLeave);
        });
      });
    }

    if (hasScrollTrigger) {
      navItems.forEach((item) => {
        const href = item.getAttribute('href');
        if (!href || href.charAt(0) !== '#') return;
        const target = select(href);
        if (!target) return;
        sectionTriggers.push(window.ScrollTrigger.create({
          trigger: target,
          start: 'top 38%',
          end: 'bottom 38%',
          onEnter: () => setCurrent(item),
          onEnterBack: () => setCurrent(item)
        }));
      });
    }

    const desktopQuery = window.matchMedia('(min-width: 901px)');
    const addMediaListener = (query, listener) => {
      if (typeof query.addEventListener === 'function') query.addEventListener('change', listener);
      else query.addListener(listener);
    };
    const removeMediaListener = (query, listener) => {
      if (typeof query.removeEventListener === 'function') query.removeEventListener('change', listener);
      else query.removeListener(listener);
    };

    const handleReducedMotionChange = (event) => {
      if (event.matches) {
        navbarUnfurlController.cancel('reduced-motion');
        scrollVisibilityController.requestVisible('reduced-motion');
        syncGeometry();
      }
    };
    const handleDesktopChange = () => {
      const snapshot = navbarUnfurlController.getSnapshot();
      if (snapshot.phase === 'preparing' || snapshot.phase === 'running' || snapshot.phase === 'settling') {
        navbarUnfurlController.cancel('breakpoint');
      }
      scheduleGeometrySync();
    };
    addMediaListener(navReducedMotionQuery, handleReducedMotionChange);
    addMediaListener(desktopQuery, handleDesktopChange);
    listenerCleanups.push(() => {
      removeMediaListener(navReducedMotionQuery, handleReducedMotionChange);
      removeMediaListener(desktopQuery, handleDesktopChange);
    });

    window.addEventListener('resize', scheduleGeometrySync, { passive: true });
    listenerCleanups.push(() => window.removeEventListener('resize', scheduleGeometrySync));

    if (navReducedMotionQuery.matches) {
      navbarUnfurlController.cancel('reduced-motion');
      scrollVisibilityController.requestVisible('reduced-motion');
      syncGeometry();
    }

    if (window.__NAV_UNFURL_TEST__ === true) {
      debugHook = Object.freeze({
        replay: () => navbarUnfurlController && navbarUnfurlController.replay(),
        cancel: () => navbarUnfurlController && navbarUnfurlController.cancel('debug'),
        snapshot: () => navbarUnfurlController
          ? Object.freeze({ ...navbarUnfurlController.getSnapshot() })
          : null,
        eventLog: () => Object.freeze(diagnosticEvents.map((event) => Object.freeze({ ...event }))),
        activeAnimationCount: () => navbarUnfurlController
          ? navbarUnfurlController.getSnapshot().activeAnimationCount
          : 0,
        rootYTarget: () => scrollVisibilityController
          ? scrollVisibilityController.getRootYTarget()
          : 0,
        isClosed: () => scrollVisibilityController
          ? scrollVisibilityController.isClosed()
          : false,
        syncGeometry: () => !tornDown && syncGeometry()
      });
      window.__navUnfurlDebug = debugHook;
    }

    const teardown = () => {
      if (tornDown) return;
      tornDown = true;
      if (navbarUnfurlController) navbarUnfurlController.destroy();
      if (scrollVisibilityController) scrollVisibilityController.destroy();
      sectionTriggers.forEach((trigger) => trigger.kill());
      listenerCleanups.forEach((removeListener) => removeListener());
      gsap.killTweensOf(indicator, 'x,xPercent');
      if (hoverTweenTargets.length) gsap.killTweensOf(hoverTweenTargets);
      if (geometryFrame) cancelAnimationFrame(geometryFrame);
      geometryFrame = 0;
      if (window.__navUnfurlDebug === debugHook) delete window.__navUnfurlDebug;
      navbarUnfurlController = null;
      scrollVisibilityController = null;
      window.removeEventListener('pagehide', teardown);
    };

    window.addEventListener('pagehide', teardown, { once: true });
  }

  function initServicesDropdown() {
    const trigger = select('.site-header .nav-item[data-nav-cell="services"]');
    if (!trigger) return;

    const items = [
      ['/services/brand-identity.html', 'BRAND IDENTITY', 'NAMES AND SYSTEMS'],
      ['/services/web-design.html', 'WEB DESIGN', 'SITES THAT BEHAVE'],
      ['/services/motion.html', 'MOTION', 'MOVEMENT WITH INTENT'],
      ['/services/strategy.html', 'STRATEGY', 'THE ARGUMENT FIRST']
    ];

    const panel = document.createElement('div');
    panel.className = 'nav-drop';
    panel.id = 'services-menu';
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', 'Services');
    items.forEach(([href, name, note]) => {
      const link = document.createElement('a');
      link.href = href;
      link.innerHTML = '<strong></strong><span></span>';
      link.firstChild.textContent = name;
      link.lastChild.textContent = note;
      panel.appendChild(link);
    });
    document.body.appendChild(panel);

    let open = false;
    let closeTimer = 0;

    const place = () => {
      const box = trigger.getBoundingClientRect();
      panel.style.left = `${Math.round(box.left)}px`;
      panel.style.top = `${Math.round(box.bottom + 8)}px`;
      panel.style.minWidth = `${Math.max(box.width, 240)}px`;
    };

    const show = () => {
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = 0; }
      if (open) return;
      open = true;
      place();
      panel.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
    };

    const hide = () => {
      if (!open) return;
      open = false;
      panel.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    };

    const hideSoon = () => {
      if (closeTimer) clearTimeout(closeTimer);
      closeTimer = window.setTimeout(hide, 180);
    };

    trigger.addEventListener('pointerenter', show);
    trigger.addEventListener('pointerleave', hideSoon);
    panel.addEventListener('pointerenter', show);
    panel.addEventListener('pointerleave', hideSoon);
    trigger.addEventListener('focus', show);
    panel.addEventListener('focusout', (event) => {
      if (!panel.contains(event.relatedTarget)) hide();
    });
    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') { event.preventDefault(); show(); panel.querySelector('a').focus(); }
    });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') hide(); });
    window.addEventListener('scroll', () => { if (open) place(); }, { passive: true });
    window.addEventListener('resize', () => { if (open) place(); }, { passive: true });
  }

  function initMobileMenu() {
    const burger = select('.nav-burger');
    const menu = select('[data-mobile-menu]');
    if (!burger || !menu) return;

    const closeButton = select('.mobile-menu__close', menu);
    const links = selectAll('a', menu);
    let open = false;
    let lastFocus = null;

    const setOpen = (next) => {
      if (next === open) return;
      open = next;
      burger.setAttribute('aria-expanded', String(next));
      body.classList.toggle('is-menu-open', next);
      if (next) {
        lastFocus = document.activeElement;
        menu.hidden = false;
        if (!navReducedMotionQuery.matches) {
          gsap.fromTo(menu, { autoAlpha: 0 }, { autoAlpha: 1, duration: .28, ease: 'power2.out' });
          gsap.fromTo(links,
            { y: 18, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: .34, stagger: .045, ease: 'power3.out', delay: .06 });
        }
        (closeButton || menu).focus({ preventScroll: true });
      } else {
        gsap.killTweensOf([menu, ...links]);
        gsap.set([menu, ...links], { clearProps: 'opacity,visibility,transform' });
        menu.hidden = true;
        if (lastFocus && lastFocus.isConnected) lastFocus.focus({ preventScroll: true });
      }
    };

    burger.addEventListener('click', () => setOpen(true));
    if (closeButton) closeButton.addEventListener('click', () => setOpen(false));

    // Navigating (router or full load) should leave the menu closed.
    links.forEach((link) => link.addEventListener('click', () => setOpen(false)));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && open) setOpen(false);
    });

    // Keep focus inside the panel while it is open.
    menu.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab' || !open) return;
      const focusable = [closeButton, ...links].filter(Boolean);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    // Leaving the mobile profile must not trap the page in a locked state.
    const desktop = window.matchMedia('(min-width: 901px)');
    const handleProfile = () => { if (desktop.matches) setOpen(false); };
    if (typeof desktop.addEventListener === 'function') desktop.addEventListener('change', handleProfile);
    else desktop.addListener(handleProfile);

    return { close: () => setOpen(false) };
  }

  function initRouter() {
    if (!window.history || !window.fetch || !window.DOMParser) return;
    if (!select('#main')) return;

    let busy = false;

    const routable = (link) => {
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return null;
      const href = link.getAttribute('href');
      if (!href || href.charAt(0) === '#') return null;
      let url;
      try {
        url = new URL(link.href, window.location.href);
      } catch (error) {
        return null;
      }
      if (url.origin !== window.location.origin) return null;
      if (!/\.html$/.test(url.pathname)) return null;
      return url;
    };

    const rebuild = () => {
      if (hasScrollTrigger) {
        // Drop triggers whose element left the document; the navbar shell
        // trigger has no element, so it survives every navigation.
        window.ScrollTrigger.getAll().forEach((trigger) => {
          const element = trigger.trigger;
          if (element && element.nodeType === 1 && !document.body.contains(element)) {
            trigger.kill();
          }
        });
      }
      initMagneticLinks();
      initHeroMotion();
      initOrbReaction();
      initManifesto();
      initHorizontalWork();
      initEyes();
      initServices();
      initProof();
      initContact();
      initProgress();
      initTilt();
      initSectionNav();
      if (hasScrollTrigger) window.ScrollTrigger.refresh();
    };

    const applyCurrent = (doc) => {
      const nextCurrent = doc.querySelector('.site-header .nav-item[aria-current]');
      const key = nextCurrent ? nextCurrent.dataset.navCell : null;
      selectAll('.site-header .nav-item').forEach((item) => {
        const isCurrent = item.dataset.navCell === key;
        item.classList.toggle('is-current', isCurrent);
        if (isCurrent) item.setAttribute('aria-current', 'page');
        else item.removeAttribute('aria-current');
      });
      // Mirror the same state in the mobile panel.
      const nextMenu = doc.querySelector('[data-mobile-menu]');
      const menu = select('[data-mobile-menu]');
      if (nextMenu && menu) {
        const wasHidden = menu.hidden;
        menu.innerHTML = nextMenu.innerHTML;
        menu.hidden = wasHidden;
        initMobileMenu();
      }
      const nextSections = doc.querySelector('[data-nav-sections]');
      const sections = select('[data-nav-sections]');
      if (nextSections && sections) sections.innerHTML = nextSections.innerHTML;
    };

    const go = (url, push) => {
      if (busy) return;
      busy = true;
      window.fetch(url.href, { credentials: 'same-origin' })
        .then((response) => {
          if (!response.ok) throw new Error('route status ' + response.status);
          return response.text();
        })
        .then((html) => {
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const nextMain = doc.querySelector('#main');
          if (!nextMain) throw new Error('route has no main');

          select('#main').replaceWith(nextMain);
          document.title = doc.title;
          document.body.className = doc.body.className;
          applyCurrent(doc);
          if (push) window.history.pushState({ router: true }, '', url.href);
          window.scrollTo({ top: 0, behavior: 'instant' });
          rebuild();
          if (!navReducedMotionQuery.matches) {
            gsap.fromTo('#main', { opacity: 0, y: 14 },
              { opacity: 1, y: 0, duration: .42, ease: 'power2.out', clearProps: 'opacity,transform' });
          }
          const focusTarget = select('#main');
          if (focusTarget) focusTarget.setAttribute('tabindex', '-1');
          busy = false;
        })
        .catch(() => {
          // Fail open: fall back to a normal page load.
          busy = false;
          window.location.href = url.href;
        });
    };

    document.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const element = event.target instanceof Element ? event.target : null;
      const link = element ? element.closest('a') : null;
      const url = routable(link);
      if (!url) return;

      if (url.pathname === window.location.pathname) {
        // Already here: never reload, just return to the top.
        if (!url.hash) {
          event.preventDefault();
          window.scrollTo({ top: 0, behavior: navReducedMotionQuery.matches ? 'instant' : 'smooth' });
        }
        return;
      }
      event.preventDefault();
      go(url, true);
    });

    window.addEventListener('popstate', () => {
      go(new URL(window.location.href), false);
    });
  }

  function initSectionNav() {
    const links = selectAll('.site-header .nav-sec');
    if (!links.length) return;
    // Visual position only. aria-current="page" belongs to the page link,
    // so section markers must not add a second current element.
    const mark = (active) => links.forEach((link) => {
      link.classList.toggle('is-current', link === active);
    });
    mark(links[0]);

    // The header owns its scroll/shell state, and clicking a compact section
    // link reopens the shell. That layout change lands in the same frame as
    // the browser's native hash jump and cancels it. So take ownership of the
    // scroll: prevent the default jump, then scroll after the next frame.
    const headerEl = select('.site-header[data-nav-root]');
    const smooth = !navReducedMotionQuery.matches;
    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (!href || href.charAt(0) !== '#') return;
      link.addEventListener('click', (event) => {
        const target = select(href);
        if (!target) return;
        event.preventDefault();
        mark(link);
        // Let any shell/layout reaction settle, then scroll to the measured top.
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const headerH = headerEl ? headerEl.getBoundingClientRect().height : 0;
          const top = target.getBoundingClientRect().top + window.scrollY - headerH - 24;
          window.scrollTo({ top: Math.max(top, 0), behavior: smooth ? 'smooth' : 'instant' });
        }));
      });
    });

    if (!hasScrollTrigger) return;
    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (!href || href.charAt(0) !== '#') return;
      const target = select(href);
      if (!target) return;
      window.ScrollTrigger.create({
        trigger: target,
        start: 'top 38%',
        end: 'bottom 38%',
        onEnter: () => mark(link),
        onEnterBack: () => mark(link)
      });
    });
  }

  function initHeroMotion() {
    if (prefersReducedMotion || !hasScrollTrigger) return;

    gsap.to('.hero__grid', {
      yPercent: 18,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 }
    });

    gsap.to('.hero__orb', {
      yPercent: 130,
      rotation: 170,
      scale: .7,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 }
    });

    gsap.to('.hero__title', {
      yPercent: -25,
      scale: .92,
      autoAlpha: .1,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: '35% top', end: 'bottom top', scrub: 1 }
    });
  }

  function initOrbReaction() {
    // Teardown first rather than early return: rebuild() legitimately re-runs
    // this against a replacement orb, and the previous controller still holds
    // listeners pointed at the detached element.
    if (orbReactionController) orbReactionController.destroy();
    orbReactionController = null;

    const control = select('.hero__orb');
    if (!control || !hasGSAP) return;

    const listenerCleanups = [];
    let tornDown = false;

    const inlinePropertyNames = (element) => Array.from(
      { length: element.style.length },
      (_, index) => element.style.item(index)
    );

    // Authored_Layer_State, read before the reaction writes anything. Value,
    // priority and absence are all recorded, so teardown can put each property
    // back exactly as the stylesheet author left it.
    const captureInlineState = (element) => Object.freeze({
      element,
      hadStyleAttribute: element.hasAttribute('style'),
      properties: Object.freeze(inlinePropertyNames(element).map((property) => Object.freeze({
        property,
        value: element.style.getPropertyValue(property),
        priority: element.style.getPropertyPriority(property)
      })))
    });

    const reactionLayers = ORB_REACTION_LAYER_SELECTORS
      .map((selector) => select(selector, control))
      .filter(Boolean);
    const authoredInlineState = Object.freeze(reactionLayers.map(captureInlineState));

    // Property-level restoration rather than clearProps: clearProps would also
    // erase inline values the reaction never created, and the playbook treats
    // that as destroying state the author owns.
    const restoreInlineState = () => {
      authoredInlineState.forEach(({ element, hadStyleAttribute, properties }) => {
        if (!element || !element.isConnected) return;
        const authored = new Map(properties.map(({ property, value, priority }) => [
          property,
          { value, priority }
        ]));
        // Read the current names first; removing a property reindexes the
        // declaration that is being walked.
        inlinePropertyNames(element).forEach((property) => {
          if (!authored.has(property)) element.style.removeProperty(property);
        });
        authored.forEach(({ value, priority }, property) => {
          element.style.setProperty(property, value, priority);
        });
        // An element that carried no style attribute keeps none, so absence is
        // restored as faithfully as a value is.
        if (!hadStyleAttribute && element.style.length === 0) element.removeAttribute('style');
        // Direct inline restoration is authoritative; make CSSPlugin re-read it
        // on the next transform tween instead of resuming from the components it
        // cached while the reaction owned the element.
        if (gsap.core && typeof gsap.core.getCache === 'function') {
          gsap.core.getCache(element).uncache = 1;
        }
      });
    };

    // Motion model: one plain velocity proxy per blade, advanced by a single
    // ticker callback. The interpolated quantity lives on the proxy, not on the
    // element, so no GSAP animation ever targets a blade wrapper and the blade
    // `rotation` channel keeps exactly one writer.
    const blades = ORB_BLADE_MOTION
      .map(({ selector, idleVelocity, engagedVelocity }) => {
        const element = select(selector, control);
        if (!element) return null;
        return {
          element,
          idleVelocity,
          engagedVelocity,
          // Latched by the velocity tween's own per-frame callback the first
          // time this blade reaches the settle threshold of the phase in
          // flight. Reset on every phase entry, so an interrupted transition
          // cannot inherit the previous one's arrival.
          settled: false,
          // `current` is the tweened value, `angle` is the unbounded
          // accumulator. Never resetting `angle` is what makes a velocity
          // change continuous in position.
          velocity: { current: idleVelocity, angle: 0 },
          setRotation: gsap.quickSetter(element, 'rotation', 'deg')
        };
      })
      .filter(Boolean);
    const velocityProxies = blades.map((blade) => blade.velocity);

    // Label_Agitation follows the same shape as the blades: the interpolated
    // quantity is the amplitude on a plain proxy, and the DOM write is a
    // quickSetter driven from the one ticker callback below. A repeating
    // `yoyo` tween on the element would have been the obvious alternative and
    // is rejected for a specific reason: it would put a second mechanism on
    // `.orb__label-motion`'s `y` channel the moment the amplitude had to change,
    // because the amplitude is the tween's own endpoint.
    const labelMotion = select('.orb__label-motion', control);
    const setLabelY = labelMotion ? gsap.quickSetter(labelMotion, 'y', 'px') : null;
    const agitation = { amplitude: 0, hz: ORB_LABEL_AGITATION_HZ };
    let labelPhase = 0;
    let labelOffset = 0;

    let tickerActive = false;
    // Flipped by the pause-on-hidden / pause-on-offscreen work; the gate exists
    // here so the ticker has one place that decides whether it may run.
    let paused = false;

    // Shares the blades' callback rather than adding a second ticker entry, so
    // the reaction still executes exactly one Animation_Frame callback and
    // Paused_State stays directly observable as a callback count of zero.
    const advanceLabelAgitation = (dt) => {
      if (!setLabelY) return;
      // Phase is pinned to 0 whenever the amplitude is 0, so an oscillation
      // always enters at sin(0) and the label starts from the translation it is
      // already holding. Left free-running, the amplitude latching on would step
      // the label to an arbitrary point in the cycle, up to the full peak in one
      // frame.
      if (agitation.amplitude === 0) labelPhase = 0;
      else labelPhase += dt;
      const offset = agitation.amplitude * Math.sin(labelPhase * ORB_TAU * agitation.hz);
      // Skipping the unchanged write is what keeps Idle_State honest: with the
      // amplitude at 0 the offset never changes, so no inline transform is
      // written on the label at all and Authored_Layer_State is untouched rather
      // than merely re-stated as `translate(0px, 0px)`.
      if (offset === labelOffset) return;
      labelOffset = offset;
      setLabelY(offset);
    };

    const tick = (time, deltaTime) => {
      const dt = Math.min(deltaTime, ORB_MAX_FRAME_DELTA_MS) / 1000;
      for (let index = 0; index < blades.length; index += 1) {
        const blade = blades[index];
        blade.velocity.angle += blade.velocity.current * dt;
        blade.setRotation(blade.velocity.angle);
      }
      advanceLabelAgitation(dt);
    };

    // Guarded so a double call cannot register the callback twice; GSAP's ticker
    // would happily hold two references and advance the accumulator at double
    // rate, which reads as a speed discontinuity at the moment of the second add.
    const startTicker = () => {
      if (tornDown || tickerActive || !blades.length) return false;
      if (paused || navReducedMotionQuery.matches) return false;
      gsap.ticker.add(tick);
      tickerActive = true;
      return true;
    };

    // Removing rather than flagging is deliberate: add/remove re-establishes the
    // ticker's delta baseline, so resuming after a hidden tab or an offscreen
    // orb cannot apply the whole elapsed interval as one frame delta.
    const stopTicker = () => {
      if (!tickerActive) return false;
      gsap.ticker.remove(tick);
      tickerActive = false;
      return true;
    };

    // Idle / Ramp_Up / Engaged / Ease_Down. `phase` is written in exactly three
    // places: the two transition entry points below, which are driven only by a
    // change in the Engagement_Source set's emptiness, and the settle latch,
    // which only ever advances a transition to its resting state. Nothing else
    // assigns it, so no two code paths can disagree about the current state.
    let phase = 'idle';
    let phaseStartedAt = 0;
    let rampUpDurationMs = 0;
    let easeDownDurationMs = 0;

    // Measured on the rendered velocity rather than read off the tween's
    // progress: a retarget mid-flight moves where the tween lands, so progress
    // and arrival are different questions.
    const settleReached = (blade) => (phase === 'easeDown'
      ? Math.abs(Math.abs(blade.velocity.current) - Math.abs(blade.idleVelocity))
        <= ORB_EASE_DOWN_SETTLE_FRACTION * Math.abs(blade.idleVelocity)
      : Math.abs(blade.velocity.current)
        >= ORB_RAMP_UP_SETTLE_FRACTION * Math.abs(blade.engagedVelocity));

    // Called from the velocity tween's own frame callback, so "first frame at
    // which the threshold is reached" is literal. Driving this from the tween
    // rather than from the reaction's ticker matters: the ticker is removed
    // under pause and reduced motion, and a transition must still be able to
    // reach its resting state while it is gone.
    const noteSettled = (blade) => {
      if (blade.settled || (phase !== 'rampUp' && phase !== 'easeDown')) return;
      if (!settleReached(blade)) return;
      blade.settled = true;
      if (!blades.every((entry) => entry.settled)) return;
      const elapsed = performance.now() - phaseStartedAt;
      if (phase === 'easeDown') {
        easeDownDurationMs = elapsed;
        phase = 'idle';
      } else {
        rampUpDurationMs = elapsed;
        phase = 'engaged';
      }
    };

    // Tweens a plain object, never a DOM node, so the blade `rotation` channel
    // keeps exactly one writer no matter how many of these are in flight.
    const retargetVelocity = (blade, target, duration) => {
      gsap.to(blade.velocity, {
        current: target,
        duration,
        ease: 'power1.out',
        overwrite: true,
        onUpdate: () => noteSettled(blade),
        onComplete: () => noteSettled(blade)
      });
    };

    const beginRampUp = () => {
      phase = 'rampUp';
      phaseStartedAt = performance.now();
      rampUpDurationMs = 0;
      // Reduced_Motion_Mode holds every blade at 0 deg/s (Requirement 8
      // acceptance criterion 1), so there is no velocity spin to run: pin the
      // proxy to 0 and settle straight into Engaged_State. The ticker is already
      // held off by startTicker's guard, so the angle never advances.
      if (navReducedMotionQuery.matches) {
        blades.forEach((blade) => {
          blade.settled = true;
          gsap.killTweensOf(blade.velocity);
          blade.velocity.current = 0;
        });
        rampUpDurationMs = 0;
        phase = 'engaged';
        return;
      }
      blades.forEach((blade) => {
        blade.settled = false;
        const fullRange = Math.abs(blade.engagedVelocity) - Math.abs(blade.idleVelocity);
        const remaining = Math.abs(blade.engagedVelocity) - Math.abs(blade.velocity.current);
        // From Idle_State this fraction is exactly 1, so the ramp asks for the
        // full ORB_RAMP_UP_DURATION and the ceiling below hands back 420 ms.
        // Re-engaging mid-Ease_Down starts from the value rendered in the
        // preceding frame, so the ramp is shortened by however much of the
        // idle-to-engaged range the coast has not yet given back; the ceiling
        // stops binding once that fraction drops under 0.84. Same formula covers
        // both, which is why there is no separate interrupt path.
        const fraction = fullRange > 0
          ? Math.min(Math.max(remaining / fullRange, 0), 1)
          : 0;
        const duration = Math.min(
          ORB_RAMP_UP_DURATION * fraction,
          ORB_RAMP_UP_MAX_MS / 1000
        );
        retargetVelocity(blade, blade.engagedVelocity, duration);
      });
    };

    const beginEaseDown = () => {
      phase = 'easeDown';
      phaseStartedAt = performance.now();
      easeDownDurationMs = 0;
      // Under Reduced_Motion_Mode the blades were never spun, so there is
      // nothing to coast: hold at 0 and settle back to Idle_State in place.
      if (navReducedMotionQuery.matches) {
        blades.forEach((blade) => {
          blade.settled = true;
          gsap.killTweensOf(blade.velocity);
          blade.velocity.current = 0;
        });
        easeDownDurationMs = 0;
        phase = 'idle';
        return;
      }
      blades.forEach((blade) => {
        blade.settled = false;
        // Released mid-Ramp_Up this retargets from the rendered value too, so
        // the reversal is continuous in velocity without waiting for the ramp
        // tween to finish first.
        retargetVelocity(blade, blade.idleVelocity, ORB_EASE_DOWN_DURATION);
      });
    };

    // Angry_Signature. Aperture, emission and glow are DOM channels and move on
    // one tween per layer; Label_Agitation is the amplitude proxy above.
    // Each layer keeps both its full channel set and an opacity-only subset:
    // under Reduced_Motion_Mode only Ring_Emission and Glow_Surge opacity move,
    // so aperture (scaleX/scaleY), glow scale and Label_Agitation are dropped
    // by handing the engage/release path the reduced subset instead of the full
    // one. A layer whose reduced subset is empty (none, since every angry layer
    // carries opacity today) is simply skipped in that mode.
    const angryLayers = ORB_ANGRY_LAYERS
      .map(({ selector, channels }) => {
        const element = select(selector, control);
        if (!element) return null;
        const reducedChannels = channels.filter((channel) => channel.property === 'opacity');
        return { element, channels, reducedChannels };
      })
      .filter(Boolean);

    const mobileLayoutQuery = window.matchMedia(ORB_MOBILE_LAYOUT_QUERY);
    // Read when the peak is latched rather than cached at init, so a viewport
    // that crosses the breakpoint between engagements picks up the new value
    // without a resize listener and without a geometry read.
    const labelAgitationPeak = () => (mobileLayoutQuery.matches
      ? ORB_LABEL_AGITATION_PEAK_MOBILE_PX
      : ORB_LABEL_AGITATION_PEAK_PX);

    // `overwrite: true` is what makes an interrupted transition correct without a
    // separate interrupt path: it kills the tween in flight on that layer and the
    // replacement starts from the value rendered in the preceding frame, rather
    // than queueing behind the engage tween or snapping to an endpoint.
    const angryVars = (channels, endpoint, duration) => {
      const vars = { duration, ease: ORB_ANGRY_EASE, overwrite: true };
      channels.forEach((channel) => { vars[channel.property] = channel[endpoint]; });
      return vars;
    };

    // Scheduled on the engage tween's own timeline rather than a setTimeout, so
    // "once the engage tween has completed" is the tween's completion boundary
    // and not a wall-clock offset that can drift away from it.
    let labelAgitationStart = null;

    const cancelLabelAgitationStart = () => {
      if (!labelAgitationStart) return false;
      labelAgitationStart.kill();
      labelAgitationStart = null;
      return true;
    };

    const startLabelAgitation = () => {
      labelAgitationStart = null;
      if (tornDown || !setLabelY || !anySourceActive()) return false;
      // A release ease from an earlier engagement can still be running on the
      // proxy; it has to stop before the peak is latched or it would keep
      // writing its decaying value over the top of it.
      gsap.killTweensOf(agitation);
      agitation.amplitude = labelAgitationPeak();
      return true;
    };

    // Under Reduced_Motion_Mode the engage/release path swaps to the opacity-only
    // channel subset and the 150 ms duration, and it never starts Label_Agitation.
    // The picker is a function rather than a captured flag so a preference change
    // mid-engagement is honoured by the next engage or release without re-wiring.
    const angryChannelsFor = (layer) => (navReducedMotionQuery.matches ? layer.reducedChannels : layer.channels);
    const angryDuration = (motionDuration) => (navReducedMotionQuery.matches
      ? ORB_REDUCED_MOTION_DURATION
      : motionDuration);

    const orbVisual = select('.orb__reaction', control);
    let orbExitTimeline = null;

    const stopOrbExit = () => {
      if (orbExitTimeline) orbExitTimeline.kill();
      orbExitTimeline = null;
      if (orbVisual) gsap.killTweensOf(orbVisual);
    };

    const engageOrbExit = () => {
      if (!orbVisual) return;
      stopOrbExit();
      if (navReducedMotionQuery.matches) {
        gsap.set(orbVisual, { yPercent: 0, rotation: 0, scale: 1 });
        return;
      }
      // First the entire visual winds up in place, then it loses containment and
      // drops well beyond the hero while continuing to spin in the same direction.
      orbExitTimeline = gsap.timeline();
      orbExitTimeline
        .to(orbVisual, {
          rotation: '+=1800',
          scale: 1.12,
          duration: .5,
          ease: 'none',
          overwrite: true
        })
        .to(orbVisual, {
          yPercent: 700,
          rotation: '+=720',
          scale: .72,
          duration: .52,
          ease: 'power4.in'
        });
    };

    const releaseOrbExit = () => {
      if (!orbVisual) return;
      stopOrbExit();
      gsap.to(orbVisual, {
        yPercent: 0,
        rotation: 0,
        scale: 1,
        duration: navReducedMotionQuery.matches ? ORB_REDUCED_MOTION_DURATION : .7,
        ease: navReducedMotionQuery.matches ? ORB_ANGRY_EASE : 'back.out(1.35)',
        overwrite: true
      });
    };

    const engageAngrySignature = () => {
      const duration = angryDuration(ORB_ANGRY_ENGAGE_DURATION);
      angryLayers.forEach((layer) => {
        const channels = angryChannelsFor(layer);
        if (!channels.length) return;
        gsap.to(layer.element, angryVars(channels, 'engaged', duration));
      });
      // The label is intentionally motionless. The wrapper carries every visible
      // layer through one violent spin-and-drop sequence instead.
      cancelLabelAgitationStart();
      gsap.killTweensOf(agitation);
      agitation.amplitude = 0;
      engageOrbExit();
    };

    const releaseAngrySignature = () => {
      const duration = angryDuration(ORB_ANGRY_RELEASE_DURATION);
      angryLayers.forEach((layer) => {
        const channels = angryChannelsFor(layer);
        if (!channels.length) return;
        gsap.to(layer.element, angryVars(channels, 'idle', duration));
      });
      cancelLabelAgitationStart();
      gsap.killTweensOf(agitation);
      agitation.amplitude = 0;
      releaseOrbExit();
    };

    // Engagement_Source detection. Four independent flags rather than a state
    // variable, so a second source arriving while the set is already non-empty
    // is a no-op by construction and cannot reset ramp progress.
    const sources = { hover: false, contact: false, keyboard: false, hold: false };
    const finePointerQuery = window.matchMedia('(pointer: fine)');
    const anySourceActive = () => ORB_ENGAGEMENT_SOURCES.some((name) => sources[name]);

    let holdTimer = 0;
    let keyboardWindowTimer = 0;
    let contactTracking = false;
    let contactStartX = 0;
    let contactStartY = 0;
    let contactStartTime = 0;

    // The single place a change in the set's emptiness is observed. Every
    // handler below routes through setSource / clearSource rather than deciding
    // state for itself, so the Keyboard_Engagement_Window expiring and a
    // pointer leaving arrive here as the same event: the last source cleared.
    const handleEngagementChange = () => {
      const engaging = anySourceActive();
      // The blade guard covers the blade wrappers only. The Angry_Signature runs
      // on the rings, the glow and the label, so missing blade markup must not
      // take it down with it.
      if (blades.length) {
        if (engaging) beginRampUp();
        else beginEaseDown();
      }
      if (engaging) engageAngrySignature();
      else releaseAngrySignature();
    };

    const applySource = (name, active) => {
      if (tornDown || sources[name] === active) return false;
      const wasActive = anySourceActive();
      sources[name] = active;
      if (wasActive !== anySourceActive()) handleEngagementChange();
      return true;
    };

    const setSource = (name) => applySource(name, true);
    const clearSource = (name) => applySource(name, false);

    // Hover is gated to a real mouse over a fine pointer, which is how
    // coarse-pointer devices stay out of the hover source entirely.
    const handlePointerEnter = (event) => {
      if (event.pointerType !== 'mouse' || !finePointerQuery.matches) return;
      setSource('hover');
    };

    // Asymmetric gate, deliberately: leaving is only ever allowed to end
    // engagement, so the media query is not re-tested here. If the pointer
    // profile changed while the cursor sat on the orb, re-testing it would pin
    // `hover` on with nothing left to clear it.
    const handlePointerLeave = (event) => {
      if (event.pointerType !== 'mouse') return;
      clearSource('hover');
    };

    // Bound to `window` rather than the control, and only while a contact is
    // live: a finger that slides or lifts outside the orb must still be seen,
    // and without pointer capture the control's own events stop arriving.
    const startContactTracking = () => {
      if (contactTracking) return false;
      window.addEventListener('pointermove', handleContactMove);
      window.addEventListener('pointerup', handleContactUp);
      window.addEventListener('pointercancel', handleContactCancel);
      contactTracking = true;
      return true;
    };

    // Idempotent, so `destroy` and the contact-end paths can both call it.
    const stopContactTracking = () => {
      if (!contactTracking) return false;
      window.removeEventListener('pointermove', handleContactMove);
      window.removeEventListener('pointerup', handleContactUp);
      window.removeEventListener('pointercancel', handleContactCancel);
      contactTracking = false;
      return true;
    };

    const endContact = () => {
      stopContactTracking();
      clearSource('contact');
    };

    const clearHoldTimer = () => {
      if (!holdTimer) return false;
      window.clearTimeout(holdTimer);
      holdTimer = 0;
      return true;
    };

    const startHold = () => {
      clearHoldTimer();
      holdTimer = window.setTimeout(() => {
        holdTimer = 0;
        clearSource('hold');
      }, ORB_MINIMUM_ENGAGEMENT_HOLD_MS);
      setSource('hold');
    };

    const handlePointerDown = (event) => {
      contactStartX = event.clientX;
      contactStartY = event.clientY;
      contactStartTime = event.timeStamp;
      // Contact is set before the stale hold is dropped. The reverse order
      // would empty the source set between the two writes and hand the state
      // machine a spurious release on a double tap.
      setSource('contact');
      clearHoldTimer();
      clearSource('hold');
      startContactTracking();
    };

    // Only `clientX`/`clientY` are read, both free of layout cost.
    const handleContactMove = (event) => {
      if (!sources.contact) {
        stopContactTracking();
        return;
      }
      const dx = event.clientX - contactStartX;
      const dy = event.clientY - contactStartY;
      if (Math.hypot(dx, dy) <= ORB_CONTACT_CANCEL_DISTANCE_PX) return;
      endContact();
    };

    const handleContactUp = (event) => {
      if (!sources.contact) {
        stopContactTracking();
        return;
      }
      // Same ordering rule as `handlePointerDown`: the hold is set before the
      // contact clears, so a short tap never leaves the set empty for a frame.
      if (event.timeStamp - contactStartTime < ORB_MINIMUM_ENGAGEMENT_HOLD_MS) startHold();
      endContact();
    };

    // A cancelled gesture is the browser claiming the pan. No hold is owed.
    const handleContactCancel = () => {
      endContact();
    };

    const clearKeyboardWindowTimer = () => {
      if (!keyboardWindowTimer) return false;
      window.clearTimeout(keyboardWindowTimer);
      keyboardWindowTimer = 0;
      return true;
    };

    const handleKeyDown = (event) => {
      // Any other key leaves the source set and the browser's own handling of
      // that key completely alone.
      if (!ORB_ENGAGEMENT_KEYS.has(event.key)) return;
      // Auto-repeats are not filtered: each one restarts the window at its full
      // duration. No preventDefault() anywhere, because a native button already
      // consumes Space without scrolling the document.
      clearKeyboardWindowTimer();
      keyboardWindowTimer = window.setTimeout(() => {
        keyboardWindowTimer = 0;
        clearSource('keyboard');
      }, ORB_KEYBOARD_ENGAGEMENT_WINDOW_MS);
      setSource('keyboard');
    };

    const handleBlur = () => {
      clearKeyboardWindowTimer();
      clearSource('keyboard');
    };

    // Reduced_Motion_Mode live switching. Same helper shape initFloatingNav uses,
    // registered against the module-scoped navReducedMotionQuery (the live query,
    // never the one-shot prefersReducedMotion boolean captured at load).
    const addMediaListener = (query, listener) => {
      if (typeof query.addEventListener === 'function') query.addEventListener('change', listener);
      else query.addListener(listener);
    };
    const removeMediaListener = (query, listener) => {
      if (typeof query.removeEventListener === 'function') query.removeEventListener('change', listener);
      else query.removeListener(listener);
    };

    // Latched while the settle-to-zero tween is in flight so a second change
    // event that re-enables motion before it completes cannot leave a stale
    // onComplete removing the ticker after it has just been re-added.
    let reducedMotionSettleTween = null;
    const killReducedMotionSettle = () => {
      if (!reducedMotionSettleTween) return;
      reducedMotionSettleTween.kill();
      reducedMotionSettleTween = null;
    };

    const handleReducedMotionChange = (event) => {
      if (tornDown) return;
      if (event.matches) {
        // Query now matches: bring every blade to 0 deg/s over 150 ms
        // (Requirement 8 acceptance criterion 5), then remove the ticker once
        // that tween completes so re-enabling later re-establishes the delta
        // baseline through gsap.ticker.add. The Angry_Signature, if engaged,
        // retargets to its opacity-only reduced form at the same 150 ms.
        killReducedMotionSettle();
        gsap.killTweensOf(velocityProxies);
        const proxies = velocityProxies.slice();
        if (proxies.length) {
          reducedMotionSettleTween = gsap.to(proxies, {
            current: 0,
            duration: ORB_REDUCED_MOTION_DURATION,
            ease: ORB_ANGRY_EASE,
            overwrite: true,
            onComplete: () => {
              reducedMotionSettleTween = null;
              stopTicker();
            }
          });
        } else {
          stopTicker();
        }
        // Re-apply the visual signature in its reduced form: if a source is
        // active, re-run engage against the opacity-only channels at 150 ms;
        // otherwise release. The blade phase is already correct either way.
        if (anySourceActive()) engageAngrySignature();
        else releaseAngrySignature();
      } else {
        // Query no longer matches. Cancel any in-flight settle-to-zero, put the
        // proxies at their targets with the accumulated angle left untouched,
        // and re-add the ticker so Idle_State resumes on the next frame
        // (Requirement 8 acceptance criterion 6).
        killReducedMotionSettle();
        gsap.killTweensOf(velocityProxies);
        const engaging = anySourceActive();
        blades.forEach((blade) => {
          blade.settled = true;
          blade.velocity.current = engaging ? blade.engagedVelocity : blade.idleVelocity;
        });
        phase = engaging ? 'engaged' : 'idle';
        // Re-run the full-motion signature at its normal durations so aperture,
        // glow scale and Label_Agitation come back.
        if (engaging) engageAngrySignature();
        else releaseAngrySignature();
        startTicker();
      }
    };
    addMediaListener(navReducedMotionQuery, handleReducedMotionChange);
    listenerCleanups.push(() => removeMediaListener(navReducedMotionQuery, handleReducedMotionChange));

    control.addEventListener('pointerenter', handlePointerEnter);
    listenerCleanups.push(() => control.removeEventListener('pointerenter', handlePointerEnter));

    control.addEventListener('pointerleave', handlePointerLeave);
    listenerCleanups.push(() => control.removeEventListener('pointerleave', handlePointerLeave));

    control.addEventListener('pointerdown', handlePointerDown);
    listenerCleanups.push(() => control.removeEventListener('pointerdown', handlePointerDown));

    // One entry covers the three window-level contact listeners: they are
    // registered and removed as a unit, and pushing on every contact would grow
    // the cleanup array once per tap.
    listenerCleanups.push(stopContactTracking);

    control.addEventListener('keydown', handleKeyDown);
    listenerCleanups.push(() => control.removeEventListener('keydown', handleKeyDown));

    control.addEventListener('blur', handleBlur);
    listenerCleanups.push(() => control.removeEventListener('blur', handleBlur));

    // The full snapshot surface belongs to the debug-hook task; this
    // placeholder keeps the controller shape stable and returns plain,
    // serialisable values only.
    const getSnapshot = () => Object.freeze({
      tornDown,
      listenerCleanupCount: listenerCleanups.length,
      layerCount: authoredInlineState.length,
      tickerActive,
      paused,
      motionMode: navReducedMotionQuery.matches ? 'reduced' : 'motion',
      phase,
      phaseStartedAt,
      rampUpDurationMs,
      easeDownDurationMs,
      settled: Object.freeze(blades.map((blade) => blade.settled)),
      velocities: Object.freeze(blades.map((blade) => blade.velocity.current)),
      angles: Object.freeze(blades.map((blade) => blade.velocity.angle)),
      sources: Object.freeze(ORB_ENGAGEMENT_SOURCES.filter((name) => sources[name])),
      engaged: anySourceActive(),
      contactTracking,
      angryLayerCount: angryLayers.length,
      // Proxy values only. Reading the rendered channels would mean a
      // getComputedStyle call, and the snapshot is not the place to introduce a
      // Forced_Layout the ticker is careful to avoid.
      labelAgitation: Object.freeze({
        amplitude: agitation.amplitude,
        hz: agitation.hz,
        peak: labelAgitationPeak(),
        offset: labelOffset,
        pendingStart: Boolean(labelAgitationStart)
      })
    });

    const destroy = () => {
      if (tornDown) return;
      tornDown = true;
      listenerCleanups.forEach((removeListener) => removeListener());
      // Pending timers outlive their listeners, so they are cancelled rather
      // than left to fire against a torn-down controller. The flags are reset
      // directly: `applySource` refuses to run once `tornDown` is set, and
      // teardown must not emit a state transition on its way out.
      clearHoldTimer();
      clearKeyboardWindowTimer();
      ORB_ENGAGEMENT_SOURCES.forEach((name) => { sources[name] = false; });
      // Stop every writer before handing the channels back. The ticker and any
      // in-flight velocity or angry tween all target values restoreInlineState()
      // is about to overwrite.
      stopTicker();
      cancelLabelAgitationStart();
      killReducedMotionSettle();
      if (velocityProxies.length) gsap.killTweensOf(velocityProxies);
      gsap.killTweensOf(agitation);
      if (reactionLayers.length) gsap.killTweensOf(reactionLayers);
      restoreInlineState();
      window.removeEventListener('pagehide', destroy);
      orbReactionController = null;
    };

    window.addEventListener('pagehide', destroy, { once: true });
    // A session that boots already in Reduced_Motion_Mode must present 0 deg/s
    // on every blade (Requirement 8 acceptance criterion 1). startTicker's guard
    // keeps the ticker off, but the proxies still hold their idle magnitudes, so
    // pin them to 0 up front; the change listener restores the idle target if
    // the preference is later cleared.
    if (navReducedMotionQuery.matches) {
      blades.forEach((blade) => { blade.velocity.current = 0; });
    }
    startTicker();
    orbReactionController = { destroy, getSnapshot };
  }

  function initManifesto() {
    const section = select('.manifesto');
    if (!section) return;

    const productLabels = selectAll('.manifesto-card__label', section);
    if (!section.dataset.productLabelsReady) {
      section.dataset.productLabelsReady = 'true';
      section.addEventListener('click', (event) => {
        const selectedLabel = event.target.closest('.manifesto-card__label');
        if (!selectedLabel || !section.contains(selectedLabel)) return;
        productLabels.forEach((label) => {
          label.setAttribute('aria-pressed', String(label === selectedLabel));
        });
      });
    }

    if (prefersReducedMotion || !hasScrollTrigger) return;

    const titleLines = selectAll('.manifesto__title-line', section);
    const intro = select('.manifesto__intro', section);
    const cards = selectAll('.manifesto-card', section);

    if (titleLines.length) {
      gsap.from(titleLines, {
        yPercent: 45,
        autoAlpha: 0,
        stagger: .08,
        scrollTrigger: { trigger: '.manifesto__head', start: 'top 86%', end: 'top 46%', scrub: .6 }
      });
    }

    if (intro) {
      gsap.from(intro, {
        y: 40,
        autoAlpha: 0,
        scrollTrigger: { trigger: intro, start: 'top 90%', end: 'top 62%', scrub: .5 }
      });
    }

    if (cards.length) {
      gsap.from(cards, {
        y: 110,
        autoAlpha: 0,
        rotation: (index) => (index === 1 ? 1.5 : -1.5),
        stagger: .08,
        transformOrigin: '50% 100%',
        scrollTrigger: { trigger: '.manifesto__cards', start: 'top 88%', end: 'top 48%', scrub: .65 }
      });
    }

    // The service pages reuse `.manifesto` for a different, editorial layout
    // (see #anti-manifesto in styles.css). Its entrance is scoped to those
    // elements so it runs only where they exist, and never on the homepage.
    const antiLead = select('.manifesto__lead', section);
    const antiBody = select('.manifesto__body', section);
    const antiFoot = select('.manifesto__foot', section);
    if (antiLead) {
      gsap.from(antiLead, {
        xPercent: -18,
        autoAlpha: 0,
        scrollTrigger: { trigger: antiLead, start: 'top 82%', end: 'top 48%', scrub: .7 }
      });
    }
    if (antiBody) {
      gsap.from(antiBody, {
        xPercent: 18,
        autoAlpha: 0,
        scrollTrigger: { trigger: antiBody, start: 'top 88%', end: 'top 48%', scrub: .7 }
      });
    }
    if (antiFoot) {
      gsap.from(antiFoot, {
        y: 70,
        autoAlpha: 0,
        scrollTrigger: { trigger: antiFoot, start: 'top 90%', end: 'top 68%', scrub: .5 }
      });
    }
    const antiAsterisk = select('.manifesto__asterisk', section);
    if (antiAsterisk) {
      gsap.to(antiAsterisk, {
        rotation: 260,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 1 }
      });
    }
  }

  function initHorizontalWork() {
    if (!hasScrollTrigger || prefersReducedMotion) return;

    const media = gsap.matchMedia();
    media.add('(min-width: 901px)', () => {
      const section = select('.work');
      const pin = select('.work__pin');
      const track = select('.work__track');
      const cards = selectAll('.project-card');
      const current = select('[data-work-current]');
      if (!section || !pin || !track) return undefined;

      const travel = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const horizontal = gsap.to(track, {
        x: () => -travel(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const index = Math.min(cards.length - 1, Math.floor(self.progress * cards.length));
            current.textContent = String(index + 1).padStart(2, '0');
          }
        }
      });

      cards.forEach((card) => {
        const visual = select('.project-visual', card);
        gsap.fromTo(visual,
          { xPercent: 12, rotation: 2 },
          {
            xPercent: -12,
            rotation: -2,
            ease: 'none',
            scrollTrigger: {
              trigger: card,
              containerAnimation: horizontal,
              start: 'left right',
              end: 'right left',
              scrub: true
            }
          }
        );
      });

      return () => {
        gsap.set(track, { clearProps: 'transform' });
      };
    });
  }

  function initEyes() {
    if (!window.matchMedia('(pointer: fine)').matches || prefersReducedMotion) return;
    const visual = select('.project-visual--eyes');
    if (!visual) return;
    const pupils = selectAll('.eye i', visual);

    visual.addEventListener('pointermove', (event) => {
      const bounds = visual.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width - .5) * 32;
      const y = ((event.clientY - bounds.top) / bounds.height - .5) * 22;
      gsap.to(pupils, { x, y, duration: .25, ease: 'power2.out', overwrite: 'auto' });
    });
    visual.addEventListener('pointerleave', () => gsap.to(pupils, { x: 0, y: 0, duration: .5, ease: 'power3.out' }));
  }

  function initServices() {
    if (prefersReducedMotion || !hasScrollTrigger) return;

    selectAll('.service-row').forEach((row) => {
      gsap.from(row.children, {
        y: 50,
        autoAlpha: 0,
        stagger: .06,
        duration: .8,
        ease: 'power3.out',
        scrollTrigger: { trigger: row, start: 'top 84%', toggleActions: 'play none none reverse' }
      });
    });
  }

  function initProof() {
    if (!hasScrollTrigger || prefersReducedMotion) return;

    gsap.from('.proof h2', {
      scale: .74,
      transformOrigin: 'left center',
      scrollTrigger: { trigger: '.proof', start: 'top bottom', end: '45% center', scrub: 1 }
    });

    selectAll('[data-count]').forEach((number) => {
      const target = Number(number.dataset.count);
      const counter = { value: 0 };
      gsap.to(counter, {
        value: target,
        duration: 1.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: number, start: 'top 82%', once: true },
        onUpdate: () => { number.textContent = Math.round(counter.value); }
      });
    });
  }

  function initContact() {
    if (!hasScrollTrigger || prefersReducedMotion) return;

    const timeline = gsap.timeline({
      scrollTrigger: { trigger: '.contact', start: 'top 70%', end: '55% 55%', scrub: 1 }
    });
    timeline
      .from('.contact h2 span:nth-child(1)', { xPercent: -35 }, 0)
      .from('.contact h2 span:nth-child(2)', { xPercent: 35 }, 0)
      .from('.contact h2 span:nth-child(3)', { xPercent: -35 }, 0);
  }

  function initProgress() {
    if (!hasScrollTrigger) return;
    gsap.to('.scroll-progress span', {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: .2 }
    });
  }

  function initTilt() {
    if (!window.matchMedia('(pointer: fine)').matches || prefersReducedMotion) return;
    selectAll('.project-card').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const bounds = card.getBoundingClientRect();
        const rx = ((event.clientY - bounds.top) / bounds.height - .5) * -3;
        const ry = ((event.clientX - bounds.left) / bounds.width - .5) * 3;
        gsap.to(card, { rotationX: rx, rotationY: ry, transformPerspective: 1000, duration: .45, ease: 'power2.out', overwrite: 'auto' });
      });
      card.addEventListener('pointerleave', () => gsap.to(card, { rotationX: 0, rotationY: 0, duration: .7, ease: 'power3.out' }));
    });
  }

  initFloatingNav();
  initSectionNav();
  initServicesDropdown();
  initMobileMenu();
  initRouter();
  runLoader();
  initMagneticLinks();
  initHeroMotion();
  initOrbReaction();
  initManifesto();
  initHorizontalWork();
  initEyes();
  initServices();
  initProof();
  initContact();
  initProgress();
  initTilt();

  if (hasScrollTrigger) {
    window.addEventListener('load', () => window.ScrollTrigger.refresh(), { once: true });
  }
})();
