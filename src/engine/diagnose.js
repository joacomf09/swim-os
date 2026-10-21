// @ts-check
// DIAGNÓSTICO: explica por qué una configuración no se puede generar y propone
// correcciones concretas (cada una es un parche que `applyFix` sabe aplicar).

import { BLOCK_ORDER, BLOCKS, BY_ID, EQUIPMENT } from '../library.js';
import { POOL_MIN, POOL_MAX, VOLUME_WARN, resolveSelection } from './config.js';
import { buildCandidates } from './candidates.js';
import { reachable } from './reach.js';

const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const blockName = (b) => BLOCKS[b].name.toLowerCase();

/** @param {import('../types').Config} config */
export function diagnose(config) {
  /** @type {any[]} */ const errors = [];
  /** @type {any[]} */ const warnings = [];
  const err = (code, message, fixes = []) => errors.push({ code, severity: 'error', message, fixes });
  const warn = (code, message, fixes = []) => warnings.push({ code, severity: 'warn', message, fixes });
  const { pool, total } = config;

  if (!Number.isFinite(total) || total <= 0) {
    err('TOTAL', 'Elegí una distancia total mayor que 0.', [{ label: 'Usar 1.500 m', patch: { set: { total: 1500 } } }]);
  }
  if (!Number.isInteger(pool) || pool < POOL_MIN || pool > POOL_MAX) {
    err('POOL', `La piscina debe medir entre ${POOL_MIN} y ${POOL_MAX} m.`, [
      { label: 'Piscina de 25 m', patch: { set: { pool: 25 } } },
      { label: 'Piscina de 50 m', patch: { set: { pool: 50 } } },
    ]);
  }
  if (errors.length) return { ok: false, errors, warnings, skipped: [] };

  if (total % pool !== 0) {
    const lo = Math.floor(total / pool) * pool;
    const hi = Math.ceil(total / pool) * pool;
    const fixes = [];
    if (lo > 0) fixes.push({ label: `Usar ${fmt(lo)} m`, patch: { set: { total: lo } } });
    fixes.push({ label: `Usar ${fmt(hi)} m`, patch: { set: { total: hi } } });
    for (const p of [25, 50, 20, 10]) {
      if (p !== pool && total % p === 0) { fixes.push({ label: `Piscina de ${p} m (${fmt(total)} m exactos)`, patch: { set: { pool: p } } }); break; }
    }
    err('TOTAL_MULTIPLE', `${fmt(total)} m no es múltiplo de ${pool} m: no se puede cerrar con largos enteros.`, fixes);
    return { ok: false, errors, warnings, skipped: [] };
  }

  // ─ bloques
  const b = config.blocks;
  const sum = BLOCK_ORDER.reduce((a, k) => a + (b[k] || 0), 0);
  const balanceFix = { label: 'Usar el reparto Equilibrado (20/40/40)', patch: { set: { distribution: 'balanced' } } };
  if (BLOCK_ORDER.some((k) => !Number.isFinite(b[k]) || b[k] < 0)) {
    err('BLOCK_NEG', 'Los metros de cada bloque deben ser 0 o más.', [balanceFix]);
  } else if (BLOCK_ORDER.some((k) => b[k] % pool !== 0)) {
    err('BLOCK_MULTIPLE', `Cada bloque debe ser múltiplo de ${pool} m para cerrar con largos enteros.`, [balanceFix]);
  } else if (sum !== total) {
    const diff = total - sum;
    const fixes = [balanceFix];
    if (b.main + diff >= 0) fixes.unshift({ label: `Ajustar el bloque principal (${diff > 0 ? '+' : ''}${fmt(diff)} m)`, patch: { set: { blocks: { main: b.main + diff } } } });
    err('BLOCK_SUM', `Los bloques suman ${fmt(sum)} m y la distancia es ${fmt(total)} m (${diff > 0 ? 'faltan' : 'sobran'} ${fmt(Math.abs(diff))} m).`, fixes);
  }
  if (errors.length) return { ok: false, errors, warnings, skipped: [] };

  // ─ selección y material
  const selected = resolveSelection(config);
  if (!selected.size) {
    err('NO_SELECTION', 'No elegiste ningún ejercicio.', [
      { label: 'Agregar crol / estilo libre', patch: { addIds: ['style-free'] } },
      { label: 'Agregar estilos completos', patch: { addCats: ['styles'] } },
    ]);
    return { ok: false, errors, warnings, skipped: [] };
  }
  const cb = buildCandidates(config);
  const missingEq = new Map();
  for (const id of selected) {
    const ex = BY_ID[id];
    for (const e of ex.equipmentRequired) if (!config.equipment.includes(e)) missingEq.set(e, (missingEq.get(e) || 0) + 1);
  }
  const equipFixes = () => {
    const f = [];
    for (const [e] of Array.from(missingEq).sort((x, y) => y[1] - x[1]).slice(0, 2)) {
      f.push({ label: `Tengo ${EQUIPMENT[e].short.toLowerCase()}`, patch: { addEquipment: [e] } });
    }
    if (!config.allowNoGear) f.push({ label: 'Permitir variantes sin material', patch: { set: { allowNoGear: true } } });
    return f;
  };
  const stylesFix = config.selection.ids.includes('style-free')
    ? [] : [{ label: 'Agregar crol / estilo libre', patch: { addIds: ['style-free'] } }];

  const reach = {};
  for (const k of BLOCK_ORDER) {
    const target = b[k];
    if (!target) continue;
    const list = cb.byBlock[k];
    if (!list.length) {
      const why = cb.skipped.length ? ` Se descartaron: ${cb.skipped.slice(0, 3).map((s) => `${s.name} (${s.reason.toLowerCase()})`).join('; ')}.` : '';
      const fixes = [...equipFixes(), ...stylesFix];
      const other = BLOCK_ORDER.find((o) => o !== k && b[o] > 0 && cb.byBlock[o].length);
      if (other) fixes.push({ label: `Pasar el ${blockName(k)} al ${blockName(other)}`, patch: { set: { blocks: { [k]: 0, [other]: b[other] + target } } } });
      err('BLOCK_EMPTY', `Con lo que elegiste no hay ejercicios posibles para el ${blockName(k)}.${why}`, fixes);
      continue;
    }
    reach[k] = reachable(list, pool, target / pool);
    if (!reach[k][target / pool]) {
      const units = target / pool;
      let fix = null;
      for (let d = 1; d <= units + 40 && !fix; d++) {
        for (const o of BLOCK_ORDER) {
          if (o === k) continue;
          for (const sign of [1, -1]) {
            const nk = target + sign * d * pool;
            const no = b[o] - sign * d * pool;
            if (nk < 0 || no < 0) continue;
            const rk = reachable(list, pool, nk / pool);
            if (nk > 0 && !rk[nk / pool]) continue;
            if (no > 0) {
              const lo = cb.byBlock[o];
              if (!lo.length || !reachable(lo, pool, no / pool)[no / pool]) continue;
            }
            fix = { label: `Pasar ${fmt(d * pool)} m ${sign > 0 ? `del ${blockName(o)} al ${blockName(k)}` : `del ${blockName(k)} al ${blockName(o)}`}`, patch: { set: { blocks: { [k]: nk, [o]: no } } } };
            break;
          }
          if (fix) break;
        }
      }
      err('BLOCK_UNREACHABLE', `No se puede armar un ${blockName(k)} de exactamente ${fmt(target)} m con los ejercicios y la piscina de ${pool} m elegidos.`,
        [...(fix ? [fix] : []), ...equipFixes(), ...stylesFix]);
    }
  }

  // ─ avisos
  const vw = VOLUME_WARN[config.level];
  if (vw && total > vw) warn('VOLUME', `${fmt(total)} m es mucho volumen para tu nivel.`);
  if (!b.warmup && (config.goal === 'speed' || config.intensity === 'hard')) {
    warn('NO_WARMUP', 'Sin calentamiento no conviene hacer series fuertes.', [balanceFix]);
  }
  const distinct = new Set();
  for (const k of BLOCK_ORDER) for (const c of cb.byBlock[k]) distinct.add(c.key);
  if (errors.length === 0 && distinct.size <= 2) warn('FEW_OPTIONS', 'Elegiste muy pocos ejercicios: la sesión va a repetir bastante.');
  for (const s of cb.skipped) warn('SKIPPED', `${s.name}: ${s.reason}.`);

  return { ok: errors.length === 0, errors, warnings, skipped: cb.skipped };
}
