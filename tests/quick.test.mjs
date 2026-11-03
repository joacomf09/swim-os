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
