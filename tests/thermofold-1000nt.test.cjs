'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../tools/seqfold/thermofold-core.js');

test('full-sequence restricted-model input supports 1,000 nt', () => {
  assert.equal(T.MAX, 1000);
  assert.equal(T.LONG_MAX, 10000);
  assert.equal(T.normalize('ACGU'.repeat(250)).length, 1000);
  assert.throws(() => T.normalize('A'.repeat(1001)), /1,000/);
});

test('global folding reports progress and returns complete structure', () => {
  let progress;
  const sequence = 'GCAU'.repeat(75);
  const result = T.fold(sequence, {onProgress: p => { progress = p; }});
  assert.equal(result.length, 300);
  assert.equal(result.dotBracket.length, sequence.length);
  assert.ok(Number.isFinite(result.deltaG37));
  assert.equal(progress.phase, 'global');
  assert.equal(progress.completed, 300);
  assert.equal(progress.total, 300);
});

test('RNA above 1,000 nt remains explicitly segmented, not global MFE', () => {
  const input = 'ACGU'.repeat(250) + 'A';
  assert.equal(T.normalizeLong(input).length, 1001);
  const result = T.foldWindowed(input);
  assert.equal(result.length, 1001);
  assert.equal(result.dotBracket.length, 1001);
  assert.equal(result.mode, 'independent-windows');
  assert.equal(result.windowCount, 6);
  assert.equal(result.globalMFE, false);
  assert.equal(result.deltaG37, null);
  assert.deepEqual(result.windows.map(x => [x.start, x.end]),
    [[1,200],[201,400],[401,600],[601,800],[801,1000],[1001,1001]]);
});

test('10,001 nt is rejected as beyond input capacity', () => {
  assert.throws(() => T.normalizeLong('A'.repeat(10001)), /10,000/);
});

// Manual or opt-in CI regression: run with NEXUS_HEAVY_FOLD_TEST=1.
// Real 1,000-nt global MFE is resource-intensive in client-side JS.
test('full 1,000-nt MFE end-to-end', {skip: !process.env.NEXUS_HEAVY_FOLD_TEST}, () => {
  const seq = 'GCAU'.repeat(250);
  const r = T.fold(seq);
  assert.equal(r.length, 1000);
  assert.equal(r.dotBracket.length, 1000);
  assert.ok(Number.isFinite(r.deltaG37));
});
