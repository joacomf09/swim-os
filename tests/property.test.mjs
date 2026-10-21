import test from 'node:test';
import assert from 'node:assert/strict';
import { gen, cfg, sel, BY_ID, generateWorkout, validateWorkout, plannedMeters } from './helpers.mjs';
import { mulberry32 } from '../src/engine/rng.js';
import { EXERCISES } from '../src/library.js';

const GOALS = ['balanced', 'endurance', 'speed', 'technique', 'legs', 'arms', 'recovery', 'mix'];
const INT = ['easy', 'moderate', 'hard'];
const DIST = ['balanced', 'speed', 'endurance', 'technique'];
const LEVELS = ['beginner', 'intermediate', 'advanced'];
const EQ = [[], ['board'], ['board', 'buoy'], ['board', 'buoy', 'paddles', 'fins', 'snorkel'], ['buoy']];
const TOTALS = [500, 750, 1000, 1250, 1500, 1750, 2000, 2500, 3000];
const CATS = ['styles', 'arms', 'legs', 'technique', 'speed', 'endurance'];

test('propiedad: 400 configuraciones aleatorias → nunca error, siempre suma exacta, nunca material ausente', () => {
  const r = mulberry32(2024);
  const pick = (a) => a[Math.floor(r() * a.length)];
  let generated = 0, rejected = 0;
  for (let i = 0; i < 400; i++) {
    const pool = pick([25, 25, 50]);
    const cats = CATS.filter(() => r() < 0.6);
    const ids = EXERCISES.filter(() => r() < 0.08).map((e) => e.id);
    const config = cfg({
      total: pick(TOTALS), pool, seed: 1 + Math.floor(r() * 1e6), goal: pick(GOALS), intensity: pick(INT),
      distribution: pick(DIST), level: pick(LEVELS), equipment: pick(EQ), allowNoGear: r() < 0.5,
      selection: sel(cats, ids), restMode: pick(['short', 'normal', 'long']),
    });
    const res = generateWorkout(config);
    if (!res.ok) { rejected++; assert.ok(res.diagnosis.errors.length > 0 && res.diagnosis.errors[0].message, 'sin explicación'); continue; }
    generated++;
    const w = res.workout;
    const v = validateWorkout(w, { config: w.config, strict: true });
    assert.deepEqual(v.errors, [], `cfg ${JSON.stringify(config)}`);
    assert.equal(plannedMeters(w.items), config.total);
    for (const it of w.items) {
      assert.equal(it.dist % (pool * (BY_ID[it.exId].unitMult || 1)), 0);
      assert.ok(it.reps >= 1 && it.rest >= 0 && it.rpe >= 1 && it.rpe <= 10);
    }
  }
  assert.ok(generated > 250, `solo ${generated} generadas (${rejected} rechazadas)`);
});

test('propiedad: los sprints nunca van sin preparación ni más de dos fuertes seguidos (config. estándar)', () => {
  for (let seed = 1; seed <= 150; seed++) {
    const w = gen({ seed, goal: GOALS[seed % 8], intensity: INT[seed % 3], total: TOTALS[seed % 9] });
    const v = validateWorkout(w, { config: w.config });
    assert.ok(!v.warnings.some((x) => x.code === 'PREP' || x.code === 'CONSECUTIVE'), `seed ${seed}: ${v.warnings.map((x) => x.message)}`);
  }
});

test('propiedad: repetición razonable con selección amplia', () => {
  for (let seed = 1; seed <= 100; seed++) {
    const w = gen({ seed, selection: sel(CATS, ['style-free']), total: 2000, equipment: ['board', 'buoy', 'paddles', 'fins'] });
    const counts = new Map();
    for (const it of w.items) counts.set(it.exId + it.variantId, (counts.get(it.exId + it.variantId) || 0) + 1);
    assert.ok(Math.max(...counts.values()) <= 2, `seed ${seed}`);
  }
});

test('propiedad: principiante nunca recibe ejercicios avanzados por categoría', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const w = gen({ seed, level: 'beginner', selection: sel(CATS, []) });
    for (const it of w.items) assert.ok(BY_ID[it.exId].difficulty <= 1, `${it.name} seed ${seed}`);
  }
});

test('propiedad: pocas series enormes no aparecen (volumen por serie razonable)', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const w = gen({ seed, total: 3000 });
    assert.ok(w.items.length >= 4);
    assert.ok(w.items.every((i) => i.reps * i.dist <= 1200));
  }
});
