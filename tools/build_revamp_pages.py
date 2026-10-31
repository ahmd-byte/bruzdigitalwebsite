"""Build the static, crawlable Bruz Digital website."""
from pathlib import Path
import json
import html

ROOT = Path(__file__).resolve().parents[1]
SITE_URL = "https://bruzdigital.com"
SOCIAL_IMAGE = f"{SITE_URL}/assets/social/bruz-social-card.png"
# Add a confirmed WhatsApp URL here when ready. The link is rendered on the Team page only.
TEAM_WHATSAPP_URL = ""
ORGANIZATION_SCHEMA = json.dumps({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Bruz Digital",
    "url": SITE_URL,
    "email": "hello@bruzdigital.com",
}, separators=(",", ":"))


def header(active="home"):
    prefix = "" if active == "home" else "index.html"
    links = [
        ("Studio", f"{prefix}#studio", "studio"),
        ("Work", f"{prefix}#work", "work"),
        ("Products", f"{prefix}#products", "products"),
        ("Team", f"{prefix}#team", "team"),
        ("Contact", f"{prefix}#contact", "contact"),
    ]
    nav = "\n".join(
        f'<a href="{href}"' + (' aria-current="page"' if key == active else '')
        + (' class="nav-cta"' if key == "contact" else '') + f'>{label}</a>'
        for label, href, key in links
    )
    return f'''<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <a class="brand" href="index.html" aria-label="Bruz Digital home"><span class="brand-mark">BRUZ<span class="brand-dot">.</span></span><span class="brand-descriptor">DIGITAL<br>STUDIO + PRODUCTS</span></a>
  <button class="menu-toggle" type="button" aria-controls="site-nav" aria-expanded="false" aria-label="Open navigation"><span></span><span></span><span></span></button>
  <nav class="site-nav" id="site-nav" aria-label="Primary navigation">{nav}</nav>
</header>'''


def footer():
    return '''<footer class="site-footer">
  <div class="footer-main">
    <a class="brand brand--footer" href="index.html" aria-label="Bruz Digital home"><span class="brand-mark">BRUZ<span class="brand-dot">.</span></span></a>
    <p>We build tech.<br><strong>You build business.</strong></p>
    <a class="footer-email" href="mailto:hello@bruzdigital.com?subject=Let%27s%20build%20with%20Bruz">hello@bruzdigital.com <span aria-hidden="true">↗</span></a>
  </div>
  <div class="footer-base"><nav aria-label="Footer navigation"><a href="index.html#studio">Studio</a><a href="index.html#work">Work</a><a href="index.html#products">Products</a><a href="index.html#team">Team</a><a href="privacy.html">Privacy</a></nav><p>© 2026 Bruz Digital</p><a href="#main">Back to top ↑</a></div>
</footer>'''


def page(title, description, active, content, pathname, lang="en"):
    canonical = f"{SITE_URL}{pathname}"
    safe_title = html.escape(title)
    safe_description = html.escape(description, quote=True)
    document_title = "Bruz Digital" if title == "Bruz Digital" else f"{safe_title} | Bruz Digital"
    return f'''<!doctype html>
<html lang="{lang}"><head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="{safe_description}"><meta name="theme-color" content="#F3F7FB">
  <meta name="color-scheme" content="light"><meta property="og:type" content="website"><meta property="og:site_name" content="Bruz Digital">
  <meta property="og:title" content="{safe_title} | Bruz Digital"><meta property="og:description" content="{safe_description}"><meta property="og:url" content="{canonical}"><meta property="og:image" content="{SOCIAL_IMAGE}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Bruz Digital — We build tech. You build business.">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{safe_title} | Bruz Digital"><meta name="twitter:description" content="{safe_description}"><meta name="twitter:image" content="{SOCIAL_IMAGE}">
  <title>{document_title}</title>
  <link rel="canonical" href="{canonical}"><link rel="icon" href="assets/brand/favicon.svg?v=3" type="image/svg+xml">
  <link rel="preload" href="assets/fonts/plus-jakarta-sans-regular.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="revamp.css"><script defer src="revamp.js"></script>
  <script type="application/ld+json">{ORGANIZATION_SCHEMA}</script>
</head><body>
{header(active)}
<main id="main">{content}</main>
{footer()}
</body></html>
'''


