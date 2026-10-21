// @ts-check
// SESIÓN EN VIVO: máquina de estados pura. Todo se calcula con marcas de
// tiempo reales (ms), así que sobrevive a pausas, cambios de pestaña y
// recargas: el estado es JSON y el tiempo se deriva de `now`.
//
// fases: ready (esperando INICIAR) → swim (nadando) → rest (descanso) → ready … → done
// `paused` congela el tiempo de la fase actual.

import { BLOCK_ORDER } from '../library.js';

/** Aplana la rutina en una lista de repeticiones. */
export function flattenSteps(workout) {
  const steps = [];
  for (const it of workout.items) {
    for (let r = 1; r <= it.reps; r++) {
      steps.push({
        itemId: it.id, block: it.block, exId: it.exId, variantId: it.variantId, name: it.name,
        rep: r, reps: it.reps, dist: it.dist, rest: it.rest, rpe: it.rpe, rpeStart: it.rpeStart || 0, note: it.note || '',
      });
    }
  }
  return steps;
}

/** Sesión nueva, lista para empezar (instantánea de la rutina: editar después no la afecta). */
export function createSession(workout, now = Date.now()) {
  const snapshot = JSON.parse(JSON.stringify(workout));
  return {
    v: 2, id: `s${now.toString(36)}`, workoutId: workout.id, workout: snapshot,
    steps: flattenSteps(snapshot), idx: 0, phase: 'ready',
    createdAt: now, startedAt: null, endedAt: null,
    phaseStart: now, pausedAt: null, pausedMs: 0,
    log: [], // { idx, swimMs, restMs, skipped }
  };
}

const live = (s) => s.phase === 'swim' || s.phase === 'rest';

/** Milisegundos transcurridos en la fase actual (congelado si está en pausa). */
export function phaseElapsed(s, now = Date.now()) {
  if (s.phase === 'ready' || s.phase === 'done') return 0;
  return Math.max(0, (s.pausedAt ?? now) - s.phaseStart);
}

export const restRemainingMs = (s, now = Date.now()) =>
  s.phase === 'rest' ? s.steps[s.idx].rest * 1000 - phaseElapsed(s, now) : 0;

/** Tiempo total de la sesión sin pausas. */
export function totalElapsed(s, now = Date.now()) {
  if (!s.startedAt) return 0;
  const end = s.endedAt ?? s.pausedAt ?? now;
  return Math.max(0, end - s.startedAt - s.pausedMs);
}

export const isPaused = (s) => s.pausedAt != null;
export const current = (s) => s.steps[s.idx] || null;
export const upcoming = (s, n = 1) => s.steps.slice(s.idx + 1, s.idx + 1 + n);

function logFor(s, idx) { return s.log.find((l) => l.idx === idx); }
function putLog(s, entry) {
  const rest = s.log.filter((l) => l.idx !== entry.idx);
  return [...rest, { ...(logFor(s, entry.idx) || {}), ...entry }].sort((a, b) => a.idx - b.idx);
}

/** INICIAR: empieza a nadar la repetición actual. */
export function start(s, now = Date.now()) {
  if (s.phase !== 'ready' || isPaused(s)) return s;
  return { ...s, phase: 'swim', phaseStart: now, startedAt: s.startedAt ?? now };
}

/** FINALIZAR SERIE: registra el tiempo real y pasa al descanso (o termina). */
export function finishRep(s, now = Date.now()) {
  if (s.phase !== 'swim' || isPaused(s)) return s;
  const swimMs = phaseElapsed(s, now);
  const log = putLog(s, { idx: s.idx, swimMs, restMs: 0, skipped: false });
  if (s.idx >= s.steps.length - 1) return { ...s, log, phase: 'done', endedAt: now };
  return { ...s, log, phase: 'rest', phaseStart: now };
}

function leaveRest(s, now) {
  const restMs = phaseElapsed(s, now);
  const log = putLog(s, { idx: s.idx, restMs });
  return { ...s, log, idx: s.idx + 1, phase: 'ready', phaseStart: now };
}

/** Saltar descanso: pasa directo a la próxima repetición (queda lista, sin arrancar el reloj). */
export function skipRest(s, now = Date.now()) {
  if (s.phase !== 'rest' || isPaused(s)) return s;
  return leaveRest(s, now);
}

