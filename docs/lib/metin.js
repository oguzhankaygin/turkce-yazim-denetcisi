export const kucult = (metin) => metin.normalize('NFC').toLocaleLowerCase('tr');
export const buyult = (metin) => metin.toLocaleUpperCase('tr');
export const kisaltma = /(?<![\p{L}\p{N}])(?:Prof|Doç|Dr|Av|Arş|Gör|Öğr|Sn|bkz|örn|vb|vs|vd|yy|No|[A-ZÇĞİÖŞÜ])\./gu;
export const teknik = /(?:https?:\/\/|www\.)[^\s<>"“”]+|(?<![\w.+-])[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b10\.\d{4,9}\/[^\s<>"“”]+|(?<![\p{L}\p{N}_-])[\p{L}\p{N}_-]+\.(?:pdf|docx?|xlsx?|pptx?|txt|csv|html|org|com|edu|gov|net)(?![\p{L}\p{N}_-])/giu;

export function sozcukler(metin) {
  return [...metin.matchAll(/\p{L}[\p{L}\p{M}]*(?:['’]\p{L}[\p{L}\p{M}]*)*/gu)];
}

export function cumleler(metin) {
  const duz = maskele(metin, teknik, (parca) => parca.replace(/[.!?…]+$/, ''));
  const korumali = maskele(duz, kisaltma, (parca, son) =>
    /^(?:vb|vs|vd)\.$/.test(parca) && /^\s+\p{Lu}/u.test(metin.slice(son)) ? '' : parca);
  const sinirlar = maskele(korumali, /(?<=\d)\.(?=\d)/g);
  const sonuc = [];
  let bas = 0;
  for (const son of sinirlar.matchAll(/[.!?…]+[”"’')\]]*|\r?\n[ \t]*\r?\n/g)) {
    const bit = son.index + son[0].length;
    ekle(bit);
  }
  ekle(metin.length);
  return sonuc;

  function ekle(bit) {
    const parca = metin.slice(bas, bit);
    if (sozcukler(parca).length) {
      const on = parca.length - parca.trimStart().length;
      sonuc.push({ bas: bas + on, bit: bas + parca.trimEnd().length });
    }
    bas = bit;
  }
}

export function maskele(metin, desen, korunacak = (parca) => parca) {
  return metin.replace(desen, (parca, konum) => {
    const uzunluk = korunacak(parca, konum + parca.length).length;
    return '_'.repeat(uzunluk) + parca.slice(uzunluk);
  });
}

export function istatistik(metin) {
  const kelimeler = sozcukler(metin);
  const sozcuk = kelimeler.length;
  const cumle = cumleler(metin).length;
  const hece = kelimeler.reduce((toplam, [kelime]) =>
    toplam + (kucult(kelime).match(/[aeıioöuüâîû]/g)?.length ?? 0), 0);
  const ortalama = cumle ? sozcuk / cumle : 0;
  const atesman = sozcuk && cumle ? 198.825 - 40.175 * hece / sozcuk - 2.610 * ortalama : null;
  return { sozcuk, cumle, hece, ortalama, atesman };
}

export function harfBicimi(eski, yeni) {
  if (eski === buyult(eski)) return buyult(yeni);
  if (eski[0] === buyult(eski[0])) return buyult(yeni[0]) + yeni.slice(1);
  return yeni;
}