hero_visual = '''<div class="hero-visual" role="img" aria-label="Illustrative diagram showing a business challenge moving through Bruz Studio into a practical product">
  <div class="visual-head"><span>BRUZ / BUILD SYSTEM</span><span>STUDIO + PRODUCTS</span></div>
  <div class="visual-flow"><div class="flow-node"><span>01</span><strong>Challenge</strong></div><i aria-hidden="true"></i><div class="flow-node flow-node--brand"><span>02</span><strong>BRUZ</strong></div><i aria-hidden="true"></i><div class="flow-node"><span>03</span><strong>Useful build</strong></div></div>
  <div class="visual-foot"><span>Designed around real work</span><span class="visual-spark" aria-hidden="true">✳</span></div>
</div>'''

case_visual = '''<div class="case-visual" role="img" aria-label="Illustrative Quality Control Tower concept, not a deployed customer system">
  <div class="case-visual-head"><span>BRUZ / QUALITY CONTROL TOWER</span><span>CONCEPT</span></div>
  <div class="case-visual-title">One shared view<br>from field signal to action.</div>
  <div class="case-steps"><span><b>01</b> Capture</span><i></i><span><b>02</b> Review</span><i></i><span><b>03</b> Act</span></div>
  <p>Illustrative interface · Hackathon prototype</p>
</div>'''

team_preview = '''<div class="team-preview">
  <article class="person person--feature"><img src="assets/team/sarvind-raj.jpg" alt="Portrait of Sarvind Raj" width="960" height="1280" loading="lazy" decoding="async"><div><h3>Sarvind Raj</h3><p>Co-founder · AI Engineer</p></div></article>
  <article class="person person--feature"><img src="assets/team/nabilah-abas.jpg" alt="Portrait of Nabilah Abas" width="853" height="1280" loading="lazy" decoding="async"><div><h3>Nabilah Abas</h3><p>AI Engineer</p></div></article>
</div>'''

home = f'''<section class="hero" aria-labelledby="hero-title"><div class="hero-copy"><p class="eyebrow">Bruz Digital · Studio + Products</p><h1 id="hero-title">We build tech.<br><em>You build business.</em></h1><p class="hero-lede">We build software, applied AI and digital products around the work businesses need to get done.</p><div class="hero-actions"><a class="button button--primary" href="mailto:hello@bruzdigital.com?subject=Let%27s%20build%20with%20Bruz">Email Bruz <span aria-hidden="true">↗</span></a><a class="button button--secondary" href="#work">Explore our work <span aria-hidden="true">↓</span></a></div><p class="hero-contact">A direct line to <a href="mailto:hello@bruzdigital.com">hello@bruzdigital.com</a></p></div>{hero_visual}</section>
<a class="recognition" href="projects.html#quality-control-tower"><span class="recognition-mark" aria-hidden="true">✳</span><span><small>Verified recognition</small><strong>2nd runner-up · Johor Plantations Hackathon 2026</strong></span><span class="recognition-link">See the build <span aria-hidden="true">↗</span></span></a>
<section class="section section--intro" id="studio" aria-labelledby="studio-title"><div class="section-heading"><p class="eyebrow">01 / What we do</p><h2 id="studio-title">One team.<br>Two ways to build.</h2><p>Custom work shaped around your business. Focused products built by Bruz.</p></div><div class="offer-grid"><article class="offer-card offer-card--studio"><span class="offer-number">01</span><p class="eyebrow">Bruz Studio</p><h3>Built around<br>your problem.</h3><p>Software, applied AI and web experiences designed around real workflows.</p><a class="text-link" href="services.html">Explore the studio <span aria-hidden="true">↗</span></a></article><article class="offer-card offer-card--products"><span class="offer-number">02</span><p class="eyebrow">Bruz Products</p><h3>Focused tools.<br>Real workflows.</h3><p>Practical tools for business information, data and documents.</p><a class="text-link" href="#products">Explore products <span aria-hidden="true">↓</span></a></article></div></section>
<section class="section section--blue" id="work" aria-labelledby="work-title"><div class="section-heading section-heading--light"><p class="eyebrow">02 / Selected work</p><h2 id="work-title">A real challenge.<br>A focused prototype.</h2><p>One example of how we turn an operational problem into a clear product direction.</p></div><div class="work-feature">{case_visual}<div class="work-copy"><p class="eyebrow">Johor Plantations Hackathon 2026</p><h3>AI Quality<br>Control Tower</h3><p>A hackathon prototype that connects capture, quality review and action in one shared view.</p><div class="work-award"><span>Recognition</span><strong>2nd runner-up</strong></div><a class="button button--light" href="projects.html#quality-control-tower">Read the case study <span aria-hidden="true">↗</span></a></div></div></section>
<section class="section section--products" id="products" aria-labelledby="products-title"><div class="section-heading"><p class="eyebrow">03 / Bruz Products</p><h2 id="products-title">What we're building.</h2><p>We show each product's current stage clearly.</p></div><div class="product-grid"><article class="product-card"><div class="product-top"><span>01 / Prototype</span><span class="status status--prototype">Hackathon build</span></div><h3>AI Quality<br>Control Tower</h3><p>Field capture, quality review and action in one operational view.</p><a class="text-link" href="projects.html#quality-control-tower">View the prototype <span aria-hidden="true">↗</span></a></article><article class="product-card product-card--highlight"><div class="product-top"><span>02 / In development</span><span class="status">Building</span></div><h3>Bruz<br>Intelligent</h3><p>Business information shaped into useful context and workflows.</p><a class="text-link" href="contact.html">Ask about Bruz Intelligent <span aria-hidden="true">↗</span></a></article><article class="product-card"><div class="product-top"><span>03 / Foundation</span><span class="status">Early build</span></div><h3>Bruz<br>OCR</h3><p>Document ingestion and image-quality checks are built. Recognition, review and export are planned.</p><a class="text-link" href="contact.html">Ask about Bruz OCR <span aria-hidden="true">↗</span></a></article></div></section>
<section class="section section--team" id="team" aria-labelledby="team-title"><div class="section-heading"><p class="eyebrow">04 / The people</p><h2 id="team-title">The team behind the build.</h2><p>AI, software and data engineering working across studio projects and Bruz products.</p></div>{team_preview}<a class="button button--secondary" href="team.html">Meet the whole team <span aria-hidden="true">↗</span></a></section>
<section class="contact-band" id="contact" aria-labelledby="contact-title"><div><p class="eyebrow">Your next build</p><h2 id="contact-title">Have a challenge<br>worth solving?</h2></div><div><p>Start with a short note. We’ll take it from there.</p><a class="button button--on-blue" href="mailto:hello@bruzdigital.com?subject=Let%27s%20build%20with%20Bruz">Email hello@bruzdigital.com <span aria-hidden="true">↗</span></a></div></section>'''

