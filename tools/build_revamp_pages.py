"""Build the static, crawlable Bruz Digital revamp pages."""

from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
SITE_URL = "https://bruzdigital.com"
SOCIAL_IMAGE = f"{SITE_URL}/assets/social/bruz-social-card.png"
ORGANIZATION_SCHEMA = json.dumps({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Bruz Digital",
    "url": SITE_URL,
    "email": "hello@bruzdigital.com",
}, separators=(",", ":"))


def header(active):
    links = [
        ("Work", "projects.html", "work"),
        ("Studio", "services.html", "studio"),
        ("Products", "index.html#products", "products"),
        ("Team", "team.html", "team"),
        ("Contact", "contact.html", "contact"),
    ]
    nav = "\n".join(
        f'<a href="{href}"' + (' aria-current="page"' if key == active else '')
        + (' class="nav-cta"' if key == "contact" else '') + f'>{label}</a>'
        for label, href, key in links
    )
    return f'''<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <a class="brand" href="index.html" aria-label="Bruz Digital home"><span class="brand-mark">BRUZ</span><span class="brand-reg">®</span><span class="brand-descriptor">DIGITAL<br>STUDIO + PRODUCTS</span></a>
  <button class="menu-toggle" type="button" aria-controls="site-nav" aria-expanded="false">Menu</button>
  <nav class="site-nav" id="site-nav" aria-label="Primary navigation">{nav}</nav>
</header>'''


def footer():
    return '''<footer class="site-footer">
  <div class="footer-directory">
    <div><span>Explore</span><nav aria-label="Footer navigation"><a href="projects.html">Work</a><a href="services.html">Studio</a><a href="index.html#products">Products</a><a href="team.html">Team</a></nav></div>
    <div><span>Connect</span><nav aria-label="Contact links"><a href="contact.html">Start a project</a><a href="mailto:hello@bruzdigital.com">Email us</a><a href="privacy.html">Privacy</a></nav></div>
    <p>Kuala Lumpur · Selangor<br>Terengganu · Pahang</p>
  </div>
  <div class="footer-wordmark" aria-hidden="true">BRUZ<span>®</span></div>
  <div class="footer-base"><p>© 2026 Bruz Digital</p><p>Studio + Products · Built with intent.</p><a href="#main">Back to top ↑</a></div>
</footer>'''


def page(title, description, active, content, pathname, scripts=()):
    canonical = f"{SITE_URL}{pathname}"
    # Page-specific scripts load before revamp.js; deferred scripts run in document order.
    extra_scripts = "".join(f'<script defer src="{src}"></script>\n  ' for src in scripts)
    return f'''<!doctype html>
<html lang="en"><head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="{description}"><meta name="theme-color" content="#101410">
  <meta name="color-scheme" content="dark"><meta property="og:type" content="website"><meta property="og:site_name" content="Bruz Digital">
  <meta property="og:title" content="{title} | Bruz Digital"><meta property="og:description" content="{description}"><meta property="og:url" content="{canonical}"><meta property="og:image" content="{SOCIAL_IMAGE}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Bruz Digital — We build tech. You build business.">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{title} | Bruz Digital"><meta name="twitter:description" content="{description}"><meta name="twitter:image" content="{SOCIAL_IMAGE}">
  <title>{title} | Bruz Digital</title>
  <link rel="canonical" href="{canonical}"><link rel="icon" href="assets/brand/favicon.svg" type="image/svg+xml">
  <link rel="preload" href="assets/fonts/plus-jakarta-sans-regular.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="revamp.css">
  {extra_scripts}<script defer src="revamp.js"></script>
  <script type="application/ld+json">{ORGANIZATION_SCHEMA}</script>
</head><body>
{header(active)}
<main id="main">{content}</main>
{footer()}
</body></html>
'''


