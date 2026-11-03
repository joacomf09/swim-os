// @ts-check
// Lógica pura de actualización: comparar versiones y decidir si hay una nueva.

/** @param {string} v */
const parts = (v) => String(v || '0').split('.').map((n) => parseInt(n, 10) || 0);

/** true si `a` es una versión posterior a `b` (compara 2.10 > 2.9). */
export function isNewer(a, b) {
  const x = parts(a), y = parts(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] || 0) - (y[i] || 0);
    if (d) return d > 0;
  }
  return false;
}

/** Valida el contenido de version.json y devuelve la versión publicada o null. */
export function parseRemote(json) {
  return json && typeof json.version === 'string' && /^\d+(\.\d+){0,2}$/.test(json.version) ? json.version : null;
}
