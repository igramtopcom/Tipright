// Builds the one stylesheet the site used to compile in the visitor's browser.
// Output is content-hashed so /assets/css/* can be cached immutably.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, unlinkSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'dist', 'assets', 'css');
const tmp = join(root, '.cache', 'app.css');

mkdirSync(dirname(tmp), { recursive: true });
mkdirSync(outDir, { recursive: true });

execFileSync(process.execPath, [
  join(root, 'node_modules', 'tailwindcss', 'lib', 'cli.js'),
  '-c', join(root, 'tailwind.config.js'),
  '-i', join(root, 'src', 'tailwind.css'),
  '-o', tmp,
  '--minify',
], { stdio: 'inherit', cwd: root });

const css = readFileSync(tmp);
const hash = createHash('sha256').update(css).digest('hex').slice(0, 10);
const name = `app.${hash}.css`;

for (const f of readdirSync(outDir)) {
  if (/^app\.[0-9a-f]{10}\.css$/.test(f) && f !== name) unlinkSync(join(outDir, f));
}
writeFileSync(join(outDir, name), css);
rmSync(join(root, '.cache'), { recursive: true, force: true });

// Point every page at the new filename.
const pages = [];
const walk = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) pages.push(p);
  }
};
walk(join(root, 'dist'));

const linkRe = /<link rel="stylesheet" href="\/assets\/css\/app\.[0-9a-f]{10}\.css">/;
let patched = 0;
for (const p of pages) {
  const src = readFileSync(p, 'utf8');
  if (!linkRe.test(src)) continue;
  const next = src.replace(linkRe, `<link rel="stylesheet" href="/assets/css/${name}">`);
  if (next !== src) { writeFileSync(p, next); patched++; }
}

console.log(`\n${name}  ${(css.length / 1024).toFixed(1)} KB  (${patched} page(s) repointed)`);
