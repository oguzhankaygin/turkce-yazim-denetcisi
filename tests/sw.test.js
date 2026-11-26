import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

test('service worker önbellek listesindeki her dosya mevcut', () => {
  const sw = readFileSync(new URL('../docs/sw.js', import.meta.url), 'utf8');
  const liste = JSON.parse(sw.match(/const DOSYALAR = (\[[^\]]*\])/)[1]);
  for (const dosya of liste.filter((d) => d !== './')) {
    assert.ok(existsSync(new URL('../docs/' + dosya, import.meta.url)), dosya);
  }
});