projects = f'''<section class="page-hero"><p class="eyebrow">Work / Selected build</p><h1>Real work,<br>made visible.</h1><p>We show the problem, the build and its context. Where a result is still a concept, we say so.</p></section><section class="section section--blue" id="quality-control-tower"><div class="section-heading section-heading--light"><p class="eyebrow">Featured case study</p><h2>AI Quality<br>Control Tower</h2><p>A hackathon prototype developed for Johor Plantations Hackathon 2026. Bruz finished as 2nd runner-up.</p></div><div class="work-feature">{case_visual}<div class="work-copy"><p class="eyebrow">The challenge</p><h3>A clearer<br>operational picture.</h3><p>The team explored a shared tower view to connect capture, review and action across an operation.</p><p>The interface shown here is an illustration of the prototype direction, not a deployed customer system.</p><div class="work-award"><span>Team</span><strong>Sarvind Raj · Nabilah Abas</strong></div><a class="button button--light" href="contact.html">Discuss a similar challenge <span aria-hidden="true">↗</span></a></div></div></section><section class="section section--intro"><div class="section-heading"><p class="eyebrow">Build path</p><h2>From field signal<br>to shared action.</h2><p>The prototype organized the challenge as one visible operating loop.</p></div><ol class="steps-list"><li><span>01</span><div><h3>Capture</h3><p>Bring the relevant field signal into a consistent starting point.</p></div></li><li><span>02</span><div><h3>Review</h3><p>Give quality information a clear place for inspection and human judgment.</p></div></li><li><span>03</span><div><h3>Act</h3><p>Make the next decision visible to the people responsible for it.</p></div></li></ol><p class="disclosure">This case study describes a hackathon concept. Additional implementation or outcome claims will be added only when verified project evidence is available.</p></section><section class="contact-band"><div><p class="eyebrow">What comes next</p><h2>Let's build your<br>next proof point.</h2></div><a class="button button--on-blue" href="mailto:hello@bruzdigital.com?subject=Let%27s%20build%20with%20Bruz">Talk to Bruz <span aria-hidden="true">↗</span></a></section>'''

