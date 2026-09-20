/**
 * Static site generator for the Bhaktamar Stotra portal.
 *
 * Reads content/*.json + content/images/, writes a plain static site to
 * dist/. Every URL emitted is relative, so the same dist/ works when served
 * from a domain root or from a repository sub-path.
 *
 * Pages: landing, 48 shloka details, /paath/ (continuous recitation),
 * /rachna/ (the poem's structure), /abhi/ (entry by inner state).
 */
import { readFile, writeFile, mkdir, rm, cp, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const contentDir = path.join(root, 'content');

/**
 * Point fontconfig at the bundled TTFs before sharp initialises librsvg, so
 * the share cards render Devanagari identically on any host. Listing only
 * our own directory means a missing system font can never silently
 * substitute — if this config is wrong, rendering fails loudly instead of
 * shipping tofu boxes.
 */
const fontDir = path.join(contentDir, 'fonts');
const fcDir = path.join(os.tmpdir(), 'bhaktamar-fontconfig');
await mkdir(fcDir, { recursive: true });
const fcFile = path.join(fcDir, 'fonts.conf');
await writeFile(
  fcFile,
  `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${fontDir}</dir>
  <cachedir>${path.join(fcDir, 'cache')}</cachedir>
</fontconfig>
`
);
process.env.FONTCONFIG_FILE = fcFile;
const { default: sharp } = await import('sharp');

/**
 * Canonical origin. Set SITE_URL for a custom domain; otherwise Vercel's
 * own production domain is used when building there. When neither is
 * present (a plain local build) canonical tags and the sitemap are skipped
 * rather than guessed.
 */
const SITE_URL = (() => {
  const raw =
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : '');
  return raw ? raw.replace(/\/+$/, '') : '';
})();

const SITE_TITLE = 'श्री भक्तामर स्तोत्र';
const SITE_SUBTITLE = 'Bhaktamar Stotra — 48 Verses for Reflection';

const DEV_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
const toDevanagari = (n) => String(n).split('').map((d) => DEV_DIGITS[Number(d)]).join('');
const nn = (id) => String(id).padStart(2, '0');

const esc = (s) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

