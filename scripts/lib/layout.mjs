// The parts every page shares. One copy, so they cannot drift apart again.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const CRLF = String.fromCharCode(13, 10);
const LF = String.fromCharCode(10);
const root = join(import.meta.dirname, '..', '..');
const read = (p) => readFileSync(join(root, 'src', 'partials', p), 'utf8')
  .split(CRLF).join(LF);

const LOGO = read('logo.svg').trim();
const STYLES = read('styles.css').replace(/\n$/, '');
const STYLES_HOME = read('styles.home.css').replace(/\n$/, '');

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const FOOTER_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/', label: 'All calculators' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/contact', label: 'Contact' },
];

export function nav(page) {
  const wordmark = `<span class="font-bold text-brand tracking-tight" style="font-size:16px;line-height:1">tipright<span class="text-brand-dark">.app</span></span>`;
  // on the page it points at, the logo is not a link
  const logo = page.route === '/'
    ? `<span class="flex items-center gap-2">\n      ${LOGO}\n      ${wordmark}\n    </span>`
    : `<a href="/" class="flex items-center gap-2" style="text-decoration:none">\n      ${LOGO}\n      ${wordmark}\n    </a>`;
  const r = page.navRight;
  return `<nav class="bg-white border-b border-gray-200 sticky top-0 z-10">
  <div class="max-w-[672px] mx-auto px-4 py-3 flex items-center justify-between">
    ${logo}
    <a href="${r.href}" class="text-sm text-gray-500 hover:text-brand-dark transition-colors">${r.label}</a>
  </div>
</nav>`;
}

export function footer(page) {
  const links = FOOTER_LINKS.filter((l) => l.href !== page.route)
    .map((l) => `<a href="${l.href}" class="hover:text-brand-dark transition-colors">${l.label}</a>`)
    .join('\n     &middot;\n    ');
  return `<footer class="${page.footerClass}">
  <p>&copy; 2026 tipright.app &mdash; Free tip calculators for every service</p>
  <p class="mt-1">
    ${links}
  </p>
</footer>`;
}

const CHEVRON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9l-7 7-7-7"></path></svg>';

// Rendered at build time. It used to be assembled by JavaScript in the browser,
// which meant the answers were not in the HTML the crawler was handed while the
// FAQPage schema below claimed they were.
export function faq(items) {
  return items.map((it) => `<div class="border border-line rounded-xl overflow-hidden"><details class="group"><summary class="flex items-center justify-between px-5 py-4 cursor-pointer list-none hover:bg-gray-50 transition-colors gap-4 min-h-[56px]"><span class="font-semibold text-gray-800 text-[15px] leading-snug">${esc(it.q)}</span><div class="faq-chevron flex-shrink-0 transition-transform duration-200 group-open:rotate-180" style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;">${CHEVRON}</div></summary><div class="px-5 pb-4 pt-1 text-gray-600 text-[14px] leading-relaxed"><div>${esc(it.a)}</div></div></details></div>`).join('');
}

// Built from the same array the page renders, so the two cannot disagree.
export function faqSchema(items) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };
}

export function head(page, cssHref) {
  const noindex = page.robots === 'noindex';
  const og = {
    title: page.ogTitle || page.title,
    description: page.ogDescription || page.description,
    image: page.ogImage || 'https://tipright.app/assets/img/og-default.png',
    url: page.canonical,
  };
  const tw = {
    title: page.twitterTitle || og.title,
    description: page.twitterDescription || og.description,
    image: page.twitterImage || og.image,
  };
  const graph = [...(page.jsonld || [])];
  if (page.faq && page.faq.length) {
    const withGraph = graph.find((g) => Array.isArray(g['@graph']));
    if (withGraph) withGraph['@graph'].push(faqSchema(page.faq));
    else graph.push({ '@context': 'https://schema.org', ...faqSchema(page.faq) });
  }
  const ld = graph.map((g) => `  <script type="application/ld+json">\n  ${JSON.stringify(g, null, 2).split('\n').join('\n  ')}\n  </script>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-F3BH93XBSW"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-F3BH93XBSW');
</script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow'}">

  <title>${esc(page.title)}</title>
  <meta name="description" content="${esc(page.description)}">
${noindex ? '' : `  <link rel="canonical" href="${esc(page.canonical)}">

  <meta property="og:type" content="website">
  <meta property="og:url" content="${esc(og.url)}">
  <meta property="og:title" content="${esc(og.title)}">
  <meta property="og:description" content="${esc(og.description)}">
  <meta property="og:image" content="${esc(og.image)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(tw.title)}">
  <meta name="twitter:description" content="${esc(tw.description)}">
  <meta name="twitter:image" content="${esc(tw.image)}">
`}
  <link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/assets/img/favicon.ico" sizes="32x32">
  <link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#1D9E75">

  <style>
${STYLES}${page.route === '/' ? '\n' + STYLES_HOME : ''}
  </style>

  <link rel="stylesheet" href="${cssHref}">

${ld}
</head>`;
}
