import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateScore } from './score.js';

test('korrektne tulemus läbib ja nimest eemaldatakse tühikud', () => {
  assert.deepEqual(validateScore({ name: '  Samuel ', balance: 1500, hands: 12 }), {
    score: { name: 'Samuel', balance: 1500, hands: 12 },
  });
});

test('tühi või liiga pikk nimi ei läbi', () => {
  assert.ok(validateScore({ name: '   ', balance: 100, hands: 1 }).error);
  assert.ok(validateScore({ name: 'x'.repeat(21), balance: 100, hands: 1 }).error);
});

test('saldo peab olema täisarv vahemikus 0 kuni 1000000', () => {
  assert.ok(validateScore({ name: 'A', balance: -5, hands: 1 }).error);
  assert.ok(validateScore({ name: 'A', balance: 10.5, hands: 1 }).error);
  assert.ok(validateScore({ name: 'A', balance: '500', hands: 1 }).error);
  assert.ok(validateScore({ name: 'A', balance: 2_000_000, hands: 1 }).error);
});

test('enne salvestamist peab olema vähemalt üks käsi mängitud', () => {
  assert.ok(validateScore({ name: 'A', balance: 1000, hands: 0 }).error);
});

test('puuduv body ei too serverit maha', () => {
  assert.ok(validateScore(null).error);
});
