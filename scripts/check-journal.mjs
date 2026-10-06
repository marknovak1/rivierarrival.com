import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { CATEGORIES, CATEGORY_ALIASES, canonicalCategory } from './journal-categories.mjs';
import { DEFAULT_COVER, loadPosts, renderHub, renderPost } from './build-journal.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURES_DIR = join(ROOT, 'test', 'fixtures', 'journal');
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

// Fixtures live in test/fixtures/journal/, not content/journal/, so they
// never appear in Nathalie's CMS entry list. They're also never built to
// HTML - verified by calling loadPosts()/renderPost()/renderHub() directly
// on the fixtures directory instead of reading generated output off disk.
// EXPECTED_DEFAULT_COVER is a literal, independent of build-journal.mjs's own
// DEFAULT_COVER export, so this test still fails if someone breaks or
// changes that constant, rather than just checking internal consistency.
const EXPECTED_DEFAULT_COVER = '/images/journal-featured.jpg';
if (DEFAULT_COVER !== EXPECTED_DEFAULT_COVER) {
  fail(`build-journal.mjs's DEFAULT_COVER changed unexpectedly to "${DEFAULT_COVER}"`);
}
const fixturePosts = loadPosts(FIXTURES_DIR);
const noCoverPost = fixturePosts.find((p) => p.slug === 'no-cover-photo-fixture');
const sampleDraftFixture = fixturePosts.find((p) => p.slug === 'sample-draft');

if (!noCoverPost) {
  fail('Test fixture test/fixtures/journal/no-cover-photo-fixture.md is missing or failed to parse');
} else {
  if (noCoverPost.image !== EXPECTED_DEFAULT_COVER) {
    fail(`Post with no cover photo should resolve to the default cover, got "${noCoverPost.image}"`);
  }
  const renderedFixture = renderPost(noCoverPost);
  if (!renderedFixture.includes(`<img src="${EXPECTED_DEFAULT_COVER}"`)) {
    fail('Post with no cover photo should fall back to the default cover in its header image');
  }
  if (!renderedFixture.includes(`<meta property="og:image" content="https://www.rivieraarrival.com${EXPECTED_DEFAULT_COVER}">`)) {
    fail('Post with no cover photo should fall back to the default cover in og:image');
  }
  if (!renderedFixture.includes(`"image":"https://www.rivieraarrival.com${EXPECTED_DEFAULT_COVER}"`)) {
    fail('Post with no cover photo should fall back to the default cover in JSON-LD');
  }
  const renderedHubWithFixture = renderHub([{ ...noCoverPost, draft: false }]);
  if (!renderedHubWithFixture.includes(`<img src="${EXPECTED_DEFAULT_COVER}"`)) {
    fail('Hub card for the no-cover-photo fixture should fall back to the default cover');
  }
}
if (!noCoverPost || !noCoverPost.draft) {
  fail('Test fixture no-cover-photo-fixture.md must stay draft: true');
}
if (!sampleDraftFixture || !sampleDraftFixture.draft) {
  fail('Test fixture sample-draft.md must stay draft: true');
}
// The real build's draft filter is `.filter((post) => !post.draft)` - prove
// it actually excludes both fixtures, exercised directly rather than via
// content/journal/ side effects now that the fixtures live elsewhere.
const publishedFixtures = fixturePosts.filter((p) => !p.draft);
if (publishedFixtures.length !== 0) {
  fail(`Draft filter should exclude all fixtures, but kept: ${publishedFixtures.map((p) => p.slug).join(', ')}`);
}

