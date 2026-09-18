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

**Vercel** — `vercel.json` sets the build command and output directory. Import
the repository and deploy; no environment variables are needed.

## Accessibility notes

Cards are real links, focusable and openable with Enter, with a soft gold focus
ring. Body text uses the warm charcoal tone (13.6:1 on the page background).
The gold accent is reserved for large or decorative type, where it meets WCAG
AA for large text; small text that needs the accent uses the darker
`--gold-deep` (5.8:1). The 3D card flip is replaced by a plain cross-fade when
`prefers-reduced-motion` is set.
