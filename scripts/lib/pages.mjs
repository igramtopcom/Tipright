// Assembles dist/*.html from src/pages/*.html (front-matter + verbatim body)
// plus the shared shell in src/partials.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { head, nav, footer, faq } from './layout.mjs';

export function buildPages(root, dist, calculatorHref, cssHref) {
  const src = join(root, 'src', 'pages');
  const files = [];
  (function walk(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p); else if (e.name.endsWith('.html')) files.push(p);
    }
  })(src);

  const written = [];
  for (const f of files) {
    const raw = readFileSync(f, 'utf8');
    const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!m) throw new Error('missing front-matter: ' + relative(root, f));
    const page = JSON.parse(m[1]);
    let body = m[2];

    body = body.replace('<!--@nav-->', () => nav(page));
    body = body.replace('<!--@footer-->', () => footer(page));
    body = body.replace('<!--@calculator-->', () => `<script src="${calculatorHref}"></script>`);
    if (page.faq && page.faq.length) body = body.replace('<!--@faq-->', () => faq(page.faq));
    for (const marker of ['<!--@nav-->', '<!--@footer-->', '<!--@calculator-->', '<!--@faq-->']) {
      if (body.includes(marker)) throw new Error(`${page.route}: ${marker} left unfilled`);
    }

    const html = head(page, cssHref) + `\n<body class="${page.bodyClass}">\n` + body.trim() + '\n</body>\n</html>\n';
    const out = page.route === '/'
      ? join(dist, 'index.html')
      : join(dist, ...page.route.slice(1).split('/'), 'index.html');
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, html);
    written.push({ route: page.route, bytes: html.length, faq: page.faq ? page.faq.length : 0 });
  }
  return written;
}