/** Each `\n`-separated line of a verse becomes its own line, per spec. */
const verseLines = (text, indent = '          ') =>
  String(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${esc(line)}</p>`)
    .join(`\n${indent}`);

const metaDescription = (shloka) => {
  const source = shloka.englishMeaning.replace(/\s+/g, ' ').trim();
  const clipped = source.length > 155 ? `${source.slice(0, 152).trimEnd()}…` : source;
  return `Shloka ${shloka.id} of the Bhaktamar Stotra — ${clipped}`;
};

/* ---------------------------------------------------------------- layout */

function layout({ title, description, bodyClass, prefix, main, canonicalPath, ogImage }) {
  const canonical = SITE_URL ? `\n<link rel="canonical" href="${SITE_URL}${canonicalPath}">` : '';
  const ogImageTags =
    SITE_URL && ogImage
      ? `\n<meta property="og:image" content="${SITE_URL}${ogImage}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">`
      : '';
  return `<!doctype html>
<html lang="hi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">${canonical}
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">${ogImageTags}
<meta name="theme-color" content="#FBF9F4">
<link rel="icon" href="${prefix}assets/favicon.svg" type="image/svg+xml">
<link rel="manifest" href="${prefix}manifest.webmanifest">
<link rel="preload" as="font" type="font/woff2" href="${prefix}assets/fonts/noto-serif-devanagari-400.woff2" crossorigin>
<link rel="stylesheet" href="${prefix}assets/css/site.css">
<script>
  /* Applied before first paint so a saved reading size never flashes. */
  try {
    var s = localStorage.getItem('bhaktamar:textsize');
    if (s) document.documentElement.setAttribute('data-textsize', s);
  } catch (e) {}
</script>
</head>
<body class="${bodyClass} marble-surface" data-prefix="${prefix}">
${main}
<script src="${prefix}assets/js/site.js" defer></script>
</body>
</html>
`;
}

/** The small links that sit under every page except the landing page. */
const siteFooter = (prefix) => `<footer class="site-footer">
  <nav class="site-footer__nav" aria-label="साइट">
    <a class="site-footer__link" href="${prefix}">सभी श्लोक</a>
    <a class="site-footer__link" href="${prefix}paath/">अखंड पाठ</a>
    <a class="site-footer__link" href="${prefix}rachna/">स्तोत्र की संरचना</a>
    <a class="site-footer__link" href="${prefix}abhi/">अभी क्या चल रहा है</a>
  </nav>
</footer>`;

/** Reading-size control, shown on the long-form reading pages. */
const textSizeControl = `<div class="textsize" data-textsize-control hidden>
  <span class="textsize__label">पाठ का आकार</span>
  <button type="button" class="textsize__btn" data-textsize="sm" aria-label="छोटा">अ</button>
  <button type="button" class="textsize__btn" data-textsize="md" aria-label="सामान्य">अ</button>
  <button type="button" class="textsize__btn" data-textsize="lg" aria-label="बड़ा">अ</button>
</div>`;

/* --------------------------------------------------------- landing page */

function landingPage(data, index) {
  const cards = data
    .map((s, i) => {
      const num = toDevanagari(s.id);
      return `      <li class="shloka-grid__item" style="--i:${i}">
        <a class="shloka-card" href="${s.slug}/" data-card aria-label="श्लोक ${num} — ${esc(s.title)}">
          <span class="shloka-card-flip-inner">
            <span class="shloka-card-face shloka-card-face--front">
              <span class="shloka-card__number">${num}</span>
              <span class="shloka-card__title">${esc(s.title)}</span>
            </span>
            <span class="shloka-card-face shloka-card-face--back">
              <img class="shloka-card__yantra" src="assets/images/thumb/s${nn(s.id)}_yantra.webp"
                   alt="" width="300" height="250" loading="lazy" decoding="async">
              <span class="shloka-card__title shloka-card__title--back">${esc(s.title)}</span>
            </span>
          </span>
        </a>
      </li>`;
    })
    .join('\n');

  // Minimal data for the client-side "verse for today" panel.
  const today = JSON.stringify(
    data.map((s) => ({
      s: s.slug,
      n: toDevanagari(s.id),
      t: s.title,
      f: (index.states.find((x) => x.id === s.id) || {}).state || '',
    }))
  );

  const main = `<header class="site-header">
  <h1 class="site-header__title">${SITE_TITLE}</h1>
  <p class="site-header__subtitle">${SITE_SUBTITLE}</p>
  <span class="rule" aria-hidden="true"></span>
</header>
<main class="page page--landing">
  <section class="today" data-today hidden aria-labelledby="today-label">
    <h2 class="section-label section-label--deva" id="today-label">आज का श्लोक</h2>
    <p class="today__date" data-today-date></p>
    <a class="today__link" href="#" data-today-link>
      <span class="today__number" data-today-number></span>
      <span class="today__title" data-today-title></span>
      <span class="today__state" data-today-state></span>
    </a>
  </section>

  <nav class="doors" aria-label="पढ़ने के रास्ते">
    <a class="door" href="abhi/">
      <span class="door__title">अभी क्या चल रहा है</span>
      <span class="door__blurb">मन की स्थिति से श्लोक तक — अंक से नहीं</span>
    </a>
    <a class="door" href="rachna/">
      <span class="door__title">स्तोत्र की संरचना</span>
      <span class="door__blurb">आठ महाभय और पूरे स्तोत्र का नक़्शा</span>
    </a>
    <a class="door" href="paath/">
      <span class="door__title">अखंड पाठ</span>
      <span class="door__blurb">सभी ४८ श्लोक एक ही पन्ने पर</span>
    </a>
  </nav>

  <nav aria-label="सभी श्लोक">
    <ul class="shloka-grid">
${cards}
    </ul>
  </nav>
</main>
<footer class="site-footer">
  <p>${SITE_TITLE} · ४८ श्लोक</p>
</footer>
<script type="application/json" data-today-data>${today}</script>`;

  return layout({
    title: SITE_TITLE,
    description:
      'All 48 shlokas of the Shri Bhaktamar Stotra — Sanskrit verse, Hindi doha, meanings in Hindi and English, yantra and bhav-chitra, and a reflection for everyday life.',
    bodyClass: 'body--landing',
    prefix: '',
    canonicalPath: '/',
    ogImage: '/assets/share/home.jpg',
    main,
  });
}

/* ---------------------------------------------------------- detail page */

function detailPage(shloka, prev, next, index, padachhed) {
  const num = toDevanagari(shloka.id);
  const entry = index.states.find((x) => x.id === shloka.id);
  const group = entry && index.groups.find((g) => g.key === entry.group);

  const picture = (base, alt, w, h) => `<picture>
            <source srcset="../assets/images/full/${base}.webp" type="image/webp">
            <img src="../assets/images/full/${base}.png" alt="${esc(alt)}"
                 width="${w}" height="${h}" loading="lazy" decoding="async">
          </picture>`;

  const prevLink = prev
    ? `<a class="footer-nav__link" href="../${prev.slug}/" rel="prev">← पिछला श्लोक</a>`
    : `<span class="footer-nav__link is-disabled" aria-disabled="true">← पिछला श्लोक</span>`;
  const nextLink = next
    ? `<a class="footer-nav__link" href="../${next.slug}/" rel="next">अगला श्लोक →</a>`
    : `<span class="footer-nav__link is-disabled" aria-disabled="true">अगला श्लोक →</span>`;

  const words = (padachhed.verses || {})[String(shloka.id)];
  const padachhedBlock = words
    ? `
    <details class="padachhed" open>
      <summary class="padachhed__summary">
        <span class="section-label section-label--deva">शब्दार्थ — पद-दर-पद</span>
      </summary>
      <dl class="padachhed__list">
${words
  .map(
    ([word, meaning]) => `        <div class="padachhed__pair">
          <dt class="padachhed__word">${esc(word)}</dt>
          <dd class="padachhed__meaning">${esc(meaning)}</dd>
        </div>`
  )
  .join('\n')}
      </dl>
      <p class="padachhed__note">${esc(padachhed.note)}</p>
    </details>`
    : '';

  const stateLine =
    entry && group
      ? `<p class="shloka__state"><a href="../abhi/#${group.key}">${esc(entry.state)}</a></p>`
      : '';

  const main = `<main class="page page--detail">
  <nav class="breadcrumb" aria-label="वापस">
    <a class="breadcrumb__link" href="../">← सभी श्लोक</a>
    ${textSizeControl}
  </nav>

  <article class="shloka">
    <header class="shloka__header">
      <h1 class="shloka__number">श्लोक ${num}</h1>
      <p class="shloka__theme">${esc(shloka.title)}</p>
      ${stateLine}
      <span class="rule" aria-hidden="true"></span>
    </header>

    <section class="block block--verse" aria-labelledby="label-sanskrit">
      <h2 class="section-label section-label--deva" id="label-sanskrit">संस्कृत मूल</h2>
      <div class="verse-sanskrit">
          ${verseLines(shloka.sanskrit)}
      </div>
      ${padachhedBlock}
    </section>

    <section class="block block--verse" aria-labelledby="label-doha">
      <h2 class="section-label section-label--deva" id="label-doha">हिंदी दोहा</h2>
      <div class="verse-doha">
          ${verseLines(shloka.hindiDoha)}
      </div>
    </section>

    <section class="block" aria-labelledby="label-hindi-meaning">
      <h2 class="section-label section-label--deva" id="label-hindi-meaning">हिंदी अर्थ</h2>
      <p class="prose">${esc(shloka.hindiMeaning)}</p>
    </section>

    <section class="block" aria-labelledby="label-english-meaning">
      <h2 class="section-label" id="label-english-meaning">Simple English Meaning</h2>
      <p class="prose prose--translation">${esc(shloka.englishMeaning)}</p>
    </section>

    <section class="block block--images" aria-labelledby="label-images">
      <h2 class="section-label section-label--deva" id="label-images">यंत्र एवं भाव-चित्र</h2>
      <div class="plates">
        <figure class="devotional-image-frame">
          ${picture(`s${nn(shloka.id)}_yantra`, `Yantra for Shloka ${shloka.id}`, 300, 250)}
          <figcaption>यंत्र</figcaption>
        </figure>
        <figure class="devotional-image-frame">
          ${picture(`s${nn(shloka.id)}_murti`, `Bhav-chitra depiction for Shloka ${shloka.id}`, 340, 470)}
          <figcaption>भाव-चित्र</figcaption>
        </figure>
      </div>
    </section>

    <section class="reflection-panel" aria-labelledby="label-reflection">
      <h2 class="section-label section-label--deva" id="label-reflection">जीवन से जुड़ाव</h2>
      <p>${esc(shloka.reflectionHindi)}</p>
    </section>
  </article>

  <nav class="footer-nav" aria-label="श्लोक नेविगेशन">
    ${prevLink}
    <a class="footer-nav__link" href="../">सभी श्लोक</a>
    ${nextLink}
  </nav>
</main>
${siteFooter('../')}`;

  return layout({
    title: `श्लोक ${num} — ${shloka.title} | ${SITE_TITLE}`,
    description: metaDescription(shloka),
    bodyClass: 'body--detail',
    prefix: '../',
    canonicalPath: `/${shloka.slug}/`,
    ogImage: `/assets/share/s${nn(shloka.id)}.jpg`,
    main,
  });
}

/* ------------------------------------------------------------ paath page */

function paathPage(data) {
  const verses = data
    .map(
      (s) => `    <article class="paath__verse" id="${s.slug}">
      <h2 class="paath__number"><a href="../${s.slug}/">${toDevanagari(s.id)}</a></h2>
      <div class="verse-sanskrit">
          ${verseLines(s.sanskrit)}
      </div>
    </article>`
    )
    .join('\n');

  const main = `<main class="page page--paath">
  <nav class="breadcrumb" aria-label="वापस">
    <a class="breadcrumb__link" href="../">← सभी श्लोक</a>
    ${textSizeControl}
  </nav>

  <header class="shloka__header">
    <h1 class="shloka__number">अखंड पाठ</h1>
    <p class="shloka__theme">सभी ४८ श्लोक, क्रम से, एक ही पन्ने पर</p>
    <span class="rule" aria-hidden="true"></span>
  </header>

  <div class="paath">
${verses}
  </div>
</main>
${siteFooter('../')}`;

  return layout({
    title: `अखंड पाठ | ${SITE_TITLE}`,
    description:
      'All 48 Sanskrit verses of the Bhaktamar Stotra in sequence on a single page, for continuous recitation.',
    bodyClass: 'body--paath',
    prefix: '../',
    canonicalPath: '/paath/',
    ogImage: '/assets/share/home.jpg',
    main,
  });
}

/* ----------------------------------------------------------- rachna page */

function rachnaPage(data, structure) {
  const byId = new Map(data.map((s) => [s.id, s]));

  const sections = structure.sections
    .map((sec) => {
      const range =
        sec.from === sec.to
          ? `श्लोक ${toDevanagari(sec.from)}`
          : `श्लोक ${toDevanagari(sec.from)}–${toDevanagari(sec.to)}`;

      if (sec.fears) {
        const fears = sec.fears
          .map((f) => {
            const first = f.ids[0];
            // "श्लोक ४२ · ४३" — the word is not repeated for a second verse.
            const links = f.ids
              .map((id, i) => `<a href="../${byId.get(id).slug}/">${i === 0 ? 'श्लोक ' : ''}${toDevanagari(id)}</a>`)
              .join(' · ');
            return `        <li class="fear">
          <figure class="fear__plate">
            <picture>
              <source srcset="../assets/images/full/s${nn(first)}_murti.webp" type="image/webp">
              <img src="../assets/images/full/s${nn(first)}_murti.png"
                   alt="Bhav-chitra depiction for Shloka ${first}"
                   width="340" height="470" loading="lazy" decoding="async">
            </picture>
          </figure>
          <div class="fear__body">
            <div class="fear__head">
              <h3 class="fear__name">${esc(f.name)}</h3>
              <p class="fear__verses">${links}</p>
            </div>
            <p class="fear__traditional">${esc(f.traditional)}</p>
            <p class="fear__scene">${esc(f.scene)}</p>
            <p class="fear__modern">
              <span class="fear__modern-label">आज के जीवन में</span>
              ${esc(f.modern)}
            </p>
          </div>
        </li>`;
          })
          .join('\n');
        return `  <section class="arc__section arc__section--fears" aria-labelledby="sec-${sec.key}">
    <p class="section-label section-label--deva">${range}</p>
    <h2 class="arc__title" id="sec-${sec.key}">${esc(sec.title)}</h2>
    <p class="arc__blurb">${esc(sec.blurb)}</p>
    <ol class="fears">
${fears}
    </ol>
  </section>`;
      }

      const chips = Array.from({ length: sec.to - sec.from + 1 }, (_, k) => sec.from + k)
        .map(
          (id) =>
            `<a class="chip" href="../${byId.get(id).slug}/" title="${esc(byId.get(id).title)}">${toDevanagari(id)}</a>`
        )
        .join('\n      ');

      return `  <section class="arc__section" aria-labelledby="sec-${sec.key}">
    <p class="section-label section-label--deva">${range}</p>
    <h2 class="arc__title" id="sec-${sec.key}">${esc(sec.title)}</h2>
    <p class="arc__blurb">${esc(sec.blurb)}</p>
    <div class="chips">
      ${chips}
    </div>
  </section>`;
    })
    .join('\n\n');

  const main = `<main class="page page--rachna">
  <nav class="breadcrumb" aria-label="वापस">
    <a class="breadcrumb__link" href="../">← सभी श्लोक</a>
  </nav>

  <header class="shloka__header">
    <h1 class="shloka__number">स्तोत्र की संरचना</h1>
    <p class="shloka__theme">४८ श्लोक एक कतार नहीं, एक संरचना हैं</p>
    <span class="rule" aria-hidden="true"></span>
  </header>

  <div class="arc">
${sections}
  </div>

  <p class="arc__note">${esc(structure.note)}</p>
</main>
${siteFooter('../')}`;

  return layout({
    title: `स्तोत्र की संरचना | ${SITE_TITLE}`,
    description:
      'The architecture of the Bhaktamar Stotra — its opening, its praise, and the eight great fears of verses 38 to 46, each with its counterpart in everyday life.',
    bodyClass: 'body--rachna',
    prefix: '../',
    canonicalPath: '/rachna/',
    ogImage: '/assets/share/rachna.jpg',
    main,
  });
}

/* ------------------------------------------------------------- abhi page */

function abhiPage(data, index) {
  const byId = new Map(data.map((s) => [s.id, s]));

  const groups = index.groups
    .map((g) => {
      const items = index.states
        .filter((s) => s.group === g.key)
        .map((s) => {
          const sh = byId.get(s.id);
          return `      <li class="state">
        <a class="state__link" href="../${sh.slug}/">
          <span class="state__text">${esc(s.state)}</span>
          <span class="state__meta">श्लोक ${toDevanagari(s.id)} · ${esc(sh.title)}</span>
        </a>
      </li>`;
        })
        .join('\n');
      return `  <section class="group" id="${g.key}" aria-labelledby="g-${g.key}">
    <h2 class="group__title" id="g-${g.key}">${esc(g.title)}</h2>
    <p class="group__blurb">${esc(g.blurb)}</p>
    <ul class="states">
${items}
    </ul>
  </section>`;
    })
    .join('\n\n');

  const main = `<main class="page page--abhi">
  <nav class="breadcrumb" aria-label="वापस">
    <a class="breadcrumb__link" href="../">← सभी श्लोक</a>
  </nav>

  <header class="shloka__header">
    <h1 class="shloka__number">अभी क्या चल रहा है</h1>
    <p class="shloka__theme">जो इस वक़्त मन में है, वहाँ से शुरू करें — अंक से नहीं</p>
    <span class="rule" aria-hidden="true"></span>
  </header>

  <div class="groups">
${groups}
  </div>
</main>
${siteFooter('../')}`;

  return layout({
    title: `अभी क्या चल रहा है | ${SITE_TITLE}`,
    description:
      'Enter the Bhaktamar Stotra through what you are actually going through — 48 verses indexed by the inner state each one speaks to.',
    bodyClass: 'body--abhi',
    prefix: '../',
    canonicalPath: '/abhi/',
    ogImage: '/assets/share/abhi.jpg',
    main,
  });
}

/* --------------------------------------------------------------- images */

async function buildImages(data) {
  await mkdir(path.join(dist, 'assets/images/thumb'), { recursive: true });
  await mkdir(path.join(dist, 'assets/images/full'), { recursive: true });

  for (const s of data) {
    for (const [key, base] of [
      [s.yantraImage, `s${nn(s.id)}_yantra`],
      [s.bhavImage, `s${nn(s.id)}_murti`],
    ]) {
      const src = path.join(contentDir, path.basename(path.dirname(key)), path.basename(key));
      if (!existsSync(src)) throw new Error(`Missing source image: ${src}`);

      // Full-size: WebP for modern browsers, re-compressed PNG as fallback.
      // No resizing or cropping — the devotional images stay as given.
      await sharp(src)
        .webp({ quality: 82, effort: 5 })
        .toFile(path.join(dist, 'assets/images/full', `${base}.webp`));
      await sharp(src)
        .png({ compressionLevel: 9, effort: 8 })
        .toFile(path.join(dist, 'assets/images/full', `${base}.png`));

      if (base.endsWith('_yantra')) {
        await sharp(src)
          .webp({ quality: 72, effort: 5 })
          .toFile(path.join(dist, 'assets/images/thumb', `${base}.webp`));
      }
    }
  }
}

/* ---------------------------------------------------------- share cards */

const SHARE_W = 1200;
const SHARE_H = 630;

/** Devanagari and Latin text rendered from the bundled TTFs (see fontconfig above). */

// Text block geometry. The yantra occupies the left; text gets the rest.
const TEXT_X = 560;
const TEXT_RIGHT_MARGIN = 60;
const TEXT_WIDTH = SHARE_W - TEXT_X - TEXT_RIGHT_MARGIN;
// Mean advance width of Noto Serif Devanagari, as a fraction of font size.
// Used to wrap without a full text-shaping pass; deliberately conservative.
const ADVANCE = 0.54;

/** Wrap on spaces and on hyphens, which is where long compound titles break. */
function wrapToWidth(text, fontSize, maxLines) {
  const maxChars = Math.floor(TEXT_WIDTH / (fontSize * ADVANCE));
  const tokens = String(text).trim().split(/\s+/).flatMap((word) =>
    word.length > maxChars ? word.split(/(?<=-)/) : [word]
  );
  const lines = [];
  let line = '';
  for (const token of tokens) {
    const candidate = line ? `${line} ${token}` : token;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = token;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines);
}

function shareSvg({ kicker, title, subtitle }) {
  // Step the title down a size when it is long, rather than letting it wrap
  // to three lines and crowd the subtitle.
  const titleSize = title.length > 34 ? 42 : title.length > 22 ? 50 : 56;
  const titleLines = wrapToWidth(title, titleSize, 3);
  const subSize = 28;
  const subLines = wrapToWidth(subtitle, subSize, 2);

  const titleTop = 250;
  const titleLead = Math.round(titleSize * 1.32);
  const subTop = titleTop + (titleLines.length - 1) * titleLead + 84;

  const tspans = (lines, lead) =>
    lines
      .map((l, i) => `<tspan x="${TEXT_X}" dy="${i === 0 ? 0 : lead}">${esc(l)}</tspan>`)
      .join('');

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${SHARE_W}" height="${SHARE_H}">
  <rect width="${SHARE_W}" height="${SHARE_H}" fill="#FBF9F4"/>
  <rect x="0" y="0" width="${SHARE_W}" height="6" fill="#B08D57"/>
  <text x="${TEXT_X}" y="180" font-family="Noto Serif Devanagari" font-size="28" fill="#7A5F2F" letter-spacing="3">${esc(kicker)}</text>
  <text x="${TEXT_X}" y="${titleTop}" font-family="Noto Serif Devanagari" font-size="${titleSize}" fill="#2E2A24">${tspans(titleLines, titleLead)}</text>
  <text x="${TEXT_X}" y="${subTop}" font-family="Noto Serif Devanagari" font-size="${subSize}" fill="#6B655A">${tspans(subLines, 40)}</text>
  <text x="${TEXT_X}" y="556" font-family="Lora" font-size="22" fill="#9A9284" letter-spacing="2">Bhaktamar Stotra</text>
</svg>`);
}