lab_visual = '''<div class="lab-visual" aria-label="Bruz System Lab: an architecture diagram transforms into a working product interface">
  <div class="visual-top"><span>BRUZ / SYSTEM LAB</span><span>01 / 03</span></div>
  <div class="visual-stage">
    <div class="lab-status"><i aria-hidden="true"></i><span>Architecture → Working UI</span></div>
    <div class="lab-grid" aria-hidden="true"></div>
    <div class="lab-schematic" aria-hidden="true">
      <div class="lab-node lab-node--input"><strong>INPUT</strong><span>Challenge</span></div>
      <i class="lab-connector lab-connector--one"></i><i class="lab-junction lab-junction--one"></i>
      <div class="lab-node lab-node--core"><strong>BRUZ</strong><span>BUILD ENGINE</span></div>
      <i class="lab-connector lab-connector--two"></i><i class="lab-junction lab-junction--two"></i>
      <div class="lab-node lab-node--output"><strong>OUTPUT</strong><span>Product</span></div>
    </div>
    <div class="product-ui" aria-hidden="true">
      <div class="ui-top"><span>BRUZ / QUALITY CONTROL TOWER</span><span>PRODUCT UI</span></div>
      <div class="ui-content"><span class="ui-kicker">Operations overview</span><div class="ui-title">Quality signals, ready to act on.</div><div class="ui-grid"><div class="ui-panel"><span>Review queue</span><strong>12 items</strong></div><div class="ui-panel"><span>Quality state</span><strong>Monitored</strong></div><div class="ui-panel ui-panel--chart"><span>Field signal / Illustrative interface</span><div class="bars"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div></div></div>
    </div>
  </div>
  <div class="visual-bottom"><span>DESIGN · ENGINEER · SHIP</span><span aria-hidden="true">↗</span></div>
</div>'''

case_visual = '''<div class="case-screen" aria-label="Illustrative interface concept for the AI Quality Control Tower"><div class="case-window"><div class="case-window__bar"><span>BRUZ / QUALITY CONTROL TOWER</span><span>INTERFACE CONCEPT</span></div><div class="case-window__main"><span class="ui-kicker">Plantation operations</span><h3>Turn field signals into a shared view.</h3><div class="case-columns"><div class="case-box"><small>Quality signal</small><div class="case-graphic"></div></div><div class="case-box"><small>Review queue</small><ul class="case-list"><li><span>Capture</span><b>01</b></li><li><span>Review</span><b>02</b></li><li><span>Act</span><b>03</b></li></ul></div></div></div></div></div>'''

# Homepage orbit hero: six things Bruz builds circle the Bruz mark.
# Copy is taken from services.html and the product panels so the hero makes no new claims.
ORBIT_ICONS = {
    "code": '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>',
    "spark": '<path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3z"/><path d="M18.5 16.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z"/>',
    "window": '<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M3.5 9h17M7 7h.01M9.5 7h.01"/>',
    "layers": '<path d="M12 4l8.5 4.5L12 13 3.5 8.5 12 4z"/><path d="M3.5 12.5L12 17l8.5-4.5M3.5 16.5L12 21l8.5-4.5"/>',
    "tower": '<path d="M5 20V11M10 20V6M15 20v-7M20 20V9M3 20h18"/>',
    "nodes": '<circle cx="6" cy="7" r="2.2"/><circle cx="18" cy="7" r="2.2"/><circle cx="12" cy="17" r="2.2"/><path d="M8 8.2l2.8 6.8M16 8.2l-2.8 6.8M8.2 7h7.6"/>',
}

ORBIT_ITEMS = (
    ("Bruz Studio", "Custom software", "Tools built for the job", "Internal systems, customer experiences and workflows built for a specific team and job.", ("Internal systems", "Customer experiences", "Workflows"), "code"),
    ("Bruz Studio", "Applied AI", "Intelligence in context", "AI features designed around useful tasks, data quality and human review.", ("Useful tasks", "Data quality", "Human review"), "spark"),
    ("Bruz Studio", "Web experiences", "Sites and interfaces", "Fast, accessible sites and interfaces that explain the offer and make the next step obvious.", ("Sites", "Interfaces", "Accessibility"), "window"),
    ("Bruz Studio", "Product &amp; brand systems", "One visual language", "A clear visual language that carries from the first prototype through the finished product.", ("Prototypes", "Product UI", "Brand"), "layers"),
    ("Bruz Products", "Quality Control Tower", "2nd runner-up · 2026", "Field capture, quality review and action in one view. Built for Johor Plantations Hackathon 2026.", ("Hackathon prototype", "2nd runner-up", "2026"), "tower"),
    ("Bruz Products", "Bruz Intelligent", "In development", "Business information shaped into useful context.", ("AI + data", "In development"), "nodes"),
)

