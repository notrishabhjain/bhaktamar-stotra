# Bhaktamar Stotra Portal — Design Tokens & Component Spec
### "Śveta Śilā" (White Stone) Design System — Smooth Marble Jain Temple Finish

This file is the single source of truth for visual styling. Claude Code
should implement these as CSS custom properties (`:root` variables) and
use them everywhere instead of hardcoded values, so the whole site stays
consistent and themeable from one place.

---

## 1. Color Tokens

```css
:root {
  /* ---- Surfaces ---- */
  --color-bg: #FBF9F4;              /* page background — warm pearly white, never pure white */
  --color-bg-alt: #F5F1E9;          /* secondary section background, slightly deeper cream */
  --color-surface: #FFFEFB;         /* card / panel surface */
  --color-surface-raised: #FFFFFF;  /* modal, popover, elevated surface */
  --color-marble-vein: #EDE7DA;     /* subtle marble-vein line color, used at low opacity only */

  /* ---- Accent: temple gold / sandstone ---- */
  --color-gold-50:  #FAF3E7;
  --color-gold-100: #F0E1C4;
  --color-gold-300: #D4B87E;
  --color-gold-500: #B08D57;        /* primary accent — verse numbers, active states, hairlines */
  --color-gold-600: #9C7A3E;        /* accent hover/pressed */
  --color-gold-700: #7A5F2F;        /* accent text-on-light, must pass AA */

  /* ---- Secondary accent: temple sage (reflection panels only) ---- */
  --color-sage-50:  #F2F5F0;
  --color-sage-100: #E7EDE4;        /* reflection panel background */
  --color-sage-500: #6B8E72;        /* reflection panel label/accent */
  --color-sage-700: #4F6B55;        /* reflection panel text-on-tint, must pass AA */

  /* ---- Text ---- */
  --color-text-primary: #2E2A24;    /* body copy, warm charcoal — never pure black */
  --color-text-secondary: #6B655A;  /* meta labels, captions, secondary copy */
  --color-text-muted: #9A9284;      /* disabled states, placeholder, faint hints */
  --color-text-on-gold: #FBF9F4;    /* text on solid gold fill (rare — buttons only) */

  /* ---- Borders / dividers ---- */
  --color-border-hairline: #E8E2D4; /* default hairline border/divider */
  --color-border-gold: #B08D57;     /* gold hairline for section rules, used at 100% or 40% opacity */

  /* ---- Focus / interaction ---- */
  --color-focus-ring: #B08D57;      /* soft gold focus ring, NOT browser-default blue */
  --color-overlay-scrim: rgba(46, 42, 36, 0.35); /* for any modal/lightbox scrim, if used */

  /* ---- Shadows (always warm-toned, never cool grey/black) ---- */
  --shadow-card: 0 1px 3px rgba(176, 141, 87, 0.08), 0 4px 14px rgba(46, 42, 36, 0.04);
  --shadow-card-hover: 0 2px 6px rgba(176, 141, 87, 0.12), 0 10px 28px rgba(46, 42, 36, 0.07);
  --shadow-panel: 0 1px 2px rgba(46, 42, 36, 0.03), 0 8px 24px rgba(46, 42, 36, 0.05);
}
```

**Explicitly forbidden anywhere in the UI:** pure black (`#000`), pure
white (`#FFF`) as a large fill, saturated red/blue/purple, any gradient,
any neon/high-chroma color. Run every new color through a quick check:
does it look like it belongs on cream temple stone? If not, mute it
toward `--color-gold-500` or `--color-text-secondary` until it does.

---

## 2. Typography Tokens

```css
:root {
  /* ---- Font families ---- */
  --font-devanagari: 'Noto Serif Devanagari', 'Tiro Devanagari Hindi', serif;
  --font-serif: 'Lora', 'Source Serif 4', Georgia, serif;       /* headings, verse Latin text */
  --font-sans: 'Inter', 'Karla', -apple-system, sans-serif;     /* UI chrome, small labels only */

  /* ---- Sizes (fluid where noted — use clamp() so it scales smoothly) ---- */
  --text-xs:   0.75rem;   /* 12px — captions, image labels ("यंत्र") */
  --text-sm:   0.875rem;  /* 14px — meta text, nav links */
  --text-base: 1rem;      /* 16px — body paragraphs (Hindi/English meaning) */
  --text-md:   1.125rem;  /* 18px — Hindi doha */
  --text-lg:   1.375rem;  /* 22px — section sub-headings */
  --text-xl:   clamp(1.75rem, 1.5rem + 1vw, 2.25rem);   /* verse number "श्लोक १" */
  --text-2xl:  clamp(2rem, 1.6rem + 1.8vw, 3rem);       /* Sanskrit verse lines */
  --text-3xl:  clamp(2.5rem, 2rem + 2.5vw, 4rem);       /* landing page title */

  /* ---- Line height ---- */
  --leading-tight:  1.3;   /* headings, verse numbers */
  --leading-normal: 1.6;   /* UI text, captions */
  --leading-verse:  1.85;  /* Sanskrit/Hindi verse blocks — generous, meditative */
  --leading-relaxed: 1.75; /* meaning paragraphs, reflection panel */

  /* ---- Letter spacing ---- */
  --tracking-normal: 0;
  --tracking-wide: 0.06em;    /* section labels, e.g. "SANSKRIT" */
  --tracking-widest: 0.12em;  /* small caps temple-signage labels */

  /* ---- Font weight ---- */
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;  /* use sparingly — nothing should feel "bold/loud" */
}
```

