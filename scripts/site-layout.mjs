export const DEFAULT_COVER = '/images/journal-featured.jpg';
export const SITE = 'https://www.rivieraarrival.com';
export const DEFAULT_OG_IMAGE = `${SITE}/images/hero-coast.jpg`;
export const BUS_FARE_URL = 'https://www.lignesdazur.com/titres-et-tarifs/quel-titre-pour-mon-deplacement/titres-au-voyage/';

const TITLE_MAX = 60;
const BRAND_SUFFIX = ' — Riviera Arrival';

export function copyrightYear() {
  return new Date().getFullYear();
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function documentTitle(title) {
  const base = String(title || '').trim();
  if (!base) return 'Riviera Arrival';
  if (base.includes('Riviera Arrival')) return base;
  const withBrand = `${base}${BRAND_SUFFIX}`;
  return withBrand.length <= TITLE_MAX ? withBrand : base;
}

export function jsonLdScript(value) {
  const json = JSON.stringify(value).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

export function breadcrumbList(crumbs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.item
    }))
  };
}

export function organizationLogo() {
  return `${SITE}/favicon.svg`;
}

const NAV_ITEMS = [
  { key: 'finding-a-home', href: '/finding-a-home.html', label: "I'll find your place" },
  { key: 'settling-in', href: '/settling-in.html', label: 'Settling in' },
  { key: 'neighborhoods', href: '/neighborhoods.html', label: 'Neighborhoods' },
  { key: 'journal', href: '/journal/', label: "Nathalie's journal" },
  { key: 'about', href: '/about.html', label: 'About' },
  { key: 'contact', href: '/contact.html', label: 'Contact' }
];

export function siteHeader(active) {
  const links = NAV_ITEMS.map((item) => {
    return item.key === active
      ? `<a href="${item.href}" style="color: var(--color-accent-700)">${item.label}</a>`
      : `<a href="${item.href}" class="nav-link" style="color: var(--color-text)">${item.label}</a>`;
  }).join('\n      ');
  return `<header class="site-header">
    <a class="brand-lockup" href="/">
      <span class="brand-name">Riviera Arrival</span>
      <span class="brand-mark" aria-hidden="true"></span>
    </a>
    <nav class="site-nav">
      ${links}
    </nav>
    <div class="site-header-tools">
      <button type="button" class="nav-toggle" aria-label="Menu" aria-expanded="false">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>
      </button>
    </div>
  </header>`;
}

export function siteFooter() {
  const year = copyrightYear();
  return `<footer class="site-footer">
    <div class="site-footer-brand">
      <div class="site-footer-name">Riviera Arrival</div>
      <div class="footer-muted">rivieraarrival.com · Nice, France</div>
      <div class="footer-copy">© ${year} Riviera Arrival</div>
    </div>
    <div class="site-footer-cols">
      <div class="site-footer-col">
        <span class="footer-label">Stay</span>
        <a href="/finding-a-home.html">I'll find your place</a>
        <a href="/neighborhoods.html">Neighborhoods</a>
      </div>
      <div class="site-footer-col">
        <span class="footer-label">Settle in</span>
        <a href="/settling-in.html">Guides</a>
        <a href="/about.html">About Nathalie</a>
      </div>
      <div class="site-footer-col">
        <span class="footer-label">Read</span>
        <a href="/journal/">Nathalie's journal</a>
        <a href="/contact.html">Contact</a>
      </div>
    </div>
  </footer>`;
}

export function siteScripts() {
  return `<script>
  (function () {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.querySelector('header nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  })();
</script>`;
}

export function iconLinks() {
  return `<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="32x32">
`;
}

export function socialTags({ title, description, url, image = DEFAULT_OG_IMAGE, type = 'website' }) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeUrl = escapeHtml(url);
  const safeImage = escapeHtml(image);
  const safeType = escapeHtml(type);
  return `<meta property="og:title" content="${safeTitle}">
<meta property="og:description" content="${safeDescription}">
<meta property="og:url" content="${safeUrl}">
<meta property="og:type" content="${safeType}">
<meta property="og:image" content="${safeImage}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${safeTitle}">
<meta name="twitter:description" content="${safeDescription}">
<meta name="twitter:image" content="${safeImage}">
`;
}

export function linkBusFare(escapedText) {
  return String(escapedText).replace(/€1\.70|&euro;1\.70/g, `<a class="source-link" href="${BUS_FARE_URL}">€1.70</a>`);
}

export function layout({
  title,
  description,
  canonical,
  extraHead = '',
  body,
  crumbs = null,
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  active = 'journal',
  robots = ''
}) {
  const socialTitle = escapeHtml(title);
  const breadcrumb = crumbs ? `${jsonLdScript(breadcrumbList(crumbs))}\n` : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${socialTitle}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${escapeHtml(canonical)}">
${iconLinks()}${socialTags({ title, description, url: canonical, image, type })}${robots}${breadcrumb}<link rel="stylesheet" href="/styles.css">
<style>
  body { margin: 0; background: var(--color-bg); color: var(--color-text); font-family: var(--font-body); }
  a { color: var(--color-accent-700); text-decoration: none; }
  a:hover { color: var(--color-accent-600); }
</style>
${extraHead}
</head>
<body>
<div style="background: var(--color-bg); min-height: 100vh">
${siteHeader(active)}
<main>
${body}
</main>
${siteFooter()}
</div>
${siteScripts()}
</body>
</html>
`;
}