BRUZ_MARK = '<svg viewBox="0 0 64 64" focusable="false"><path d="M14 15v34h18c10 0 17-5 17-14 0-5-3-9-8-11 3-2 5-5 5-9H35c0 4-3 6-8 6h-3v-6H14zm10 16h8c4 0 6 2 6 5s-2 5-6 5h-8V31z" fill="currentColor"/><circle cx="51" cy="13" r="4" class="orbit-core__dot"/></svg>'


def orbit_card(index, item):
    kind, title, short, description, tags, icon = item
    front = " is-front" if index == 0 else ""
    return (
        f'<li class="orbit-card{front}" data-kind="{kind}" data-tags="{"|".join(tags)}">'
        f'<span class="orbit-card__icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false">{ORBIT_ICONS[icon]}</svg></span>'
        f'<span class="orbit-card__text"><strong>{title}</strong><span>{short}</span>'
        f'<span class="orbit-card__desc">{description}</span></span></li>'
    )


def orbit_detail(item, total):
    kind, title, _short, description, tags, _icon = item
    tag_list = "".join(f"<li>{tag}</li>" for tag in tags)
    return (
        '<div class="orbit-detail" aria-hidden="true"><div class="orbit-detail__body">'
        f'<div class="orbit-detail__index"><b data-detail="num">01</b> / {total:02d} — <span data-detail="kind">{kind}</span></div>'
        f'<div class="orbit-detail__title" data-detail="title">{title}</div>'
        f'<p data-detail="desc">{description}</p>'
        f'<ul class="orbit-detail__tags" data-detail="tags">{tag_list}</ul>'
        '</div></div>'
    )


orbit_cards = "".join(orbit_card(i, item) for i, item in enumerate(ORBIT_ITEMS))
orbit_ticks = "<i></i>" * len(ORBIT_ITEMS)
orbit_hero = f'''<section class="orbit-hero" id="orbit" aria-labelledby="hero-title"><div class="orbit-pin">
<div class="orbit-copy"><div class="eyebrow">Engineering what's next</div><h1 id="hero-title">We build tech.<br><em>You build business.</em></h1></div>
<div class="orbit-aside"><p class="orbit-lede">Great ideas deserve great engineering. We build intelligent software and digital products to make them real.</p><div class="hero-actions"><a class="button button--acid" href="contact.html">Start a project <span aria-hidden="true">↗</span></a><a class="button button--text" href="projects.html">Our work <span aria-hidden="true">→</span></a></div></div>
<div class="orbit-stage"><div class="orbit-watermark" aria-hidden="true">BRUZ<span>®</span></div><div class="orbit-ring" aria-hidden="true"></div><div class="orbit-core" aria-hidden="true"><div class="orbit-core__halo"></div><div class="orbit-core__spin"></div><div class="orbit-core__mark">{BRUZ_MARK}</div></div><ol class="orbit-cards" aria-label="What Bruz builds">{orbit_cards}</ol></div>
{orbit_detail(ORBIT_ITEMS[0], len(ORBIT_ITEMS))}
<div class="orbit-progress" aria-hidden="true"><span>Orbit</span>{orbit_ticks}</div>
<div class="orbit-foot"><span>Studio thinking. Product discipline.</span><span>Scroll to orbit ↓</span></div>
</div></section>'''

HOME_SCRIPTS = (
    "assets/vendor/gsap/gsap-3.15.1.min.js",
    "assets/vendor/gsap/ScrollTrigger-3.15.1.min.js",
)

