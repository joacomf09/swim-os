import test from 'node:test';
import assert from 'node:assert/strict';
import { isNewer, parseRemote } from '../src/update.js';

test('isNewer compara numéricamente por segmentos', () => {
  assert.equal(isNewer('2.2', '2.1'), true);
  assert.equal(isNewer('2.10', '2.9'), true);
  assert.equal(isNewer('2.1', '2.1'), false);
  assert.equal(isNewer('2.0.1', '2.0'), true);
  assert.equal(isNewer('2.0', '2.1'), false);
  assert.equal(isNewer('3', '2.9.9'), true);
});
test('parseRemote solo acepta versiones válidas', () => {
  assert.equal(parseRemote({ version: '2.2' }), '2.2');
  assert.equal(parseRemote({ version: 'x' }), null);
  assert.equal(parseRemote(null), null);
  assert.equal(parseRemote({}), null);
});
