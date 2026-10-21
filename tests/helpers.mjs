import { generateWorkout, validateWorkout, plannedMeters, blockMeters, resolveSelection, defaultConfig, normalizeConfig } from '../src/engine/index.js';
import { BY_ID } from '../src/library.js';

export const cfg = (over = {}) => ({ ...defaultConfig(), ...over });
export function gen(over = {}, opts) {
  const r = generateWorkout(cfg(over), opts);
  if (!r.ok) throw new Error('No generó: ' + JSON.stringify(r.diagnosis.errors.map((e) => e.message)));
  return r.workout;
}
export const sel = (cats, ids = []) => ({ cats, ids, off: [] });
export const ids = (w) => Array.from(new Set(w.items.map((i) => i.exId)));
export { BY_ID, generateWorkout, validateWorkout, plannedMeters, blockMeters, resolveSelection, normalizeConfig };