home = f'''{orbit_hero}
<a class="achievement" href="projects.html#quality-control-tower"><span class="eyebrow">Recent recognition</span><strong>2nd runner-up · Johor Plantations Hackathon 2026</strong><span>See the build ↗</span></a>
<section class="section section--light" id="approach" aria-labelledby="approach-title"><div class="section-head"><div><div class="eyebrow eyebrow--dark">01 / What we do</div><h2 id="approach-title">One team.<br>Two ways to build.</h2></div><p class="section-lead">Custom work for your business. Focused products built by Bruz.</p></div><div class="pathways"><article class="pathway"><div class="eyebrow eyebrow--dark">Bruz Studio</div><h3>Built around<br>your problem.</h3><p>Software, AI and web experiences shaped around the work.</p><a href="services.html">Studio services ↗</a></article><article class="pathway"><div class="eyebrow eyebrow--dark">Bruz Products</div><h3>Focused tools.<br>Real workflows.</h3><p>Practical tools for business data and documents.</p><a href="#products">Our products ↗</a></article></div></section>
<section class="section section--dark" id="featured-work" aria-labelledby="featured-title"><div class="section-head"><div><div class="eyebrow">02 / Featured work</div><h2 id="featured-title">The visible build.</h2></div><p class="section-lead">A focused response to a real operational challenge.</p></div><div class="case-layout">{lab_visual}<div class="case-copy"><div class="eyebrow">Hackathon case study / 2026</div><h2>AI Quality Control Tower</h2><p>A clearer view for capture, quality review and action.</p><div class="case-facts"><div><span>Recognition</span><strong>2nd runner-up</strong></div><div><span>Context</span><strong>Johor Plantations Hackathon 2026</strong></div></div><a class="button button--acid" href="projects.html#quality-control-tower">View case study <span aria-hidden="true">↗</span></a></div></div></section>
<section class="section section--light" id="products" aria-labelledby="products-title"><div class="section-head"><div><div class="eyebrow eyebrow--dark">03 / Bruz Products</div><h2 id="products-title">What we're building.</h2></div><p class="section-lead">Current products and their honest status.</p></div><div class="product-explorer"><div class="product-tabs" role="tablist" aria-label="Bruz product demos"><button type="button" role="tab" id="tab-tower" aria-selected="true" aria-controls="panel-tower" data-product-tab="tower"><span>01</span>Quality Control Tower</button><button type="button" role="tab" id="tab-intelligent" aria-selected="false" aria-controls="panel-intelligent" data-product-tab="intelligent" tabindex="-1"><span>02</span>Bruz Intelligent</button><button type="button" role="tab" id="tab-ocr" aria-selected="false" aria-controls="panel-ocr" data-product-tab="ocr" tabindex="-1"><span>03</span>Bruz OCR</button></div><div class="product-demo" id="panel-tower" role="tabpanel" aria-labelledby="tab-tower" data-product-panel="tower"><div class="demo-copy"><div class="product-index"><span>Hackathon prototype / 2026</span><span class="status">2nd runner-up</span></div><h3>AI Quality Control Tower</h3><p>Field capture, quality review and action in one view.</p><a href="projects.html#quality-control-tower">Open case study ↗</a></div><div class="demo-interface demo-interface--tower" aria-label="Illustrative Quality Control Tower workflow"><div class="demo-bar"><span>QUALITY CONTROL TOWER</span><span>PROTOTYPE</span></div><div class="tower-flow"><div><b>01</b><strong>Capture</strong><span>Field signal</span></div><i></i><div><b>02</b><strong>Review</strong><span>Quality check</span></div><i></i><div><b>03</b><strong>Act</strong><span>Shared decision</span></div></div></div></div><div class="product-demo" id="panel-intelligent" role="tabpanel" aria-labelledby="tab-intelligent" data-product-panel="intelligent" hidden><div class="demo-copy"><div class="product-index"><span>AI + data direction</span><span class="status">In development</span></div><h3>Bruz Intelligent</h3><p>Business information shaped into useful context.</p><a href="contact.html">Discuss the product ↗</a></div><div class="demo-interface demo-interface--intelligent" aria-label="Bruz Intelligent development pipeline"><div class="demo-bar"><span>BRUZ INTELLIGENT</span><span>DEVELOPMENT VIEW</span></div><div class="intelligent-flow"><div><span>01 / INPUT</span><strong>Business data</strong></div><div><span>02 / CONTEXT</span><strong>Structured knowledge</strong></div><div><span>03 / USE</span><strong>Useful workflow</strong></div></div><small>Product direction · Interface illustration</small></div></div><div class="product-demo" id="panel-ocr" role="tabpanel" aria-labelledby="tab-ocr" data-product-panel="ocr" hidden><div class="demo-copy"><div class="product-index"><span>Local document intelligence</span><span class="status">Early foundation</span></div><h3>Bruz OCR</h3><p>Ingestion and image-quality checks are built. Recognition, review and export are planned.</p><a href="contact.html">Discuss the product ↗</a></div><div class="demo-interface demo-interface--ocr" aria-label="Bruz OCR implementation status"><div class="demo-bar"><span>BRUZ OCR / LOCAL PIPELINE</span><span>FOUNDATION</span></div><ol class="ocr-pipeline"><li class="is-built"><b>01</b><span>Ingest</span><small>Built</small></li><li class="is-built"><b>02</b><span>Validate</span><small>Built</small></li><li class="is-built"><b>03</b><span>Quality</span><small>Built</small></li><li><b>04</b><span>Recognize</span><small>Planned</small></li><li><b>05</b><span>Review</span><small>Planned</small></li><li><b>06</b><span>Export</span><small>Planned</small></li></ol></div></div></div></section>
<section class="cta-band"><div><div class="eyebrow eyebrow--dark">Next / Your build</div><h2>Ready to build?</h2></div><a class="button button--dark" href="contact.html">Start a conversation <span aria-hidden="true">↗</span></a></section>'''