**Rules:**
- Never use a weight above 600 anywhere on the site.
- Devanagari text always uses `--font-devanagari`; never substitute a
  sans-serif Devanagari font, even for UI labels in Hindi.
- Section labels (`SANSKRIT`, `यंत्र`, `HINDI MEANING`) always use
  `--text-xs` or `--text-sm`, `--tracking-widest`, uppercase (Latin) or
  the Devanagari label as-is, in `--color-text-secondary` — never in the
  gold accent at full body size.

---

## 3. Spacing Tokens

```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-24: 6rem;     /* 96px */
  --space-32: 8rem;     /* 128px */

  /* ---- Semantic spacing ---- */
  --gap-card-grid: var(--space-8);          /* gutter between landing-page cards */
  --gap-section: var(--space-16);           /* vertical gap between detail-page sections */
  --gap-section-lg: var(--space-24);        /* gap around hero/header areas */
  --padding-card: var(--space-6);           /* internal card padding */
  --padding-panel: var(--space-8) var(--space-8); /* reflection panel internal padding */
  --content-max-width: 760px;               /* reading column max-width on detail pages */
  --page-max-width: 1400px;                 /* outer container max-width */
}
```

**Rule of thumb:** when in doubt, add more space, not less. This site
should never feel dense. If a section looks "fine" at `--space-8`, try
`--space-12` and see if it feels calmer.

---

## 4. Radius & Border Tokens

```css
:root {
  --radius-sm: 8px;     /* small elements, tags */
  --radius-md: 14px;    /* cards */
  --radius-lg: 16px;    /* reflection panel, larger surfaces */
  --radius-full: 999px; /* pills, if ever needed */

  --border-hairline: 1px solid var(--color-border-hairline);
  --border-gold-hairline: 1px solid var(--color-gold-500);
}
```

---

## 5. Motion Tokens

```css
:root {
  --duration-fast: 180ms;
  --duration-normal: 350ms;
  --duration-flip: 480ms;   /* card flip specifically */
  --ease-calm: cubic-bezier(0.4, 0, 0.2, 1);   /* standard ease — no bounce, no elastic */
  --ease-flip: cubic-bezier(0.45, 0.05, 0.15, 1); /* slightly slower start, for the flip */
}
```

```css
/* Respect reduced motion everywhere */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Motion budget for the entire site (do not exceed):**
1. Card hover → flip reveal (`--duration-flip`)
2. Card/button hover → soft lift + shadow deepen (`--duration-fast`)
3. Page/section entry → gentle opacity fade-in (`--duration-normal`)
4. Focus ring appearance (instant, no transition delay — accessibility)

Nothing else moves. No parallax, no scroll-triggered animations beyond
the entry fade, no auto-playing carousels, no bouncing/elastic easing
anywhere.

---

## 6. The "Marble Finish" Texture Treatment

The calm, temple-stone feel comes from **restraint**, not from an actual
image texture. Do this instead of importing a marble background image:

```css
.marble-surface {
  background-color: var(--color-surface);
  background-image:
    radial-gradient(circle at 20% 15%, rgba(176,141,87,0.025) 0%, transparent 45%),
    radial-gradient(circle at 80% 85%, rgba(107,142,114,0.02) 0%, transparent 45%);
  background-blend-mode: multiply;
}
```

This gives surfaces a faint, almost imperceptible warmth/depth — like
light catching real stone — without ever reading as a "texture" or
pattern. Apply `.marble-surface` to the `<body>` background and to large
panel backgrounds only; cards themselves stay flat `--color-surface` with
just `--shadow-card` for depth, so the grid doesn't feel busy.

---

## 7. Component Specs

### 7.1 Landing-page card
```css
.shloka-card {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  padding: var(--padding-card);
  border: none;
  transition: box-shadow var(--duration-fast) var(--ease-calm),
              transform var(--duration-fast) var(--ease-calm);
  cursor: pointer;
}
.shloka-card:hover,
.shloka-card:focus-visible {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px);
}
.shloka-card:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 3px;
}
/* 3D flip container */
.shloka-card-flip-inner {
  transition: transform var(--duration-flip) var(--ease-flip);
  transform-style: preserve-3d;
}
.shloka-card:hover .shloka-card-flip-inner,
.shloka-card.is-flipped .shloka-card-flip-inner {
  transform: rotateY(180deg);
}
.shloka-card-face--back { transform: rotateY(180deg); }
```
- Card number: `--text-lg`, `--font-devanagari`, `--color-gold-500`,
  `--weight-medium`
- Card title label: `--text-sm`, `--font-devanagari`, `--color-text-secondary`
- Back face (yantra): image fills ~80% of card, centered, `--radius-sm`
  on the image itself, title label repeated small beneath at `--text-xs`

### 7.2 Detail-page section label
```css
.section-label {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-3);
}
```
(For Devanagari labels like "यंत्र", skip `text-transform: uppercase`
and `--font-sans`; use `--font-devanagari` at `--text-sm` with
`--tracking-wide` instead — Devanagari has no case, so uppercase-styling
doesn't apply.)

### 7.3 Sanskrit verse block
```css
.verse-sanskrit {
  font-family: var(--font-devanagari);
  font-size: var(--text-2xl);
  line-height: var(--leading-verse);
  color: var(--color-text-primary);
  text-align: center;
  max-width: var(--content-max-width);
  margin: 0 auto;
}
.verse-sanskrit p { margin: 0; } /* one <p> per verse line, no extra gap beyond line-height */
```

### 7.4 Reflection panel ("जीवन से जुड़ाव")
```css
.reflection-panel {
  background: var(--color-sage-100);
  border-radius: var(--radius-lg);
  padding: var(--padding-panel);
  box-shadow: var(--shadow-panel);
}
.reflection-panel .section-label {
  color: var(--color-sage-700);
}
.reflection-panel p {
  font-family: var(--font-devanagari);
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  color: var(--color-text-primary);
}
```

### 7.5 Image frame (yantra / bhav-chitra)
```css
.devotional-image-frame {
  border: var(--border-hairline);
  border-radius: var(--radius-sm);
  padding: var(--space-3);
  background: var(--color-surface-raised);
}
.devotional-image-frame img {
  width: 100%;
  height: auto;
  border-radius: calc(var(--radius-sm) - 4px);
  display: block;
}
.devotional-image-frame figcaption {
  text-align: center;
  margin-top: var(--space-2);
  font-family: var(--font-devanagari);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}
