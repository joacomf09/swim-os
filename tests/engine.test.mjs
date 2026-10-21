import test from 'node:test';
import assert from 'node:assert/strict';
import { gen, cfg, sel, ids, BY_ID, generateWorkout, validateWorkout, plannedMeters, blockMeters, resolveSelection } from './helpers.mjs';
import { regenerateBlock, generateAlternative, diagnose, applyFix, normalizeConfig, updateItem, removeItem, addItem, swapExercise, fitToTarget, acceptPlanned, distanceStatus, moveItem, startCheck } from '../src/engine/index.js';

const ALL = ['styles', 'arms', 'legs', 'technique', 'speed', 'endurance'];
const noErrors = (w) => { const v = validateWorkout(w, { config: w.config, strict: true }); assert.deepEqual(v.errors, [], v.errors.map((e) => e.message).join(' | ')); return v; };

test('1. 1.500 m en piscina de 25 m suma exacto y cada serie es múltiplo de 25', () => {
  const w = gen({ total: 1500, pool: 25, seed: 11 });
  assert.equal(plannedMeters(w.items), 1500);
  for (const it of w.items) assert.equal(it.dist % 25, 0, it.name);
  noErrors(w);
});

test('2. 2.000 m en piscina de 50 m: todo múltiplo de 50, sin sprints de 25', () => {
  const w = gen({ total: 2000, pool: 50, seed: 5, selection: sel(ALL, ['style-free']) });
  assert.equal(plannedMeters(w.items), 2000);
  for (const it of w.items) { assert.equal(it.dist % 50, 0, it.name); assert.notEqual(it.exId, 'speed-sprint25'); }
  noErrors(w);
});

test('3. sin equipamiento y sin permitir variantes: no aparece material', () => {
  const w = gen({ equipment: [], allowNoGear: false, selection: sel(ALL, ['style-free']), seed: 3 });
  for (const it of w.items) assert.deepEqual(BY_ID[it.exId].equipmentRequired, [], it.name);
  assert.equal(plannedMeters(w.items), 1500);
});

test('3b. sin equipamiento pero permitiendo variantes: las variantes sin material se marcan', () => {
  const w = gen({ equipment: [], allowNoGear: true, selection: sel(['arms', 'legs'], ['style-free']), seed: 4 });
  for (const it of w.items) {
    const missing = BY_ID[it.exId].equipmentRequired.length > 0;
    if (missing) { assert.ok(it.noGear, it.name); assert.ok(BY_ID[it.exId].noGearVariant); }
  }
});

test('4. solo crol: solo ejercicios de crol', () => {
  const w = gen({ selection: sel([], ['style-free']), seed: 8 });
  assert.deepEqual(ids(w), ['style-free']);
  assert.equal(plannedMeters(w.items), 1500);
});

test('5. crol + espalda + pecho: solo esos tres, sin intrusos', () => {
  const w = gen({ selection: sel([], ['style-free', 'style-back', 'style-breast']), seed: 9, total: 2000 });
  for (const id of ids(w)) assert.ok(['style-free', 'style-back', 'style-breast'].includes(id), id);
  assert.equal(plannedMeters(w.items), 2000);
});

test('6. objetivo resistencia: más metros en resistencia y tandas continuas largas', () => {
  const w = gen({ goal: 'endurance', distribution: 'endurance', seed: 21, total: 2000 });
  const b = blockMeters(w.items);
  assert.equal(b.endurance, 1200);
  assert.ok(w.items.some((i) => i.block === 'endurance' && i.dist * i.reps >= 200));
});

test('7. objetivo velocidad: hay sprints en el principal y vienen después de preparación', () => {
  const w = gen({ goal: 'speed', distribution: 'speed', intensity: 'hard', seed: 31, total: 2000 });
  assert.ok(w.items.some((i) => i.block === 'main' && i.rpe >= 8));
  const v = validateWorkout(w, { config: w.config });
  assert.ok(!v.warnings.some((x) => x.code === 'PREP'), 'sprint sin preparación');
});

test('8. regenerar con los mismos parámetros y semilla da exactamente la misma rutina', () => {
  const a = gen({ seed: 77 }, { now: 1 });
  const b = gen({ seed: 77 }, { now: 2 });
  assert.deepEqual(a.items, b.items);
  const c = gen({ seed: 78 });
  assert.notDeepEqual(a.items, c.items);
});

test('8b. otra opción conserva los parámetros y cambia la semilla', () => {
  const a = gen({ seed: 10, total: 1750, pool: 25 });
  const r = generateAlternative(a, { seed: 99 });
  assert.ok(r.ok);
  assert.equal(r.workout.config.total, 1750);
  assert.equal(r.workout.seed, 99);
  assert.equal(plannedMeters(r.workout.items), 1750);
});

test('8c. regenerar un bloque deja los otros idénticos y mantiene la distancia', () => {
  const a = gen({ seed: 12 });
  for (const blk of ['warmup', 'main', 'endurance']) {
    const r = regenerateBlock(a, blk, { seed: 4242 });
    assert.ok(r.ok, r.message);
    for (const other of ['warmup', 'main', 'endurance'].filter((x) => x !== blk)) {
      assert.deepEqual(r.workout.items.filter((i) => i.block === other), a.items.filter((i) => i.block === other));
    }
    assert.equal(blockMeters(r.workout.items)[blk], blockMeters(a.items)[blk]);
    assert.equal(plannedMeters(r.workout.items), 1500);
  }
});

