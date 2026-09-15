import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { marked } from 'marked';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.rivieraarrival.com';
const CONTENT_DIR = join(ROOT, 'content', 'journal');
const OUT_DIR = join(ROOT, 'journal');
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const CATEGORIES = ['Local businesses', 'Paperwork', 'Food & markets', 'Walks', 'Language'];

const RELATED_BY_CATEGORY = {
  'Local businesses': [
    { href: '/guide-businesses.html', title: 'Local businesses' },
    { href: '/neighborhoods.html', title: 'Neighborhoods' }
  ],
  Paperwork: [
    { href: '/settling-in.html', title: 'Settling in' },
    { href: '/guide-visas.html', title: 'Visas & residency' }
  ],
  'Food & markets': [
    { href: '/guide-businesses.html', title: 'Local businesses' },
    { href: '/neighborhoods.html', title: 'Neighborhoods' }
  ],
  Walks: [
    { href: '/guide-transport.html', title: 'Getting around' },
    { href: '/neighborhoods.html', title: 'Neighborhoods' }
  ],
  Language: [
    { href: '/guide-french.html', title: 'Learning French' },
    { href: '/about.html', title: 'About Nathalie' }
  ]
};

marked.setOptions({ gfm: true, breaks: false });

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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

function siteHeader(active) {
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

function siteFooter() {
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

function siteScripts() {
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

function layout({ title, description, canonical, extraHead = '', body }) {
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

function loadPosts() {
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
      category: CATEGORIES.includes(data.category) ? data.category : 'Local businesses',
      description,
      image: publicImage(data.image || '/images/journal-featured.jpg'),
      imageAlt: String(data.imageAlt || data.title || 'Journal photo'),
      bodyHtml: html
    });
  }

  posts.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
  return posts;
}

function jsonLd(post) {
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
  const links = RELATED_BY_CATEGORY[post.category] || RELATED_BY_CATEGORY.Paperwork;
  return `<aside style="margin-top: 48px; background: var(--color-neutral-100); border-radius: var(--radius-lg); padding: 26px; box-shadow: var(--shadow-sm)">
      <div style="font-family: var(--font-heading); font-size: 21px">Related guides</div>
      <p style="font-size: 15px; line-height: 1.55; margin: 10px 0 16px; color: color-mix(in srgb, var(--color-text) 70%, transparent)">If this post is the small story, these pages are the practical version.</p>
      <div style="display: flex; flex-wrap: wrap; gap: 10px">
        ${links.map((item) => `<a href="${item.href}" class="btn btn-secondary" style="border-radius: 999px">${escapeHtml(item.title)}</a>`).join('')}
      </div>
    </aside>`;
}

function renderPost(post) {
  const canonical = `${SITE}/journal/${post.slug}.html`;
  const extraHead = `<script type="application/ld+json">${JSON.stringify(jsonLd(post))}</script>`;
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

function renderHub(posts) {
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
