import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DEFAULT_OG_IMAGE,
  iconLinks,
  siteFooter,
  siteHeader,
  siteScripts,
  socialTags
} from './site-layout.mjs';

const STATIC_PAGES = [
  'index.html',
  'journal.html',
  'about.html',
  'contact.html',
  'service-apartment-search.html',
  'service-banking-essentials.html',
  'service-finding-home.html',
  'service-local-life.html',
  'service-settling-in.html',
  'service-utilities.html',
  'guide-banking.html',
  'guide-businesses.html',
  'guide-french.html',
  'guide-healthcare.html',
  'guide-transport.html',
  'guide-visas.html',
  '_template.html'
];

const ACTIVE = {
  'about.html': 'about',
  'contact.html': 'contact',
  'journal.html': 'journal',
  'guide-banking.html': 'settling-in',
  'guide-businesses.html': 'settling-in',
  'guide-french.html': 'settling-in',
  'guide-healthcare.html': 'settling-in',
  'guide-transport.html': 'settling-in',
  'guide-visas.html': 'settling-in'
};

function decode(value) {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&mdash;/g, '—')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripSocial(html) {
  return html
    .replace(/\n?<meta property="og:[^"]+" content="[^"]*">/g, '')
    .replace(/\n?<meta name="twitter:[^"]+" content="[^"]*">/g, '')
    .replace(/\n?<link rel="icon"[^>]*>/g, '');
}

function stripLangScript(html) {
  return html.replace(
    /\s*<script>\s*(?:\/\/[^\n]*\n\s*)?\(function \(\) \{\s*var btns = document\.querySelectorAll\('\.lang-btn'\);[\s\S]*?<\/script>/g,
    ''
  );
}

function ogImageFrom(html) {
  const relative = html.match(/<img[^>]+src="(images\/[^"]+)"/);
  if (relative) return `https://www.rivieraarrival.com/${relative[1]}`;
  const absolute = html.match(/<img[^>]+src="(\/images\/[^"]+)"/);
  if (absolute) return `https://www.rivieraarrival.com${absolute[1]}`;
  return DEFAULT_OG_IMAGE;
}

function insertSocial(html, { title, description, url, image, type }) {
  const tags = `${iconLinks()}${socialTags({ title, description, url, image, type })}`;
  if (html.includes('<link rel="canonical"')) {
    return html.replace(/<link rel="canonical" href="[^"]+">\n?/, (match) => `${match.trim()}\n${tags}`);
  }
  return html.replace('</title>', `</title>\n${tags.trim()}`);
}

function ensureMain(html) {
  if (/<main[\s>]/i.test(html)) return html;
  if (html.includes('</header>') && html.includes('<footer')) {
    return html.replace(/<\/header>([\s\S]*?)<footer\b/, '</header>\n<main>$1</main>\n<footer');
  }
  return html;
}

function ensureNavScript(html) {
  if (html.includes("querySelector('.nav-toggle')")) return html;
  return html.replace('</body>', `${siteScripts()}\n</body>`);
}

function addLogo(html) {
  const needle = '"name":"Riviera Arrival","url":"https://www.rivieraarrival.com/","description":';
  const withLogo = '"name":"Riviera Arrival","url":"https://www.rivieraarrival.com/","logo":"https://www.rivieraarrival.com/favicon.svg","description":';
  if (html.includes(withLogo)) return html;
  return html.replaceAll(needle, withLogo);
}

function refreshPage(html, name) {
  html = html.replace(/<html\b[^>]*>/i, '<html lang="en">');
  html = stripLangScript(html);
  html = stripSocial(html);
  const active = ACTIVE[name] || '';
  if (!html.includes('styles.css')) {
    html = html.replace('</head>', '<link rel="stylesheet" href="/styles.css">\n</head>');
  }
  if (!html.includes('<header')) {
    html = html.replace(
      /<body>([\s\S]*)<\/body>/,
      `<body>\n<div style="background: var(--color-bg); min-height: 100vh">\n${siteHeader(active)}\n<main>$1</main>\n${siteFooter()}\n</div>\n</body>`
    );
  } else {
    html = html.replace(/<header\b[\s\S]*?<\/header>/, siteHeader(active));
    html = html.replace(/<footer\b[\s\S]*?<\/footer>/, siteFooter());
    html = ensureMain(html);
  }
  html = ensureNavScript(html);
  const title = decode((html.match(/<title>([^<]*)<\/title>/) || [, 'Riviera Arrival'])[1]);
  const description = decode((html.match(/<meta name="description" content="([^"]*)"/) || [, ''])[1]);
  const url = (html.match(/<link rel="canonical" href="([^"]+)"/) || [, 'https://www.rivieraarrival.com/'])[1];
  const type = name.startsWith('guide-') ? 'article' : 'website';
  html = insertSocial(html, { title, description, url, image: ogImageFrom(html), type });
  return addLogo(html);
}

function refreshAdmin(html) {
  html = html.replace(/<html\b[^>]*>/i, '<html lang="en">');
  html = stripSocial(html);
  html = html.replace(/<title>[^<]*<\/title>/, '<title>Journal admin, Nice — Riviera Arrival</title>');
  if (!html.includes('name="description"')) {
    html = html.replace(
      '</title>',
      '</title>\n  <meta name="description" content="Journal admin for Nathalie\'s posts on Riviera Arrival.">'
    );
  }
  const title = 'Journal admin, Nice — Riviera Arrival';
  const description = "Journal admin for Nathalie's posts on Riviera Arrival.";
  return insertSocial(html, {
    title,
    description,
    url: 'https://www.rivieraarrival.com/admin/',
    image: DEFAULT_OG_IMAGE,
    type: 'website'
  });
}

export function applySharedChrome(root) {
  for (const name of STATIC_PAGES) {
    const path = join(root, name);
    writeFileSync(path, refreshPage(readFileSync(path, 'utf8'), name));
  }
  const adminPath = join(root, 'admin', 'index.html');
  writeFileSync(adminPath, refreshAdmin(readFileSync(adminPath, 'utf8')));
}
