import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { marked } from 'marked';
import {
  DEFAULT_COVER,
  DEFAULT_OG_IMAGE,
  breadcrumbList,
  documentTitle,
  escapeHtml,
  iconLinks,
  jsonLdScript,
  linkBusFare,
  organizationLogo,
  siteFooter,
  siteHeader,
  siteScripts,
  socialTags
} from './site-layout.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.rivieraarrival.com';

const AREA_SERVED = ['Nice', 'Antibes', 'Cannes', 'Menton'].map((name) => ({
  '@type': 'City',
  name
}));

const ORG_DESCRIPTION = 'Guided by Nathalie: practical help to settle in Nice, Antibes, Cannes and Menton, from the home search through the first months.';

function organizationNode() {
  return {
    '@type': 'Organization',
    '@id': `${SITE}/#organization`,
    name: 'Riviera Arrival',
    url: `${SITE}/`,
    logo: organizationLogo(),
    description: ORG_DESCRIPTION,
    areaServed: AREA_SERVED
  };
}

function serviceNode({ name, description, url }) {
  return {
    '@type': 'Service',
    name,
    url,
    description,
    provider: { '@id': `${SITE}/#organization` },
    areaServed: AREA_SERVED
  };
}

function orgAndServiceScript(service) {
  return jsonLdScript({
    '@context': 'https://schema.org',
    '@graph': [organizationNode(), serviceNode(service)]
  });
}

function crumbScript(crumbs) {
  return jsonLdScript(breadcrumbList(crumbs));
}

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

// Shared shell for Decap "pages" collection output.
function pageShell({
  activeNav,
  title,
  description,
  canonical = '',
  fontLinks = '',
  extraStyles = '',
  extraHead = '',
  body,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  robots = ''
}) {
  const fullTitle = documentTitle(title);
  const canonicalTag = canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}">\n` : '';
  const pageUrl = canonical || `${SITE}/`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(fullTitle)}</title>
<meta name="description" content="${escapeHtml(description)}">
${canonicalTag}${iconLinks()}${socialTags({ title: fullTitle, description, url: pageUrl, image: ogImage, type: ogType })}${robots}${extraHead}${fontLinks}<link rel="stylesheet" href="/styles.css">
<style>
  body { margin: 0; background: var(--color-bg); color: var(--color-text); font-family: var(--font-body); }
  a { color: var(--color-accent-700); text-decoration: none; }
  a:hover { color: var(--color-accent-600); }
${extraStyles}</style>
</head>
<body>

<div style="background: var(--color-bg); min-height: 100vh">

  ${siteHeader(activeNav)}
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

function renderSections(sections) {
  return sections
    .map((section, i) => {
      const headingMargin = i === 0 ? '0' : '40px 0 0';
      return `<h2 style="font-family: var(--font-heading); font-size: 32px; margin: ${headingMargin}; letter-spacing: -0.01em">${escapeHtml(section.heading)}</h2>
      ${paragraphs(section.body, SECTION_PARAGRAPH_STYLE)}`;
    })
    .join('\n\n      ');
}

// These three stay on the page even when a Decap save clears or shortens the list.
const DEFAULT_HELPFUL_GUIDES = [
  { label: 'Exchanging a foreign driving licence', href: 'guide-exchanging-a-driving-licence.html' },
  { label: 'Buying or renting on the Riviera', href: 'guide-buying-or-renting-on-the-french-riviera.html' },
  { label: 'The carte de séjour', href: 'guide-carte-de-sejour.html' }
];

export function mergeHelpfulGuides(items) {
  const provided = Array.isArray(items) ? items : [];
  const seen = new Set();
  const merged = [];
  for (const item of provided) {
    const href = String(item?.href || '').trim();
    const label = String(item?.label || '').trim();
    if (!href || !label || seen.has(href)) continue;
    seen.add(href);
    merged.push({ label, href });
  }
  for (const fallback of DEFAULT_HELPFUL_GUIDES) {
    if (seen.has(fallback.href)) continue;
    seen.add(fallback.href);
    merged.push({ label: fallback.label, href: fallback.href });
  }
  return merged;
}