services = '''<section class="page-hero"><p class="eyebrow">Studio / Bruz Digital</p><h1>Good engineering<br>starts with the work.</h1><p>Bruz Studio builds custom technology around the people, processes and tools a business already has.</p><a class="button button--primary" href="mailto:hello@bruzdigital.com?subject=Talk%20to%20Bruz%20Studio">Email Bruz Studio <span aria-hidden="true">↗</span></a></section><section class="section section--intro"><div class="section-heading"><p class="eyebrow">Capabilities</p><h2>Designed for<br>real workflows.</h2><p>We bring product thinking and engineering together from the first conversation.</p></div><div class="capability-grid"><article><span>01</span><h3>Custom software</h3><p>Tools and platforms built around a specific business process.</p></article><article><span>02</span><h3>Applied AI</h3><p>AI features grounded in useful, well-defined work.</p></article><article><span>03</span><h3>Web experiences</h3><p>Clear websites and product interfaces for customers and teams.</p></article><article><span>04</span><h3>Product systems</h3><p>Product structure, interaction and visual systems built to work together.</p></article></div></section><section class="section section--soft"><div class="section-heading"><p class="eyebrow">How we work</p><h2>Understand.<br>Shape. Build. Hand over.</h2><p>A practical process that makes decisions visible as the work moves forward.</p></div><ol class="process-grid"><li><span>01</span><h3>Understand</h3><p>Get clear on the people, problem and existing workflow.</p></li><li><span>02</span><h3>Shape</h3><p>Agree on a useful first version and what it needs to prove.</p></li><li><span>03</span><h3>Build</h3><p>Design and engineer the experience around that agreed scope.</p></li><li><span>04</span><h3>Hand over</h3><p>Share the working product and the information needed to continue.</p></li></ol></section><section class="contact-band"><div><p class="eyebrow">Bruz Studio</p><h2>Start with the<br>problem.</h2></div><a class="button button--on-blue" href="mailto:hello@bruzdigital.com?subject=Talk%20to%20Bruz%20Studio">Email hello@bruzdigital.com <span aria-hidden="true">↗</span></a></section>'''

products = '''<section class="page-hero"><p class="eyebrow">Products / Bruz Digital</p><h1>Focused tools.<br>Clear status.</h1><p>We build practical products for business information, data and documents. Each page shows what exists and what is still planned.</p></section><section class="section section--products"><div class="product-grid product-grid--page"><article class="product-card"><div class="product-top"><span>01 / Hackathon prototype</span><span class="status status--prototype">2nd runner-up</span></div><h2>AI Quality Control Tower</h2><p>A shared view for field capture, quality review and action. Developed as a prototype at Johor Plantations Hackathon 2026.</p><a class="text-link" href="projects.html#quality-control-tower">Read the case study <span aria-hidden="true">↗</span></a></article><article class="product-card product-card--highlight"><div class="product-top"><span>02 / In development</span><span class="status">Building</span></div><h2>Bruz Intelligent</h2><p>A product direction for shaping business information into useful context and workflows.</p><a class="text-link" href="mailto:hello@bruzdigital.com?subject=Bruz%20Intelligent">Ask about Bruz Intelligent <span aria-hidden="true">↗</span></a></article><article class="product-card"><div class="product-top"><span>03 / Foundation</span><span class="status">Early build</span></div><h2>Bruz OCR</h2><p>Document ingestion and image-quality checks are built. Recognition, review and export are planned.</p><a class="text-link" href="mailto:hello@bruzdigital.com?subject=Bruz%20OCR">Ask about Bruz OCR <span aria-hidden="true">↗</span></a></article></div></section><section class="contact-band"><div><p class="eyebrow">Bruz Products</p><h2>Explore a product<br>with us.</h2></div><a class="button button--on-blue" href="mailto:hello@bruzdigital.com?subject=Bruz%20Products">Email Bruz <span aria-hidden="true">↗</span></a></section>'''


def person(name, role, initials, image=None, email=None):
    visual = (f'<img src="{image}" alt="Portrait of {html.escape(name)}" width="960" height="1280" loading="lazy" decoding="async">' if image else f'<span class="person-mark" aria-hidden="true">{initials}</span>')
    contact = f'<a class="person-contact" href="mailto:{email}">{email}</a>' if email else ''
    return f'<article class="team-card">{visual}<div class="team-card-info"><h2>{html.escape(name)}</h2><p>{html.escape(role)}</p>{contact}</div></article>'

team_whatsapp = f'<a class="team-whatsapp" href="{html.escape(TEAM_WHATSAPP_URL, quote=True)}" target="_blank" rel="noopener noreferrer">WhatsApp the team <span aria-hidden="true">↗</span></a>' if TEAM_WHATSAPP_URL else ''
team = f'''<section class="page-hero"><p class="eyebrow">People / Bruz Digital</p><h1>The people<br>behind the build.</h1><p>AI engineers and software builders making practical technology.</p></section><section class="section section--team"><div class="section-heading"><p class="eyebrow">The team</p><h2>Hands on, from idea to interface.</h2><p>A small team across AI, software and data engineering.</p></div><div class="team-grid">{person("Ahmad Syafi", "Founder · AI Engineer", "AS")}{person("Sarvind Raj", "Co-founder · AI Engineer", "SR", "assets/team/sarvind-raj.jpg", "sarvind@bruzdigital.com")}{person("Nabilah Abas", "AI Engineer", "NA", "assets/team/nabilah-abas.jpg", "nabilah@bruzdigital.com")}{person("Suvarnaa Mugunthan", "Software Engineer", "SM")}{person("Pravin Anand Kumar", "Data Engineer", "PA")}</div><div class="team-contact">{team_whatsapp}<a href="mailto:hello@bruzdigital.com?subject=Contact%20Bruz%20Digital">Email the Bruz team <span aria-hidden="true">↗</span></a></div></section>'''

