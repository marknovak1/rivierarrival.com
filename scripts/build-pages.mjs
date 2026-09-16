import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { marked } from 'marked';
import { DEFAULT_COVER, escapeHtml, siteScripts } from './site-layout.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

marked.setOptions({ gfm: true, breaks: false });

// marked's text-escaping HTML-encodes straight apostrophes as `&#39;`; the
// existing hand-written pages use literal `'`, so undo that one substitution
// to keep prose byte-identical (safe: none of our content wants a literal
// `&#39;`).
function inline(text) {
  return marked.parseInline(String(text || '')).replace(/&#39;/g, "'");
}

// escapeHtml() escapes `&` to `&amp;`, but the hand-written pages use a bare
// `&` in headings like "Visas & paperwork" or "Monaco & the Cap". Still
// escape `<`/`>`/`"` for safety, just undo the `&` escaping to stay
// byte-identical (browsers render both identically either way).
function text(value) {
  return escapeHtml(value).replace(/&amp;/g, '&');
}

function paragraphs(body, style) {
  return String(body || '')
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => `<p style="${style}">${inline(chunk)}</p>`)
    .join('\n      ');
}

// Normalizes an image field to the site's existing convention: a path
// relative to the page (e.g. "images/town-nice.jpg"), never a leading
// slash, and never empty. Decap's image widget can store a path with a
// leading slash (depending on media_folder/public_folder); this keeps
// output consistent regardless of how the value was stored.
function pageImage(path, fallback = DEFAULT_COVER) {
  const value = String(path || '').trim() || fallback;
  if (/^https?:\/\//i.test(value)) return value;
  return value.startsWith('/') ? value.slice(1) : value;
}

const SECTION_PARAGRAPH_STYLE =
  'font-size: 18px; line-height: 1.6; margin: 14px 0 0; color: color-mix(in srgb, var(--color-text) 80%, transparent)';
const LOOSE_PARAGRAPH_STYLE =
  'font-size: 18px; line-height: 1.6; margin: 32px 0 0; color: color-mix(in srgb, var(--color-text) 80%, transparent)';

const NAV_ITEMS = [
  { key: 'finding-a-home', href: 'finding-a-home.html', label: "I'll find your place" },
  { key: 'settling-in', href: 'settling-in.html', label: 'Settling in' },
  { key: 'neighborhoods', href: 'neighborhoods.html', label: 'Neighborhoods' },
  { key: 'journal', href: '/journal/', label: "Nathalie's journal" },
  { key: 'about', href: 'about.html', label: 'About' }
];

function pageHeader(active) {
  const links = NAV_ITEMS.map((item) => {
    return item.key === active
      ? `<a href="${item.href}" style="color: var(--color-accent-700)">${item.label}</a>`
      : `<a href="${item.href}" class="nav-link" style="color: var(--color-text)">${item.label}</a>`;
  }).join('\n      ');
  return `<header style="display: flex; align-items: center; gap: 26px; padding: 20px 48px; max-width: 1320px; margin: 0 auto">
    <a href="index.html" style="display: flex; align-items: baseline; gap: 8px; color: var(--color-text)">
      <span style="font-family: var(--font-heading); font-size: 23px; letter-spacing: -0.01em">Riviera Arrival</span>
      <span style="width: 9px; height: 9px; border-radius: 999px; background: var(--color-accent); display: inline-block"></span>
    </a>
    <nav style="display: flex; gap: 28px; margin-left: 18px; font-size: 15px">
      ${links}
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

function pageFooter() {
  return `<footer class="site-footer" style="max-width: 1320px; margin: 80px auto 0; padding: 56px 48px 64px; display: flex; gap: 48px; align-items: flex-start; border-top: 1px solid var(--color-divider)">
    <div style="flex: 0 0 280px">
      <div style="font-family: var(--font-heading); font-size: 21px">Riviera Arrival</div>
      <div style="font-size: 14px; margin-top: 8px; color: color-mix(in srgb, var(--color-text) 60%, transparent)">rivieraarrival.com &middot; Nice, France</div>
    </div>
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 180px)); gap: 32px; font-size: 15px">
      <div style="display: flex; flex-direction: column; gap: 10px">
        <span style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: color-mix(in srgb, var(--color-text) 50%, transparent)">Stay</span>
        <a href="finding-a-home.html">I'll find your place</a>
        <a href="neighborhoods.html">Neighborhoods</a>
      </div>
      <div style="display: flex; flex-direction: column; gap: 10px">
        <span style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: color-mix(in srgb, var(--color-text) 50%, transparent)">Settle in</span>
        <a href="settling-in.html">Guides</a>
        <a href="about.html">About Nathalie</a>
        <a href="contact.html">Contact</a>
      </div>
      <div style="display: flex; flex-direction: column; gap: 10px">
        <span style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: color-mix(in srgb, var(--color-text) 50%, transparent)">Read</span>
        <a href="/journal/">Nathalie's journal</a>
        <a href="neighborhoods.html">Neighborhoods</a>
        <a href="contact.html">Contact</a>
      </div>
    </div>
  </footer>`;
}

// Shared shell for all "pages" collection pages. fontLinks/extraStyles are
// escape hatches for the one-off differences between pages (finding-a-home's
// redundant Google Fonts link; settling-in/neighborhoods' .stub-grid media
// queries) so each page still comes out byte-identical to its hand-written
// original.
function pageShell({ activeNav, title, description, fontLinks = '', extraStyles = '', body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} &mdash; Riviera Arrival</title>
<meta name="description" content="${escapeHtml(description)}">
${fontLinks}<link rel="stylesheet" href="styles.css">
<style>
  body { margin: 0; background: var(--color-bg); color: var(--color-text); font-family: var(--font-body); }
  a { color: var(--color-accent-700); text-decoration: none; }
  a:hover { color: var(--color-accent-600); }
${extraStyles}</style>
</head>
<body>

<div style="background: var(--color-bg); min-height: 100vh">

  ${pageHeader(activeNav)}

  ${body}

  ${pageFooter()}
</div>

${siteScripts()}
</body>
</html>
`;
}

