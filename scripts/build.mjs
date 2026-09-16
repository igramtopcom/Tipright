// Builds the two assets the pages load, each under a content-hashed filename so
// /assets/css/* and /assets/js/* can be cached immutably, and repoints every
// page at the new names.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, unlinkSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const tmp = join(root, '.cache', 'app.css');

mkdirSync(dirname(tmp), { recursive: true });

execFileSync(process.execPath, [
  join(root, 'node_modules', 'tailwindcss', 'lib', 'cli.js'),
  '-c', join(root, 'tailwind.config.js'),
  '-i', join(root, 'src', 'tailwind.css'),
  '-o', tmp,
  '--minify',
], { stdio: 'inherit', cwd: root });

const assets = [
  { src: tmp,                                dir: 'assets/css', base: 'app',        ext: 'css' },
  { src: join(root, 'src', 'calculator.js'), dir: 'assets/js',  base: 'calculator', ext: 'js'  },
];

const emitted = [];
for (const a of assets) {
  const body = readFileSync(a.src);
  const hash = createHash('sha256').update(body).digest('hex').slice(0, 10);
  const name = `${a.base}.${hash}.${a.ext}`;
  const outDir = join(dist, a.dir);
  mkdirSync(outDir, { recursive: true });
  // drop every earlier build of this asset, hashed or not
  const stale = new RegExp(`^${a.base}(\.[0-9a-f]{10})?\.${a.ext}$`);
  for (const f of readdirSync(outDir)) {
    if (stale.test(f) && f !== name) unlinkSync(join(outDir, f));
  }
  writeFileSync(join(outDir, name), body);
  emitted.push({ ...a, name, bytes: body.length,
    ref: new RegExp(`/${a.dir}/${a.base}(?:\.[0-9a-f]{10})?\.${a.ext}`, 'g') });
}
rmSync(join(root, '.cache'), { recursive: true, force: true });

const pages = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) pages.push(p);
  }
})(dist);

const patched = new Map(emitted.map((a) => [a.name, 0]));
for (const p of pages) {
  const before = readFileSync(p, 'utf8');
  let after = before;
  for (const a of emitted) {
    const next = after.replace(a.ref, `/${a.dir}/${a.name}`);
    if (next !== after) patched.set(a.name, patched.get(a.name) + 1);
    after = next;
  }
  if (after !== before) writeFileSync(p, after);
}

console.log('');
for (const a of emitted) {
  console.log(`${a.name.padEnd(28)} ${(a.bytes / 1024).toFixed(1).padStart(6)} KB   ${patched.get(a.name)} page(s)`);
}