contact = '''<section class="page-hero page-hero--contact"><p class="eyebrow">Contact / Bruz Digital</p><h1>Let's talk<br>about the build.</h1><p>Send us a short note about what needs to work better. We’ll reply by email.</p><a class="button button--primary" href="mailto:hello@bruzdigital.com?subject=Let%27s%20build%20with%20Bruz">Email hello@bruzdigital.com <span aria-hidden="true">↗</span></a></section><section class="section section--soft"><div class="section-heading"><p class="eyebrow">A useful first note</p><h2>Start with what<br>you know.</h2><p>You can include the challenge, the people involved, existing tools or a target timeline. A short outline is enough to begin.</p></div><a class="email-panel" href="mailto:hello@bruzdigital.com?subject=Let%27s%20build%20with%20Bruz"><span class="email-panel-label">Email</span><strong>hello@bruzdigital.com</strong><span class="email-panel-arrow" aria-hidden="true">↗</span></a></section>'''

privacy = '''<section class="page-hero page-hero--compact"><p class="eyebrow">Privacy / Bruz Digital</p><h1>Your enquiry<br>stays purposeful.</h1><p>We use the details you choose to share to understand and respond to your enquiry.</p></section><section class="section section--soft legal-copy"><h2>Website privacy</h2><p>This website uses direct email links. When you email Bruz Digital, your message is handled by the email providers and systems involved. Bruz uses the information in your message to respond to your enquiry and discuss potential work.</p><p>Bruz Digital does not sell enquiry information. To request access, correction or deletion of an enquiry, email <a href="mailto:hello@bruzdigital.com">hello@bruzdigital.com</a>.</p><p><strong>Last updated:</strong> 31 October 2026</p></section>'''

thanks = '''<section class="page-hero page-hero--compact"><p class="eyebrow">Email / Bruz Digital</p><h1>Your email app<br>should be open.</h1><p>Review your message and press send in your email app. If it did not open, email <a href="mailto:hello@bruzdigital.com">hello@bruzdigital.com</a> directly.</p><a class="button button--secondary" href="index.html">Return to Bruz Digital <span aria-hidden="true">↗</span></a></section>'''

not_found = '''<section class="page-hero page-hero--compact"><p class="eyebrow">404 / Page not found</p><h1>This path<br>doesn't exist.</h1><p>The page may have moved. Return home or explore the work.</p><div class="hero-actions"><a class="button button--primary" href="index.html">Go to Bruz Digital <span aria-hidden="true">↗</span></a><a class="button button--secondary" href="projects.html">View our work <span aria-hidden="true">↗</span></a></div></section>'''

pages = {
    "index.html": page("Bruz Digital", "Bruz Digital builds software, applied AI and digital products around the work businesses need to get done.", "home", home, "/"),
    "projects.html": page("Work", "Explore Bruz Digital's AI Quality Control Tower hackathon prototype and the challenge behind it.", "work", projects, "/projects.html"),
    "services.html": page("Studio", "Bruz Studio builds custom software, applied AI, web experiences and product systems.", "studio", services, "/services.html"),
    "products.html": page("Products", "See Bruz Digital product directions and their current development status.", "products", products, "/products.html"),
    "team.html": page("Team", "Meet the AI, software and data engineers behind Bruz Digital.", "team", team, "/team.html"),
    "contact.html": page("Contact", "Contact Bruz Digital about software, applied AI or digital product work.", "contact", contact, "/contact.html"),
    "privacy.html": page("Privacy", "How Bruz Digital uses information shared through direct contact links.", "", privacy, "/privacy.html"),
    "thanks.html": page("Email Bruz Digital", "Continue your enquiry in your email app.", "contact", thanks, "/thanks.html"),
    "404.html": page("Page not found", "The requested Bruz Digital page could not be found.", "", not_found, "/404.html"),
}

for filename, content in pages.items():
    (ROOT / filename).write_text(content, encoding="utf-8")

print(f"Built {len(pages)} pages")
