export const DEFAULT_COVER = '/images/journal-featured.jpg';

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function siteHeader(active) {
  const journalStyle = active === 'journal'
    ? 'color: var(--color-accent-700)'
    : 'color: var(--color-text)';
  const journalClass = active === 'journal' ? '' : ' class="nav-link"';
  return `<header style="display: flex; align-items: center; gap: 26px; padding: 20px 48px; max-width: 1320px; margin: 0 auto">
    <a href="/index.html" style="display: flex; align-items: baseline; gap: 8px; color: var(--color-text)">
      <span style="font-family: var(--font-heading); font-size: 23px; letter-spacing: -0.01em">Riviera Arrival</span>
      <span style="width: 9px; height: 9px; border-radius: 999px; background: var(--color-accent); display: inline-block"></span>
    </a>
    <nav style="display: flex; gap: 28px; margin-left: 18px; font-size: 15px">
      <a href="/finding-a-home.html" class="nav-link" style="color: var(--color-text)">I'll find your place</a>
      <a href="/settling-in.html" class="nav-link" style="color: var(--color-text)">Settling in</a>
      <a href="/neighborhoods.html" class="nav-link" style="color: var(--color-text)">Neighborhoods</a>
      <a href="/journal/"${journalClass} style="${journalStyle}">Nathalie's journal</a>
      <a href="/about.html" class="nav-link" style="color: var(--color-text)">About</a>
    </nav>
    <div style="margin-left: auto; display: flex; align-items: center; gap: 14px">
      <div style="display: flex; gap: 2px; padding: 3px; border-radius: 999px; background: color-mix(in srgb, var(--color-text) 7%, transparent)">
        <button type="button" class="lang-btn active" data-lang="en">EN</button>
        <button type="button" class="lang-btn" data-lang="fr">FR</button>
      </div>
      <button type="button" class="nav-toggle" aria-label="Menu" aria-expanded="false">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>
      </button>
    </div>
  </header>`;
}

export function siteFooter() {
  return `<footer class="site-footer" style="max-width: 1320px; margin: 88px auto 0; padding: 56px 48px 64px; display: flex; gap: 48px; align-items: flex-start; border-top: 1px solid var(--color-divider)">
    <div style="flex: 0 0 280px">
      <div style="font-family: var(--font-heading); font-size: 21px">Riviera Arrival</div>
      <div style="font-size: 14px; margin-top: 8px; color: color-mix(in srgb, var(--color-text) 60%, transparent)">rivieraarrival.com · Nice, France</div>
    </div>
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 180px)); gap: 32px; font-size: 15px">
      <div style="display: flex; flex-direction: column; gap: 10px">
        <span style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: color-mix(in srgb, var(--color-text) 50%, transparent)">Stay</span>
        <a href="/finding-a-home.html">I'll find your place</a>
        <a href="/neighborhoods.html">Neighborhoods</a>
      </div>
      <div style="display: flex; flex-direction: column; gap: 10px">
        <span style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: color-mix(in srgb, var(--color-text) 50%, transparent)">Settle in</span>
        <a href="/settling-in.html">Guides</a>
        <a href="/about.html">About Nathalie</a>
        <a href="/contact.html">Contact</a>
      </div>
      <div style="display: flex; flex-direction: column; gap: 10px">
        <span style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: color-mix(in srgb, var(--color-text) 50%, transparent)">Read</span>
        <a href="/journal/">Nathalie's journal</a>
        <a href="/neighborhoods.html">Neighborhoods</a>
        <a href="/contact.html">Contact</a>
      </div>
    </div>
  </footer>`;
}

export function siteScripts() {
  return `<script>
  (function () {
    var btns = document.querySelectorAll('.lang-btn');
    var saved = null;
    try { saved = localStorage.getItem('ra-lang'); } catch (e) {}
    if (saved) setLang(saved);
    btns.forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.lang); }); });
    function setLang(lang) {
      btns.forEach(function (b) { b.classList.toggle('active', b.dataset.lang === lang); });
      document.documentElement.setAttribute('lang', lang);
      try { localStorage.setItem('ra-lang', lang); } catch (e) {}
    }
  })();
</script>
<script>
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

export function layout({ title, description, canonical, extraHead = '', body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${escapeHtml(canonical)}">
<link rel="stylesheet" href="/styles.css">
<style>
  body { margin: 0; background: var(--color-bg); color: var(--color-text); font-family: var(--font-body); }
  a { color: var(--color-accent-700); text-decoration: none; }
  a:hover { color: var(--color-accent-600); }
</style>
${extraHead}
</head>
<body>
<div style="background: var(--color-bg); min-height: 100vh">
${body}
${siteFooter()}
</div>
${siteScripts()}
</body>
</html>
`;
}
