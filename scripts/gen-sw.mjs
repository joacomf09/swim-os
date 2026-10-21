// Regenera sw.js con la lista real de archivos y una versión de caché nueva.
// Uso: node scripts/gen-sw.mjs [versión]   (sin argumento conserva la actual)
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
const root = new URL('..', import.meta.url).pathname;
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = ['fonts', 'icons', 'vendor', 'src'].flatMap((d) => walk(join(root, d))).map((p) => './' + relative(root, p))
  .filter((p) => !p.endsWith('.d.ts'));
const assets = [...files, './index.html', './styles.css', './manifest.webmanifest', './'].sort();
const swPath = join(root, 'sw.js');
const old = readFileSync(swPath, 'utf8');
const m = old.match(/const CACHE = 'swim-os-v(\d+)'/);
const ver = process.argv[2] || (m ? m[1] : '2');
const body = old.slice(old.indexOf('self.addEventListener'));
writeFileSync(swPath, `// SWIM OS service worker: guarda la app completa para usarla sin conexión.
// Generado por scripts/gen-sw.mjs. Al publicar cambios, subí la versión para que los móviles se actualicen.
const CACHE = 'swim-os-v${ver}';
const ASSETS = [
${assets.map((a) => `  '${a}',`).join('\n')}
];
${body}`);
console.log(`sw.js: cache v${ver}, ${assets.length} archivos`);
