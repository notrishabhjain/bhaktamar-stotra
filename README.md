# श्री भक्तामर स्तोत्र — Digital Portal

A quiet, fully static site presenting all 48 shlokas of the Shri Bhaktamar
Stotra. One landing page shows the 48 verses as flip cards; each card opens a
detail page with the Sanskrit verse, the Hindi doha, meanings in Hindi and
English, the yantra and bhav-chitra, and a reflection connecting the verse to
everyday life.

No backend, no database, no tracking, no third-party embeds. All 49 pages are
generated at build time from `content/data.json`.

## Getting started

```bash
npm install
npm run build     # writes the site to dist/
npm run serve     # preview dist/ at http://localhost:4173
npm run dev       # build, then serve
```

## Project layout

```
content/
  data.json             canonical content — 48 shlokas, in reading order
  images/               96 source PNGs (yantra + bhav-chitra per shloka)
src/
  build.mjs             the static site generator
  styles.css            all styling
  site.js               tap-to-flip behaviour for touch devices
  serve.mjs             local preview server
  favicon.svg
dist/                   build output (git-ignored)
SPEC.md                 the original build specification
```

### Editing content

`content/data.json` is the single source of truth. Change a verse, a meaning
or a reflection there and re-run `npm run build` — nothing is hand-authored
per shloka. Fields per entry: `id`, `slug`, `title`, `sanskrit`, `hindiDoha`,
`hindiMeaning`, `englishMeaning`, `reflectionHindi`, `yantraImage`,
`bhavImage`. `sanskrit` and `hindiDoha` keep their `\n` line breaks; each line
is rendered on its own line.

## What the build does

- Emits `dist/index.html` plus `dist/shloka-NN/index.html` for all 48 shlokas.
- Converts every source PNG to WebP (full size for detail pages, a lighter
  thumbnail for the card flip) and keeps a re-compressed PNG as fallback.
  Images are never cropped, filtered or distorted — only re-encoded.
- Self-hosts the webfonts (Noto Serif Devanagari, Lora, Inter) from
  `@fontsource` packages, so there is no runtime Google Fonts request.
- Writes `.nojekyll` so GitHub Pages serves the output as-is.

Every URL in the output is **relative**, so the same `dist/` works served from
a domain root or from a repository sub-path.

Rough transfer budget: landing page ≈ 0.95 MB (HTML + CSS + fonts + 48 lazy
thumbnails), each detail page ≈ 60 KB.

## Deployment

The build output is a plain static folder — any static host will serve it.

**GitHub Pages** — `.github/workflows/deploy.yml` builds and deploys on every
push to the repository default branch. Enable it once under *Settings → Pages → Build and deployment
→ Source: GitHub Actions*. Works at both `user.github.io` and
`user.github.io/repo/` without configuration.

**Vercel** (the configured target) — `vercel.json` sets the build command,
output directory and long-lived cache headers for fonts and images. Import the
repository and deploy; no environment variables are required.

Canonical tags and `sitemap.xml`/`robots.txt` are generated from the site
origin, resolved in this order:

1. `SITE_URL` — set this once a custom domain is attached, e.g.
   `SITE_URL=https://bhaktamar.example`.
2. `VERCEL_PROJECT_PRODUCTION_URL` — injected automatically by Vercel, so the
   default `*.vercel.app` domain works with no configuration.
3. Neither set (a plain local build) — canonical tags and the sitemap are
   skipped rather than pointing at a guessed domain.

## Design system

`DESIGN-TOKENS.md` is the source of truth for visual styling — the
"Śveta Śilā" (White Stone) token set. Every token in it is declared as a CSS
custom property on `:root` in `src/styles.css`, and nothing outside that block
hardcodes a value that has a token. To restyle the site, change the token, not
the component.

Two documented deviations, both for WCAG AA:

- The card numeral uses `--color-gold-700` rather than `--color-gold-500`.
  Gold 500 measures 3.06:1 on the card surface, short of the 4.5:1 that text at
  `--text-lg` needs; gold 700 is the same hue family at 5.94:1. Gold 500 is
  still used for hairlines, rules and the focus ring, where contrast minimums
  don't apply.
- Below the tablet breakpoint the Sanskrit and doha blocks step down one size
  token (`--text-lg` / `--text-base`). At 375px the longest Sanskrit line
  renders 370px wide at `--text-2xl` against 327px of available width, which
  wrapped every line and broke the verse structure. Desktop sizes are
  unchanged.

## Accessibility notes

Cards are real links, focusable and openable with Enter, with a soft gold focus
ring (`--color-focus-ring`, never the browser-default blue). Body text uses the
warm charcoal tone at 13.6:1 on the page background; secondary text is 5.5:1
and the reflection panel's sage label is 4.9:1 on its tint. The gold accent is
reserved for hairlines and decoration, with `--color-gold-700` (5.9:1) wherever
gold carries text. The 3D card flip is replaced by an opacity cross-fade when
`prefers-reduced-motion` is set, and tap-to-flip replaces hover on touch.
