import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { marked } from 'marked';
import { escapeHtml, siteScripts } from './site-layout.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

marked.setOptions({ gfm: true, breaks: false });

// marked's text-escaping HTML-encodes straight apostrophes as `&#39;`; the
// existing hand-written page uses literal `'`, so undo that one substitution
// to keep prose byte-identical (safe: none of our content wants a literal
// `&#39;`).
function inline(text) {
  return marked.parseInline(String(text || '')).replace(/&#39;/g, "'");
}

function paragraphs(body, style) {
  return String(body || '')
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => `<p style="${style}">${inline(chunk)}</p>`)
    .join('\n      ');
}

const SECTION_PARAGRAPH_STYLE =
  'font-size: 18px; line-height: 1.6; margin: 14px 0 0; color: color-mix(in srgb, var(--color-text) 80%, transparent)';
const LOOSE_PARAGRAPH_STYLE =
  'font-size: 18px; line-height: 1.6; margin: 32px 0 0; color: color-mix(in srgb, var(--color-text) 80%, transparent)';

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

  const header = `<header style="display: flex; align-items: center; gap: 26px; padding: 20px 48px; max-width: 1320px; margin: 0 auto">
    <a href="index.html" style="display: flex; align-items: baseline; gap: 8px; color: var(--color-text)">
      <span style="font-family: var(--font-heading); font-size: 23px; letter-spacing: -0.01em">Riviera Arrival</span>
      <span style="width: 9px; height: 9px; border-radius: 999px; background: var(--color-accent); display: inline-block"></span>
    </a>
    <nav style="display: flex; gap: 28px; margin-left: 18px; font-size: 15px">
      <a href="finding-a-home.html" style="color: var(--color-accent-700)">I'll find your place</a>
      <a href="settling-in.html" class="nav-link" style="color: var(--color-text)">Settling in</a>
      <a href="neighborhoods.html" class="nav-link" style="color: var(--color-text)">Neighborhoods</a>
      <a href="/journal/" class="nav-link" style="color: var(--color-text)">Nathalie's journal</a>
      <a href="about.html" class="nav-link" style="color: var(--color-text)">About</a>
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

  const footer = `<footer class="site-footer" style="max-width: 1320px; margin: 80px auto 0; padding: 56px 48px 64px; display: flex; gap: 48px; align-items: flex-start; border-top: 1px solid var(--color-divider)">
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

  const main = `<main style="max-width: 1320px; margin: 0 auto; padding: 40px 48px 0">
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

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(data.title)} &mdash; Riviera Arrival</title>
<meta name="description" content="${escapeHtml(data.description)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Lora:ital,wght@0,400;0,500;0,600;0,700&display=swap">
<link rel="stylesheet" href="styles.css">
<style>
  body { margin: 0; background: var(--color-bg); color: var(--color-text); font-family: var(--font-body); }
  a { color: var(--color-accent-700); text-decoration: none; }
  a:hover { color: var(--color-accent-600); }
</style>
</head>
<body>

<div style="background: var(--color-bg); min-height: 100vh">

  ${header}

  ${main}

  ${footer}
</div>

${siteScripts()}
</body>
</html>
`;
}

const raw = readFileSync(join(ROOT, 'content', 'pages', 'finding-a-home.md'), 'utf8');
const { data } = matter(raw);
writeFileSync(join(ROOT, 'finding-a-home.html'), renderFindingAHome(data));
console.log('Pages build: finding-a-home.html generated from content/pages/finding-a-home.md');
