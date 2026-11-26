import test from 'node:test';
import assert from 'node:assert/strict';
import { cumleler, istatistik } from '../docs/lib/metin.js';

test('Ateşman formülü iki cümlede ve Türkçe ünlülerle hesaplanır', () => {
  const s = istatistik('İki kişi. Işık gördü.');
  assert.deepEqual([s.sozcuk, s.cumle, s.hece, s.ortalama], [4, 2, 8, 2]);
  assert.ok(Math.abs(s.atesman - 113.255) < 0.000001);
  assert.equal(istatistik('Hâl, kâğıt, rüzgâr, millî, sükûn.').hece, 9);
  assert.equal(istatistik('I\u0307ki').hece, 2);
});

test('Kısaltmalar, ondalık sayılar, ardışık noktalama ve paragraf sınırları', () => {
  const metin = 'Prof. Dr. Kaya 3.14 yazdı... “Gördünüz mü?!”\r\n\r\nSon paragraf';
  assert.deepEqual(cumleler(metin).map(({ bas, bit }) => metin.slice(bas, bit)),
    ['Prof. Dr. Kaya 3.14 yazdı...', '“Gördünüz mü?!”', 'Son paragraf']);
  assert.equal(istatistik('https://örnek.org/a.b. Sonra döndük.').cumle, 2);
});

test('Boş metinde veya yalnızca rakam olduğunda puan gösterilmez', () => {
  for (const metin of ['', '  \n\t', '2026 ...']) {
    assert.deepEqual(istatistik(metin), { sozcuk: 0, cumle: 0, hece: 0, ortalama: 0, atesman: null });
  }
});
