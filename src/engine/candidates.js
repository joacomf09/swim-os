// @ts-check
// Qué puede aparecer en cada bloque: filtra la selección del usuario por
// equipamiento, nivel, intensidad, objetivo y piscina, y calcula las
// "porciones" (repeticiones × distancia) con las que se puede llenar un bloque.

import { EXERCISES, BY_ID, EQUIPMENT, BLOCK_ORDER, variantsOf } from '../library.js';
import { resolveSelection, levelNumber } from './config.js';

/** Peso de cada categoría por objetivo y bloque. Lo no listado pesa poco. */
const W = {
  balanced: {
    warmup: { styles: 3, arms: 2, legs: 2, technique: 2 },
    main: { technique: 2, legs: 2, arms: 2, speed: 2, styles: 1, endurance: 0.4 },
    endurance: { endurance: 4, styles: 2, arms: 0.4, legs: 0.3 },
  },
  endurance: {
    warmup: { styles: 3, arms: 2, legs: 2, technique: 1.5 },
    main: { styles: 2, arms: 2, endurance: 2, legs: 1, technique: 1, speed: 0.3 },
    endurance: { endurance: 5, styles: 1.5, arms: 0.3 },
  },
  speed: {
    warmup: { styles: 3, arms: 1.5, legs: 2, technique: 2 },
    main: { speed: 5, technique: 1.5, legs: 1, arms: 1, styles: 0.6 },
    endurance: { endurance: 2, styles: 2.5, legs: 1, speed: 0.3 },
  },
  technique: {
    warmup: { styles: 2, technique: 3, legs: 1.5, arms: 1.5 },
    main: { technique: 5, legs: 1.5, arms: 1.5, styles: 1.2 },
    endurance: { styles: 2.5, technique: 2, endurance: 1.5 },
  },
  legs: {
    warmup: { legs: 3, styles: 2, technique: 1 },
    main: { legs: 6, technique: 1, styles: 1, arms: 0.3 },
    endurance: { legs: 3, styles: 1.5, endurance: 1 },
  },
  arms: {
    warmup: { arms: 3, styles: 2, technique: 1, legs: 1 },
    main: { arms: 6, technique: 1, styles: 1, legs: 0.3 },
    endurance: { arms: 3, styles: 1.5, endurance: 1 },
  },
  recovery: {
    warmup: { styles: 3, technique: 2, legs: 1.5 },
    main: { technique: 3, styles: 2.5, legs: 1, arms: 1 },
    endurance: { styles: 3, endurance: 2, technique: 1 },
  },
};

export function categoryWeight(goal, block, cat) {
  if (goal === 'mix') return 1;
  const t = W[goal] && W[goal][block];
  return t && t[cat] != null ? t[cat] : 0.15;
}

/** Techo de esfuerzo (RPE) por bloque según intensidad, nivel y objetivo. */
export function rpeCap(blockId, config) {
  let cap = { easy: 6, moderate: 8, hard: 9 }[config.intensity];
  if (config.level === 'beginner') cap -= 1;
  const bc = {
    warmup: config.intensity === 'hard' ? 5 : 4,
    main: 10,
    endurance: config.intensity === 'hard' ? 8 : 7,
  }[blockId];
  cap = Math.min(cap, bc);
  if (config.goal === 'recovery') cap = Math.min(cap, blockId === 'warmup' ? 3 : 5);
  return cap;
}

/** Máximo de repeticiones por nivel. */
export function maxReps(variant, ex, config) {
  let m = variant.reps[1];
  const hardKind = variant.kind === 'sprint' || variant.kind === 'intervals';
  if (config.level === 'beginner') m = Math.min(m, hardKind ? 4 : 6);
  if (config.level === 'intermediate' && hardKind) m = Math.min(m, 8);
  return Math.max(variant.reps[0], m);
}

/**
 * Distancias permitidas de una variante para una piscina: siempre múltiplos
 * exactos de la longitud (y de 4 largos en IM). Con piscinas atípicas se
 * adaptan a largos enteros; con 25 y 50 m solo valen las distancias exactas.
 */
export function allowedDistances(ex, variant, pool) {
  const unit = pool * (ex.unitMult || 1);
  let ds = variant.dist.filter((d) => d % unit === 0);
  if (!ds.length && pool !== 25 && pool !== 50) {
    ds = Array.from(new Set(variant.dist.map((d) => Math.max(1, Math.round(d / unit)) * unit)));
  }
  return ds.sort((a, b) => a - b);
}

