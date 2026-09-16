import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { marked } from 'marked';
import { CATEGORIES, RELATED_BY_CATEGORY, canonicalCategory } from './journal-categories.mjs';
import { escapeHtml, siteHeader, siteFooter, siteScripts, layout } from './site-layout.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.rivieraarrival.com';
const CONTENT_DIR = join(ROOT, 'content', 'journal');
const OUT_DIR = join(ROOT, 'journal');
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_RELATED = RELATED_BY_CATEGORY['Tips & Resources'];
export const DEFAULT_COVER = '/images/journal-featured.jpg';

marked.setOptions({ gfm: true, breaks: false });

function toIsoDate(value) {
  if (!value) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const text = String(value).trim();
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : text.slice(0, 10);
}

function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatLong(iso) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC'
  }).format(parseDate(iso));
}

function formatShort(iso) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC'
  }).format(parseDate(iso));
}

function slugify(title) {
  return String(title || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function publicImage(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith('/') ? path : `/${path}`;
}

function absoluteUrl(path) {
  if (!path) return `${SITE}/images/nathalie.jpg`;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE}${publicImage(path)}`;
}

export function loadPosts() {
  let files = [];
  try {
    files = readdirSync(CONTENT_DIR).filter((name) => name.endsWith('.md'));
  } catch {
    return [];
  }

  const posts = [];
  for (const file of files) {
    const raw = readFileSync(join(CONTENT_DIR, file), 'utf8');
    const parsed = matter(raw);
    const data = parsed.data || {};
    const draft = data.draft === true || data.draft === 'true';
    let slug = String(file).replace(/\.md$/i, '');
    if (DATE_ONLY.test(slug)) {
      const fromTitle = slugify(data.title);
      const fallback = fromTitle && !DATE_ONLY.test(fromTitle) ? fromTitle : `journal-${slug}`;
      console.warn(`Date-only slug "${slug}" renamed to "${fallback}"`);
      slug = fallback;
    }
    const date = toIsoDate(data.date);
    if (!date) {
      console.warn(`Skipping ${file}: missing date`);
      continue;
    }
    const description = String(data.description || '').trim();
    const html = marked.parse(parsed.content || '') || '';
    posts.push({
      slug,
      title: String(data.title || slug),
      date,
      updated: toIsoDate(data.updated) || date,
      draft,
      category: canonicalCategory(data.category),
      description,
      image: publicImage(data.image || DEFAULT_COVER),
      imageAlt: String(data.imageAlt || data.title || 'Journal photo'),
      bodyHtml: html
    });
  }

  posts.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
  return posts;
}

export function jsonLd(post) {
  const url = `${SITE}/journal/${post.slug}.html`;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated,
    image: absoluteUrl(post.image),
    author: {
      '@type': 'Person',
      name: 'Nathalie',
      url: `${SITE}/about.html`
    },
    publisher: {
      '@type': 'Organization',
      name: 'Riviera Arrival',
      url: `${SITE}/`
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url
    },
    url
  };
}

function relatedBlock(post) {
  const links = RELATED_BY_CATEGORY[post.category] || DEFAULT_RELATED;
  return `<aside style="margin-top: 48px; background: var(--color-neutral-100); border-radius: var(--radius-lg); padding: 26px; box-shadow: var(--shadow-sm)">
      <div style="font-family: var(--font-heading); font-size: 21px">Related guides</div>
      <p style="font-size: 15px; line-height: 1.55; margin: 10px 0 16px; color: color-mix(in srgb, var(--color-text) 70%, transparent)">If this post is the small story, these pages are the practical version.</p>
      <div style="display: flex; flex-wrap: wrap; gap: 10px">
        ${links.map((item) => `<a href="${item.href}" class="btn btn-secondary" style="border-radius: 999px">${escapeHtml(item.title)}</a>`).join('')}
      </div>
    </aside>`;
}

export function renderPost(post) {
  const canonical = `${SITE}/journal/${post.slug}.html`;
  const extraHead = `<meta property="og:image" content="${escapeHtml(absoluteUrl(post.image))}">
<script type="application/ld+json">${JSON.stringify(jsonLd(post))}</script>`;
  const body = `${siteHeader('journal')}
  <article style="max-width: 820px; margin: 0 auto; padding: 34px 48px 0">
    <p style="margin: 0 0 8px"><a href="/journal/" style="font-size: 14px">← All posts</a></p>
    <div style="display: flex; align-items: center; gap: 12px; font-size: 14px; color: var(--color-accent-700)">
      <time datetime="${escapeHtml(post.date)}">${escapeHtml(formatLong(post.date))}</time>
      <span style="width: 5px; height: 5px; border-radius: 999px; background: var(--color-accent); display: inline-block"></span>
      <span>${escapeHtml(post.category)}</span>
    </div>
    <h1 style="font-family: var(--font-heading); font-size: 48px; line-height: 1.08; letter-spacing: -0.02em; margin: 16px 0 0; text-wrap: pretty">${escapeHtml(post.title)}</h1>
    <p style="font-size: 19px; line-height: 1.55; margin: 18px 0 0; color: color-mix(in srgb, var(--color-text) 76%, transparent); text-wrap: pretty">${escapeHtml(post.description)}</p>
    <div style="height: 380px; border-radius: var(--radius-lg); overflow: hidden; margin-top: 28px; box-shadow: var(--shadow-md)">
      <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.imageAlt)}" style="width:100%;height:100%;object-fit:cover;display:block">
    </div>
    <div class="journal-body">${post.bodyHtml}</div>
    ${relatedBlock(post)}
  </article>`;
  return layout({
    title: `${post.title} — Riviera Arrival`,
    description: post.description,
    canonical,
    extraHead,
    body
  });
}

function filterButtons(posts) {
  const present = new Set(posts.map((p) => p.category));
  const cats = CATEGORIES.filter((c) => present.has(c));
  const buttons = ['All posts', ...cats].map((label, i) => {
    const cls = i === 0 ? 'btn btn-primary journal-filter is-active' : 'btn btn-secondary journal-filter';
    const value = label === 'All posts' ? 'all' : label;
    return `<button type="button" class="${cls}" style="border-radius: 999px" data-filter="${escapeHtml(value)}">${escapeHtml(label)}</button>`;
  });
  return `<div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 26px">${buttons.join('\n        ')}</div>`;
}

