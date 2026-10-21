// @ts-check
// EDICIÓN MANUAL: funciones puras que devuelven una rutina nueva. La distancia
// planificada siempre se recalcula a partir de las series.

import { BLOCK_ORDER, BY_ID, variantsOf, itemName } from '../library.js';
import { plannedMeters, meters, validateWorkout } from './validator.js';
import { allowedDistances } from './candidates.js';
import { hashSeed } from './rng.js';

let counter = 0;
const uid = () => `m${Date.now().toString(36)}${(counter++).toString(36)}`;
const touch = (w, items) => ({ ...w, items, edited: true });
const inBlockOrder = (items) => BLOCK_ORDER.flatMap((b) => items.filter((i) => i.block === b));

/** Estado de la distancia: planificada vs objetivo. */
export function distanceStatus(w) {
  const planned = plannedMeters(w.items);
  return { planned, target: w.target, diff: planned - w.target, ok: planned === w.target };
}

export function updateItem(w, id, patch) {
  const items = w.items.map((it) => {
    if (it.id !== id) return it;
    const next = { ...it, ...patch };
    for (const k of ['reps', 'dist']) next[k] = Math.max(1, Math.round(Number(next[k]) || 1));
    next.rest = Math.max(0, Math.round(Number(next.rest) || 0));
    next.rpe = Math.min(10, Math.max(1, Math.round(Number(next.rpe) || it.rpe)));
    return next;
  });
  return touch(w, items);
}

/** Cambia el ejercicio de una serie conservando los metros siempre que sea posible. */
export function swapExercise(w, id, exId, variantId) {
  const ex = BY_ID[exId];
  if (!ex) return w;
  const vs = variantsOf(ex);
  const v = vs.find((x) => x.id === variantId) || vs[0];
  const items = w.items.map((it) => {
    if (it.id !== id) return it;
    const unit = w.pool * (ex.unitMult || 1);
    const m = meters(it);
    let { reps, dist } = it;
    if (dist % unit !== 0) {
      dist = Math.max(unit, Math.round(dist / unit) * unit);
      reps = Math.max(1, Math.round(m / dist));
    }
    const missing = ex.equipmentRequired.filter((e) => !(w.config.equipment || []).includes(e));
    const noGear = !!(missing.length && ex.noGearVariant);
    return {
      ...it, exId, variantId: v.id, name: itemName(ex, v.id === 'base' ? null : v, noGear),
      reps, dist, rpe: Math.min(Math.max(it.rpe, v.rpe[0]), v.rpe[1]),
      rest: it.rest, note: v.note || '', manual: true, ...(noGear ? { noGear: true } : { noGear: undefined }),
    };
  });
  return touch(w, items);
}

export function removeItem(w, id) {
  return touch(w, w.items.filter((i) => i.id !== id));
}

/** Sube/baja una serie dentro de su bloque. */
export function moveItem(w, id, dir) {
  const items = [...w.items];
  const i = items.findIndex((x) => x.id === id);
  if (i < 0) return w;
  const j = i + dir;
  if (j < 0 || j >= items.length || items[j].block !== items[i].block) return w;
  [items[i], items[j]] = [items[j], items[i]];
  return touch(w, items);
}

export function moveToBlock(w, id, block) {
  const it = w.items.find((x) => x.id === id);
  if (!it || it.block === block) return w;
  return touch(w, inBlockOrder(w.items.map((x) => (x.id === id ? { ...x, block } : x))));
}

/** Agrega una serie al final de un bloque con valores razonables. */
export function addItem(w, block, exId, variantId) {
  const ex = BY_ID[exId];
  if (!ex) return w;
  const vs = variantsOf(ex);
  const v = vs.find((x) => x.id === variantId) || vs[0];
  const ds = allowedDistances(ex, v, w.pool);
  const dist = ds[0] || w.pool * (ex.unitMult || 1);
  const missing = ex.equipmentRequired.filter((e) => !(w.config.equipment || []).includes(e));
  const noGear = !!(missing.length && ex.noGearVariant);
  const item = {
    id: uid(), block, exId, variantId: v.id, name: itemName(ex, v.id === 'base' ? null : v, noGear),
    reps: v.reps[0], dist, rest: Math.round((v.rest[0] + v.rest[1]) / 2 / 5) * 5,
    rpe: Math.round((v.rpe[0] + v.rpe[1]) / 2), note: v.note || '', manual: true, ...(noGear ? { noGear: true } : {}),
  };
  return touch(w, inBlockOrder([...w.items, item]));
}

/** Cambia el objetivo para que coincida con lo planificado (decisión del usuario). */
export function acceptPlanned(w) {
  const planned = plannedMeters(w.items);
  return { ...w, target: planned, edited: true };
}

/**
 * Redistribuye para llegar al objetivo cambiando UNA serie (y, si hace falta,
 * agregando una). Devuelve null si no hay forma exacta.
 */
export function fitToTarget(w) {
  const diff = w.target - plannedMeters(w.items);
  if (diff === 0) return w;
  const order = [...w.items].reverse().sort((a, b) => BLOCK_ORDER.indexOf(b.block) - BLOCK_ORDER.indexOf(a.block));
  for (const it of order) {
    const ex = BY_ID[it.exId];
    const unit = w.pool * ((ex && ex.unitMult) || 1);
    const m = meters(it) + diff;
    if (m < unit) continue;
    let best = null;
    for (let reps = 1; reps <= 16; reps++) {
      if (m % reps) continue;
      const dist = m / reps;
      if (dist % unit) continue;
      const cost = Math.abs(reps - it.reps) * 2 + Math.abs(dist - it.dist) / unit;
      if (!best || cost < best.cost) best = { reps, dist, cost };
    }
    if (best) return touch(w, w.items.map((x) => (x.id === it.id ? { ...x, reps: best.reps, dist: best.dist } : x)));
  }
  if (diff > 0 && diff % w.pool === 0) {
    const ex = BY_ID['style-free'];
    const e = addItem({ ...w, config: { ...w.config, equipment: w.config.equipment || [] } }, 'endurance', ex.id, 'easy');
    const added = e.items.find((i) => !w.items.some((o) => o.id === i.id));
    if (added) {
      const reps = 1;
      const dist = diff;
      return touch(w, inBlockOrder([...w.items, { ...added, reps, dist, rpe: 4 }]));
    }
  }
  return null;
}

/** ¿Se puede empezar sin problemas? */
export function startCheck(w) {
  const v = validateWorkout(w, { config: w.config });
  return { ok: v.ok, errors: v.errors, warnings: v.warnings, ...distanceStatus(w) };
}

export { hashSeed };