projects = f'''<section class="page-hero"><div class="eyebrow">Work / Selected build</div><h1>Real work, made visible.</h1><p>We show the problem, the build and its context. Where a result is still a concept, we say so.</p></section><section class="section section--light" id="quality-control-tower"><div class="section-head"><div><div class="eyebrow eyebrow--dark">01 / Featured case study</div><h2>AI Quality Control Tower</h2></div><p class="section-lead">A hackathon prototype developed for Johor Plantations Hackathon 2026. Bruz finished as 2nd runner-up.</p></div><div class="case-layout">{case_visual}<div class="case-copy"><div class="eyebrow eyebrow--dark">The challenge</div><h2>A clearer operational picture.</h2><p>Quality work depends on information arriving from different steps of an operation. The team explored a shared tower view to connect capture, review and action in one place.</p><p>The interface shown here is a website reconstruction of the prototype direction. It is not presented as a deployed customer system.</p><div class="case-facts"><div><span>Project type</span><strong>Hackathon prototype</strong></div><div><span>Recognition</span><strong>2nd runner-up, 2026</strong></div><div><span>Team</span><strong>Sarvind Raj · Nabilah Abas</strong></div><div><span>Discipline</span><strong>Applied AI engineering</strong></div></div><a class="button button--dark" href="contact.html">Discuss a similar challenge ↗</a></div></div></section><section class="section section--dark" aria-labelledby="method-title"><div class="section-head"><div><div class="eyebrow">02 / Build path</div><h2 id="method-title">From field signal to shared action.</h2></div><p class="section-lead">The prototype organized the challenge as one visible operating loop.</p></div><ol class="case-method"><li><span>01</span><div><h3>Capture</h3><p>Bring the relevant field signal into a consistent starting point.</p></div></li><li><span>02</span><div><h3>Review</h3><p>Give quality information a clear place for inspection and human judgment.</p></div></li><li><span>03</span><div><h3>Connect</h3><p>Present the signal and its context in one shared operational view.</p></div></li><li><span>04</span><div><h3>Act</h3><p>Make the next decision visible to the people responsible for it.</p></div></li></ol><p class="case-disclosure">This case study describes the hackathon concept and interface direction. Additional implementation claims will be added only when verified project evidence is available.</p></section><section class="cta-band"><div><div class="eyebrow eyebrow--dark">What comes next</div><h2>Let's build your next proof point.</h2></div><a class="button button--dark" href="contact.html">Talk to Bruz ↗</a></section>'''