export function renderHub(posts) {
  const canonical = `${SITE}/journal/`;
  const featured = posts[0];
  const rest = posts.slice(1);
  const grid = rest.slice(0, 4);
  const archive = rest.slice(4);

  let featuredHtml = '';
  if (featured) {
    featuredHtml = `<section style="max-width: 1320px; margin: 0 auto; padding: 72px 48px 0">
    <article class="journal-card grid-2" data-category="${escapeHtml(featured.category)}" style="display: grid; grid-template-columns: 1.15fr 1fr; gap: 44px; align-items: center; background: var(--color-neutral-100); border-radius: var(--radius-lg); padding: 34px; box-shadow: var(--shadow-md)">
      <div style="height: 380px; border-radius: var(--radius-lg); overflow: hidden">
        <img src="${escapeHtml(featured.image)}" alt="${escapeHtml(featured.imageAlt)}" style="width:100%;height:100%;object-fit:cover;display:block">
      </div>
      <div>
        <div style="display: flex; align-items: center; gap: 12px; font-size: 14px; color: var(--color-accent-700)">
          <time datetime="${escapeHtml(featured.date)}">${escapeHtml(formatLong(featured.date))}</time>
          <span style="width: 5px; height: 5px; border-radius: 999px; background: var(--color-accent); display: inline-block"></span>
          <span>${escapeHtml(featured.category)}</span>
        </div>
        <h2 style="font-family: var(--font-heading); font-size: 40px; line-height: 1.08; letter-spacing: -0.01em; margin: 14px 0 0; text-wrap: pretty">${escapeHtml(featured.title)}</h2>
        <p style="font-size: 18px; line-height: 1.6; margin: 18px 0 0; color: color-mix(in srgb, var(--color-text) 76%, transparent); text-wrap: pretty">${escapeHtml(featured.description)}</p>
        <a href="/journal/${escapeHtml(featured.slug)}.html" class="btn btn-primary" style="border-radius: 999px; margin-top: 24px; padding: 12px 24px">Read this post</a>
      </div>
    </article>
  </section>`;
  } else {
    featuredHtml = `<section style="max-width: 1320px; margin: 0 auto; padding: 72px 48px 0">
    <p style="font-size: 18px; max-width: 34em">No posts yet — Nathalie is writing.</p>
  </section>`;
  }

  const gridHtml = grid.length
    ? `<div class="posts-grid" style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px">
        ${grid.map((post) => `<a class="journal-card" data-category="${escapeHtml(post.category)}" href="/journal/${escapeHtml(post.slug)}.html" style="color: var(--color-text)">
          <div style="height: 200px; border-radius: var(--radius-lg); overflow: hidden"><img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.imageAlt)}" style="width:100%;height:100%;object-fit:cover;display:block"></div>
          <div style="display: flex; gap: 10px; font-size: 13px; margin-top: 14px; color: var(--color-accent-700)"><time datetime="${escapeHtml(post.date)}">${escapeHtml(formatLong(post.date))}</time><span>·</span><span>${escapeHtml(post.category)}</span></div>
          <div style="font-family: var(--font-heading); font-size: 23px; line-height: 1.18; margin-top: 6px">${escapeHtml(post.title)}</div>
          <p style="font-size: 15px; line-height: 1.55; margin: 8px 0 0; color: color-mix(in srgb, var(--color-text) 68%, transparent)">${escapeHtml(post.description)}</p>
        </a>`).join('\n        ')}
      </div>`
    : '';

  const archiveHtml = archive.length
    ? `<h2 style="font-family: var(--font-heading); font-size: 28px; margin: 56px 0 18px">The archive</h2>
      <div style="display: flex; flex-direction: column">
        ${archive.map((post, i) => `<a class="archive-row journal-card" data-category="${escapeHtml(post.category)}" href="/journal/${escapeHtml(post.slug)}.html" style="display: flex; align-items: baseline; gap: 20px; padding: 16px 4px; border-top: 1px solid var(--color-divider); ${i === archive.length - 1 ? 'border-bottom: 1px solid var(--color-divider); ' : ''}color: var(--color-text)">
          <time datetime="${escapeHtml(post.date)}" style="flex: 0 0 96px; font-size: 14px; color: color-mix(in srgb, var(--color-text) 55%, transparent)">${escapeHtml(formatShort(post.date))}</time>
          <span style="font-family: var(--font-heading); font-size: 19px; flex: 1">${escapeHtml(post.title)}</span>
          <span style="font-size: 13px; color: var(--color-accent-700)">${escapeHtml(post.category)}</span>
        </a>`).join('\n        ')}
      </div>`
    : '';

  const listHeading = grid.length ? '<h2 style="font-family: var(--font-heading); font-size: 28px; margin: 0 0 24px">Earlier this week</h2>' : '';

  const body = `${siteHeader('journal')}
  <section class="grid-2" style="max-width: 1320px; margin: 0 auto; padding: 34px 48px 0; display: grid; grid-template-columns: 1fr 320px; gap: 56px; align-items: center">
    <div>
      <span class="tag tag-accent-2" style="border-radius: 999px">Daily, from Nice</span>
      <h1 style="font-family: var(--font-heading); font-size: 58px; line-height: 1.04; letter-spacing: -0.02em; margin: 18px 0 0">Nathalie's journal</h1>
      <p style="font-size: 19px; line-height: 1.55; max-width: 34em; margin: 20px 0 0; color: color-mix(in srgb, var(--color-text) 78%, transparent); text-wrap: pretty">One street, one shop, one small administrative victory at a time. If it took me a morning to figure out, it's written down here so it takes you ten minutes.</p>
      ${filterButtons(posts)}
    </div>
    <div style="height: 320px; border-radius: 999px 999px 160px 160px; overflow: hidden; box-shadow: var(--shadow-lg)">
      <img src="/images/nathalie.jpg" alt="Nathalie, your guide to the Riviera" style="width:100%;height:100%;object-fit:cover;display:block">
    </div>
  </section>
  ${featuredHtml}
  <section class="grid-list" style="max-width: 1320px; margin: 0 auto; padding: 76px 48px 0; display: grid; grid-template-columns: 1fr 300px; gap: 56px; align-items: start">
    <div style="min-width: 0">
      ${listHeading}
      ${gridHtml}
      ${archiveHtml}
    </div>
    <aside style="display: flex; flex-direction: column; gap: 26px; position: sticky; top: 24px">
      <div style="background: var(--color-accent-2-200); border-radius: var(--radius-lg); padding: 26px">
        <div style="font-family: var(--font-heading); font-size: 21px; color: var(--color-accent-2-900)">One email, every Sunday</div>
        <p style="font-size: 15px; line-height: 1.55; margin: 10px 0 16px; color: var(--color-accent-2-900)">The week's posts and anything newcomers asked me about.</p>
        <div class="field">
          <input class="input" style="border-radius: 999px; min-height: 42px" placeholder="you@example.com">
        </div>
        <button type="button" class="btn btn-primary btn-block" style="border-radius: 999px; min-height: 42px">Subscribe</button>
      </div>
      <div style="background: var(--color-neutral-100); border-radius: var(--radius-lg); padding: 26px; box-shadow: var(--shadow-sm)">
        <div style="font-family: var(--font-heading); font-size: 19px">Ask Nathalie</div>
        <p style="font-size: 15px; line-height: 1.55; margin: 10px 0 16px; color: color-mix(in srgb, var(--color-text) 70%, transparent)">Stuck on something in your first weeks? Send it over — the answer usually becomes a post.</p>
        <a href="/contact.html" class="btn btn-secondary btn-block" style="border-radius: 999px">Send a question</a>
      </div>
    </aside>
  </section>
<script>
  (function () {
    var buttons = document.querySelectorAll('.journal-filter');
    var cards = document.querySelectorAll('.journal-card');
    if (!buttons.length) return;
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var value = btn.getAttribute('data-filter');
        buttons.forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
          b.classList.toggle('btn-primary', b === btn);
          b.classList.toggle('btn-secondary', b !== btn);
        });
        cards.forEach(function (card) {
          var show = value === 'all' || card.getAttribute('data-category') === value;
          card.style.display = show ? '' : 'none';
        });
      });
    });
  })();
</script>`;

  return layout({
    title: "Nathalie's journal — Riviera Arrival",
    description: "One street, one shop, one small administrative victory at a time — a daily journal from Nice for newcomers to the Côte d'Azur.",
    canonical,
    body
  });
}