async function buildShareCards(data, index) {
  const outDir = path.join(dist, 'assets/share');
  await mkdir(outDir, { recursive: true });

  const plate = async (file, box) => {
    const buf = await sharp(file)
      .resize({ width: box.w, height: box.h, fit: 'inside' })
      .toBuffer();
    return { input: buf, left: box.left, top: box.top };
  };

  for (const s of data) {
    const entry = index.states.find((x) => x.id === s.id);
    const svg = shareSvg({
      kicker: `श्लोक ${toDevanagari(s.id)}`,
      title: s.title,
      subtitle: entry ? entry.state : '',
    });
    const yantra = await plate(path.join(contentDir, 'images', `s${nn(s.id)}_yantra.png`), {
      w: 400,
      h: 334,
      left: 80,
      top: 148,
    });
    await sharp(svg).composite([yantra]).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(outDir, `s${nn(s.id)}.jpg`));
  }

  // Cards for the three non-verse pages.
  const covers = [
    ['home.jpg', SITE_TITLE, '४८ श्लोक · अर्थ · जीवन से जुड़ाव', 's01_yantra.png'],
    ['rachna.jpg', 'स्तोत्र की संरचना', 'आठ महाभय और पूरे स्तोत्र का नक़्शा', 's38_yantra.png'],
    ['abhi.jpg', 'अभी क्या चल रहा है', 'मन की स्थिति से श्लोक तक', 's09_yantra.png'],
  ];
  for (const [file, title, subtitle, art] of covers) {
    const svg = shareSvg({ kicker: 'श्री भक्तामर स्तोत्र', title, subtitle });
    const yantra = await plate(path.join(contentDir, 'images', art), {
      w: 400,
      h: 334,
      left: 80,
      top: 148,
    });
    await sharp(svg).composite([yantra]).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(outDir, file));
  }
}

