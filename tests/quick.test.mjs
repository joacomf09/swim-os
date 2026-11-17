import test from 'node:test';
import assert from 'node:assert/strict';
import { quickWorkout, snapTotal, idsForStrokes, defaultConfig, validateWorkout, unitOf } from '../src/engine/index.js';
import { BY_ID } from '../src/library.js';

test('aleatorio: respeta estilos, material y es múltiplo de ida y vuelta', () => {
  for (const pool of [25, 50]) for (const stroke of ['free', 'back', 'breast']) for (const seed of [1, 2, 3]) {
    const total = snapTotal(1500, pool);
    const r = quickWorkout({ ...defaultConfig(), pool }, { strokes: [stroke], equipment: ['board'], intensity: 'moderate', total, seed });
    assert.ok(r.ok, `${pool}/${stroke}/${seed}`);
    const w = r.workout;
    assert.equal(validateWorkout(w, { config: w.config }).errors.length, 0);
    for (const it of w.items) {
      assert.equal(it.dist % (pool * 2), 0);
      assert.equal(it.dist % unitOf(BY_ID[it.exId], pool), 0);
      assert.equal(BY_ID[it.exId].stroke === stroke || BY_ID[it.exId].stroke === undefined, true, it.exId);
      assert.ok(BY_ID[it.exId].equipmentRequired.every((e) => ['board'].includes(e)) || it.noGear);
    }
  }
});

test('aleatorio: solo mariposa se completa con crol (widened)', () => {
  const r = quickWorkout(defaultConfig(), { strokes: ['fly'], equipment: ['board'], total: 1500, seed: 5 });
  assert.ok(r.ok && r.widened);
});

test('aleatorio: distintas semillas dan rutinas distintas', () => {
  const a = quickWorkout(defaultConfig(), { total: 1500, seed: 11 }).workout.items.map((i) => i.exId).join();
  const b = quickWorkout(defaultConfig(), { total: 1500, seed: 12 }).workout.items.map((i) => i.exId).join();
  assert.notEqual(a, b);
});

test('snapTotal lleva al múltiplo de ida y vuelta', () => {
  assert.equal(snapTotal(1510, 25), 1500);
  assert.equal(snapTotal(1560, 50), 1600);
  assert.ok(idsForStrokes(['free']).length > 10);
});

import { assignFins, propagateFins, setFinsStart, validateWorkout as vw } from '../src/engine/index.js';
import { finsMode } from '../src/library.js';

test('aletas: sin aletas al principio, con aletas desde el bloque principal y sin volver a sacarlas', () => {
  for (const pool of [25, 50]) for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const r = quickWorkout({ ...defaultConfig(), pool }, { equipment: ['board', 'fins', 'buoy'], total: snapTotal(2000, pool), seed });
    const items = r.workout.items;
    assert.ok(items.every((i) => typeof i.fins === 'boolean'));
    assert.equal(items.filter((i) => i.block === 'warmup').every((i) => i.fins === false), true);
    let on = false;
    for (const it of items) {
      if (it.fins) { on = true; assert.notEqual(finsMode(BY_ID[it.exId]), 'never', it.name); } else assert.equal(on, false, 'se sacó las aletas en ' + it.name);
    }
    assert.ok(items.some((i) => i.fins), 'debería haber usado aletas');
    const v = vw(r.workout, { config: r.workout.config });
    assert.equal(v.warnings.filter((x) => x.code.startsWith('FINS')).length, 0);
  }
});

test('aletas: sin aletas en el material no se marca ninguna serie', () => {
  const r = quickWorkout(defaultConfig(), { equipment: ['board'], total: 1500, seed: 3 });
  assert.ok(r.workout.items.every((i) => i.fins === undefined));
});

test('aletas: editar propaga y el validador avisa si se las saca', () => {
  const r = quickWorkout(defaultConfig(), { equipment: ['fins', 'board'], total: 1500, seed: 9 });
  let w = setFinsStart(r.workout, 3);
  assert.deepEqual(w.items.map((i) => !!i.fins).slice(0, 4), [false, false, false, true]);
  w = { ...w, items: w.items.map((i, k) => (k === 5 ? { ...i, fins: false } : i)) };
  assert.ok(vw(w, { config: w.config }).warnings.some((x) => x.code === 'FINS_ORDER'));
  assert.ok(propagateFins(w).items.slice(3).every((i) => i.fins || finsMode(BY_ID[i.exId]) === 'never'));
});
