# Riviera Arrival — style rules

`styles.css` is the source of truth for tokens.

Plain-language rules so a new page looks like it belongs, without re-deriving
the look from scratch. Backed by [`styles.css`](styles.css).

## Setup

Every new page:

1. Copies [`_template.html`](_template.html) as its starting point.
2. Links `styles.css` in `<head>` (the Google Fonts `@import` for Cormorant
   Garamond/Lora lives at the top of that file, so it doesn't need
   repeating).

## Kicker tags, not a tagline

There is no fixed site tagline. Instead, hero-style sections open with a
small pill kicker — `<span class="tag tag-accent-2">…</span>` — labelling the
page: "For newcomers to the Côte d'Azur" (home), "Daily, from Nice"
(journal), "About" (about). New pages should follow this pattern rather than
inventing a slogan.

## Headline voice

- Headings use `--font-heading` (Cormorant Garamond, paired with
  `--font-heading-weight: 600`) — an elegant, classical serif. Body copy is
  `--font-body` (Lora): Cormorant Garamond reads too light/delicate at 15px
  body sizes, so Lora — a sturdier serif in the same spirit — carries
  paragraphs. Both are serif; there is no sans-serif left in the system.
- A stylized word or short phrase inside a headline (e.g. "French Riviera"
  in the homepage h1) can be set in italic (`<em>`) for emphasis, roman for
  the rest of the line.
- Copy is warm and first-person from Nathalie wherever it addresses the
  visitor directly: "Bonjour! I'm Nathalie…", "I'm Nathalie, and I've done
  this the hard way." Guides can be third-person/practical; hero intros and
  journal entries should stay in her voice.

## Gradient usage

The `.ph` image-placeholder panel is the only gradient in the system: a
135deg sage-into-terracotta blend built from `color-mix(in srgb,
var(--color-accent-2) 22%, var(--color-surface))` into `color-mix(in srgb,
var(--color-accent) 18%, var(--color-surface))`, defined inline on `.ph` in
`styles.css` (there is no separate gradient token). It fills panels standing
in for a photo that hasn't been shot yet. It is not a page background or a
decorative band, and there is no "sunset" gradient used anywhere else. Once
a real photo exists, the gradient placeholder is replaced by an `<img>` and
the gradient no longer applies to that spot. Everywhere else the background
is the flat `--color-bg` cream.

## Card sections

There is no rentals/listings marketplace on this site — that feature (a
property listings page, a "list your place" submission page, and their nav
links) was removed. The one card family left is:

- **Essentials / guide grid** (`essentials-grid`) — icon-led link cards for
  practical topics ("Bank & phone", "Healthcare", "Getting around"…).

The footer keeps three link columns — **Stay**, **Settle in**, **Read** —
but **Stay** is now just "Neighborhoods" (its rentals/listing links are
gone). New pages should slot their own links under whichever of the three
columns they belong to rather than adding a fourth.

## Image treatment

Photos are real photography, not illustration: `object-fit: cover` inside
soft rounded or pill/blob-shaped frames (`border-radius: 999px …`, or
`--radius-lg`), lifted with `--shadow-md`/`--shadow-sm`. No grain or film
filter is applied by default — treat photos as clean, current, and
warm-toned to match the cream/terracotta palette, not styled to look like an
old or degraded print. (`styles.css` defines an unused `.washed` filter
utility for a muted look — leave it unused unless a page specifically calls
for it.)

## Real-photo rule

Nathalie's portrait (`images/nathalie.jpg`) is a real photo and must never
be swapped for an AI-generated one. It currently appears in exactly four
places:

1. Homepage hero intro banner (88px circle)
2. Homepage journal teaser (68px circle)
3. `journal.html` hero portrait (pill/blob frame)
4. `about.html` full-width portrait band

If a new page needs Nathalie's likeness, reuse `images/nathalie.jpg` — don't
generate a new image of her.
