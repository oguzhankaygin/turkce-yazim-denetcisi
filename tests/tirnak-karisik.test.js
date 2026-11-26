import test from 'node:test';
import assert from 'node:assert/strict';
import { denetle } from '../docs/lib/kurallar.js';

const tirnak = (metin) => denetle(metin).filter((b) => b.kod === 'tirnak');

test('bir ucu düz, öbür ucu tipografik tırnak yakalanır', () => {
  assert.equal(tirnak('"Merhaba” dedi.').length, 1);
  assert.equal(tirnak('“Merhaba" dedi.').length, 1);
});

test('tutarlı tırnaklar işaretlenmez', () => {
  assert.equal(tirnak('"Bir" ve "iki" dedi.').length, 0);
  assert.equal(tirnak('“Bir” ve “iki” dedi.').length, 0);
});
