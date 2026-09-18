/**
 * Static site generator for the Bhaktamar Stotra portal.
 *
 * Reads content/data.json + content/images/, writes a plain static site to
 * dist/. Every URL emitted is relative, so the same dist/ works when served
 * from a domain root (Vercel) or from a repository sub-path (GitHub Pages).
 */
import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const contentDir = path.join(root, 'content');

const SITE_TITLE = 'श्री भक्तामर स्तोत्र';
const SITE_SUBTITLE = 'Bhaktamar Stotra — 48 Verses for Reflection';

const DEV_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
const toDevanagari = (n) => String(n).split('').map((d) => DEV_DIGITS[Number(d)]).join('');

const esc = (s) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

/** Each `\n`-separated line of a verse becomes its own line, per spec §2. */
const verseLines = (text) =>
  String(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<span class="verse__line">${esc(line)}</span>`)
    .join('\n          ');

const metaDescription = (shloka) => {
  const source = shloka.englishMeaning.replace(/\s+/g, ' ').trim();
  const clipped = source.length > 155 ? `${source.slice(0, 152).trimEnd()}…` : source;
  return `Shloka ${shloka.id} of the Bhaktamar Stotra — ${clipped}`;
};

/* ---------------------------------------------------------------- layout */

function layout({ title, description, bodyClass, prefix, main }) {
  return `<!doctype html>
<html lang="hi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta name="theme-color" content="#FBF9F5">
<link rel="icon" href="${prefix}assets/favicon.svg" type="image/svg+xml">
<link rel="preload" as="font" type="font/woff2" href="${prefix}assets/fonts/noto-serif-devanagari-400.woff2" crossorigin>
<link rel="stylesheet" href="${prefix}assets/css/site.css">
</head>
<body class="${bodyClass}">
${main}
<script src="${prefix}assets/js/site.js" defer></script>
</body>
</html>
`;
}

/* --------------------------------------------------------- landing page */

function landingPage(data) {
  const cards = data
    .map((s, i) => {
      const num = toDevanagari(s.id);
      return `      <li class="grid__item" style="--i:${i}">
        <a class="card" href="${s.slug}/" data-card aria-label="श्लोक ${num} — ${esc(s.title)}">
          <span class="card__inner">
            <span class="card__face card__face--front">
              <span class="card__number">${num}</span>
              <span class="card__title">${esc(s.title)}</span>
            </span>
            <span class="card__face card__face--back">
              <img class="card__yantra" src="assets/images/thumb/s${String(s.id).padStart(2, '0')}_yantra.webp"
                   alt="" width="300" height="250" loading="lazy" decoding="async">
              <span class="card__title card__title--back">${esc(s.title)}</span>
            </span>
          </span>
        </a>
      </li>`;
    })
    .join('\n');

  const main = `<header class="site-header">
  <h1 class="site-header__title">${SITE_TITLE}</h1>
  <p class="site-header__subtitle">${SITE_SUBTITLE}</p>
  <span class="rule" aria-hidden="true"></span>
</header>
<main class="page page--landing">
  <nav aria-label="सभी श्लोक">
    <ul class="grid">
${cards}
    </ul>
  </nav>
</main>
<footer class="site-footer">
  <p>${SITE_TITLE} · ४८ श्लोक</p>
</footer>`;

  return layout({
    title: SITE_TITLE,
    description:
      'All 48 shlokas of the Shri Bhaktamar Stotra — Sanskrit verse, Hindi doha, meanings in Hindi and English, yantra and bhav-chitra, and a reflection for everyday life.',
    bodyClass: 'body--landing',
    prefix: '',
    main,
  });
}

/* ---------------------------------------------------------- detail page */

function detailPage(shloka, prev, next) {
  const nn = String(shloka.id).padStart(2, '0');
  const num = toDevanagari(shloka.id);

  const picture = (base, alt, w, h, cls) => `<picture>
              <source srcset="../assets/images/full/${base}.webp" type="image/webp">
              <img class="${cls}" src="../assets/images/full/${base}.png" alt="${esc(alt)}"
                   width="${w}" height="${h}" loading="lazy" decoding="async">
            </picture>`;

  const prevLink = prev
    ? `<a class="pager__link pager__link--prev" href="../${prev.slug}/" rel="prev">← पिछला श्लोक</a>`
    : `<span class="pager__link pager__link--prev is-disabled" aria-disabled="true">← पिछला श्लोक</span>`;
  const nextLink = next
    ? `<a class="pager__link pager__link--next" href="../${next.slug}/" rel="next">अगला श्लोक →</a>`
    : `<span class="pager__link pager__link--next is-disabled" aria-disabled="true">अगला श्लोक →</span>`;

  const main = `<main class="page page--detail">
  <nav class="breadcrumb" aria-label="वापस">
    <a class="breadcrumb__link" href="../">← सभी श्लोक</a>
  </nav>

  <article class="shloka">
    <header class="shloka__header">
      <h1 class="shloka__number">श्लोक ${num}</h1>
      <p class="shloka__theme">${esc(shloka.title)}</p>
      <span class="rule" aria-hidden="true"></span>
    </header>

    <section class="block block--verse" aria-labelledby="label-sanskrit">
      <h2 class="label" id="label-sanskrit">संस्कृत मूल</h2>
      <p class="verse verse--sanskrit">
          ${verseLines(shloka.sanskrit)}
      </p>
    </section>

    <section class="block block--verse" aria-labelledby="label-doha">
      <h2 class="label" id="label-doha">हिंदी दोहा</h2>
      <p class="verse verse--doha">
          ${verseLines(shloka.hindiDoha)}
      </p>
    </section>

    <section class="block" aria-labelledby="label-hindi-meaning">
      <h2 class="label" id="label-hindi-meaning">हिंदी अर्थ</h2>
      <p class="prose">${esc(shloka.hindiMeaning)}</p>
    </section>

    <section class="block" aria-labelledby="label-english-meaning">
      <h2 class="label" id="label-english-meaning">Simple English Meaning</h2>
      <p class="prose prose--translation">${esc(shloka.englishMeaning)}</p>
    </section>

    <section class="block block--images" aria-labelledby="label-images">
      <h2 class="label" id="label-images">यंत्र एवं भाव-चित्र</h2>
      <div class="plates">
        <figure class="plate">
          <div class="plate__frame">
            ${picture(`s${nn}_yantra`, `Yantra for Shloka ${shloka.id}`, 300, 250, 'plate__img')}
          </div>
          <figcaption class="plate__caption">यंत्र</figcaption>
        </figure>
        <figure class="plate">
          <div class="plate__frame">
            ${picture(`s${nn}_murti`, `Bhav-chitra depiction for Shloka ${shloka.id}`, 340, 470, 'plate__img')}
          </div>
          <figcaption class="plate__caption">भाव-चित्र</figcaption>
        </figure>
      </div>
    </section>

    <section class="reflection" aria-labelledby="label-reflection">
      <h2 class="label label--reflection" id="label-reflection">जीवन से जुड़ाव</h2>
      <p class="reflection__text">${esc(shloka.reflectionHindi)}</p>
    </section>
  </article>

  <nav class="pager" aria-label="श्लोक नेविगेशन">
    ${prevLink}
    <a class="pager__link pager__link--all" href="../">सभी श्लोक</a>
    ${nextLink}
  </nav>
</main>
<footer class="site-footer">
  <p><a class="site-footer__link" href="../">${SITE_TITLE}</a></p>
</footer>`;

  return layout({
    title: `श्लोक ${num} — ${shloka.title} | ${SITE_TITLE}`,
    description: metaDescription(shloka),
    bodyClass: 'body--detail',
    prefix: '../',
    main,
  });
}

/* --------------------------------------------------------------- images */

async function buildImages(data) {
  await mkdir(path.join(dist, 'assets/images/thumb'), { recursive: true });
  await mkdir(path.join(dist, 'assets/images/full'), { recursive: true });

  let bytes = 0;
  for (const s of data) {
    const nn = String(s.id).padStart(2, '0');
    for (const [key, base] of [
      [s.yantraImage, `s${nn}_yantra`],
      [s.bhavImage, `s${nn}_murti`],
    ]) {
      const src = path.join(contentDir, path.basename(path.dirname(key)), path.basename(key));
      if (!existsSync(src)) throw new Error(`Missing source image: ${src}`);

      // Full-size: WebP for modern browsers, re-compressed PNG as fallback.
      // No resizing or cropping — the devotional images stay visually as given.
      const webp = path.join(dist, 'assets/images/full', `${base}.webp`);
      const png = path.join(dist, 'assets/images/full', `${base}.png`);
      await sharp(src).webp({ quality: 82, effort: 5 }).toFile(webp);
      await sharp(src).png({ compressionLevel: 9, effort: 8 }).toFile(png);
      bytes += (await sharp(webp).metadata()).size ?? 0;

      if (base.endsWith('_yantra')) {
        const thumb = path.join(dist, 'assets/images/thumb', `${base}.webp`);
        await sharp(src).webp({ quality: 72, effort: 5 }).toFile(thumb);
      }
    }
  }
  return bytes;
}

/* ---------------------------------------------------------------- fonts */

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

/* ----------------------------------------------------------------- main */

const dirSize = async (dir) => {
  const { readdir, stat } = await import('node:fs/promises');
  let total = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    total += entry.isDirectory() ? await dirSize(p) : (await stat(p)).size;
  }
  return total;
};

async function build() {
  const data = JSON.parse(await readFile(path.join(contentDir, 'data.json'), 'utf8'));
  if (data.length !== 48) throw new Error(`Expected 48 shlokas, found ${data.length}`);

  await rm(dist, { recursive: true, force: true });
  await mkdir(path.join(dist, 'assets/css'), { recursive: true });
  await mkdir(path.join(dist, 'assets/js'), { recursive: true });

  await writeFile(path.join(dist, 'index.html'), landingPage(data));
  for (const [i, shloka] of data.entries()) {
    const dir = path.join(dist, shloka.slug);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'index.html'), detailPage(shloka, data[i - 1], data[i + 1]));
  }

  await cp(path.join(root, 'src/styles.css'), path.join(dist, 'assets/css/site.css'));
  await cp(path.join(root, 'src/site.js'), path.join(dist, 'assets/js/site.js'));
  await cp(path.join(root, 'src/favicon.svg'), path.join(dist, 'assets/favicon.svg'));
  // Tell GitHub Pages not to run the output through Jekyll.
  await writeFile(path.join(dist, '.nojekyll'), '');

  await buildFonts();
  await buildImages(data);

  const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;
  console.log(`Built 1 landing page + ${data.length} detail pages`);
  console.log(`dist/ total: ${mb(await dirSize(dist))}`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