/**
 * Candidatos de un ejercicio (una entrada por variante y bloque compatible).
 * @returns {{cands: any[], reasons: string[]}}
 */
function candidatesFor(ex, config, ctx) {
  const reasons = [];
  const { equipment, blocksActive } = ctx;
  const missing = ex.equipmentRequired.filter((e) => !equipment.includes(e));
  let noGear = false;
  if (missing.length) {
    if (config.allowNoGear && ex.noGearVariant) noGear = true;
    else {
      reasons.push(`Falta ${missing.map((m) => EQUIPMENT[m].short.toLowerCase()).join(' y ')}`);
      return { cands: [], reasons };
    }
  }
  if (config.goal === 'recovery' && (ex.category === 'speed' || ex.kind === 'sprint' || ex.kind === 'intervals')) {
    reasons.push('No hay sprints en recuperación activa');
    return { cands: [], reasons };
  }
  if (ex.paddles && config.level === 'beginner' && config.intensity === 'hard') {
    reasons.push('Palas no recomendadas para principiantes con intensidad alta');
    return { cands: [], reasons };
  }
  const cands = [];
  for (const v of variantsOf(ex)) {
    const dists = allowedDistances(ex, v, config.pool);
    if (!dists.length) {
      reasons.push(`Sus distancias no encajan con una piscina de ${config.pool} m`);
      continue;
    }
    const blocks = v.blocks.filter((b) => blocksActive.includes(b));
    if (!blocks.length) continue;
    let [lo, hi] = v.rpe;
    if (ex.paddles && config.level === 'beginner') hi = Math.min(hi, 6);
    // RPE efectivo por bloque: se recorta al techo de cada bloque.
    const perBlock = {};
    for (const b of blocks) {
      const c = Math.min(rpeCap(b, config), hi);
      if (lo > c) {
        reasons.push('Demasiado intenso para la intensidad o el nivel elegidos');
        continue;
      }
      perBlock[b] = [lo, c];
    }
    const okBlocks = Object.keys(perBlock);
    if (!okBlocks.length) continue;
    const rMax = maxReps(v, ex, config);
    const byAmount = new Map();
    for (const d of dists) {
      for (let r = v.reps[0]; r <= rMax; r++) {
        const a = d * r;
        if (!byAmount.has(a)) byAmount.set(a, []);
        byAmount.get(a).push({ d, r });
      }
    }
    cands.push({
      key: `${ex.id}:${v.id}`,
      ex,
      variant: v,
      noGear,
      blocks: okBlocks,
      rpe: perBlock,
      dists,
      chunks: Array.from(byAmount, ([a, pairs]) => ({ a, pairs })).sort((x, y) => x.a - y.a),
      hardish: v.rpe[1] >= 8,
    });
  }
  if (!cands.length && !reasons.length) reasons.push('No encaja en los bloques activos');
  return { cands, reasons };
}

/**
 * @param {import('../types').Config} config
 * @param {{allowedIds?: Set<string>, onlyBlocks?: string[]}} [opts] sustituye la selección (p. ej. para sugerencias o edición manual)
 */
export function buildCandidates(config, opts = {}) {
  const selected = opts.allowedIds || resolveSelection(config);
  const blocksActive = opts.onlyBlocks || BLOCK_ORDER.filter((b) => (config.blocks[b] || 0) > 0);
  const byBlock = { warmup: [], main: [], endurance: [] };
  const skipped = [];
  const ctx = { equipment: config.equipment, blocksActive };
  for (const id of selected) {
    const ex = BY_ID[id];
    if (!ex) continue;
    const { cands, reasons } = candidatesFor(ex, config, ctx);
    if (!cands.length) {
      skipped.push({ id, name: ex.name, reason: reasons[0] || 'No disponible' });
      continue;
    }
    for (const c of cands) for (const b of c.blocks) byBlock[b].push(c);
  }
  return { byBlock, skipped, selected };
}

/** Todos los ejercicios de la biblioteca como si estuvieran elegidos (para sugerir). */
export function allIds(config) {
  return new Set(EXERCISES.filter((e) => !config.excluded.includes(e.id)).map((e) => e.id));
}

export { levelNumber };
