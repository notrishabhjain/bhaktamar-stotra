# Bhaktamar Stotra — Digital Portal — Build Spec

## 1. What this is

A static, read-only website presenting all 48 shlokas of the Shri Bhaktamar
Stotra. One landing page shows all 48 shlokas as cards in a grid; clicking a
card opens a dedicated detail page for that shloka with the full verse, its
meanings, both reference images, and a short reflection connecting it to
everyday life.

There is no backend, no database, no user accounts, no comments, no search
indexing requirements beyond basic SEO tags. Content is fixed at build time
and read from `assets/data.json`. This should be buildable as a plain
static site (plain HTML/CSS/JS, or a static-site framework such as Astro /
Next.js with `output: "export"` / Vite — Claude Code's choice, but nothing
that requires a running server or database at request time).

## 2. Content source (provided)

- `assets/data.json` — an array of 48 objects, one per shloka, already in
  final reading order (1 → 48). Each object:

  ```json
  {
    "id": 1,
    "slug": "shloka-01",
    "title": "सर्व विघ्न उपद्रवनाशक",
    "sanskrit": "भक्तामर-प्रणत-मौलि-मणि-प्रभाणा-\n...",
    "hindiDoha": "सुर-नत-मुकुट रतन-छवि करें...",
    "hindiMeaning": "झुके हुए भक्त देवों के मुकुट...",
    "englishMeaning": "Bowing wholeheartedly to the feet of Bhagwan Adinath...",
    "reflectionHindi": "कई बार दिन की शुरुआत ही अधूरे कामों...",
    "yantraImage": "images/s01_yantra.png",
    "bhavImage": "images/s01_murti.png"
  }
  ```

  - `sanskrit` and `hindiDoha` contain literal `\n` line breaks — render
    each line as its own line (e.g. split on `\n`, one `<p>` or `<br>` per
    line), preserving verse structure. Do not collapse into one paragraph.
  - `title` is the traditional short "benefit/theme" label for that shloka
    (e.g. "सर्व विघ्न उपद्रवनाशक") — use it as a subtitle/tag on both the
    card and the detail page.
  - `reflectionHindi` is the "how this relates to everyday life" passage —
    already written, do not regenerate or translate it.

- `assets/images/` — 96 PNG files, two per shloka:
  - `sNN_yantra.png` — the yantra (geometric/mantra diagram) for that shloka
  - `sNN_murti.png` — the bhav-chitra / literal devotional depiction for
    that shloka (taller aspect ratio, portrait)

  Copy this folder as-is into the site's public/static assets directory.
  Treat these as source-of-truth devotional images — do not crop faces,
  don't apply filters/effects, don't distort aspect ratio. Optimize file
  size (re-encode/compress) if needed for web performance, but keep them
  visually unaltered.

## 3. Visual language — "quiet marble temple"

The entire site should feel like stepping into a calm, sunlit, white-marble
Jain temple courtyard — not a busy devotional/astrology website. Think
negative space, soft stone, a single warm accent, nothing that moves unless
the user's cursor asks it to.

### Palette
- Base background: pearly off-white — `#FBF9F5` or `#F8F6F1` (not pure
  `#FFFFFF`, which feels clinical/cold).
- Secondary surface (cards, panels): warm white — `#FFFFFF` or `#FEFDFB`
  with a very soft `#00000008`–`#0000000F` shadow, never a hard border.
- Primary accent (headings, active states, verse numbers): a muted
  temple-gold / sandstone — `#B08D57` or `#9C7A3E`. Use sparingly — as a
  hairline rule, a small numeral, a hover glow — never as a large fill.
- Secondary accent (optional, for the reflection section only): a soft
  sage/incense-smoke green — `#6B8E72` or similar, muted, not saturated.
- Text: warm charcoal, not pure black — `#2E2A24` for body, `#6B655A` for
  secondary/meta text.
- No bright reds, blues, purples, gradients, or neon anywhere.

### Typography
- Devanagari (Sanskrit/Hindi): a classical, readable serif-style Devanagari
  webfont — e.g. "Noto Serif Devanagari" or "Tiro Devanagari Hindi". Avoid
  bold/heavy display Devanagari fonts; keep it closer to manuscript/temple
  inscription weight.
- Latin/English: a calm humanist serif or serif-adjacent font for headings
  (e.g. "Lora", "Cormorant", "Source Serif 4") and a clean, understated sans
  (e.g. "Inter", "Karla") for UI labels/meta text. Do not mix more than 2
  font families total (one serif for content, one sans for UI chrome).
- Generous line-height on verse text (1.7–2.0) — this is meant to be read
  slowly, not scanned.
