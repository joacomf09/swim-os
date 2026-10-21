// @ts-check
// Azar controlado: misma semilla, mismo entrenamiento.

/** Hash de 32 bits (FNV-1a) para derivar semillas de partes. */
export function hashSeed(...parts) {
  let h = 2166136261 >>> 0;
  for (const p of parts) {
    const s = String(p);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    h ^= 0x9e;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** mulberry32: generador pequeño y reproducible. Devuelve () => [0,1). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Semilla nueva para una generación (la única parte no determinista). */
export function newSeed() {
  let s;
  try {
    const a = new Uint32Array(1);
    globalThis.crypto.getRandomValues(a);
    s = a[0];
  } catch (e) {
    s = Math.floor(Math.random() * 4294967296);
  }
  return (s >>> 0) || 1;
}

/**
 * Elige un índice con probabilidad proporcional al peso.
 * @param {() => number} rng
 * @param {number[]} weights
 */
export function weightedIndex(rng, weights) {
  let total = 0;
  for (const w of weights) total += w > 0 ? w : 0;
  if (total <= 0) return Math.floor(rng() * weights.length);
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    const w = weights[i] > 0 ? weights[i] : 0;
    if (r < w) return i;
    r -= w;
  }
  return weights.length - 1;
}

export function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
export function roundTo(x, step) { return Math.round(x / step) * step; }
