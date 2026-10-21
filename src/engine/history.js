// @ts-check
// HISTORIAL, FAVORITOS Y PREFERENCIAS. Persistencia con almacenamiento
// inyectable (localStorage en el navegador, un objeto en memoria en los tests).

import { BY_ID, STROKES, BLOCK_ORDER } from '../library.js';
import { normalizeConfig, defaultConfig } from './config.js';

export const KEYS = {
  workout: 'swimos.workout', history: 'swimos.history', prefs: 'swimos.prefs',
  favorites: 'swimos.favorites', session: 'swimos.session', draft: 'swimos.draft',
};

export function memoryBackend() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => void m.set(k, String(v)), removeItem: (k) => void m.delete(k) };
}

export function createStore(backend) {
  const b = backend || (typeof localStorage !== 'undefined' ? localStorage : memoryBackend());
  return {
    get(key, fallback) {
      try { const v = b.getItem(key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    set(key, value) { try { b.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; } },
    remove(key) { try { b.removeItem(key); } catch (e) { /* sin acceso */ } },
  };
}

/* ───────── preferencias ───────── */
export function defaultPrefs() {
  const c = defaultConfig();
  return { level: c.level, pool: c.pool, equipment: c.equipment, allowNoGear: c.allowNoGear, intensity: c.intensity, restMode: c.restMode, restCustom: c.restCustom, goal: c.goal, excluded: [], lastConfig: null };
}
export function loadPrefs(store) {
  const p = store.get(KEYS.prefs, null);
  return p && typeof p === 'object' ? { ...defaultPrefs(), ...p } : defaultPrefs();
}
/** Configuración inicial del configurador a partir de las preferencias. */
export function configFromPrefs(prefs) {
  const base = prefs.lastConfig ? { ...prefs.lastConfig } : {};
  return normalizeConfig({
    ...base, level: prefs.level, pool: prefs.pool, equipment: prefs.equipment, allowNoGear: prefs.allowNoGear,
    intensity: prefs.intensity, restMode: prefs.restMode, restCustom: prefs.restCustom, goal: prefs.goal, excluded: prefs.excluded,
  });
}

/* ───────── historial ───────── */
/** Convierte una sesión terminada en una entrada de historial. */
export function makeEntry(session, summary) {
  const w = session.workout;
  const log = session.log.filter((l) => !l.skipped && l.swimMs > 0).map((l) => {
    const st = session.steps[l.idx];
    return { exId: st.exId, block: st.block, dist: st.dist, swimMs: l.swimMs };
  });
  return {
    v: 2, id: session.id, date: session.startedAt || session.createdAt, source: 'measured',
    name: w.name, workoutId: w.id, seed: w.seed, goal: w.config ? w.config.goal : null, intensity: w.config ? w.config.intensity : null,
    pool: w.pool, level: w.config ? w.config.level : null,
    meters: summary.meters, plannedMeters: summary.plannedMeters, reps: summary.reps, plannedReps: summary.plannedReps,
    activeSeconds: summary.activeSeconds, restSeconds: summary.restSeconds, totalSeconds: summary.totalSeconds,
    pace100: summary.pace100, compliance: summary.compliance, completed: summary.completed,
    log, workout: { config: w.config, items: w.items, target: w.target, pool: w.pool, blockTargets: w.blockTargets, seed: w.seed, name: w.name },
  };
}

/** Acepta entradas del formato 1.x (milisegundos) y del 2.0. */
export function migrateEntry(h) {
  if (!h || typeof h !== 'object' || h.id == null) return null;
  if (h.v === 2) return h;
  if (typeof h.meters !== 'number') return null;
  const pace = h.pace ? Math.round((h.pace / 1000) * 10) / 10 : null;
  return {
    v: 2, id: String(h.id), date: Number(h.date) || Number(h.id) || 0, source: 'measured', legacy: true,
    name: 'Rutina 1.500 m', workoutId: null, seed: null, goal: null, intensity: null, pool: h.pool === 50 ? 50 : 25, level: null,
    meters: h.meters, plannedMeters: h.compliance ? Math.round(h.meters / (h.compliance / 100)) : h.meters,
    reps: h.sets || 0, plannedReps: h.sets || 0,
    activeSeconds: h.active ? Math.round(h.active / 100) / 10 : null, restSeconds: h.rest ? Math.round(h.rest / 1000) : 0,
    totalSeconds: h.total ? Math.round(h.total / 1000) : 0, pace100: pace, compliance: h.compliance || 0, completed: (h.compliance || 0) >= 100,
    log: [], workout: null,
  };
}
export function loadHistory(store) {
  const raw = store.get(KEYS.history, []);
  const list = (Array.isArray(raw) ? raw : []).map(migrateEntry).filter(Boolean);
  return list.sort((a, b) => b.date - a.date);
}
export function saveEntry(store, entry) {
  const list = [entry, ...loadHistory(store).filter((e) => e.id !== entry.id)].slice(0, 500);
  store.set(KEYS.history, list);
  return list;
}

/* ───────── favoritos ───────── */
export function loadFavorites(store) {
  const f = store.get(KEYS.favorites, []);
  return Array.isArray(f) ? f.filter((x) => x && x.id && x.workout) : [];
}
export function addFavorite(store, workout, name) {
  const fav = { id: `f${workout.id}`, name: name || workout.name, savedAt: Date.now(), workout: JSON.parse(JSON.stringify(workout)) };
  const list = [fav, ...loadFavorites(store).filter((x) => x.id !== fav.id)].slice(0, 100);
  store.set(KEYS.favorites, list);
  return list;
}
export function removeFavorite(store, id) {
  const list = loadFavorites(store).filter((x) => x.id !== id);
  store.set(KEYS.favorites, list);
  return list;
}

/** "3/10", "5 → 8/10", "90–95%", "Moderada 6/10" → RPE. */
export function parseOldIntensity(txt) {
  const t = String(txt || '').replace(/\/10/g, '');
  const nums = (t.match(/\d+/g) || []).map(Number);
  if (!nums.length) return { rpe: 5 };
  const toRpe = (n) => (t.includes('%') ? Math.min(10, Math.max(1, Math.round(n / 10))) : Math.min(10, Math.max(1, n)));
  if (/→|->/.test(t) && nums.length >= 2) return { rpeStart: toRpe(nums[0]), rpe: Math.max(toRpe(nums[nums.length - 1]), toRpe(nums[0])) };
  if (/[–-]/.test(t) && t.includes('%') && nums.length >= 2) return { rpe: toRpe(Math.round((nums[0] + nums[1]) / 2)) };
  return { rpe: toRpe(nums[0]) };
}

/** Rutina de la v1.x guardada en `swimos.workout` → formato 2.0, o null. */
export function migrateOldWorkout(old) {
  if (!old || !Array.isArray(old.exercises) || old.v === 2) return null;
  const MAP = { crol: ['style-free', 'easy'], pull: ['arms-pull-free', 'base'], kick: ['legs-board-free', 'base'], breast: ['legs-breast-board', 'base'], dolphin: ['legs-fly-supine', 'base'], sprint: ['speed-sprint25', 'base'], endurance: ['end-free-continuous', 'base'] };
  const BL = { w: 'warmup', t: 'main', r: 'endurance' };
  const items = old.exercises.map((e, i) => {
    let [exId, variantId] = MAP[e.type] || MAP.crol;
    if (e.type === 'sprint' && e.dist >= 50) exId = 'speed-sprint50';
    if (e.type === 'crol' && /progres/i.test(e.name || '')) variantId = 'build';
    if (e.type === 'endurance' && /progres/i.test(e.name || '')) { exId = 'end-progressive'; variantId = 'base'; }
    const { rpe, rpeStart } = parseOldIntensity(e.intensity);
    if (!BY_ID[exId]) { exId = 'style-free'; variantId = 'easy'; }
    return { id: `old${i}`, block: BL[e.block] || 'main', exId, variantId, name: e.name || BY_ID[exId].name, reps: e.reps, dist: e.dist, rest: e.rest, rpe, ...(rpeStart ? { rpeStart } : {}), note: '', manual: true };
  });
  const config = normalizeConfig({ total: old.target, pool: old.pool, seed: 1, distribution: 'custom', blocks: Object.fromEntries(BLOCK_ORDER.map((b) => [b, items.filter((i) => i.block === b).reduce((a, i) => a + i.reps * i.dist, 0)])) });
  return { v: 2, id: 'wlegacy', name: `Rutina ${old.target} m`, createdAt: Date.now(), seed: 1, pool: config.pool, target: old.target, blockTargets: config.blocks, config, items, edited: true, warnings: [], skipped: [], attempts: 1 };
}

/* ───────── estadísticas ───────── */
const DAY = 86400000;
export function startOfWeek(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const wd = (d.getDay() + 6) % 7;
  return d.getTime() - wd * DAY;
}

/**
 * Estadísticas del historial. Todo lo que sale de tiempos medidos se marca
 * como medido; los metros por estilo salen de las series realmente nadadas.
 * @param {any[]} entries
 * @param {{now?: number, days?: number}} [o]
 */
export function computeStats(entries, o = {}) {
  const now = o.now ?? Date.now();
  const from = o.days ? now - o.days * DAY : 0;
  const rows = entries.filter((e) => e.date >= from);
  const meters = rows.reduce((a, e) => a + e.meters, 0);
  const measured = rows.filter((e) => e.pace100);
  const mm = measured.reduce((a, e) => a + e.meters, 0);
  const bestPace = measured.reduce((a, e) => (a == null || e.pace100 < a ? e.pace100 : a), null);
  const avgPace = mm ? Math.round((measured.reduce((a, e) => a + e.activeSeconds, 0) / mm) * 100 * 10) / 10 : null;

  const weeks = new Map();
  for (const e of rows) {
    const k = startOfWeek(e.date);
    weeks.set(k, (weeks.get(k) || 0) + e.meters);
  }
  const weekly = Array.from(weeks, ([t, m]) => ({ t, meters: m })).sort((a, b) => a.t - b.t);

  const byStroke = {};
  const byBlock = {};
  const byEx = {};
  for (const e of rows) for (const l of e.log || []) {
    const ex = BY_ID[l.exId];
    const s = ex ? ex.stroke : 'other';
    byStroke[s] = (byStroke[s] || 0) + l.dist;
    byBlock[l.block] = (byBlock[l.block] || 0) + l.dist;
    byEx[l.exId] = (byEx[l.exId] || 0) + l.dist;
  }
  const strokes = Object.entries(byStroke).map(([id, m]) => ({ id, name: STROKES[id] || id, meters: m })).sort((a, b) => b.meters - a.meters);
  const topExercises = Object.entries(byEx).map(([id, m]) => ({ id, name: BY_ID[id] ? BY_ID[id].name : id, meters: m })).sort((a, b) => b.meters - a.meters).slice(0, 5);

  const days = new Set(rows.map((e) => new Date(e.date).toDateString()));
  const paceSeries = measured.map((e) => ({ t: e.date, pace: e.pace100 })).sort((a, b) => a.t - b.t);
  const totalSeconds = rows.reduce((a, e) => a + (e.totalSeconds || 0), 0);
  return {
    sessions: rows.length, meters, avgMeters: rows.length ? Math.round(meters / rows.length) : 0,
    avgCompliance: rows.length ? Math.round(rows.reduce((a, e) => a + (e.compliance || 0), 0) / rows.length) : 0,
    activeDays: days.size, totalSeconds, avgPace, bestPace, measuredSessions: measured.length,
    longest: rows.reduce((a, e) => Math.max(a, e.meters), 0), weekly, paceSeries, strokes, byBlock, topExercises,
  };
}