- Generous letter-spacing on small caps / section labels (e.g. "यंत्र",
  "भाव-चित्र", "SANSKRIT") — a temple-signage feel.

### Layout & spacing
- Wide margins, generous whitespace between sections. Max content width on
  detail pages ~720–800px for the verse/meaning columns, so line length
  stays readable.
- No drop shadows other than the very soft card elevation described above.
  No skeuomorphic textures, no stock "marble" background images — solid
  soft color does the job.
- No busy iconography. If icons are needed (e.g. a "back" arrow), use thin,
  single-weight line icons only, in the muted gold or charcoal tone.
- No autoplay video, no background music, no particle effects, no parallax
  scrolling, no confetti/sparkle animations. Motion budget for the entire
  site: card hover/flip, gentle fades on page/section entry, and a subtle
  hover-lift on buttons. That's it.
- Respect `prefers-reduced-motion`: disable the flip/fade transitions (swap
  to instant or opacity-only) when the user has that OS setting on.

### General mood checklist (use this to self-review the build)
- Would this look calm as a screenshot with no color correction?
- Is there any single element competing for attention at first glance
  (bright color, motion, bold weight)? If yes, mute it.
- Does the page feel like it could be printed on textured cream paper and
  still look intentional?

## 4. Pages & components

### 4.1 Landing page (`/`)