services = '''<section class="page-hero"><div class="eyebrow">Bruz Studio / Services</div><h1>From unclear brief to working system.</h1><p>We connect discovery, design and engineering so the finished work makes sense for the people who use it.</p></section><section class="section section--light"><div class="section-head"><div><div class="eyebrow eyebrow--dark">01 / The studio</div><h2>What we can build together.</h2></div><p class="section-lead">The right scope starts with the business problem. These are the capabilities we bring to the table.</p></div><div class="content-grid"><article class="content-card"><div class="eyebrow eyebrow--dark">01 / Software</div><h2>Custom tools and platforms</h2><p>Internal systems, customer experiences and workflows built for a specific team and job.</p></article><article class="content-card"><div class="eyebrow eyebrow--dark">02 / Applied AI</div><h2>Intelligence in context</h2><p>AI features designed around useful tasks, data quality and human review.</p></article><article class="content-card"><div class="eyebrow eyebrow--dark">03 / Web</div><h2>Web experiences</h2><p>Fast, accessible sites and interfaces that explain the offer and make the next step obvious.</p></article><article class="content-card"><div class="eyebrow eyebrow--dark">04 / Design</div><h2>Product and brand systems</h2><p>A clear visual language that carries from the first prototype through the finished product.</p></article></div></section><section class="section section--dark"><div class="section-head"><div><div class="eyebrow">02 / How we work</div><h2>Make the work visible.</h2></div><p class="section-lead">A shared view of the problem, early interface thinking and tangible progress throughout the build.</p></div><ol class="detail-list"><li><strong>Understand the workflow</strong><span>Map the people, decisions and information involved.</span></li><li><strong>Shape the first version</strong><span>Turn the core journey into an interface and technical plan.</span></li><li><strong>Build and learn</strong><span>Ship working pieces, test them and refine what matters.</span></li><li><strong>Hand over clearly</strong><span>Document the system so the team can keep moving.</span></li></ol></section><section class="cta-band"><div><div class="eyebrow eyebrow--dark">Start here</div><h2>Tell us what needs to work better.</h2></div><a class="button button--dark" href="contact.html">Contact Bruz ↗</a></section>'''

team = '''<section class="page-hero"><div class="eyebrow">People / Bruz Digital</div><h1>The people behind the build.</h1><p>AI engineers building practical technology.</p></section><section class="section section--light"><div class="section-head"><div><div class="eyebrow eyebrow--dark">01 / AI Engineering</div><h2>Hands on, from idea to interface.</h2></div><p class="section-lead">Meet the people behind Bruz.</p></div><div class="team-list"><article class="person person--profile"><img class="person-photo" src="assets/team/sarvind-raj.jpg" alt="Portrait of Sarvind Raj" width="960" height="1280" loading="lazy" decoding="async"><div><h3>Sarvind Raj</h3><span>AI Engineer</span><a class="person-email" href="mailto:sarvind@bruzdigital.com">sarvind@bruzdigital.com</a></div></article><article class="person person--profile"><img class="person-photo" src="assets/team/nabilah-abas.jpg" alt="Portrait of Nabilah Abas" width="853" height="1280" loading="lazy" decoding="async"><div><h3>Nabilah Abas</h3><span>AI Engineer</span><a class="person-email" href="mailto:nabilah@bruzdigital.com">nabilah@bruzdigital.com</a></div></article></div></section><section class="cta-band"><div><div class="eyebrow eyebrow--dark">Work with us</div><h2>Meet the builders.</h2></div><a class="button button--dark" href="contact.html">Start a conversation ↗</a></section>'''

contact = '''<section class="page-hero"><div class="eyebrow">Contact / Bruz Digital</div><h1>Let's talk about the build.</h1><p>Tell us what needs to work better.</p><a class="button button--acid" href="mailto:hello@bruzdigital.com?subject=Let%27s%20build%20with%20Bruz">Email hello@bruzdigital.com ↗</a></section><section class="section section--light" aria-labelledby="brief-title"><div class="section-head"><div><div class="eyebrow eyebrow--dark">Project brief</div><h2 id="brief-title">Give us the useful part first.</h2></div><p class="section-lead">Send a structured project brief directly to Bruz. You can also use the email link if you prefer.</p></div><form class="brief-form" name="project-brief" method="POST" action="/thanks.html" data-netlify="true" netlify-honeypot="bot-field" data-brief-form><input type="hidden" name="form-name" value="project-brief"><p class="form-trap" aria-hidden="true"><label>Leave this field empty <input name="bot-field" tabindex="-1" autocomplete="off"></label></p><div class="form-field"><label for="brief-name">Your name</label><input id="brief-name" name="name" autocomplete="name" required></div><div class="form-field"><label for="brief-email">Your email</label><input id="brief-email" name="email" type="email" autocomplete="email" required></div><div class="form-field form-field--wide"><label for="brief-challenge">What needs to work better?</label><textarea id="brief-challenge" name="challenge" rows="5" required></textarea></div><div class="form-field"><label for="brief-timeline">Target timeline <span>(optional)</span></label><input id="brief-timeline" name="timeline" placeholder="e.g. Q1 2027"></div><div class="form-field"><label for="brief-context">Existing tools or context <span>(optional)</span></label><input id="brief-context" name="context"></div><div class="form-actions"><button class="button button--acid" type="submit">Send project brief <span aria-hidden="true">↗</span></button><a href="mailto:hello@bruzdigital.com">Or email directly</a><small>By sending this form, you agree that Bruz may use these details to respond to your enquiry. <a href="privacy.html">Privacy</a></small></div></form></section>'''

