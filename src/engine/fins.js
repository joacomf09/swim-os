// @ts-check
// ALETAS: la primera parte va sin aletas; en cuanto te las ponés no te las sacás más.
// Cada serie lleva `fins: true|false` cuando la rutina usa aletas.

import { BY_ID, BLOCK_ORDER, finsMode } from '../library.js';

export const usesFins = (config) => !!(config && (config.equipment || []).includes('fins'));
const modeOf = (it) => finsMode(BY_ID[it.exId]);

/**
 * Reparte las aletas: sin aletas hasta el inicio del bloque principal (o hasta donde permita la
 * secuencia) y con aletas desde ahí hasta el final. Las series que no admiten aletas quedan antes.
 * @param {any[]} items
 * @param {any} config
 * @returns {{items:any[], start:number, warning:string|null}}
 */
export function assignFins(items0, config) {
  if (!usesFins(config)) return { items: items0.map(({ fins, ...r }) => r), start: -1, warning: null };
  const first = place(items0);
  // Las aletas empiezan tarde o no caben: probamos poniendo antes, dentro de cada bloque, las series que no las admiten.
  const moved = BLOCK_ORDER.flatMap((b) => {
    const list = items0.filter((i) => i.block === b);
    return b === 'warmup' ? list : [...list.filter((i) => modeOf(i) === 'never'), ...list.filter((i) => modeOf(i) !== 'never')];
  });
  const second = place(moved);
  if (second.start < 0) return first;
  return first.start < 0 || second.start < first.start ? second : first;
}

function place(items) {
  const n = items.length;
  const modes = items.map(modeOf);
  let lastNever = -1;
  let firstReq = n;
  modes.forEach((m, i) => { if (m === 'never') lastNever = i; if (m === 'required' && firstReq === n) firstReq = i; });
  const pref = items.findIndex((it) => it.block !== 'warmup');
  let k = Math.max(pref < 0 ? n : pref, lastNever + 1);
  let warning = null;
  if (firstReq < n) {
    if (firstReq >= lastNever + 1) k = Math.min(k, firstReq);
    else { k = lastNever + 1; warning = 'Hay un ejercicio solo con aletas antes de uno que no se hace con aletas: revisá el orden.'; }
  }
  if (k >= n) warning = warning || 'No usé aletas: los ejercicios del final no se pueden hacer con aletas.';
  return { items: items.map((it, i) => ({ ...it, fins: i >= k && k < n })), start: k < n ? k : -1, warning };
}

/** Índice de la primera serie con aletas (o -1). */
export const finsStart = (items) => items.findIndex((i) => i.fins === true);

/**
 * Tras editar: desde la primera serie con aletas, todas las demás quedan con aletas
 * (salvo las que no las admiten, que el validador marca).
 */
export function propagateFins(w) {
  if (!usesFins(w.config)) return w;
  const start = finsStart(w.items);
  const items = w.items.map((it, i) => {
    const want = start >= 0 && i >= start && modeOf(it) !== 'never';
    const forced = modeOf(it) === 'required';
    return it.fins === (want || forced) ? it : { ...it, fins: want || forced };
  });
  // las series que exigen aletas arrastran a las anteriores solo si ya estaban en la parte con aletas
  return { ...w, items };
}

/** Decide desde qué serie (índice) te ponés las aletas; -1 = no usar aletas. */
export function setFinsStart(w, index) {
  const items = w.items.map((it, i) => ({ ...it, fins: index >= 0 && i >= index && modeOf(it) !== 'never' }));
  return { ...w, items, edited: true };
}