- **Header**: Site title "श्री भक्तामर स्तोत्र" (Devanagari, large, gold or
  charcoal) with a small subtitle underneath in Latin serif italics —
  "Bhaktamar Stotra — 48 Verses for Reflection" (or similar; do not
  reference any person's name or a specific year anywhere on the site).
  Centered, generous top padding, no navbar clutter — this single header is
  the entire top-of-page chrome.
- **Grid of 48 cards**, responsive:
  - Desktop: 6 columns × 8 rows (or 4×12 — Claude Code's call based on
    visual balance), comfortable gutter (24–32px).
  - Tablet: 3–4 columns.
  - Mobile: 1–2 columns.
- **Card, default state**: soft white card, rounded corners (12–16px),
  subtle elevation. Shows:
  - The shloka number in the gold accent, small, top-left or centered
    (e.g. "०१" in Devanagari numerals, or "1" — Claude Code's call, but
    Devanagari numerals fit the mood better).
  - The `title` (theme label) in small serif text.
  - Nothing else — keep the resting state extremely minimal.
- **Card, hover/flip state** (desktop: on `:hover`; touch devices: on
  tap-and-hold or a visible "flip" affordance since there's no hover — use
  a tap-to-flip toggle on touch, with a second tap/tap-elsewhere to open):
  - The card flips (CSS 3D flip, ~400–500ms, ease-in-out) to reveal the
    `yantraImage` for that shloka, filling most of the card, with the
    title small beneath it.
  - Keep the flip subtle — no bounce/elastic easing, no spinning.
- **Card click** → navigates to that shloka's detail page
  (`/shloka-01`, etc.).
- Keyboard accessibility: cards must be focusable (`tabindex`, real `<a>`
  or `<button>` element) and openable via Enter/Space; focus state should
  show a soft gold outline, not a harsh browser-default blue ring.

### 4.2 Detail page (`/shloka-NN`)

One page per shloka (48 total, statically generated from `data.json`), in
this fixed vertical order:

1. **Breadcrumb / back link** — small, top-left, "← सभी श्लोक" (back to
   all shlokas), quiet styling.
2. **Shloka number + title** — the number large and centered in the gold
   accent (e.g. "श्लोक १"), the theme `title` beneath it in muted italics.
3. **Sanskrit verse** — the most visually prominent text block on the
   page. Larger type size than everything else, centered, generous
   line-height, each line of the verse on its own line (split on `\n`).
   Label above it: "संस्कृत मूल" in small tracked caps.
4. **Hindi doha** — same treatment, one size step down from the Sanskrit
   block. Label: "हिंदी दोहा".
5. **Hindi meaning (अर्थ)** — regular paragraph, comfortable reading width.
   Label: "हिंदी अर्थ".
6. **English meaning** — regular paragraph, slightly muted/italic to mark
   it as a translation rather than the primary text. Label: "ENGLISH
   MEANING" or "SIMPLE ENGLISH MEANING".
7. **Images — यंत्र एवं भाव-चित्र**: the two images side by side (stacked
   on mobile), each in its own soft-bordered frame, each with a small
   caption beneath ("यंत्र" / "भाव-चित्र"). Keep frames simple — thin
   hairline border or soft shadow, no ornate frame graphics.
8. **जीवन से जुड़ाव (reflection)** — the `reflectionHindi` text, set apart
   from the rest of the page: a softly tinted panel (very light sage or
   pearly beige, distinct from pure white), generous internal padding,
   rounded corners, no border needed if the tint provides enough contrast.
   This is the emotional payoff of the page — give it room to breathe.
9. **Footer nav** — "← पिछला श्लोक" / "अगला श्लोक →" (previous/next shloka)
   links, plus a "सभी श्लोक" (all shlokas) link back to the grid. Wrap
   around at the ends (shloka 48 → next disabled or loops to 1 — Claude
   Code's call, disabling is cleaner).

### 4.3 Shared

- No global navbar beyond the back-link on detail pages and the header on
  the landing page — keep chrome minimal throughout.
- Page `<title>` per page: `श्लोक N — <title> | श्री भक्तामर स्तोत्र` for
  detail pages, `श्री भक्तामर स्तोत्र` for the landing page.
- Basic meta description per page (can be auto-generated from
  `englishMeaning`, truncated).
- Favicon: something simple and on-theme (a small gold dot, om-adjacent
  mark, or lotus line-icon) — not required to be pixel-perfect, but should
  not be the framework's default icon.

## 5. Technical requirements

- **Fully static** — no API calls at runtime, no database. All 48 detail
  pages statically generated at build time from `assets/data.json`.
- **Framework**: Claude Code's choice — a lightweight static-site
  generator (Astro is a strong fit given the content-heavy, mostly-static
  nature) or plain Vite + HTML/CSS/JS is equally acceptable. Avoid
  bringing in a full SPA framework with client-side routing unless it's
  genuinely the simplest path — this content doesn't need it.
- **Images**: serve the provided PNGs from `assets/images/`, optionally
  converted to WebP with PNG fallback for performance, lazy-loaded on the
  landing page (only load an image when its card is hovered/focused,
  or lazy-load all 48 yantra thumbnails with `loading="lazy"`).
- **Fonts**: self-host the chosen Devanagari + Latin webfonts (e.g. via
  `@fontsource` packages if using a Node-based toolchain) rather than
  depending on a runtime Google Fonts request, for both performance and
  offline-friendliness. If self-hosting isn't practical, a standard Google
  Fonts `<link>` is an acceptable fallback.
- **Responsive**: must work cleanly from ~360px mobile width up through
  desktop; the flip-card interaction must degrade gracefully to tap-to-flip
  on touch devices (see §4.1).
- **Accessibility**: semantic HTML (`<main>`, `<article>`, `<nav>`,
  heading hierarchy `h1`→`h2` etc.), all images have descriptive `alt`
  text (e.g. `alt="Yantra for Shloka 12"` / `alt="Bhav-chitra depiction for
  Shloka 12"`), color contrast should meet WCAG AA against the pearly
  background (verify the gold accent on white passes for any text use —
  if not, reserve gold for large text/decorative elements only and use the
  charcoal tone for body text).
- **Performance**: this is 96 images plus 48 pages of Devanagari text —
  keep total landing-page initial load reasonable (target under ~3MB
  initial transfer; defer/lazy-load what isn't immediately visible).
- **No tracking/analytics, no third-party embeds, no cookie banners** —
  keep it a clean, self-contained, distraction-free artifact, consistent
  with the calm-temple brief.
- **Deployment**: build output should be a plain static folder (e.g.
  `dist/`) deployable to any static host (Netlify, Vercel, GitHub Pages,
  Cloudflare Pages, S3+CloudFront) — no server-side requirements. (The
  person deploying this will handle hosting separately.)

## 6. File structure handed off alongside this spec

```
portal_package/
├── SPEC.md                 <- this document
└── assets/
    ├── data.json           <- all 48 shlokas, structured (see §2)
    └── images/
        ├── s01_yantra.png
        ├── s01_murti.png
        ├── s02_yantra.png
        ├── s02_murti.png
        ├── ...
        ├── s48_yantra.png
        └── s48_murti.png
```

Claude Code should treat `assets/data.json` and `assets/images/` as the
canonical content source, copy/import them into whatever project structure
it scaffolds, and generate all 49 pages (1 landing + 48 detail pages) from
that data rather than hand-authoring per-shloka markup.

## 7. Explicit non-goals

- No admin panel, no CMS, no editing UI — content is fixed.
- No search, filtering, or tagging beyond the 1–48 grid and prev/next nav.
- No user accounts, favorites, or progress-tracking.
- No multi-language toggle beyond what's already bilingual on the page
  (Sanskrit/Hindi/English all shown together, not switched between).
- No sound, no background music, no autoplay of any kind.
