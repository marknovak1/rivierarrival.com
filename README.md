# rivierarrival.com

Consulting and relocation platform for the French Riviera (Côte d'Azur), guided by a local persona, **Nathalie**. Helps foreign newcomers with housing, visas, banking, healthcare, schools and settling in.

## Structure

- `index.html` — homepage (hero, settling-in guides, neighborhoods, journal preview)
- `journal.html` — Nathalie's journal (daily posts, archive, newsletter)
- `styles.css` — design system tokens + components (warm cream / terracotta / sage, Cormorant Garamond + Lora)

Plain static HTML/CSS with a small vanilla-JS EN/FR language toggle. No build step.

## Local preview

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

## Deploy

Connected to Vercel via GitHub integration — pushes to `main` auto-deploy.

## Roadmap

- Swap placeholder panels for real photography
- French translations behind the EN/FR toggle
- Additional languages
- Monetization model (TBD)