for (const slug of ['sample-draft', 'no-cover-photo-fixture']) {
  if (existsSync(join(ROOT, 'content', 'journal', `${slug}.md`))) {
    fail(`Fixture ${slug}.md should live in test/fixtures/journal/, not content/journal/`);
  }
  if (existsSync(join(ROOT, 'journal', `${slug}.html`))) {
    fail(`Fixture ${slug} was published to HTML`);
  }
  if (hub.includes(slug)) fail(`Fixture ${slug} appeared on the hub`);
  if (sitemap.includes(slug)) fail(`Fixture ${slug} appeared in the sitemap`);
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
if (config && !/branch:\s*main\b/.test(config)) {
  fail('CMS backend.branch must be "main" — this looks like a pilot-branch config (e.g. cms-pages-pilot) that was not reverted before merging');
}
if (config && /^local_backend:\s*true/m.test(config)) {
  fail('CMS local_backend: true must be removed before merging — it is a local-testing-only setting');
}
if (config && !/^publish_mode:\s*editorial_workflow\s*$/m.test(config)) {
  fail('CMS config is missing publish_mode: editorial_workflow');
}
if (CATEGORIES.length !== 22) fail(`Expected 22 journal categories, found ${CATEGORIES.length}`);
if (config) {
  for (const label of CATEGORIES) {
    if (!config.includes(label)) fail(`CMS config is missing category "${label}"`);
  }
  if (config.includes('- "Local businesses"') || config.includes('- "Food & markets"')) {
    fail('CMS config still lists an old category option');
  }
}
if (canonicalCategory('Paperwork') !== 'Legal & Administrative') {
  fail('Old Paperwork category should map to Legal & Administrative');
}
if (canonicalCategory('Local businesses') !== 'Local Services') {
  fail('Old Local businesses category should map to Local Services');
}
if (canonicalCategory('Walks') !== 'Outdoor Activities') {
  fail('Old Walks category should map to Outdoor Activities');
}
if (canonicalCategory('Mystery topic') !== 'Mystery topic') {
  fail('Unknown categories should stay readable');
}
if (Object.keys(CATEGORY_ALIASES).length < 5) fail('Category aliases for old posts are missing');
if (hub && !hub.includes('journal-filter')) fail('Hub is missing category filter chips');
if (hub && !hub.includes('data-filter="Local Services"')) fail('Hub filter is missing Local Services');
if (hub && !hub.includes('data-filter="Legal &amp; Administrative"') && !hub.includes('data-filter="Legal & Administrative"')) {
  fail('Hub filter is missing Legal & Administrative');
}

if (!existsSync(join(ROOT, 'journal/two-hours-at-the-caf-desk.html'))) {
  fail('Missing CAF post page');
}
if (!existsSync(join(ROOT, 'journal/where-to-swim-in-nice.html'))) {
  fail('Missing swimming post page');
}

if (!existsSync(join(ROOT, 'public/journal/index.html'))) {
  fail('public/journal/index.html missing (Vercel output directory)');
}
if (!existsSync(join(ROOT, 'public/admin/index.html'))) {
  fail('public/admin/index.html missing');
}
if (!existsSync(join(ROOT, 'public/index.html'))) {
  fail('public/index.html missing');
}

const findingAHome = read('finding-a-home.html');
if (findingAHome && !findingAHome.includes("I'll find your place")) {
  fail('finding-a-home.html was not generated from content/pages/finding-a-home.md correctly');
}
if (!existsSync(join(ROOT, 'public/finding-a-home.html'))) {
  fail('public/finding-a-home.html missing');
}

const settlingIn = read('settling-in.html');
if (settlingIn && !settlingIn.includes('The guides')) {
  fail('settling-in.html was not generated from content/pages/settling-in.md correctly');
}
if (!existsSync(join(ROOT, 'public/settling-in.html'))) {
  fail('public/settling-in.html missing');
}

const neighborhoods = read('neighborhoods.html');
if (neighborhoods && !neighborhoods.includes('Town by town')) {
  fail('neighborhoods.html was not generated from content/pages/neighborhoods.md correctly');
}
if (!existsSync(join(ROOT, 'public/neighborhoods.html'))) {
  fail('public/neighborhoods.html missing');
}

// Nathalie picks a guide from a select widget rather than typing a link, but
// prove the linked files actually exist so a renamed/removed guide page
// can't silently produce a dead card.
const settlingInPath = join(ROOT, 'content', 'pages', 'settling-in.md');
if (existsSync(settlingInPath)) {
  const { data: settlingInData } = matter(readFileSync(settlingInPath, 'utf8'));
  for (const guide of settlingInData.guides || []) {
    if (!existsSync(join(ROOT, guide.link))) {
      fail(`settling-in.md guide "${guide.heading}" links to "${guide.link}", which does not exist`);
    }
  }
}

const INDEXABLE_GUIDES = [
  'guide-moving-to-the-french-riviera.html',
  'guide-retiring-on-the-french-riviera.html',
  'guide-renting-an-apartment-in-nice.html',
  'guide-international-schools.html'
];
const COST_GUIDE = 'guide-cost-of-living.html';
const GUIDE_SOURCES = [
  'content/pages/guide-moving-to-the-french-riviera.md',
  'content/pages/guide-cost-of-living.md',
  'content/pages/guide-retiring-on-the-french-riviera.md',
  'content/pages/guide-renting-an-apartment-in-nice.md',
  'content/pages/guide-international-schools.md'
];

function headerHtml(html) {
  const start = html.indexOf('<header');
  const end = html.indexOf('</header>');
  if (start === -1 || end === -1 || end < start) return '';
  return html.slice(start, end);
}

function hasType(html, type) {
  return html.includes(`"@type":"${type}"`) || html.includes(`"@type": "${type}"`);
}

for (const page of INDEXABLE_GUIDES) {
  const html = read(page);
  if (!html) continue;
  if (!hasType(html, 'Article')) fail(`${page} is missing Article JSON-LD`);
  if (!hasType(html, 'FAQPage')) fail(`${page} is missing FAQPage JSON-LD`);
  if (!html.includes('href="contact.html"')) fail(`${page} is missing the contact link`);
  if (!html.includes('Talk to Nathalie')) fail(`${page} is missing the Talk to Nathalie CTA`);
  if (/\bnoindex\b/i.test(html)) fail(`${page} should stay indexable`);
  if (sitemap && !sitemap.includes(`https://www.rivieraarrival.com/${page}`)) {
    fail(`Sitemap is missing ${page}`);
  }
  if (!existsSync(join(ROOT, 'public', page))) fail(`public/${page} missing`);
  if (!/<title>[^<]+<\/title>/.test(html)) fail(`${page} is missing a title`);
  if (!html.includes('name="description" content="')) fail(`${page} is missing a meta description`);
}

const cost = read(COST_GUIDE);
if (cost) {
  if (!hasType(cost, 'Article')) fail('Cost guide is missing Article JSON-LD');
  if (!hasType(cost, 'FAQPage')) fail('Cost guide is missing FAQPage JSON-LD');
  if (!cost.includes('href="contact.html"')) fail('Cost guide is missing the contact link');
  if (!cost.includes('Talk to Nathalie')) fail('Cost guide is missing the Talk to Nathalie CTA');
  if (!/\bnoindex\b/i.test(cost)) fail('Cost guide must be noindex');
  if (!cost.includes('Nathalie to fill')) fail('Cost guide is missing figure placeholders');
  if (cost.includes('€')) fail('Cost guide must not contain a euro sign');
  if (/\d[\d\s.,]*\s*euros?\b/i.test(cost)) fail('Cost guide must not contain a euro amount');
  if (headerHtml(cost).includes(COST_GUIDE)) fail('Cost guide header must not link itself as navigation');
}
if (sitemap && sitemap.includes('guide-cost-of-living')) fail('Sitemap must not include the cost-of-living guide');
const robots = read('robots.txt');
if (robots && robots.includes('guide-cost-of-living')) {
  fail('robots.txt must not disallow the cost-of-living guide');
}
if (robots && !robots.includes('Disallow: /admin/')) {
  fail('robots.txt must still disallow /admin/');
}
const movingGuide = read('guide-moving-to-the-french-riviera.html');
if (movingGuide.includes(COST_GUIDE)) {
  fail('Moving guide must not link the cost-of-living page while it is noindex');
}
if (/hidden from Google/i.test(movingGuide)) {
  fail('Moving guide must not say the cost page is hidden from Google');
}
const schoolsGuide = read('guide-international-schools.html');
const schoolsDescription = 'International and bilingual schools in Nice and on the French Riviera: curricula, languages, and how admissions work for families moving here.';
if (schoolsGuide && !schoolsGuide.includes(`content="${schoolsDescription}"`)) {
  fail('International schools meta description is wrong');
}
if (!existsSync(join(ROOT, 'public', COST_GUIDE))) fail(`public/${COST_GUIDE} missing`);

const homepage = read('index.html');
if (homepage.includes(COST_GUIDE)) fail('Homepage must not link the noindex cost-of-living guide');
if (settlingIn && settlingIn.includes(COST_GUIDE)) {
  fail('settling-in.html must not link the noindex cost-of-living guide');
}
for (const page of [...INDEXABLE_GUIDES, COST_GUIDE, 'settling-in.html', 'index.html', 'finding-a-home.html']) {
  const html = page === 'settling-in.html' ? settlingIn : page === 'index.html' ? homepage : read(page);
  if (html && headerHtml(html).includes(COST_GUIDE)) {
    fail(`${page} primary nav links the cost-of-living guide`);
  }
}

if (config) {
  for (const file of GUIDE_SOURCES) {
    if (!config.includes(file)) fail(`CMS config is missing ${file}`);
  }
}

if (errors.length) {
  console.error(errors.map((e) => ` - ${e}`).join('\n'));
  process.exit(1);
}

console.log('Journal checks passed');
