// sitemap.xml, generated. The hand-kept one had changefreq and priority, which
// Google ignores, and no lastmod, which is the one field it reads.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const today = () => new Date().toISOString().slice(0, 10);

// when this page's own source last changed: the last commit that touched it,
// or today if it has changes that are not committed yet
function lastmod(root, file) {
  const rel = relative(root, file).split(sep).join('/');
  const git = (args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  try {
    if (git(['status', '--porcelain', '--', rel])) return today();
    return git(['log', '-1', '--format=%cs', '--', rel]) || today();
  } catch { return today(); }
}

const rank = (route) => route === '/' ? 0 : route.startsWith('/tip/') ? 1 : route.startsWith('/guide/') ? 2 : 3;

export function writeSitemap(root, dist, pages) {
  const urls = pages
    .filter((p) => p.robots !== 'noindex')
    .sort((a, b) => rank(a.route) - rank(b.route) || a.route.localeCompare(b.route))
    .map((p) => `  <url><loc>https://tipright.app${p.route === '/' ? '/' : p.route}</loc><lastmod>${lastmod(root, p.source)}</lastmod></url>`);
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.join('\n') + '\n</urlset>\n';
  writeFileSync(join(dist, 'sitemap.xml'), xml);
  return urls.length;
}