privacy = '''<section class="page-hero"><div class="eyebrow">Privacy / Bruz Digital</div><h1>Your enquiry stays purposeful.</h1><p>We use the information you choose to share only to understand and respond to your enquiry.</p></section><section class="section section--light legal-copy"><h2>Website privacy</h2><p>When you submit the project brief, Bruz Digital receives the name, email address and project information you provide. We use it to respond to your enquiry and discuss potential work.</p><p>We do not sell the information submitted through this website. Form submissions may be processed and stored by our website hosting provider so they can be delivered to us.</p><p>To request access, correction or deletion of an enquiry, email <a href="mailto:hello@bruzdigital.com">hello@bruzdigital.com</a>.</p><p><strong>Last updated:</strong> 21 October 2026</p></section>'''

thanks = '''<section class="page-hero page-hero--compact"><div class="eyebrow">Project brief received</div><h1>Thanks. We'll take a look.</h1><p>Your brief has been sent to Bruz Digital. We will reply using the email address you provided.</p><a class="button button--acid" href="index.html">Return home ↗</a></section>'''

not_found = '''<section class="page-hero page-hero--compact"><div class="eyebrow">404 / Page not found</div><h1>This path does not exist.</h1><p>The page may have moved. Return to the Bruz Digital homepage or explore our work.</p><div class="hero-actions"><a class="button button--acid" href="index.html">Return home ↗</a><a class="button button--text" href="projects.html">View our work →</a></div></section>'''

pages = {
    "index.html": page("We build tech. You build business.", "Bruz Digital builds custom technology and applied AI, while developing focused products for business workflows.", "home", home, "/", scripts=HOME_SCRIPTS),
    "projects.html": page("Work", "Explore Bruz Digital's AI Quality Control Tower hackathon concept and selected work.", "work", projects, "/projects.html"),
    "services.html": page("Studio", "Bruz Studio builds custom software, applied AI, web experiences and product design systems.", "studio", services, "/services.html"),
    "team.html": page("Team", "Meet the AI engineers behind Bruz Digital's practical technology work.", "team", team, "/team.html"),
    "contact.html": page("Contact", "Start a conversation with Bruz Digital about a technology or AI project.", "contact", contact, "/contact.html"),
    "privacy.html": page("Privacy", "How Bruz Digital uses information submitted through its project enquiry form.", "privacy", privacy, "/privacy.html"),
    "thanks.html": page("Project brief received", "Your project brief has been sent to Bruz Digital.", "contact", thanks, "/thanks.html"),
    "404.html": page("Page not found", "The requested page could not be found on Bruz Digital.", "404", not_found, "/404.html"),
}

for filename, html in pages.items():
    (ROOT / filename).write_text(html, encoding="utf-8")

# Preserve older deep links without leaving contradictory service claims live.
for service in ("brand-identity", "web-design", "motion", "strategy"):
    (ROOT / "services" / f"{service}.html").write_text(
        '<!doctype html><html lang="en"><head><meta charset="UTF-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1">'
        '<meta http-equiv="refresh" content="0; url=../services.html">'
        '<title>Bruz Studio services | Bruz Digital</title>'
        '<link rel="icon" href="../assets/brand/favicon.svg" type="image/svg+xml">'
        f'<link rel="canonical" href="{SITE_URL}/services.html"></head><body>'
        '<p>This service is now part of <a href="../services.html">Bruz Studio</a>.</p>'
        '</body></html>',
        encoding="utf-8",
    )
