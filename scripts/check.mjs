// Comprobaciones estáticas: sintaxis de cada módulo, archivos referenciados por
// index.html y cobertura del service worker (para que funcione sin conexión).
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
const root = new URL('..', import.meta.url).pathname;
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
let bad = 0;
const fail = (m) => { console.error('✗ ' + m); bad++; };

for (const f of walk(join(root, 'src')).filter((p) => p.endsWith('.js'))) {
  try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); } catch (e) { fail('sintaxis: ' + relative(root, f)); }
}
const index = readFileSync(join(root, 'index.html'), 'utf8');
for (const m of index.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if (/^(https?:|data:)/.test(m[1])) fail('recurso externo en index.html: ' + m[1]);
  else if (!existsSync(join(root, m[1]))) fail('falta el archivo: ' + m[1]);
}
const sw = readFileSync(join(root, 'sw.js'), 'utf8');
const listed = new Set([...sw.matchAll(/'(\.\/[^']*)'/g)].map((m) => m[1]));
for (const d of ['src', 'fonts', 'icons', 'vendor']) for (const p of walk(join(root, d))) {
  const rel = './' + relative(root, p);
  if (!rel.endsWith('.d.ts') && !listed.has(rel)) fail('el service worker no cachea ' + rel + ' (ejecutá: npm run sw)');
}
for (const need of ['./index.html', './styles.css', './manifest.webmanifest']) if (!listed.has(need)) fail('el service worker no cachea ' + need);
if (bad) { console.error(`\n${bad} problema(s)`); process.exit(1); }
console.log('✓ sintaxis, referencias y caché sin conexión correctos');