test('9. editar y recalcular: la distancia planificada refleja los cambios', () => {
  let w = gen({ seed: 14 });
  const it = w.items[w.items.length - 1];
  const before = plannedMeters(w.items);
  w = updateItem(w, it.id, { reps: it.reps + 1 });
  assert.equal(distanceStatus(w).planned, before + it.dist);
  assert.equal(distanceStatus(w).ok, false);
  assert.equal(w.edited, true);
  const fixed = fitToTarget(w);
  assert.ok(fixed);
  assert.equal(plannedMeters(fixed.items), 1500);
  noErrorsEdit(fixed);
});
function noErrorsEdit(w) { const v = validateWorkout(w, { config: w.config }); assert.deepEqual(v.errors, []); }

test('9b. quitar y agregar series; aceptar lo planificado cambia el objetivo', () => {
  let w = gen({ seed: 15 });
  const total = plannedMeters(w.items);
  w = removeItem(w, w.items[0].id);
  assert.ok(plannedMeters(w.items) < total);
  assert.equal(startCheck(w).ok, false);
  w = addItem(w, 'warmup', 'style-free', 'easy');
  assert.ok(w.items.some((i) => i.manual));
  const acc = acceptPlanned(w);
  assert.equal(acc.target, plannedMeters(acc.items));
  assert.equal(startCheck(acc).ok, true);
});

test('9c. mover serie dentro del bloque; intercambiar ejercicio mantiene múltiplos de piscina', () => {
  let w = gen({ seed: 16, pool: 50, total: 2000 });
  const mainItems = w.items.filter((i) => i.block === 'main');
  if (mainItems.length > 1) {
    const moved = moveItem(w, mainItems[0].id, 1);
    assert.equal(moved.items.filter((i) => i.block === 'main')[1].id, mainItems[0].id);
  }
  const it = w.items[0];
  const s = swapExercise(w, it.id, 'style-back', 'easy');
  for (const x of s.items) assert.equal(x.dist % 50, 0);
});

test('10. configuración imposible: se explica con arreglos concretos', () => {
  const d = diagnose(normalizeConfig(cfg({ total: 1510, pool: 25 })));
  assert.equal(d.ok, false);
  assert.equal(d.errors[0].code, 'TOTAL_MULTIPLE');
  assert.ok(d.errors[0].fixes.length >= 2);
  const fixed = applyFix(normalizeConfig(cfg({ total: 1510 })), d.errors[0].fixes[0]);
  assert.equal(fixed.total, 1500);
  assert.ok(generateWorkout(fixed).ok);
});

test('10b. sin material y sin variantes para una selección que lo necesita', () => {
  const r = generateWorkout(cfg({ equipment: [], allowNoGear: false, selection: sel([], ['arms-pull-free', 'legs-board-free']) }));
  assert.equal(r.ok, false);
  assert.ok(r.diagnosis.errors.length);
  assert.ok(r.diagnosis.errors[0].fixes.length);
  const fx = r.diagnosis.errors[0].fixes[0];
  const c2 = applyFix(normalizeConfig(cfg({ equipment: [], allowNoGear: false, selection: sel([], ['arms-pull-free', 'legs-board-free']) })), fx);
  assert.ok(generateWorkout(c2).ok);
});

test('10c. bloques personalizados que no suman: se rechaza con arreglo', () => {
  const r = generateWorkout(cfg({ distribution: 'custom', blocks: { warmup: 300, main: 600, endurance: 500 } }));
  assert.equal(r.ok, false);
  assert.equal(r.diagnosis.errors[0].code, 'BLOCK_SUM');
});

test('11. nunca aparece material no disponible', () => {
  for (let seed = 1; seed <= 25; seed++) {
    const w = gen({ seed, equipment: ['board'], allowNoGear: false, selection: sel(ALL, ['style-free']) });
    for (const it of w.items) {
      const miss = BY_ID[it.exId].equipmentRequired.filter((e) => e !== 'board');
      assert.deepEqual(miss, [], `${it.name} seed ${seed}`);
    }
  }
});

test('11b. los ejercicios no elegidos no aparecen', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const config = cfg({ seed, selection: sel(['legs', 'technique'], ['style-free']) });
    const w = generateWorkout(config).workout;
    const allowed = resolveSelection(normalizeConfig(config));
    for (const it of w.items) assert.ok(allowed.has(it.exId), it.exId);
  }
});

test('12. metros exactos por bloque con reparto personalizado', () => {
  const w = gen({ distribution: 'custom', blocks: { warmup: 250, main: 650, endurance: 600 }, seed: 40 });
  const b = blockMeters(w.items);
  assert.deepEqual([b.warmup, b.main, b.endurance], [250, 650, 600]);
});

test('12b. presets de reparto', () => {
  for (const [dist, pct] of [['balanced', [20, 40, 40]], ['speed', [20, 60, 20]], ['endurance', [15, 25, 60]], ['technique', [20, 60, 20]]]) {
    const w = gen({ distribution: dist, total: 2000, seed: 2 });
    const b = blockMeters(w.items);
    assert.equal(b.warmup + b.main + b.endurance, 2000);
    assert.ok(Math.abs(b.warmup - 2000 * pct[0] / 100) <= 25 && Math.abs(b.main - 2000 * pct[1] / 100) <= 25, dist);
  }
});

test('recuperación activa: sin sprints y sin esfuerzo fuerte', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const w = gen({ goal: 'recovery', intensity: 'easy', seed });
    for (const it of w.items) { assert.ok(it.rpe <= 5, `${it.name} rpe ${it.rpe}`); assert.ok(BY_ID[it.exId].category !== 'speed'); }
  }
});

test('alta intensidad no es todo al máximo', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const w = gen({ intensity: 'hard', seed });
    const hard = w.items.filter((i) => i.rpe >= 9).reduce((a, i) => a + i.reps * i.dist, 0);
    assert.ok(hard / 1500 <= 0.35, `seed ${seed}: ${hard} m a tope`);
    assert.ok(w.items.some((i) => i.rpe <= 5));
  }
});