function renderSections(sections) {
  return sections
    .map((section, i) => {
      const headingMargin = i === 0 ? '0' : '40px 0 0';
      return `<h2 style="font-family: var(--font-heading); font-size: 32px; margin: ${headingMargin}; letter-spacing: -0.01em">${escapeHtml(section.heading)}</h2>
      ${paragraphs(section.body, SECTION_PARAGRAPH_STYLE)}`;
    })
    .join('\n\n      ');
}

function renderFindingAHome(data) {
  const ctaLabel = escapeHtml(data.cta_label);
  const ctaLink = escapeHtml(data.cta_link);

  const body = `<main style="max-width: 1320px; margin: 0 auto; padding: 40px 48px 0">
    <span class="tag tag-accent-2" style="border-radius: 999px">${escapeHtml(data.eyebrow)}</span>
    <h1 style="font-family: var(--font-heading); font-size: 60px; line-height: 1.03; letter-spacing: -0.02em; margin: 20px 0 0; max-width: 15em; text-wrap: pretty">${escapeHtml(data.hero_heading)}</h1>
    <p style="font-size: 19px; line-height: 1.55; max-width: 40em; margin: 22px 0 0; color: color-mix(in srgb, var(--color-text) 78%, transparent); text-wrap: pretty">${inline(data.hero_intro)}</p>
    <a href="${ctaLink}" class="btn btn-primary" style="border-radius: 999px; margin-top: 24px; padding: 13px 26px">${ctaLabel}</a>
  </main>

  <section style="max-width: 1320px; margin: 56px auto 0; padding: 0 48px">
    <div style="max-width: 46em">
      ${renderSections(data.sections)}

      <p style="${LOOSE_PARAGRAPH_STYLE}">${inline(data.service_link_text)}</p>

      <p style="${LOOSE_PARAGRAPH_STYLE}">${inline(data.closing_text)}</p>
      <a href="${ctaLink}" class="btn btn-primary" style="border-radius: 999px; margin-top: 4px; padding: 13px 26px">${ctaLabel}</a>
    </div>
  </section>`;

  return pageShell({
    activeNav: 'finding-a-home',
    title: data.title,
    description: data.description,
    fontLinks: `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Lora:ital,wght@0,400;0,500;0,600;0,700&display=swap">
`,
    body
  });
}

