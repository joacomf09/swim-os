// @ts-check
// ENTRENAMIENTO RÁPIDO: el usuario elige estilos, material e intensidad;
// el resto (ejercicios, orden, reparto) sale al azar con una semilla nueva.
import { EXERCISES, LEVELS } from '../library.js';
import { normalizeConfig, defaultConfig, cycleOf } from './config.js';
import { generateWorkout } from './generator.js';
import { newSeed } from './rng.js';

export const STROKES = [
  { id: 'free', name: 'Crol' },
  { id: 'back', name: 'Espalda' },
  { id: 'breast', name: 'Braza' },
  { id: 'fly', name: 'Mariposa' },
];

/** Ejercicios que usan alguno de los estilos pedidos y entran en el nivel. */
export function idsForStrokes(strokes, level = 'intermediate') {
  const set = new Set(strokes);
  const lv = (LEVELS[level] || LEVELS.intermediate).n;
  return EXERCISES
    .filter((e) => e.difficulty <= lv && (set.has(e.stroke) || (set.size > 1 && (e.stroke === 'im' || e.stroke === 'mixed'))))
    .map((e) => e.id);
}

/**
 * Configuración a partir de las elecciones rápidas. Sin estilos = todos.
 * @param {Partial<import('../types').Config>} base
 * @param {{strokes?: string[], equipment?: string[], intensity?: string, total?: number, seed?: number}} pick
 */
export function quickConfig(base, pick = {}) {
  const b = { ...defaultConfig(), ...(base || {}) };
  const strokes = pick.strokes && pick.strokes.length ? pick.strokes : STROKES.map((s) => s.id);
  const all = strokes.length === STROKES.length;
  const total = pick.total || b.total;
  return normalizeConfig({
    ...b,
    total,
    equipment: pick.equipment || b.equipment,
    intensity: pick.intensity || b.intensity,
    goal: 'mix',
    distribution: 'balanced',
    excluded: b.excluded || [],
    selection: all
      ? { cats: ['arms', 'legs', 'technique', 'speed', 'endurance', 'styles'], ids: [], off: [] }
      : { cats: [], ids: idsForStrokes(strokes, b.level), off: [] },
    seed: pick.seed || newSeed(),
  });
}

/** Ajusta el total al múltiplo de ida y vuelta más cercano. */
export function snapTotal(total, pool) {
  const c = cycleOf(pool);
  return Math.max(c, Math.round(total / c) * c);
}

/**
 * Genera con la semilla dada; si no sale, prueba con otras semillas y, como
 * último recurso, suma crol de resistencia (`widened: true`) para completar
 * los bloques que el estilo elegido no puede cubrir (p. ej. solo mariposa).
 */
export function quickWorkout(base, pick = {}, tries = 6) {
  let last = null;
  for (let i = 0; i < tries; i++) {
    const cfg = quickConfig(base, { ...pick, seed: i === 0 ? pick.seed : undefined });
    const r = generateWorkout(cfg);
    if (r.ok) return r;
    last = r;
  }
  const cfg = quickConfig(base, { ...pick, seed: undefined });
  const extra = EXERCISES.filter((e) => e.stroke === 'free' && (e.category === 'endurance' || e.category === 'styles') && e.difficulty <= (LEVELS[cfg.level] || LEVELS.intermediate).n).map((e) => e.id);
  const wide = normalizeConfig({ ...cfg, selection: { ...cfg.selection, ids: Array.from(new Set([...cfg.selection.ids, ...extra])) } });
  const r = generateWorkout(wide);
  return r.ok ? { ...r, widened: true } : last || r;
}
