// @ts-check
// WORKOUT CONFIGURATION: valores por defecto, normalización, reparto por
// bloques y resolución de la selección de ejercicios. Sin React ni DOM.

import { EXERCISES, BY_ID, LEVELS, BLOCK_ORDER } from '../library.js';

export const GOALS = {
  balanced: { id: 'balanced', name: 'Equilibrado', hint: 'Un poco de todo' },
  endurance: { id: 'endurance', name: 'Resistencia cardiovascular', hint: 'Más metros continuos' },
  speed: { id: 'speed', name: 'Velocidad y potencia', hint: 'Sprints bien preparados' },
  technique: { id: 'technique', name: 'Técnica y eficiencia', hint: 'Ejercicios y control' },
  legs: { id: 'legs', name: 'Trabajo de piernas', hint: 'Pataleo en todas sus formas' },
  arms: { id: 'arms', name: 'Trabajo de brazos', hint: 'Tracción y agarre' },
  recovery: { id: 'recovery', name: 'Recuperación activa', hint: 'Suave, sin sprints' },
  mix: { id: 'mix', name: 'Entrenamiento mixto aleatorio', hint: 'Sorpresa controlada' },
};

export const INTENSITIES = {
  easy: { id: 'easy', name: 'Suave', hint: 'Podés conversar' },
  moderate: { id: 'moderate', name: 'Moderada', hint: 'Esfuerzo sostenido' },
  hard: { id: 'hard', name: 'Alta', hint: 'Con tramos fuertes, no todo al máximo' },
};

export const REST_MODES = {
  short: { id: 'short', name: 'Cortos' },
  normal: { id: 'normal', name: 'Normales' },
  long: { id: 'long', name: 'Largos' },
  custom: { id: 'custom', name: 'Personalizados' },
};

export const DISTRIBUTIONS = {
  balanced: { id: 'balanced', name: 'Equilibrado', pct: [20, 40, 40] },
  speed: { id: 'speed', name: 'Velocidad', pct: [20, 60, 20] },
  endurance: { id: 'endurance', name: 'Resistencia', pct: [15, 25, 60] },
  technique: { id: 'technique', name: 'Técnica', pct: [20, 60, 20] },
};

export const QUICK_DISTANCES = [500, 750, 1000, 1250, 1500, 1750, 2000, 2500, 3000];
export const POOL_MIN = 10;
export const POOL_MAX = 100;

/** Volumen a partir del cual se avisa según el nivel. */
export const VOLUME_WARN = { beginner: 2000, intermediate: 3500, advanced: 5000 };

/** @returns {import('../types').Config} */
export function defaultConfig() {
  return {
    total: 1500,
    pool: 25,
    selection: { cats: ['arms', 'legs', 'technique', 'speed', 'endurance'], ids: ['style-free'], off: [] },
    equipment: ['board', 'buoy'],
    allowNoGear: false,
    distribution: 'balanced',
    blocks: { warmup: 300, main: 600, endurance: 600 },
    goal: 'balanced',
    intensity: 'moderate',
    restMode: 'normal',
    restCustom: 30,
    level: 'intermediate',
    excluded: [],
    favorites: [],
    seed: 1,
  };
}

const uniq = (a) => Array.from(new Set(a));

/**
 * Reparte `total` en [calentamiento, principal, resistencia] en múltiplos
 * exactos de la piscina (método del mayor resto).
 * @param {number} total
 * @param {number} pool
 * @param {number[]} pct
 */
export function splitBlocks(total, pool, pct) {
  const units = Math.floor(total / pool);
  const raw = pct.map((p) => (units * p) / 100);
  const base = raw.map(Math.floor);
  let left = units - base.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r), pri: i === 1 ? 2 : i === 2 ? 1 : 0 }))
    .sort((a, b) => b.frac - a.frac || b.pri - a.pri);
  for (let k = 0; left > 0; k = (k + 1) % 3, left--) base[order[k].i]++;
  const [w, m, e] = base.map((u) => u * pool);
  return { warmup: w, main: m, endurance: e };
}

/**
 * Completa y sanea una configuración. No corrige valores inválidos: eso lo
 * decide `diagnose`, para no modificar nada en silencio.
 * @param {Partial<import('../types').Config>} input
 * @returns {import('../types').Config}
 */
export function normalizeConfig(input) {
  const d = defaultConfig();
  const c = { ...d, ...(input || {}) };
  c.total = Number(c.total);
  c.pool = Number(c.pool);
  c.restCustom = Number(c.restCustom);
  c.seed = Number(c.seed) >>> 0 || 1;
  const sel = c.selection || d.selection;
  c.selection = {
    cats: uniq(sel.cats || []),
    ids: uniq(sel.ids || []),
    off: uniq(sel.off || []),
  };
  c.equipment = uniq(c.equipment || []);
  c.excluded = uniq(c.excluded || []);
  c.favorites = uniq(c.favorites || []);
  if (!LEVELS[c.level]) c.level = 'intermediate';
  if (!GOALS[c.goal]) c.goal = 'balanced';
  if (!INTENSITIES[c.intensity]) c.intensity = 'moderate';
  if (!REST_MODES[c.restMode]) c.restMode = 'normal';
  if (c.distribution !== 'custom' && DISTRIBUTIONS[c.distribution] && Number.isInteger(c.total / c.pool) && c.pool > 0) {
    c.blocks = splitBlocks(c.total, c.pool, DISTRIBUTIONS[c.distribution].pct);
  } else {
    if (c.distribution !== 'custom' && !DISTRIBUTIONS[c.distribution]) c.distribution = 'custom';
    const b = c.blocks || d.blocks;
    c.blocks = { warmup: Number(b.warmup), main: Number(b.main), endurance: Number(b.endurance) };
  }
  return c;
}