const STUB_GRID_STYLES = `  @media (max-width: 900px) { .stub-grid { grid-template-columns: repeat(2, 1fr) !important; } }
  @media (max-width: 560px) { .stub-grid { grid-template-columns: 1fr !important; } }
`;

function renderGuideCard(guide) {
  const image = pageImage(guide.image);
  const alt = text(guide.imageAlt || guide.heading);
  return `<a href="${escapeHtml(guide.link)}" style="background: var(--color-neutral-100); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 10px; color: var(--color-text); text-decoration: none">
        <div style="height: 130px; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 4px"><img src="${escapeHtml(image)}" alt="${alt}" style="width:100%;height:100%;object-fit:cover;display:block" loading="lazy"></div>
        <div style="font-family: var(--font-heading); font-size: 20px; line-height: 1.15">${text(guide.heading)}</div>
        <div style="font-size: 15px; color: color-mix(in srgb, var(--color-text) 68%, transparent)">${text(guide.description)}</div>
      </a>`;
}

function renderSettlingIn(data) {
  const guideCards = data.guides.map(renderGuideCard).join('\n      ');

  const body = `<section style="max-width: 1320px; margin: 0 auto; padding: 40px 48px 0">
    <span class="tag tag-accent-2" style="border-radius: 999px">${escapeHtml(data.eyebrow)}</span>
    <h1 style="font-family: var(--font-heading); font-size: 60px; line-height: 1.03; letter-spacing: -0.02em; margin: 20px 0 0; max-width: 15em; text-wrap: pretty">${escapeHtml(data.hero_heading)}</h1>
    <p style="font-size: 19px; line-height: 1.55; max-width: 40em; margin: 22px 0 0; color: color-mix(in srgb, var(--color-text) 78%, transparent); text-wrap: pretty">${inline(data.hero_intro)}</p>
  </section>

  <section style="max-width: 1320px; margin: 72px auto 0; padding: 0 48px">
    <h2 style="font-family: var(--font-heading); font-size: 36px; margin: 0; letter-spacing: -0.01em">${escapeHtml(data.guides_heading)}</h2>
    <div class="stub-grid" style="margin-top: 30px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px">
      ${guideCards}
    </div>
  </section>

  <section style="max-width: 1320px; margin: 80px auto 0; padding: 0 48px">
    <div style="background: var(--color-accent-2-200); border-radius: var(--radius-lg); padding: 44px 48px; display: flex; align-items: center; gap: 40px; flex-wrap: wrap">
      <div style="flex: 1; min-width: 280px">
        <h2 style="font-family: var(--font-heading); font-size: 32px; margin: 0; letter-spacing: -0.01em; color: var(--color-accent-2-900)">${escapeHtml(data.cta_heading)}</h2>
        <p style="margin: 12px 0 0; font-size: 17px; line-height: 1.55; color: var(--color-accent-2-900); text-wrap: pretty">${inline(data.cta_text)}</p>
      </div>
      <a href="${escapeHtml(data.cta_link)}" class="btn btn-primary" style="border-radius: 999px; padding: 13px 26px">${escapeHtml(data.cta_label)}</a>
    </div>
  </section>`;

  return pageShell({
    activeNav: 'settling-in',
    title: data.title,
    description: data.description,
    extraStyles: STUB_GRID_STYLES,
    body
  });
}

