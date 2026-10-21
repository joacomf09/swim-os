// @ts-check
// WORKOUT VALIDATOR: comprueba una rutina (generada o editada a mano).
// Errores = la rutina es incorrecta. Avisos = técnicamente posible pero poco recomendable.

import { BLOCK_ORDER, BY_ID, LEVELS, EQUIPMENT, resolveItem } from '../library.js';
import { resolveSelection, VOLUME_WARN } from './config.js';

const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export const meters = (it) => it.reps * it.dist;
export const plannedMeters = (items) => items.reduce((a, it) => a + meters(it), 0);

export function blockMeters(items) {
  const out = { warmup: 0, main: 0, endurance: 0 };
  for (const it of items) out[it.block] = (out[it.block] || 0) + meters(it);
  return out;
}

/** Metros que deben pasar antes de la primera serie muy intensa. */
export const prepMeters = (total) => Math.min(300, Math.max(100, Math.round(total * 0.15)));
export const isHard = (it) => it.rpe >= 8;

/** Máximo razonable de apariciones de una misma serie en la rutina. */
export function repeatCap(itemCount, distinctKeys) {
  return Math.max(2, Math.ceil(itemCount / Math.max(1, distinctKeys)));
}

/**
 * @param {import('../types').Workout} workout
 * @param {{config?: import('../types').Config, strict?: boolean, distinctKeys?: number}} [opts]
 *   strict: exige también que cada bloque coincida con el reparto de la configuración.
 */
export function validateWorkout(workout, opts = {}) {
  const config = opts.config || workout.config || null;
  const errors = [];
  const warnings = [];
  const E = (code, message, itemId) => errors.push({ code, message, itemId });
  const Wn = (code, message, itemId) => warnings.push({ code, message, itemId });
  const items = workout.items || [];
  const pool = workout.pool;
  const planned = plannedMeters(items);
  const byBlock = blockMeters(items);

  if (!items.length) E('EMPTY', 'La rutina no tiene ejercicios.');

  // ─ estructura por serie
  const selected = config && !workout.edited ? resolveSelection(config) : null;
  for (const it of items) {
    const { ex, variant } = resolveItem(it);
    const label = it.name || (ex ? ex.name : 'Serie');
    if (!Number.isInteger(it.reps) || it.reps < 1 || !Number.isInteger(it.dist) || it.dist < 1) {
      E('ITEM_INVALID', `«${label}»: repeticiones y distancia deben ser números enteros positivos.`, it.id);
      continue;
    }
    if (it.rest < 0) E('REST_NEGATIVE', `«${label}»: el descanso no puede ser negativo.`, it.id);
    const unit = pool * ((ex && ex.unitMult) || 1);
    if (it.dist % unit !== 0) {
      E('POOL_MULTIPLE', `«${label}»: ${it.dist} m no es múltiplo de ${unit} m (${ex && ex.unitMult > 1 ? 'cuatro largos de ' : 'la piscina de '}${pool} m).`, it.id);
    }
    if (!ex) {
      Wn('UNKNOWN_EXERCISE', `«${label}»: no está en la biblioteca.`, it.id);
      continue;
    }
    if (config && !it.manual) {
      const missing = ex.equipmentRequired.filter((e) => !config.equipment.includes(e));
      if (missing.length && !(it.noGear && ex.noGearVariant)) {
        E('EQUIPMENT', `«${label}» necesita ${missing.map((m) => EQUIPMENT[m].short.toLowerCase()).join(' y ')}, que no está disponible.`, it.id);
      }
      if (selected && !selected.has(ex.id)) {
        E('NOT_SELECTED', `«${label}» no estaba entre los ejercicios elegidos.`, it.id);
      }
      if (config.excluded.includes(ex.id)) E('EXCLUDED', `«${label}» está excluido en tus ajustes.`, it.id);
    } else if (config && it.manual) {
      const missing = ex.equipmentRequired.filter((e) => !config.equipment.includes(e));
      if (missing.length && !(it.noGear && ex.noGearVariant)) {
        Wn('EQUIPMENT_MANUAL', `«${label}» necesita ${missing.map((m) => EQUIPMENT[m].short.toLowerCase()).join(' y ')}, que marcaste como no disponible.`, it.id);
      }
    }
    if (config && config.goal === 'recovery' && (it.rpe >= 8 || (variant && (variant.kind === 'sprint' || variant.kind === 'intervals')))) {
      E('RECOVERY_SPRINT', `«${label}» es un sprint: no entra en una recuperación activa.`, it.id);
    }
    if (config && LEVELS[config.level] && ex.difficulty > LEVELS[config.level].n) {
      Wn('LEVEL', `«${label}» es de nivel ${['', 'principiante', 'intermedio', 'avanzado'][ex.difficulty]}, por encima de tu nivel.`, it.id);
    }
  }

  // ─ suma
  if (planned !== workout.target) {
    const diff = planned - workout.target;
    E('SUM', `Distancia planificada ${fmt(planned)} m frente a ${fmt(workout.target)} m (${diff > 0 ? '+' : ''}${fmt(diff)} m).`);
  }
  if (opts.strict && workout.blockTargets) {
    for (const b of BLOCK_ORDER) {
      if ((byBlock[b] || 0) !== (workout.blockTargets[b] || 0)) {
        E('BLOCK_SUM', `El bloque «${b}» suma ${byBlock[b] || 0} m y debía sumar ${workout.blockTargets[b] || 0} m.`);
      }
    }
  }

  // ─ secuencia y esfuerzo
  const prep = prepMeters(workout.target);
  let cum = 0;
  let run = 0;
  for (const it of items) {
    if (isHard(it)) {
      if (cum < prep) Wn('PREP', `«${it.name}»: serie muy intensa tras solo ${cum} m (conviene al menos ${prep} m de preparación).`, it.id);
      run++;
      if (run === 3) Wn('CONSECUTIVE', 'Hay más de dos series muy intensas seguidas.', it.id);
    } else run = 0;
    cum += meters(it);
  }

  // ─ repetición excesiva
  const counts = new Map();
  for (const it of items) {
    const k = `${it.exId}:${it.variantId || 'base'}`;
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  const cap = repeatCap(items.length, opts.distinctKeys || 99);
  for (const [k, n] of counts) {
    if (n > cap) Wn('REPEAT', `«${(BY_ID[k.split(':')[0]] || {}).name || k}» aparece ${n} veces.`);
  }

  // ─ palas y volumen
  const paddleM = items.filter((it) => (BY_ID[it.exId] || {}).paddles && !it.noGear).reduce((a, it) => a + meters(it), 0);
  if (config && planned > 0) {
    const share = paddleM / planned;
    const lim = config.level === 'beginner' ? 0.2 : 0.4;
    if (share > lim) Wn('PADDLES', `Las palas suman el ${Math.round(share * 100)} % de la sesión; para tu nivel conviene no pasar del ${Math.round(lim * 100)} %.`);
    const vw = VOLUME_WARN[config.level];
    if (vw && planned > vw) Wn('VOLUME', `${planned} m es mucho volumen para nivel ${LEVELS[config.level].name.toLowerCase()}.`);
  }

  return { ok: errors.length === 0, errors, warnings, planned, diff: planned - workout.target, byBlock };
}
