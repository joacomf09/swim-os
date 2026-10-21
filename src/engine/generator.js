// @ts-check
// GENERADOR: construye una rutina que suma exactamente la distancia pedida.
// Pura y determinista: misma configuración + misma semilla = misma rutina.

import { BLOCK_ORDER, itemName } from '../library.js';
import { normalizeConfig, GOALS } from './config.js';
import { buildCandidates, categoryWeight } from './candidates.js';
import { diagnose } from './diagnose.js';
import { reachable } from './reach.js';
import { validateWorkout, blockMeters, plannedMeters } from './validator.js';
import { mulberry32, hashSeed, newSeed, weightedIndex, clamp } from './rng.js';

const IDEAL_ITEM = { warmup: 150, main: 175, endurance: 300 };
const ATTEMPTS = 40;

function restFor(config, variant, rpe, rpeLo, rpeHi) {
  if (config.restMode === 'custom') return Math.max(0, Math.round(config.restCustom / 5) * 5);
  const [lo, hi] = variant.rest;
  let r;
  if (config.restMode === 'short') r = lo;
  else if (config.restMode === 'long') r = hi * 1.3;
  else {
    const t = rpeHi > rpeLo ? clamp((rpe - rpeLo) / (rpeHi - rpeLo), 0, 1) : 0.5;
    r = lo + (hi - lo) * (0.35 + 0.4 * t);
  }
  return Math.max(0, Math.round(r / 5) * 5);
}

/**
 * Llena un bloque con series que suman exactamente `target`.
 * @returns {any[]|null} items, o null si no se pudo
 */
function fillBlock(o) {
  const { blockId, target, config, rng, used, usedEx, blockSeed } = o;
  const pool = config.pool;
  const units = Math.round(target / pool);
  if (!units) return [];
  const list = o.cands.filter((c) => c.blocks.includes(blockId));
  if (!list.length) return null;
  const reach = reachable(list, pool, units);
  if (!reach[units]) return null;
  const nIdeal = Math.max(1, Math.round(target / IDEAL_ITEM[blockId]));
  const hardLimit = config.intensity === 'hard' ? 2 : 1;
  const chosen = [];
  let rem = target;
  let hard = 0;
  let prev = null;

  while (rem > 0) {
    const desired = rem / Math.max(1, nIdeal - chosen.length);
    let opts = [];
    for (const limit of [hardLimit, Infinity]) {
      opts = [];
      for (const c of list) {
        if (c.hardish && hard >= limit) continue;
        const feasible = c.chunks.filter((ch) => ch.a <= rem && reach[Math.round((rem - ch.a) / pool)]);
        if (!feasible.length) continue;
        let w = categoryWeight(config.goal, blockId, c.ex.category);
        if (config.favorites.includes(c.ex.id)) w *= 1.6;
        const u = used.get(c.key) || 0;
        if (u) w *= Math.pow(0.12, u);
        if (blockId !== 'warmup' && c.variant.order === 0 && c.ex.category === 'styles') w *= 0.3;
        if (usedEx.has(c.ex.id)) w *= 0.5;
        if (prev && prev.c.ex.id === c.ex.id) w *= 0.3;
        if (prev && prev.c.ex.category === c.ex.category && c.ex.category !== 'styles') w *= 0.6;
        opts.push({ c, feasible, w });
      }
      if (opts.length) break;
    }
    if (!opts.length) return null;
    const pick = opts[weightedIndex(rng, opts.map((x) => x.w))];
    const cw = pick.feasible.map((ch) => {
      const z = (ch.a - desired) / (desired * 0.6 + 1);
      return Math.exp(-z * z) + 0.02 + (ch.a === rem ? 0.6 : 0);
    });
    const ch = pick.feasible[weightedIndex(rng, cw)];
    const pr = ch.pairs[weightedIndex(rng, ch.pairs.map((p) => 1 / p.r))];
    chosen.push({ c: pick.c, d: pr.d, r: pr.r });
    used.set(pick.c.key, (used.get(pick.c.key) || 0) + 1);
    usedEx.add(pick.c.ex.id);
    if (pick.c.hardish) hard++;
    prev = chosen[chosen.length - 1];
    rem -= ch.a;
  }

  // orden suave → fuerte
  const ordered = chosen.map((x, i) => ({ x, i })).sort((a, b) => a.x.c.variant.order - b.x.c.variant.order || a.i - b.i).map((z) => z.x);
  const f = { easy: 0.25, moderate: 0.55, hard: 0.85 }[config.intensity] * (config.goal === 'recovery' ? 0.6 : 1);
  return ordered.map((x, n) => {
    const [lo, hi] = x.c.rpe[blockId];
    const v = x.c.variant;
    let rpe;
    let rpeStart;
    if (v.kind === 'sprint' || v.kind === 'intervals') rpe = hi;
    else rpe = clamp(Math.round(lo + (hi - lo) * clamp(f + (rng() - 0.5) * 0.3, 0, 1)), lo, hi);
    if (v.kind === 'build') { rpe = hi; rpeStart = lo; }
    return {
      id: `${blockId[0]}${hashSeed(blockSeed, n).toString(36)}`,
      block: blockId,
      exId: x.c.ex.id,
      variantId: v.id,
      name: itemName(x.c.ex, v.id === 'base' ? null : v, x.c.noGear),
      reps: x.r,
      dist: x.d,
      rest: restFor(config, v, rpe, lo, hi),
      rpe,
      ...(rpeStart ? { rpeStart } : {}),
      ...(x.c.noGear ? { noGear: true } : {}),
      note: v.note || '',
    };
  });
}