```

### 7.6 Footer nav links (prev/next/all)
```css
.footer-nav {
  display: flex;
  justify-content: center;
  gap: var(--space-8);
  padding-top: var(--space-8);
  border-top: 1px solid var(--color-gold-500);
  /* hairline uses gold at reduced opacity, not full solid width */
  border-image: linear-gradient(to right, transparent, var(--color-gold-500) 20%, var(--color-gold-500) 80%, transparent) 1;
}
.footer-nav a {
  font-family: var(--font-devanagari);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color var(--duration-fast) var(--ease-calm);
}
.footer-nav a:hover { color: var(--color-gold-600); }
```

---

## 8. Breakpoints

```css
:root {
  --bp-mobile: 375px;   /* design floor — must look intentional here */
  --bp-tablet: 768px;
  --bp-desktop: 1200px;
  --bp-wide: 1440px;
}
```
- **Mobile (< 768px):** landing grid → 1 column; detail-page images
  (yantra + bhav-chitra) stack vertically instead of side-by-side; card
  flip-on-hover becomes tap-to-flip (see §9).
- **Tablet (768–1199px):** landing grid → 3 columns.
- **Desktop (≥ 1200px):** landing grid → 6 columns.
- Detail-page reading column stays at `--content-max-width` (760px) and
  centers itself at every breakpoint above mobile — never stretches full
  width, even on a wide desktop screen.

---

## 9. Interaction Notes (non-visual but required for correct implementation)

- **Touch devices have no `:hover`.** Implement tap-to-flip: first tap on
  a card flips it (adds `.is-flipped`, per §7.1); a second tap, or a tap
  elsewhere on the grid, navigates through / flips it back. Do not rely on
  `:hover` alone for the flip on any touch-capable viewport.
- **Focus states must always be visible and must use `--color-focus-ring`**,
  never the browser default blue outline — every interactive element
  (cards, nav links, footer nav) needs an explicit `:focus-visible` rule.
- **`prefers-reduced-motion`** must disable the card flip animation
  (swap to instant `opacity` cross-fade of front/back face content
  instead of the 3D rotate) and skip section entry fades.

---

## 10. What Claude Code should do with this file

1. Add the entire "Color/Typography/Spacing/Radius/Motion" token blocks
   above as CSS custom properties on `:root` in the global stylesheet.
2. Implement the component specs in §7 using those tokens — do not
   hardcode any hex/px/rem value that already has a token; reference the
   variable instead.
3. Apply the breakpoint rules in §8 to the existing landing-grid and
   detail-page layouts already generated from `assets/data.json`.
4. This is a **visual/CSS pass on the existing structure** — do not
   change routing, data loading, or the 48-page generation logic already
   in the repo.
5. Real yantra/bhav-chitra images continue to come from
   `assets/images/` per `assets/data.json` — this spec governs only the
   frame/label/layout styling around them, not the images themselves.