function renderTownCard(town) {
  const image = pageImage(town.image);
  const alt = text(town.imageAlt || town.name);
  return `<div style="background: var(--color-neutral-100); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 10px">
        <div style="height: 130px; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 4px"><img src="${escapeHtml(image)}" alt="${alt}" style="width:100%;height:100%;object-fit:cover;display:block" loading="lazy"></div>
        <div style="font-family: var(--font-heading); font-size: 20px; line-height: 1.15">${text(town.name)}</div>
        <div style="font-size: 15px; color: color-mix(in srgb, var(--color-text) 68%, transparent)">${text(town.description)}</div>
      </div>`;
}

function renderNeighborhoods(data) {
  const townCards = data.towns.map(renderTownCard).join('\n      ');
  const heroImage = pageImage(data.hero_image);
  const heroAlt = text(data.hero_image_alt || data.hero_heading);

  const body = `<section style="max-width: 1320px; margin: 0 auto; padding: 40px 48px 0">
    <span class="tag tag-accent-2" style="border-radius: 999px">${escapeHtml(data.eyebrow)}</span>
    <h1 style="font-family: var(--font-heading); font-size: 60px; line-height: 1.03; letter-spacing: -0.02em; margin: 20px 0 0; max-width: 15em; text-wrap: pretty">${escapeHtml(data.hero_heading)}</h1>
    <p style="font-size: 19px; line-height: 1.55; max-width: 40em; margin: 22px 0 0; color: color-mix(in srgb, var(--color-text) 78%, transparent); text-wrap: pretty">${inline(data.hero_intro)}</p>
  </section>

  <section style="max-width: 1320px; margin: 40px auto 0; padding: 0 48px">
    <div style="height: 320px; border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-md)"><img src="${escapeHtml(heroImage)}" alt="${heroAlt}" style="width:100%;height:100%;object-fit:cover;display:block" loading="lazy"></div>
  </section>

  <section style="max-width: 1320px; margin: 72px auto 0; padding: 0 48px">
    <h2 style="font-family: var(--font-heading); font-size: 36px; margin: 0; letter-spacing: -0.01em">${escapeHtml(data.towns_heading)}</h2>
    <p style="margin: 10px 0 0; font-size: 17px; max-width: 44em; color: color-mix(in srgb, var(--color-text) 70%, transparent); text-wrap: pretty">${inline(data.towns_intro)}</p>
    <div class="stub-grid" style="margin-top: 30px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px">
      ${townCards}
    </div>
  </section>

  <section style="max-width: 1320px; margin: 80px auto 0; padding: 0 48px">
    <div style="background: var(--color-accent-2-200); border-radius: var(--radius-lg); padding: 44px 48px; display: flex; align-items: center; gap: 40px; flex-wrap: wrap">
      <div style="flex: 1; min-width: 280px">
        <h2 style="font-family: var(--font-heading); font-size: 32px; margin: 0; letter-spacing: -0.01em; color: var(--color-accent-2-900)">${escapeHtml(data.cta_heading)}</h2>
        <p style="margin: 12px 0 0; font-size: 17px; line-height: 1.55; color: var(--color-accent-2-900); text-wrap: pretty">${inline(data.cta_text)}</p>
      </div>
      <a href="${escapeHtml(data.cta_link)}" class="btn btn-primary" style="border-radius: 999px; padding: 13px 26px">${escapeHtml(data.cta_label)}</a>
    </div>
  </section>`;

  return pageShell({
    activeNav: 'neighborhoods',
    title: data.title,
    description: data.description,
    extraStyles: STUB_GRID_STYLES,
    body
  });
}

function buildPage(slug, render) {
  const raw = readFileSync(join(ROOT, 'content', 'pages', `${slug}.md`), 'utf8');
  const { data } = matter(raw);
  writeFileSync(join(ROOT, `${slug}.html`), render(data));
}

buildPage('finding-a-home', renderFindingAHome);
buildPage('settling-in', renderSettlingIn);
buildPage('neighborhoods', renderNeighborhoods);
console.log('Pages build: finding-a-home.html, settling-in.html, neighborhoods.html generated from content/pages/*.md');
