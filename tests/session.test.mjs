import test from 'node:test';
import assert from 'node:assert/strict';
import { gen } from './helpers.mjs';
import * as S from '../src/engine/session.js';
import * as H from '../src/engine/history.js';
import { estimateItems, estimateFromTotal, measuredPace } from '../src/engine/estimate.js';

const T0 = 1_000_000;

test('sesión: INICIAR → FINALIZAR SERIE registra tiempo real y pasa a descanso', () => {
  const w = gen({ seed: 1 });
  let s = S.createSession(w, T0);
  assert.equal(s.phase, 'ready');
  s = S.start(s, T0 + 1000);
  assert.equal(S.phaseElapsed(s, T0 + 31000), 30000);
  s = S.finishRep(s, T0 + 31000);
  assert.equal(s.phase, 'rest');
  assert.equal(s.log[0].swimMs, 30000);
  assert.equal(S.restRemainingMs(s, T0 + 31000 + 5000), s.steps[0].rest * 1000 - 5000);
});

test('sesión: la pausa congela el tiempo y el reloj usa marcas reales (pestaña en segundo plano)', () => {
  let s = S.start(S.createSession(gen({ seed: 2 }), T0), T0);
  s = S.pause(s, T0 + 10000);
  assert.equal(S.phaseElapsed(s, T0 + 999999), 10000);
  s = S.resume(s, T0 + 70000);
  assert.equal(S.phaseElapsed(s, T0 + 80000), 20000);
  assert.equal(S.totalElapsed(s, T0 + 80000), 20000);
  // simula recarga: serializar y restaurar no pierde el tiempo
  const back = S.restoreSession(JSON.stringify(s));
  assert.equal(S.phaseElapsed(back, T0 + 80000), 20000);
});

test('sesión: saltar descanso, siguiente y anterior', () => {
  let s = S.start(S.createSession(gen({ seed: 3 }), T0), T0);
  s = S.finishRep(s, T0 + 20000);
  s = S.skipRest(s, T0 + 22000);
  assert.equal(s.idx, 1);
  assert.equal(s.phase, 'ready');
  s = S.next(s, T0 + 23000);
  assert.equal(s.idx, 2);
  assert.ok(s.log.some((l) => l.idx === 1 && l.skipped));
  s = S.prev(s, T0 + 24000);
  assert.equal(s.idx, 1);
  assert.equal(s.log.find((l) => l.idx === 1), undefined);
});

test('sesión: completa toda la rutina y el resumen coincide con lo medido', () => {
  const w = gen({ seed: 4 });
  let s = S.createSession(w, T0);
  let t = T0;
  while (s.phase !== 'done') {
    s = S.start(s, t);
    t += 40000;
    s = S.finishRep(s, t);
    if (s.phase === 'rest') { t += 5000; s = S.skipRest(s, t); }
  }
  const sum = S.summarize(s, t);
  assert.equal(sum.meters, 1500);
  assert.equal(sum.completed, true);
  assert.equal(sum.compliance, 100);
  assert.equal(sum.activeSeconds, s.steps.length * 40);
  assert.equal(sum.pace100, Math.round((s.steps.length * 40 / 1500) * 100 * 10) / 10);
});

test('sesión: terminar antes registra solo lo nadado y no inventa ritmo', () => {
  let s = S.start(S.createSession(gen({ seed: 5 }), T0), T0);
  s = S.finishSession(s, T0 + 5000);
  const sum = S.summarize(s, T0 + 5000);
  assert.equal(sum.completed, false);
  assert.equal(sum.pace100, null);
});

test('sesión: la instantánea no cambia si se edita la rutina original', () => {
  const w = gen({ seed: 6 });
  const s = S.createSession(w, T0);
  w.items[0].reps = 99;
  assert.notEqual(s.workout.items[0].reps, 99);
});

test('restoreSession descarta datos corruptos', () => {
  assert.equal(S.restoreSession('{no json'), null);
  assert.equal(S.restoreSession({ v: 2, steps: [], idx: 0, phase: 'swim' }), null);
});

test('historial: guarda, migra el formato 1.x y calcula estadísticas', () => {
  const store = H.createStore(H.memoryBackend());
  store.set(H.KEYS.history, [{ id: 111, date: 111, meters: 1500, total: 3600000, active: 1500000, rest: 600000, pace: 100000, sets: 20, compliance: 100, pool: 25 }]);
  let list = H.loadHistory(store);
  assert.equal(list.length, 1);
  assert.equal(list[0].pace100, 100);
  assert.equal(list[0].activeSeconds, 1500);

  const w = gen({ seed: 7 });
  let s = S.start(S.createSession(w, T0), T0);
  let t = T0;
  while (s.phase !== 'done') { t += 30000; s = S.finishRep(s, t); if (s.phase === 'rest') s = S.skipRest(s, t); if (s.phase === 'ready') s = S.start(s, t); }
  const entry = H.makeEntry(s, S.summarize(s, t));
  list = H.saveEntry(store, entry);
  assert.equal(list.length, 2);
  const st = H.computeStats(list, { now: T0 + 1e9 });
  assert.equal(st.sessions, 2);
  assert.equal(st.meters, 3000);
  assert.ok(st.strokes.length > 0);
  assert.equal(st.measuredSessions, 2);
});

test('historial: sin ritmo medido no se inventa ritmo', () => {
  const st = H.computeStats([{ date: 1, meters: 500, pace100: null, activeSeconds: 0, totalSeconds: 600, log: [] }], { now: 2 });
  assert.equal(st.avgPace, null);
  assert.equal(st.bestPace, null);
});

test('favoritos y preferencias', () => {
  const store = H.createStore(H.memoryBackend());
  const w = gen({ seed: 8 });
  H.addFavorite(store, w);
  assert.equal(H.loadFavorites(store).length, 1);
  H.removeFavorite(store, H.loadFavorites(store)[0].id);
  assert.equal(H.loadFavorites(store).length, 0);
  store.set(H.KEYS.prefs, { level: 'advanced', pool: 50 });
  const c = H.configFromPrefs(H.loadPrefs(store));
  assert.equal(c.level, 'advanced');
  assert.equal(c.pool, 50);
});

test('migración de la rutina 1.x conserva los 1.500 m', () => {
  const old = { target: 1500, pool: 25, exercises: [
    { id: 'e1', type: 'crol', block: 'w', reps: 1, dist: 100, rest: 15, name: 'Crol suave' },
    { id: 'e8', type: 'sprint', block: 't', reps: 4, dist: 25, rest: 30, name: 'Sprint' },
    { id: 'e10', type: 'endurance', block: 'r', reps: 1, dist: 300, rest: 45, name: 'Crol continuo' },
  ] };
  const w = H.migrateOldWorkout(old);
  assert.equal(w.items.reduce((a, i) => a + i.reps * i.dist, 0), 500);
  assert.equal(w.v, 2);
});

test('estimación: orientativa sin historial, medida con historial', () => {
  const w = gen({ seed: 9 });
  const a = estimateItems(w.items, { level: 'intermediate' });
  assert.equal(a.source, 'orientative');
  assert.ok(a.minutes > 15 && a.minutes < 120);
  const hist = [{ meters: 1000, activeSeconds: 1000 }];
  assert.ok(measuredPace(hist) === 100);
  assert.equal(estimateFromTotal(1500, { history: hist }).source, 'history');
  assert.equal(estimateFromTotal(1500).source, 'orientative');
});