function distinctKeys(cb) {
  const s = new Set();
  for (const b of BLOCK_ORDER) for (const c of cb.byBlock[b]) s.add(c.key);
  return s.size;
}

function makeWorkout(config, items, extra) {
  const total = config.total;
  return {
    v: 2,
    id: `w${config.seed.toString(36)}${Math.abs(hashSeed(JSON.stringify(items.map((i) => i.id)))).toString(36)}`,
    name: `${total} m · ${GOALS[config.goal].name}`,
    createdAt: extra.now,
    seed: config.seed,
    pool: config.pool,
    target: total,
    blockTargets: { ...config.blocks },
    config,
    items,
    edited: false,
    warnings: extra.warnings || [],
    skipped: extra.skipped || [],
    attempts: extra.attempts || 1,
  };
}

/**
 * @param {Partial<import('../types').Config>} input
 * @param {{now?: number}} [opts]
 */
export function generateWorkout(input, opts = {}) {
  const config = normalizeConfig(input);
  const diagnosis = diagnose(config);
  if (!diagnosis.ok) return { ok: false, diagnosis, config };
  const cb = buildCandidates(config);
  const cands = BLOCK_ORDER.flatMap((b) => cb.byBlock[b]);
  const dk = distinctKeys(cb);
  const now = opts.now ?? Date.now();
  let best = null;
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const used = new Map();
    const usedEx = new Set();
    const items = [];
    let failed = false;
    for (const blockId of BLOCK_ORDER) {
      const blockSeed = hashSeed(config.seed, blockId, attempt);
      const got = fillBlock({ blockId, target: config.blocks[blockId], config, cands, rng: mulberry32(blockSeed), used, usedEx, blockSeed });
      if (!got) { failed = true; break; }
      items.push(...got);
    }
    if (failed) continue;
    const w = makeWorkout(config, items, { now, attempts: attempt + 1, skipped: diagnosis.skipped });
    const v = validateWorkout(w, { config, strict: true, distinctKeys: dk });
    if (!v.ok) continue;
    w.warnings = v.warnings;
    if (!best || v.warnings.length < best.warnings.length) best = w;
    if (!v.warnings.length) break;
  }
  if (!best) {
    return { ok: false, config, diagnosis: { ok: false, errors: [{ code: 'GENERATION_FAILED', severity: 'error', message: 'No encontré una combinación válida con estos ajustes. Probá con más ejercicios o con otro reparto.', fixes: [] }], warnings: diagnosis.warnings, skipped: diagnosis.skipped } };
  }
  best.attempts = best.attempts || 1;
  return { ok: true, workout: best, diagnosis };
}

/** Otra opción con los mismos parámetros y una semilla nueva. */
export function generateAlternative(workout, opts = {}) {
  const seed = opts.seed ?? newSeed();
  return generateWorkout({ ...workout.config, seed }, opts);
}

/**
 * Regenera solo un bloque; los demás quedan idénticos.
 * @returns {{ok:true, workout:any}|{ok:false, message:string}}
 */
export function regenerateBlock(workout, blockId, opts = {}) {
  const config = workout.config;
  const target = blockMeters(workout.items)[blockId];
  if (!target) return { ok: false, message: 'Ese bloque no tiene metros para regenerar.' };
  const cb = buildCandidates(config, { onlyBlocks: [blockId] });
  const cands = cb.byBlock[blockId];
  if (!cands.length) return { ok: false, message: 'Con el material y los ejercicios elegidos no hay alternativas para este bloque.' };
  const dk = distinctKeys(buildCandidates(config));
  const base = opts.seed ?? newSeed();
  let best = null;
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const used = new Map();
    const usedEx = new Set();
    for (const it of workout.items) {
      if (it.block === blockId) continue;
      const k = `${it.exId}:${it.variantId}`;
      used.set(k, (used.get(k) || 0) + 1);
      usedEx.add(it.exId);
    }
    const blockSeed = hashSeed(base, blockId, attempt);
    const got = fillBlock({ blockId, target, config, cands, rng: mulberry32(blockSeed), used, usedEx, blockSeed });
    if (!got) continue;
    const items = BLOCK_ORDER.flatMap((b) => (b === blockId ? got : workout.items.filter((i) => i.block === b)));
    const w = { ...workout, items };
    const v = validateWorkout(w, { config, distinctKeys: dk });
    if (!v.ok) continue;
    const same = JSON.stringify(got.map((i) => [i.exId, i.variantId, i.reps, i.dist])) === JSON.stringify(workout.items.filter((i) => i.block === blockId).map((i) => [i.exId, i.variantId, i.reps, i.dist]));
    const score = v.warnings.length + (same ? 5 : 0);
    if (!best || score < best.score) best = { score, w: { ...w, warnings: v.warnings } };
    if (score === 0) break;
  }
  if (!best) return { ok: false, message: 'No encontré otra combinación válida para ese bloque.' };
  return { ok: true, workout: best.w };
}

export { plannedMeters };
