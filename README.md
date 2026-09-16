# rivierarrival.com

Consulting and relocation platform for the French Riviera (Côte d'Azur), guided by a local persona, **Nathalie**. Helps foreign newcomers with housing, visas, banking, healthcare, schools and settling in.

## Structure

- `index.html` — homepage (hero, settling-in guides, neighborhoods, journal preview)
- `journal/` — Nathalie's journal hub and posts (built from `content/journal/*.md`)
- `admin/` — Decap CMS for writing posts (no code)
- `styles.css` — design system tokens + components (warm cream / terracotta / sage, Cormorant Garamond + Lora)

Static HTML/CSS with a small vanilla-JS EN/FR language toggle, plus a free Node build that turns journal Markdown into HTML and updates `sitemap.xml`.

## Local preview

```bash
npm install
npm run build
python3 -m http.server 8000 --directory public
```

Then open `http://localhost:8000/journal/` and `http://localhost:8000/admin/`.

## Vercel

Build command: `npm run build`  
Install command: `npm install`  
Output directory: `public`

Pushes to `main` auto-deploy. Journal posts published in the CMS commit Markdown to GitHub; Vercel rebuilds the HTML pages.

## Journal admin

The GitHub OAuth App is configured on Vercel (`OAUTH_CLIENT_ID`/`OAUTH_CLIENT_SECRET`), and CMS login works in production. Nathalie signs in at `/admin/` with GitHub, writes a post, unchecks **Keep as draft**, and saves. The live page appears when the Vercel deploy finishes.