function renderHelpfulGuides(data) {
  const heading = String(data.helpful_guides_heading || '').trim() || 'Helpful guides';
  const links = mergeHelpfulGuides(data.helpful_guides)
    .map((item) => `<li><a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a></li>`)
    .join('\n          ');
  return `<h2 style="font-family: var(--font-heading); font-size: 32px; margin: 48px 0 0; letter-spacing: -0.01em">${escapeHtml(heading)}</h2>
      <ul style="margin: 16px 0 0; padding-left: 1.25em; font-size: 18px; line-height: 1.7">
          ${links}
      </ul>`;
}

function renderFindingAHome(data) {
  const ctaLabel = escapeHtml(data.cta_label);
  const ctaLink = escapeHtml(data.cta_link);

  const body = `<div style="max-width: 1320px; margin: 0 auto; padding: 40px 48px 0">
    <span class="tag tag-accent-2" style="border-radius: 999px">${escapeHtml(data.eyebrow)}</span>
    <h1 style="font-family: var(--font-heading); font-size: 60px; line-height: 1.03; letter-spacing: -0.02em; margin: 20px 0 0; max-width: 15em; text-wrap: pretty">${escapeHtml(data.hero_heading)}</h1>
    <p style="font-size: 19px; line-height: 1.55; max-width: 40em; margin: 22px 0 0; color: color-mix(in srgb, var(--color-text) 78%, transparent); text-wrap: pretty">${inline(data.hero_intro)}</p>
    <a href="${ctaLink}" class="btn btn-primary" style="border-radius: 999px; margin-top: 24px; padding: 13px 26px">${ctaLabel}</a>
  </div>

  <section style="max-width: 1320px; margin: 56px auto 0; padding: 0 48px">
    <div style="max-width: 46em">
      ${renderSections(data.sections)}

      ${renderHelpfulGuides(data)}

      <p style="${LOOSE_PARAGRAPH_STYLE}">${inline(data.service_link_text)}</p>

      <p style="${LOOSE_PARAGRAPH_STYLE}">${inline(data.closing_text)}</p>
      <a href="${ctaLink}" class="btn btn-primary" style="border-radius: 999px; margin-top: 4px; padding: 13px 26px">${ctaLabel}</a>
    </div>
  </section>`;

  const canonical = `${SITE}/finding-a-home.html`;
  const extraHead = `${orgAndServiceScript({
    name: 'French Riviera home-finding service',
    description: data.description,
    url: canonical
  })}
${crumbScript([
  { name: 'Home', item: `${SITE}/` },
  { name: "I'll find your place", item: canonical }
])}
`;

  return pageShell({
    activeNav: 'finding-a-home',
    title: data.title,
    description: data.description,
    canonical,
    extraHead,
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
  const description = linkBusFare(text(guide.description));
  const cardStyle = 'background: var(--color-neutral-100); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 10px; color: var(--color-text); text-decoration: none';
  const photo = `<div style="height: 130px; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 4px"><img src="${escapeHtml(image)}" alt="${alt}" width="640" height="260" style="width:100%;height:100%;object-fit:cover;display:block" loading="lazy"></div>`;
  const heading = `<div style="font-family: var(--font-heading); font-size: 20px; line-height: 1.15">${text(guide.heading)}</div>`;
  const blurb = `<div style="font-size: 15px; color: color-mix(in srgb, var(--color-text) 68%, transparent)">${description}</div>`;
  if (description.includes('source-link')) {
    return `<div class="essential-card" style="${cardStyle}">
        <a href="${escapeHtml(guide.link)}" style="display: flex; flex-direction: column; gap: 10px; color: inherit; text-decoration: none">
        ${photo}
        ${heading}
        </a>
        ${blurb}
      </div>`;
  }
  return `<a href="${escapeHtml(guide.link)}" class="essential-card" style="${cardStyle}">
        ${photo}
        ${heading}
        ${blurb}
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

  const canonical = `${SITE}/settling-in.html`;
  return pageShell({
    activeNav: 'settling-in',
    title: data.title,
    description: data.description,
    canonical,
    extraHead: `${crumbScript([
      { name: 'Home', item: `${SITE}/` },
      { name: 'Settling in', item: canonical }
    ])}\n`,
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
  const townsIntro = String(data.towns_intro || '').trim();
  const townsIntroHtml = townsIntro
    ? `<p style="margin: 10px 0 0; font-size: 17px; max-width: 44em; color: color-mix(in srgb, var(--color-text) 70%, transparent); text-wrap: pretty">${inline(townsIntro)}</p>`
    : '';
  const ctaHref = String(data.cta_link || '').trim();
  const ctaButton = ctaHref && ctaHref !== '#'
    ? `<a href="${escapeHtml(ctaHref)}" class="btn btn-primary" style="border-radius: 999px; padding: 13px 26px">${escapeHtml(data.cta_label)}</a>`
    : '';

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
    ${townsIntroHtml}
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
      ${ctaButton}
    </div>
  </section>`;

  const canonical = `${SITE}/neighborhoods.html`;
  return pageShell({
    activeNav: 'neighborhoods',
    title: data.title,
    description: data.description,
    canonical,
    extraHead: `${crumbScript([
      { name: 'Home', item: `${SITE}/` },
      { name: 'Neighborhoods', item: canonical }
    ])}\n`,
    extraStyles: STUB_GRID_STYLES,
    body
  });
}

function buildPage(slug, render) {
  const raw = readFileSync(join(ROOT, 'content', 'pages', `${slug}.md`), 'utf8');
  const { data } = matter(raw);
  writeFileSync(join(ROOT, `${slug}.html`), render(data));
}

const GUIDE_STYLES = `  .guide-body p { font-size: 18px; line-height: 1.6; margin: 14px 0 0; color: color-mix(in srgb, var(--color-text) 80%, transparent); }
  .guide-body ul, .guide-body ol { margin: 14px 0 0; padding-left: 1.25em; font-size: 18px; line-height: 1.6; color: color-mix(in srgb, var(--color-text) 80%, transparent); }
  .guide-body li { margin: 0.35em 0; }
  .guide-body a { text-decoration: underline; text-underline-offset: 3px; }
  .figure-wrap { overflow-x: auto; margin-top: 8px; }
  .figure-table { width: 100%; border-collapse: collapse; }
  .figure-table th, .figure-table td { text-align: left; vertical-align: top; padding: 12px 8px; border-bottom: 1px solid var(--color-divider); font-size: 16px; line-height: 1.45; }
  .figure-table th { font-family: var(--font-heading); font-size: 18px; font-weight: 600; }
  .figure-placeholder { font-style: italic; color: var(--color-accent-700); }
  .faq-list { margin: 8px 0 0; }
  .faq-list h3 { font-family: var(--font-heading); font-size: 24px; margin: 28px 0 0; letter-spacing: -0.01em; }
`;

function isoDate(value) {
  if (!value) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, '0');
    const d = String(value.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const match = String(value).trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
}

function formatLongDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

function guideHtml(markdown) {
  return marked.parse(String(markdown || '')).replace(/&#39;/g, "'");
}

function plainText(markdown) {
  return guideHtml(markdown)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function isHiddenFromGoogle(data) {
  return data.noindex === true || data.noindex === 'true';
}

function absoluteAsset(path) {
  const value = pageImage(path);
  if (/^https?:\/\//i.test(value)) return value;
  return `${SITE}/${value}`;
}

function renderFigureGroups(groups) {
  if (!Array.isArray(groups) || !groups.length) return '';
  return groups
    .map((group) => {
      const rows = (group.rows || [])
        .map((row) => {
          const label = String(row.label || '').trim();
          const value = String(row.value || '').trim();
          const shown = value
            ? escapeHtml(value)
            : `<span class="figure-placeholder">[Nathalie to fill: ${escapeHtml(label)}]</span>`;
          return `<tr>
          <td>${escapeHtml(label)}</td>
          <td>${shown}</td>
        </tr>`;
        })
        .join('\n        ');
      const intro = String(group.intro || '').trim();
      const introHtml = intro ? `<p style="font-size: 17px; line-height: 1.55; margin: 10px 0 0; color: color-mix(in srgb, var(--color-text) 70%, transparent)">${inline(intro)}</p>` : '';
      return `<h2 style="font-family: var(--font-heading); font-size: 32px; margin: 40px 0 0; letter-spacing: -0.01em">${escapeHtml(group.heading)}</h2>
      ${introHtml}
      <div class="figure-wrap">
      <table class="figure-table">
        <thead>
          <tr><th>Item</th><th>Figure</th></tr>
        </thead>
        <tbody>
        ${rows}
        </tbody>
      </table>
      </div>`;
    })
    .join('\n\n      ');
}

function renderGuideSections(sections) {
  if (!Array.isArray(sections)) return '';
  return sections
    .map((section) => `<h2 style="font-family: var(--font-heading); font-size: 32px; margin: 40px 0 0; letter-spacing: -0.01em">${escapeHtml(section.heading)}</h2>
      <div class="guide-body">
      ${guideHtml(section.body)}
      </div>`)
    .join('\n\n      ');
}

function renderFaqs(faqs) {
  if (!Array.isArray(faqs) || !faqs.length) return '';
  const items = faqs
    .map((faq) => `<h3>${escapeHtml(faq.question)}</h3>
        <div class="guide-body">
        ${guideHtml(faq.answer)}
        </div>`)
    .join('\n        ');
  return `<h2 style="font-family: var(--font-heading); font-size: 32px; margin: 48px 0 0; letter-spacing: -0.01em">Questions I get asked</h2>
      <div class="faq-list">
        ${items}
      </div>`;
}

function renderRelated(related) {
  if (!Array.isArray(related) || !related.length) return '';
  const links = related
    .map((item) => `<li><a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a></li>`)
    .join('\n          ');
  return `<h2 style="font-family: var(--font-heading); font-size: 32px; margin: 48px 0 0; letter-spacing: -0.01em">Keep going</h2>
      <ul style="margin: 16px 0 0; padding-left: 1.25em; font-size: 18px; line-height: 1.7">
          ${links}
      </ul>`;
}

function renderSources(sources) {
  if (!Array.isArray(sources) || !sources.length) return '';
  const links = sources
    .map((item) => `<li><a href="${escapeHtml(item.url)}">${escapeHtml(item.label)}</a></li>`)
    .join('\n          ');
  return `<h2 style="font-family: var(--font-heading); font-size: 32px; margin: 48px 0 0; letter-spacing: -0.01em">Where I checked</h2>
      <ul style="margin: 16px 0 0; padding-left: 1.25em; font-size: 16px; line-height: 1.7">
          ${links}
      </ul>`;
}

function articleJsonLd(data, canonical, image) {
  const published = isoDate(data.date_published);
  const modified = isoDate(data.date_modified) || published;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.hero_heading || data.title,
    description: data.description,
    datePublished: published,
    dateModified: modified,
    image,
    author: {
      '@type': 'Person',
      name: 'Nathalie',
      url: `${SITE}/about.html`
    },
    publisher: {
      '@type': 'Organization',
      name: 'Riviera Arrival',
      url: `${SITE}/`,
      logo: organizationLogo()
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonical
    },
    url: canonical
  };
}

function faqJsonLd(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: (faqs || []).map((faq) => ({
      '@type': 'Question',
      name: String(faq.question || ''),
      acceptedAnswer: {
        '@type': 'Answer',
        text: plainText(faq.answer)
      }
    }))
  };
}

function renderGuide(slug) {
  return function render(data) {
    const canonical = `${SITE}/${slug}.html`;
    const hidden = isHiddenFromGoogle(data);
    const published = isoDate(data.date_published);
    const modified = isoDate(data.date_modified) || published;
    const heroImage = pageImage(data.hero_image);
    const heroAlt = text(data.hero_image_alt || data.hero_heading);
    const image = absoluteAsset(data.hero_image);
    const robots = hidden ? `<meta name="robots" content="noindex, follow">\n` : '';
    const extraHead = `${jsonLdScript(articleJsonLd(data, canonical, image))}
${jsonLdScript(faqJsonLd(data.faqs))}
${crumbScript([
  { name: 'Home', item: `${SITE}/` },
  { name: 'Settling in', item: `${SITE}/settling-in.html` },
  { name: data.hero_heading || data.title, item: canonical }
])}
`;
    const updated = modified ? `<p style="font-size: 14px; margin: 18px 0 0; color: color-mix(in srgb, var(--color-text) 55%, transparent)">Updated ${escapeHtml(formatLongDate(modified))}</p>` : '';
    const draft = hidden
      ? `<div class="draft-banner" style="background: var(--color-accent-2-200); border-radius: var(--radius-lg); padding: 22px 26px; margin-top: 28px; max-width: 46em">
      <p style="margin: 0; font-size: 16px; line-height: 1.55; color: var(--color-accent-2-900)">${inline(data.draft_notice || 'This page is hidden from Google until it is finished.')}</p>
    </div>`
      : '';
    const disclaimer = String(data.disclaimer || '').trim();
    const disclaimerHtml = disclaimer
      ? `<div class="hr" style="margin: 40px 0 0"></div>
      <p style="font-size: 14px; font-style: italic; margin: 20px 0 0; color: color-mix(in srgb, var(--color-text) 55%, transparent)">${inline(disclaimer)}</p>`
      : '';
    const homeCta = String(data.home_cta || '').trim()
      || "If you would rather I looked for the home, start with [I'll find your place](finding-a-home.html).";

    const body = `<section style="max-width: 1320px; margin: 0 auto; padding: 40px 48px 0">
    <a href="${escapeHtml(data.back_href || 'settling-in.html')}" style="font-size: 13px; color: color-mix(in srgb, var(--color-text) 55%, transparent)">&larr; ${escapeHtml(data.back_label || 'All guides')}</a>
    <div style="margin-top: 14px">
      <span class="tag tag-accent-2" style="border-radius: 999px">${escapeHtml(data.eyebrow)}</span>
    </div>
    <h1 style="font-family: var(--font-heading); font-size: 60px; line-height: 1.03; letter-spacing: -0.02em; margin: 20px 0 0; max-width: 15em; text-wrap: pretty">${escapeHtml(data.hero_heading)}</h1>
    <p style="font-size: 19px; line-height: 1.55; max-width: 40em; margin: 22px 0 0; color: color-mix(in srgb, var(--color-text) 78%, transparent); text-wrap: pretty">${inline(data.hero_intro)}</p>
    ${updated}
    ${draft}
  </section>

  <section style="max-width: 1320px; margin: 40px auto 0; padding: 0 48px">
    <div style="height: 340px; border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-md)"><img src="${escapeHtml(heroImage)}" alt="${heroAlt}" style="width:100%;height:100%;object-fit:cover;display:block" loading="lazy"></div>
  </section>

  <section style="max-width: 1320px; margin: 56px auto 0; padding: 0 48px">
    <div style="max-width: 46em">
      ${renderGuideSections(data.sections)}

      ${renderFigureGroups(data.figure_groups)}

      ${renderFaqs(data.faqs)}

      ${renderRelated(data.related)}

      ${renderSources(data.sources)}

      <p style="font-size: 18px; line-height: 1.6; margin: 28px 0 0; color: color-mix(in srgb, var(--color-text) 80%, transparent)">${inline(homeCta)}</p>

      ${disclaimerHtml}
    </div>
  </section>

  <section style="max-width: 1320px; margin: 80px auto 0; padding: 0 48px">
    <div style="background: var(--color-accent-2-200); border-radius: var(--radius-lg); padding: 44px 48px; display: flex; align-items: center; gap: 40px; flex-wrap: wrap">
      <div style="flex: 1; min-width: 280px">
        <h2 style="font-family: var(--font-heading); font-size: 32px; margin: 0; letter-spacing: -0.01em; color: var(--color-accent-2-900)">${escapeHtml(data.cta_heading)}</h2>
        <p style="margin: 12px 0 0; font-size: 17px; line-height: 1.55; color: var(--color-accent-2-900); text-wrap: pretty">${inline(data.cta_text)}</p>
      </div>
      <a href="${escapeHtml(data.cta_link || 'contact.html')}" class="btn btn-primary" style="border-radius: 999px; padding: 13px 26px">${escapeHtml(data.cta_label || 'Talk to Nathalie')}</a>
    </div>
  </section>`;

    return pageShell({
      activeNav: 'settling-in',
      title: data.title,
      description: data.description,
      canonical,
      extraStyles: GUIDE_STYLES,
      extraHead,
      ogImage: image,
      ogType: 'article',
      robots,
      body
    });
  };
}

const GUIDE_SLUGS = [
  'guide-moving-to-the-french-riviera',
  'guide-cost-of-living',
  'guide-retiring-on-the-french-riviera',
  'guide-renting-an-apartment-in-nice',
  'guide-international-schools',
  'guide-exchanging-a-driving-licence',
  'guide-buying-or-renting-on-the-french-riviera',
  'guide-carte-de-sejour'
];

function main() {
  buildPage('finding-a-home', renderFindingAHome);
  buildPage('settling-in', renderSettlingIn);
  buildPage('neighborhoods', renderNeighborhoods);
  for (const slug of GUIDE_SLUGS) {
    buildPage(slug, renderGuide(slug));
  }
  console.log(`Pages build: finding-a-home.html, settling-in.html, neighborhoods.html, ${GUIDE_SLUGS.map((slug) => `${slug}.html`).join(', ')}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