export const levelNumber = (config) => (LEVELS[config.level] || LEVELS.intermediate).n;

/**
 * Conjunto de ejercicios que el usuario ha elegido (antes de filtrar por
 * equipamiento). Las categorías solo habilitan ejercicios hasta su nivel;
 * los elegidos uno a uno entran siempre. Los excluidos nunca entran.
 * @param {import('../types').Config} config
 * @returns {Set<string>}
 */
export function resolveSelection(config) {
  const lv = levelNumber(config);
  const sel = config.selection;
  const out = new Set();
  for (const ex of EXERCISES) {
    if (config.excluded.includes(ex.id)) continue;
    if (sel.ids.includes(ex.id)) out.add(ex.id);
    else if (sel.cats.includes(ex.category) && !sel.off.includes(ex.id) && ex.difficulty <= lv) out.add(ex.id);
  }
  return out;
}

/** Cambia un ejercicio en la selección, conservando el modelo categorías/ids/off. */
export function toggleExercise(config, id) {
  const ex = BY_ID[id];
  if (!ex || config.excluded.includes(id)) return config;
  const sel = { cats: [...config.selection.cats], ids: [...config.selection.ids], off: [...config.selection.off] };
  const selected = resolveSelection(config).has(id);
  const viaCat = sel.cats.includes(ex.category) && ex.difficulty <= levelNumber(config);
  if (selected) {
    sel.ids = sel.ids.filter((x) => x !== id);
    if (viaCat) sel.off = uniq([...sel.off, id]);
  } else {
    sel.off = sel.off.filter((x) => x !== id);
    if (!viaCat) sel.ids = uniq([...sel.ids, id]);
  }
  return { ...config, selection: sel };
}

/** Activa o desactiva una categoría completa. */
export function toggleCategory(config, cat) {
  const sel = { cats: [...config.selection.cats], ids: [...config.selection.ids], off: [...config.selection.off] };
  const inCat = new Set(EXERCISES.filter((e) => e.category === cat).map((e) => e.id));
  if (sel.cats.includes(cat)) {
    sel.cats = sel.cats.filter((c) => c !== cat);
    sel.ids = sel.ids.filter((i) => !inCat.has(i));
    sel.off = sel.off.filter((i) => !inCat.has(i));
  } else {
    sel.cats = uniq([...sel.cats, cat]);
    sel.off = sel.off.filter((i) => !inCat.has(i));
  }
  return { ...config, selection: sel };
}

/**
 * Aplica una corrección propuesta por el diagnóstico.
 * @param {import('../types').Config} config
 * @param {import('../types').Fix} fix
 */
export function applyFix(config, fix) {
  const p = fix.patch || {};
  let c = { ...config, selection: { ...config.selection } };
  if (p.set) {
    const { blocks, ...rest } = p.set;
    c = { ...c, ...rest };
    if ((rest.total !== undefined || rest.pool !== undefined) && !blocks && c.distribution === 'custom') c.distribution = 'balanced';
    if (blocks) c = { ...c, blocks: { ...c.blocks, ...blocks }, distribution: 'custom' };
  }
  if (p.addCats) c.selection.cats = uniq([...c.selection.cats, ...p.addCats]);
  if (p.addIds) {
    c.selection.ids = uniq([...c.selection.ids, ...p.addIds]);
    c.selection.off = c.selection.off.filter((i) => !p.addIds.includes(i));
  }
  if (p.addEquipment) c.equipment = uniq([...c.equipment, ...p.addEquipment]);
  if (p.removeExcluded) c.excluded = c.excluded.filter((i) => !p.removeExcluded.includes(i));
  return normalizeConfig(c);
}

export function blockSum(blocks) {
  return BLOCK_ORDER.reduce((a, b) => a + (Number(blocks[b]) || 0), 0);
}

/** Marca o desmarca TODOS los ejercicios de una categoría (incluidos los de nivel superior). */
export function setCategoryAll(config, cat, on) {
  const inCat = EXERCISES.filter((e) => e.category === cat && !config.excluded.includes(e.id));
  const ids = new Set(inCat.map((e) => e.id));
  const sel = { cats: [...config.selection.cats], ids: config.selection.ids.filter((i) => !ids.has(i)), off: config.selection.off.filter((i) => !ids.has(i)) };
  if (on) {
    if (!sel.cats.includes(cat)) sel.cats.push(cat);
    const lv = levelNumber(config);
    sel.ids.push(...inCat.filter((e) => e.difficulty > lv).map((e) => e.id));
  } else {
    sel.cats = sel.cats.filter((c) => c !== cat);
  }
  return { ...config, selection: sel };
}
