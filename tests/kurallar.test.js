import test from 'node:test';
import assert from 'node:assert/strict';
import { denetle, duzelt, hatalariUygula, kurallar } from '../docs/lib/kurallar.js';
import { yazimlar } from '../docs/lib/sozcukler.js';

const ornekler = {
  'de-da': ['Ben de katıldım. Evde yazdım. Bende bir kitap var. Okulda ders var.'],
  ki: ['Demek ki doğru. Evdeki ve yarınki işler. Belki çünkü oysaki mademki sanki halbuki hâlbuki meğerki.'],
  soru: ['Geldin mi? Geliyor musun? Resmi? Adımı? O birimi? Kimi?'],
  sozluk: ['Herkes doğru yazdı. Hiçbir şey yok. Bir şey gördüm. Kirpik. Her şey.'],
  'buyuk-harf': ['“İlk cümle.” İstanbul güzel. Prof. Dr. Ayşe geldi. e-posta gönderdik.'],
  'cift-bosluk': ['Bir örnek\n  Girintili satır\n'],
  'once-bosluk': ['Evet, geldim.\n...\nHayır!'],
  'sonra-bosluk': ['Evet, geldim. 3.14 ve 3,14. https://örnek.org/a.b. Dr. Kaya. “Geldin mi?”', 'Örnek metin.pdf dosyasında. 10.1234/örnek.parça'],
  'uc-nokta': ['Bekledim… Dört nokta....'],
  tirnak: ['“Bir” ve “iki”', '"Bir" ve "iki"'],
  'ozel-ad': ["Ankara’da, Ankara'da, İstanbul'da. ankarada. Burada. Ankara'daki buluşma."],
  'sayi-eki': ["2023'te, 2024’te. 2023 de geçti. 2024 için 12 adet örnek."],
  kisaltma: ['Prof. Dr. Kaya, örnekler vb. şeyler ve vs.'],
  tarih: ['12 Mart 2024 ve 29 Ekim. Bu mart ayında. 123 mart.'],
  'ay-adi': ['Bu mart ayında. Mart ayında yağmur yağar. 12 Mart ayında.'],
  'ardisik-tekrar': ['ve ya. sonuç, sonuç.\nsonuç\nsonuç.'],
  'uzun-cumle': [Array(39).fill('sözcük').join(' ') + '.', 'Kısa cümle. '.repeat(40)],
  'paragraf-tekrar': ['Sonuç önemli. Sonuç değişti.\n\nSonuç açık. Sonuç tartışıldı.'],
};

for (const kural of kurallar) {
  test(kural.kod + ' — pozitif örnek ve yanlış pozitiften kaçınma', () => {
    const etkin = new Set([kural.kod]);
    const bulgular = denetle(kural.yanlis, etkin);
    assert.ok(bulgular.length > 0, kural.yanlis);
    for (const b of bulgular) {
      assert.equal(b.alinti, kural.yanlis.slice(b.bas, b.bit));
      assert.ok(b.bas >= 0 && b.bit > b.bas);
      assert.equal(b.duzey, kural.duzey);
    }
    for (const dogru of [kural.dogru, ...ornekler[kural.kod]]) {
      assert.deepEqual(denetle(dogru, etkin), [], dogru);
    }
  });
}

test('Sözlükte 80’den fazla farklı düzeltme var ve sözlük girdileri yeniden tetiklenmiyor', () => {
  assert.ok(Object.keys(yazimlar).length >= 80);
  const etkin = new Set(['sozluk']);
  for (const [yanlis, dogru] of Object.entries(yazimlar)) {
    assert.equal(denetle(yanlis, etkin)[0]?.yeni, dogru, yanlis);
    assert.deepEqual(denetle(dogru, etkin), [], dogru);
  }
  assert.equal(denetle('Önce 😀 HERKEZ, sonra KİPRİK.', etkin)[1].yeni, 'KİRPİK');
  assert.deepEqual(denetle('https://herkez.org/herkez x@herkez.org', etkin), []);
});

test('Bağlaç ve soru eki için Türkçe uyum ve uyarı düzeyi', () => {
  const etkin = new Set(['de-da', 'soru']);
  const bulgular = denetle('Bende mi? Geldinmi? Olurmu? Gördünmü? Geliyormusun? Bumu? Kitabıda okudum.', etkin);
  assert.deepEqual(bulgular.map((b) => b.yeni), [
    'Ben de', 'Geldin mi', 'Olur mu', 'Gördün mü', 'Geliyor musun', 'Bu mu', 'Kitabı da',
  ]);
  assert.ok(bulgular.every((b) => b.duzey === 'uyarı'));
});

test('Toplu düzeltme etkin hataları uygular ve çakışan boşlukları çözer', () => {
  const metin = 'Herkez  ,geldi. Ankarada da geldinmi? Bekledim...';
  assert.equal(hatalariUygula(metin), 'Herkes, geldi. Ankarada da geldinmi? Bekledim...');
  assert.equal(hatalariUygula(metin, new Set(['sozluk'])), 'Herkes  ,geldi. Ankarada da geldinmi? Bekledim...');
  assert.deepEqual(denetle(metin, new Set()), []);
  assert.equal(denetle('Bekledim...').some((b) => b.kod === 'uc-nokta'), false);
});

test('Tekli düzeltme boşluğu silebilir ve eski konumda farklı içerik varsa uygulamaz', () => {
  const metin = 'Evet , geldim.';
  const bulgu = denetle(metin, new Set(['once-bosluk']))[0];
  assert.equal(duzelt(metin, bulgu), 'Evet, geldim.');
  assert.equal(duzelt('Evet, geldim.', bulgu), 'Evet, geldim.');
});

test('Belirli tarihte ay adının sonundaki kesmeyi ve eki korur', () => {
  const metin = 'Toplantı 12 mart’ta.';
  assert.equal(hatalariUygula(metin), 'Toplantı 12 Mart’ta.');
});
