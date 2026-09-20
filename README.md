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

## Pages

| Route | What it is |
|---|---|
| `/` | the 48-card grid, today's verse, and three doors into the text |
| `/shloka-NN/` | one verse in full — Sanskrit, doha, meanings, images, reflection |
| `/paath/` | all 48 Sanskrit verses in sequence, for continuous recitation |
| `/rachna/` | the poem's architecture, including the eight great fears |
| `/abhi/` | entry by inner state rather than by verse number |

## Project layout

```
content/
  data.json             canonical content — 48 shlokas, in reading order
  reflection-index.json derived — each reflection's inner state + group
  structure.json        derived — the poem's sections and the eight fears
  images/               96 source PNGs (yantra + bhav-chitra per shloka)
  fonts/                TTFs used to render share cards at build time
src/
  build.mjs             the static site generator
  styles.css            all styling
  site.js               flip, keyboard nav, text size, today's verse, SW
  sw.js                 service worker (offline support)
  serve.mjs             local preview server
  favicon.svg
dist/                   build output (git-ignored)
SPEC.md                 the original build specification
DESIGN-TOKENS.md        the visual token system
```

## Derived content

Two files hold content *derived* from the reflections rather than authored
alongside them, and both are meant to be reviewed and edited by hand:

- `reflection-index.json` gives every shloka a one-line **inner state** (the
  situation its reflection actually describes) and sorts the 48 into eight
  groups. This is what `/abhi/` is built from. The verses, meanings and
  reflections themselves are never touched.
- `padachhed.json` holds the word-by-word Hindi gloss (शब्दार्थ) and the
  अलंकार notes shown under the Sanskrit on a detail page — complete for all
  48 verses. A verse with no entry would simply render no block, and every
  build prints coverage. See "शब्दार्थ and अलंकार" below.
- `structure.json` describes the poem's sections. The eight-fears sequence
  (verses 38–46) is evident in the source data itself — the titles name the
  elephant, lion, fire, snake, war, water, disease and chains in order, and
  verse 47 enumerates all eight together. The प्रातिहार्य section (28–35) is
  likewise verse-by-verse evidenced: each of those eight verses names its own
  प्रातिहार्य — अशोक, सिंहासन, चामर, छत्र, दुंदुभि, पुष्पवृष्टि, भामण्डल,
  दिव्यध्वनि.

## शब्दार्थ and अलंकार

`content/padachhed.json` carries, for all 48 verses, a word-by-word Hindi
gloss and a set of अलंकार notes — the figures of speech and what they are
doing. Both render under the Sanskrit on a detail page, where a pravachan
would take them up.

```json
"48": {
  "words": [["स्तोत्र-स्रजम्", "स्तुति रूपी माला को"]],
  "alankar": [{ "name": "श्लेष", "note": "'मानतुंग' दो अर्थ एक साथ रखता है …" }]
}
```

Two things matter when editing:

1. **Reconstitute words the verse layout breaks.** `data.json` breaks
   mid-word to preserve the line structure — `प्रभाणा-` ending one line and
   `मुद्योतकं` starting the next are really `प्रभाणाम् उद्योतकम्`. The gloss
   lists the whole word.
2. **Undo sandhi.** The text writes `उच्चैर-शोक`; the gloss restores
   `उच्चैः` + `अशोक`. Splitting the compound *is* the job.

The glosses were derived from the Sanskrit together with the Hindi and English
meanings already in `data.json`, so each entry is anchored to a meaning that
shipped with the content rather than to an outside reading. Two checks run
against them: mean word-to-verse correspondence is 93.8% under sandhi-tolerant
matching, and every one of the 48 glosses matches its own verse better than a
randomly chosen other verse — so nothing is attached to the wrong shloka. They
remain a reading aid; corrections belong in this one file and need no code
change.

## Share cards

Every page carries an `og:image` generated at build time into
`dist/assets/share/` — the verse's yantra, its number, its theme and its inner
state on the marble background, so a link shared to WhatsApp arrives as a card
instead of a bare grey rectangle.

Devanagari is rendered from the TTFs in `content/fonts/`, wired up through a
fontconfig file that lists *only* that directory. A missing system font
therefore cannot silently substitute tofu boxes — the build either renders the
right glyphs or fails loudly. Cards are JPEG, averaging 48 KB, to stay inside
WhatsApp's preview budget.

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
- Generates 51 share cards, PWA icons and `manifest.webmanifest`.
- Writes `.nojekyll` so GitHub Pages serves the output as-is.

Every URL in the output is **relative**, so the same `dist/` works served from
a domain root or from a repository sub-path.

Rough transfer budget: landing page ≈ 0.95 MB (HTML + CSS + fonts + 48 lazy
thumbnails), each detail page ≈ 60 KB. Share cards are only ever fetched by
link-preview crawlers, never by readers.

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

## Behaviour

All of it is progressive — with JavaScript off, every page still reads and
every link still works.

- **Arrow keys** move between verses on a shloka page.
- **Reading size** has three steps, stored in `localStorage` and applied
  before first paint so a saved size never flashes. Only the reading tokens
  change; UI chrome keeps its size.
- **Today's verse** is derived from the **local** calendar date, so it turns
  over at local midnight and everyone in a timezone sees the same verse on the
  same day. (Dividing the UTC epoch instead would roll it over at 05:30 in
  India.) A tab left open overnight re-checks the date when it is looked at
  again, so it never sits on yesterday's verse. No storage, no backend, no
  tracking.
- **Offline**: a service worker precaches the shell and caches pages as they
  are read, so a verse you have opened stays readable with no connection.
  Pages are network-first, so a rebuild is picked up as soon as you are back
  online.
- **Print**: `@media print` drops navigation and decoration, forces white,
  and keeps verses, panels and plates from splitting across pages.

## Accessibility notes

Cards are real links, focusable and openable with Enter, with a soft gold focus
ring (`--color-focus-ring`, never the browser-default blue). Body text uses the
warm charcoal tone at 13.6:1 on the page background; secondary text is 5.5:1
and the reflection panel's sage label is 4.9:1 on its tint. The gold accent is
reserved for hairlines and decoration, with `--color-gold-700` (5.9:1) wherever
gold carries text. The 3D card flip is replaced by an opacity cross-fade when
`prefers-reduced-motion` is set, and tap-to-flip replaces hover on touch.