function writeSitemap(posts) {
  const rootPages = readdirSync(ROOT)
    .filter((name) => name.endsWith('.html') && !name.startsWith('_') && name !== 'journal.html')
    .sort();

  const urls = [`${SITE}/`];
  for (const page of rootPages) {
    if (page === 'index.html') continue;
    urls.push(`${SITE}/${page}`);
  }
  urls.push(`${SITE}/journal/`);
  for (const post of posts) {
    urls.push(`${SITE}/journal/${post.slug}.html`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((loc) => `  <url>\n    <loc>${loc}</loc>\n  </url>`).join('\n')}
</urlset>
`;
  writeFileSync(join(ROOT, 'sitemap.xml'), xml);
}

function resetOutDir() {
  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });
}

function assemblePublic() {
  const dest = join(ROOT, 'public');
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  const copy = ['styles.css', 'robots.txt', 'sitemap.xml', 'images', 'admin', 'journal'];
  for (const name of readdirSync(ROOT)) {
    if (name.endsWith('.html')) copy.push(name);
  }
  for (const item of copy) {
    cpSync(join(ROOT, item), join(dest, item), { recursive: true });
  }
}

function main() {
  const allPosts = loadPosts();
  const published = allPosts.filter((post) => !post.draft);
  resetOutDir();
  writeFileSync(join(OUT_DIR, 'index.html'), renderHub(published));
  for (const post of published) {
    writeFileSync(join(OUT_DIR, `${post.slug}.html`), renderPost(post));
  }
  writeSitemap(published);
  assemblePublic();

  console.log(`Journal build: ${published.length} published, ${allPosts.length - published.length} draft`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