/* ------------------------------------------------------- icons & fonts */

const FONTS = [
  ['@fontsource/noto-serif-devanagari/files/noto-serif-devanagari-devanagari-400-normal.woff2', 'noto-serif-devanagari-400.woff2'],
  ['@fontsource/noto-serif-devanagari/files/noto-serif-devanagari-devanagari-500-normal.woff2', 'noto-serif-devanagari-500.woff2'],
  ['@fontsource/lora/files/lora-latin-400-normal.woff2', 'lora-400.woff2'],
  ['@fontsource/lora/files/lora-latin-400-italic.woff2', 'lora-400-italic.woff2'],
  ['@fontsource/inter/files/inter-latin-400-normal.woff2', 'inter-400.woff2'],
  ['@fontsource/inter/files/inter-latin-500-normal.woff2', 'inter-500.woff2'],
];

async function buildFonts() {
  const out = path.join(dist, 'assets/fonts');
  await mkdir(out, { recursive: true });
  for (const [from, to] of FONTS) {
    await cp(path.join(root, 'node_modules', from), path.join(out, to));
  }
}

async function buildIcons() {
  const out = path.join(dist, 'assets/icons');
  await mkdir(out, { recursive: true });
  const svg = await readFile(path.join(root, 'src/favicon.svg'));
  for (const size of [192, 512]) {
    await sharp(svg, { density: 384 })
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(path.join(out, `icon-${size}.png`));
  }
  await writeFile(
    path.join(dist, 'manifest.webmanifest'),
    JSON.stringify(
      {
        name: SITE_TITLE,
        short_name: 'भक्तामर',
        description: SITE_SUBTITLE,
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#FBF9F4',
        theme_color: '#FBF9F4',
        icons: [
          { src: 'assets/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'assets/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        ],
      },
      null,
      2
    )
  );
}

/* ------------------------------------------------------------------ seo */

async function buildSeoFiles(data) {
  if (!SITE_URL) {
    console.log('SITE_URL not set — skipping sitemap.xml and robots.txt');
    return;
  }
  const urls = ['/', '/paath/', '/rachna/', '/abhi/', ...data.map((s) => `/${s.slug}/`)]
    .map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`)
    .join('\n');
  await writeFile(
    path.join(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  );
  await writeFile(
    path.join(dist, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
  );
}

/* ----------------------------------------------------------------- main */

const dirSize = async (dir) => {
  let total = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    total += entry.isDirectory() ? await dirSize(p) : (await stat(p)).size;
  }
  return total;
};

async function build() {
  const data = JSON.parse(await readFile(path.join(contentDir, 'data.json'), 'utf8'));
  const index = JSON.parse(await readFile(path.join(contentDir, 'reflection-index.json'), 'utf8'));
  const structure = JSON.parse(await readFile(path.join(contentDir, 'structure.json'), 'utf8'));
  const padachhed = JSON.parse(await readFile(path.join(contentDir, 'padachhed.json'), 'utf8'));

  if (data.length !== 48) throw new Error(`Expected 48 shlokas, found ${data.length}`);
  if (index.states.length !== 48) throw new Error(`Expected 48 state entries, found ${index.states.length}`);
  for (const s of data) {
    if (!index.states.some((x) => x.id === s.id)) throw new Error(`No state entry for shloka ${s.id}`);
  }

  await rm(dist, { recursive: true, force: true });
  await mkdir(path.join(dist, 'assets/css'), { recursive: true });
  await mkdir(path.join(dist, 'assets/js'), { recursive: true });

  await writeFile(path.join(dist, 'index.html'), landingPage(data, index));
  for (const [i, shloka] of data.entries()) {
    const dir = path.join(dist, shloka.slug);
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, 'index.html'),
      detailPage(shloka, data[i - 1], data[i + 1], index, padachhed)
    );
  }
  for (const [slug, html] of [
    ['paath', paathPage(data)],
    ['rachna', rachnaPage(data, structure)],
    ['abhi', abhiPage(data, index)],
  ]) {
    await mkdir(path.join(dist, slug), { recursive: true });
    await writeFile(path.join(dist, slug, 'index.html'), html);
  }

  await cp(path.join(root, 'src/styles.css'), path.join(dist, 'assets/css/site.css'));
  await cp(path.join(root, 'src/site.js'), path.join(dist, 'assets/js/site.js'));
  await cp(path.join(root, 'src/sw.js'), path.join(dist, 'sw.js'));
  await cp(path.join(root, 'src/favicon.svg'), path.join(dist, 'assets/favicon.svg'));
  // Tell GitHub Pages not to run the output through Jekyll.
  await writeFile(path.join(dist, '.nojekyll'), '');

  await buildFonts();
  await buildIcons();
  await buildImages(data);
  await buildShareCards(data, index);
  await buildSeoFiles(data);

  const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;
  const glossed = Object.keys(padachhed.verses || {}).length;
  console.log(`Built landing + ${data.length} shlokas + paath + rachna + abhi = ${data.length + 4} pages`);
  console.log(
    `शब्दार्थ present for ${glossed} of ${data.length} verses` +
      (glossed < data.length
        ? ` — missing: ${data.filter((s) => !(padachhed.verses || {})[String(s.id)]).map((s) => s.id).join(', ')}`
        : '')
  );
  console.log(`dist/ total: ${mb(await dirSize(dist))}`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
