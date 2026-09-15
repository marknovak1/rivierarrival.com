import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

function fail(msg) {
  errors.push(msg);
}

function read(rel) {
  const path = join(ROOT, rel);
  if (!existsSync(path)) {
    fail(`Missing ${rel}`);
    return '';
  }
  return readFileSync(path, 'utf8');
}

const hub = read('journal/index.html');
const postPath = 'journal/knife-sharpener-liberation-market.html';
const post = read(postPath);
const sitemap = read('sitemap.xml');
const admin = read('admin/index.html');
const config = read('admin/config.yml');

if (hub) {
  if (!hub.includes('<h1')) fail('Hub is missing an H1');
  if ((hub.match(/<h1\b/g) || []).length !== 1) fail('Hub should have exactly one H1');
  if (!hub.includes('rel="canonical" href="https://www.rivieraarrival.com/journal/"')) {
    fail('Hub canonical is wrong');
  }
  if (!hub.includes('knife-sharpener-liberation-market.html')) fail('Hub does not list the seeded post');
}

if (post) {
  if ((post.match(/<h1\b/g) || []).length !== 1) fail('Post should have exactly one H1');
  if (!post.includes('<title>The knife sharpener who comes to Libération market on Fridays — Riviera Arrival</title>')) {
    fail('Post title tag is wrong');
  }
  if (!post.includes('rel="canonical" href="https://www.rivieraarrival.com/journal/knife-sharpener-liberation-market.html"')) {
    fail('Post canonical is wrong');
  }
  if (!post.includes('application/ld+json')) fail('Post is missing JSON-LD');
  if (!post.includes('"@type":"BlogPosting"') && !post.includes('"@type": "BlogPosting"')) {
    fail('JSON-LD is not BlogPosting');
  }
  if (!post.includes('"name":"Nathalie"') && !post.includes('"name": "Nathalie"')) {
    fail('JSON-LD is missing author Nathalie');
  }
  if (!post.includes('/guide-businesses.html')) fail('Post is missing a related guide link');
}

if (sitemap) {
  if (!sitemap.includes('https://www.rivieraarrival.com/journal/')) fail('Sitemap missing journal hub');
  if (!sitemap.includes('https://www.rivieraarrival.com/journal/knife-sharpener-liberation-market.html')) {
    fail('Sitemap missing seeded post');
  }
  if (!sitemap.includes('https://www.rivieraarrival.com/about.html')) fail('Sitemap dropped existing pages');
  if (sitemap.includes('/admin')) fail('Sitemap should not include /admin');
}

if (admin && !admin.includes('decap-cms')) fail('Admin page does not load Decap CMS');
if (config && !config.includes('folder: content/journal')) fail('CMS config is missing the journal collection');

if (existsSync(join(ROOT, 'journal/sample-draft.html'))) {
  fail('Draft post was published to HTML');
}
if (sitemap.includes('sample-draft')) fail('Draft post appeared in sitemap');
if (hub.includes('Sample draft')) fail('Draft post appeared on the hub');
if (!existsSync(join(ROOT, 'journal/two-hours-at-the-caf-desk.html'))) {
  fail('Missing CAF post page');
}
if (!existsSync(join(ROOT, 'journal/where-to-swim-in-nice.html'))) {
  fail('Missing swimming post page');
}

if (errors.length) {
  console.error(errors.map((e) => ` - ${e}`).join('\n'));
  process.exit(1);
}

console.log('Journal checks passed');
