// @ts-check
// ESTIMACIÓN DE DURACIÓN. Con historial medido usa tu ritmo real; sin él, una
// estimación orientativa por nivel (siempre etiquetada como tal).

import { BY_ID } from '../library.js';

const BASE_100 = { beginner: 135, intermediate: 105, advanced: 85 }; // s/100 m a esfuerzo 5
const CAT_MULT = { legs: 1.45, technique: 1.25, arms: 0.95, speed: 1, endurance: 1, styles: 1 };

/** Ritmo medido (s/100 m) a partir del historial, o null. */
export function measuredPace(history) {
  const rows = (history || []).filter((h) => h && h.activeSeconds > 0 && h.meters > 0).slice(0, 10);
  const m = rows.reduce((a, h) => a + h.meters, 0);
  if (m < 400) return null;
  return (rows.reduce((a, h) => a + h.activeSeconds, 0) / m) * 100;
}

const paceFor = (base, rpe, cat) => base * (1.25 - 0.05 * rpe) * (CAT_MULT[cat] || 1);

/**
 * @param {any[]} items
 * @param {{level?: string, history?: any[]}} [o]
 * @returns {{seconds:number, swim:number, rest:number, minutes:number, source:'history'|'orientative'}}
 */
export function estimateItems(items, o = {}) {
  const measured = measuredPace(o.history);
  const base = measured || BASE_100[o.level || 'intermediate'] || 105;
  let swim = 0;
  let rest = 0;
  items.forEach((it, i) => {
    const ex = BY_ID[it.exId];
    const p = paceFor(base, it.rpe, ex ? ex.category : 'styles');
    swim += (it.reps * it.dist * p) / 100;
    rest += (it.reps - (i === items.length - 1 ? 1 : 0)) * it.rest;
  });
  const seconds = Math.round(swim + rest);
  return { seconds, swim: Math.round(swim), rest: Math.round(rest), minutes: Math.round(seconds / 60), source: measured ? 'history' : 'orientative' };
}

/** Estimación rápida solo con la distancia total (paso 1 del configurador). */
export function estimateFromTotal(total, o = {}) {
  const measured = measuredPace(o.history);
  const base = measured || BASE_100[o.level || 'intermediate'] || 105;
  const seconds = Math.round((total * base) / 100 * 1.22);
  return { seconds, minutes: Math.round(seconds / 60), source: measured ? 'history' : 'orientative' };
}

export const fmtClock = (s) => {
  s = Math.max(0, Math.round(s));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}` : `${m}:${String(ss).padStart(2, '0')}`;
};