/** SIGUIENTE: avanza sin contar la repetición actual si no se hizo. */
export function next(s, now = Date.now()) {
  if (s.phase === 'done' || isPaused(s)) return s;
  if (s.phase === 'rest') return leaveRest(s, now);
  const last = s.idx >= s.steps.length - 1;
  const log = logFor(s, s.idx) ? s.log : putLog(s, { idx: s.idx, swimMs: 0, restMs: 0, skipped: true });
  if (last) return { ...s, log, phase: 'done', endedAt: now };
  return { ...s, log, idx: s.idx + 1, phase: 'ready', phaseStart: now };
}

/** ANTERIOR: vuelve a la repetición anterior y descarta su registro para repetirla. */
export function prev(s, now = Date.now()) {
  if (s.phase === 'done' || isPaused(s)) return s;
  if (s.phase === 'swim' || (s.phase === 'ready' && s.idx === 0)) return { ...s, phase: 'ready', phaseStart: now };
  if (s.idx === 0) return s;
  return { ...s, idx: s.idx - 1, phase: 'ready', phaseStart: now, log: s.log.filter((l) => l.idx !== s.idx - 1 && l.idx !== s.idx) };
}

export function pause(s, now = Date.now()) {
  if (!live(s) || isPaused(s)) return s;
  return { ...s, pausedAt: now };
}

export function resume(s, now = Date.now()) {
  if (!isPaused(s)) return s;
  const gap = now - s.pausedAt;
  return { ...s, pausedAt: null, pausedMs: s.pausedMs + gap, phaseStart: s.phaseStart + gap };
}

/** Terminar antes de tiempo (o al acabar). */
export function finishSession(s, now = Date.now()) {
  if (s.phase === 'done') return s;
  let t = isPaused(s) ? resume(s, now) : s;
  if (t.phase === 'swim') {
    const swimMs = phaseElapsed(t, now);
    if (swimMs > 0) t = { ...t, log: putLog(t, { idx: t.idx, swimMs, restMs: 0, skipped: false, partial: true }) };
  }
  return { ...t, phase: 'done', endedAt: now };
}

/** Avance: metros hechos/restantes y progreso por bloque. */
export function progress(s) {
  const done = new Set(s.log.filter((l) => !l.skipped && l.swimMs > 0).map((l) => l.idx));
  const meters = s.steps.reduce((a, st, i) => a + (done.has(i) ? st.dist : 0), 0);
  const planned = s.steps.reduce((a, st) => a + st.dist, 0);
  const blocks = {};
  for (const b of BLOCK_ORDER) {
    const idxs = s.steps.map((st, i) => (st.block === b ? i : -1)).filter((i) => i >= 0);
    const total = idxs.reduce((a, i) => a + s.steps[i].dist, 0);
    const d = idxs.filter((i) => done.has(i)).reduce((a, i) => a + s.steps[i].dist, 0);
    blocks[b] = { total, done: d, pct: total ? d / total : 0 };
  }
  return { meters, planned, remaining: planned - meters, pct: planned ? meters / planned : 0, repsDone: done.size, reps: s.steps.length, blocks };
}

/** Resumen final de lo medido (nada de datos inventados). */
export function summarize(s, now = Date.now()) {
  const p = progress(s);
  const doneLogs = s.log.filter((l) => !l.skipped && l.swimMs > 0);
  const activeSeconds = doneLogs.reduce((a, l) => a + l.swimMs, 0) / 1000;
  const restSeconds = s.log.reduce((a, l) => a + (l.restMs || 0), 0) / 1000;
  const totalSeconds = totalElapsed(s, s.endedAt ?? now) / 1000;
  const enough = p.meters > 0 && activeSeconds >= 10;
  return {
    meters: p.meters, plannedMeters: p.planned, reps: p.repsDone, plannedReps: p.reps,
    skipped: s.log.filter((l) => l.skipped).length,
    activeSeconds: Math.round(activeSeconds * 10) / 10, restSeconds: Math.round(restSeconds), totalSeconds: Math.round(totalSeconds),
    pace100: enough ? Math.round((activeSeconds / p.meters) * 100 * 10) / 10 : null,
    compliance: p.planned ? Math.round((p.meters / p.planned) * 100) : 0,
    completed: s.steps.length > 0 && p.repsDone === s.steps.length,
  };
}

/** Un estado guardado puede estar corrupto: lo valida antes de reanudar. */
export function restoreSession(raw) {
  try {
    const s = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!s || s.v !== 2 || !Array.isArray(s.steps) || !s.steps.length || !Number.isInteger(s.idx)) return null;
    if (s.idx < 0 || s.idx >= s.steps.length || !['ready', 'swim', 'rest', 'done'].includes(s.phase)) return null;
    if (s.phase === 'done') return null;
    return s;
  } catch (e) { return null; }
}
