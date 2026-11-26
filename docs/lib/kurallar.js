import { buyult, cumleler, harfBicimi, kisaltma, kucult, maskele, sozcukler, teknik } from './metin.js';
import { yazimlar } from './sozcukler.js';

const SINIR = String.raw`[\p{L}\p{M}\p{N}'’]`;
const tam = (desen, bayrak = 'gu') => new RegExp(
  '(?<!' + SINIR + ')(?:' + desen + ')(?!' + SINIR + ')', bayrak);
const esles = (metin, desen, duzelt) => Array.from(metin.matchAll(desen), (m) => ({
  bas: m.index, bit: m.index + m[0].length, yeni: duzelt(m),
})).filter(({ yeni }) => yeni !== null);

const sozluk = tam(Object.keys(yazimlar).sort((a, b) => b.length - a.length)
  .map((kelime) => [...kelime].map((harf) =>
    harf === 'i' ? '[iİ]' : harf === 'ı' ? '[ıI]' : harf === ' ' ? ' ' :
      '[' + harf + buyult(harf) + ']').join('')).join('|'));

const aylar = 'ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık';
const ayDeseni = aylar.split('|').map((ay) => '[' + ay[0] + buyult(ay[0]) + ']' + ay.slice(1)).join('|');
const tarih = new RegExp('(?<!' + SINIR + ')(0?[1-9]|[12][0-9]|3[01])([ \\t]+)(' + aylar + ')(?![\\p{L}\\p{M}\\p{N}])', 'gu');
const belirsizAy = tam('(' + ayDeseni + ')(?=[ \\t]+ay(?:ı(?:nda|nın|na|ndan)?|larında)' + '(?!' + SINIR + '))');
const noktalama = 'Noktalama İşaretleri';
const buyukHarf = 'Büyük Harflerin Kullanıldığı Yerler';
const kural = (kod, ad, duzey, aciklama, yanlis, dogru, konu, tara, varsayilan = true) =>
  ({ kod, ad, duzey, aciklama, yanlis, dogru, konu, kaynak: 'TDK Yazım Kılavuzu · ' + konu, tara, varsayilan });

export const kurallar = [
  kural('de-da', 'Bağlaç olan de / da', 'uyarı',
    'Kontrol et. “Dahi” anlamı varsa de veya da ayrı yazılır. Bulunma eki bitişik yazılır.',
    'Bende katıldım.', 'Ben de katıldım.', 'Bağlaç Olan da / de’nin Yazılışı',
    ({ duz }) => esles(duz, tam('(ben|sen|biz|siz|o|onlar|bunlar|şunlar|kitabı|ödevi|raporu|konuyu|ayrıca)(de|da)(?=[ \\t]+(?:m[ıiuü](?!' + SINIR + ')|katıl|gel|git|ist[ei]|yap|yaz|oku|düşün|gör|varım|incele))', 'giu'),
      ([, govde, ek]) => govde + ' ' + ek)),
  kural('ki', 'Bağlaç olan ki', 'hata',
    'Bağlaç olan ki ayrı yazılır. Kalıplaşmış sözcükler ve aitlik eki bitişik kalır.',
    'Demekki doğru.', 'Demek ki doğru.', 'Bağlaç Olan ki’nin Yazılışı',
    ({ duz }) => esles(duz, tam('(demek|dedi|deyince|belli|yeter|iyi|neyse|öyle|şöyle|kaldı|sanırım|tabii|diyorlar|gördüm|anladım|düşünüyorum)ki', 'giu'),
      ([kelime, govde]) => govde + (kelime === buyult(kelime) ? ' Kİ' : ' ki'))),
  kural('soru', 'Soru eki', 'uyarı',
    'Kontrol et. Soru eki ayrı, ardından gelen kişi ve zaman ekleri bitişik yazılır.',
    'Geldinmi?', 'Geldin mi?', 'Soru Eki mı / mi / mu / mü’nün Yazılışı',
    ({ duz }) => esles(duz, tam('([\\p{L}\\p{M}]{2,})(m[ıiuü](?:s[ıiuü]n(?:[ıiuü]z)?|y[ıiuü](?:m|z)|yd[ıiuü](?:m|n|k|n[ıiuü]z)?|ym[ıiuü]ş(?:[ıiuü]m|s[ıiuü]n)?|l[ae]r)?)(?=[ \\t]*\\?)', 'gu'),
      ([kelime, govde, ek]) => {
        if (/^(?:adımı|adamı|soyadımı|yardımı|terimi|resmi|ismi)$/u.test(kucult(kelime))) return null;
        const kok = kucult(govde);
        const sonUnlu = kok.match(/[aeıioöuü](?!.*[aeıioöuü])/)?.[0];
        const uyum = { a: 'ı', ı: 'ı', e: 'i', i: 'i', o: 'u', u: 'u', ö: 'ü', ü: 'ü' };
        const fiil = /(?:d[ıiuü](?:m|n|k|n[ıiuü]z|l[ae]r)?|[ct][ae]k|yor(?:um|sun|uz|sunuz|lar)?|[aıiuüe]r|[ae]z|m[ıiuü]ş(?:[ıiuü]m|s[ıiuü]n)?|d[ıiuü]r|t[ıiuü]r)$/u;
        return uyum[sonUnlu] === ek[1] && (ek.length > 2 || fiil.test(kok) ||
          /^(?:bu|şu|siz|sen|ben|güzel|doğru|yanlış|iyi|kötü|var|yok|evet|hayır)$/.test(kok))
          ? govde + ' ' + ek : null;
      })),
  kural('sozluk', 'Sık yanlış yazılan sözcükler', 'hata',
    'Bu yazım, sık karşılaşılan yanlışlar sözlüğünde yer alıyor.',
    'Herkez', 'Herkes', 'Ayrı Yazılan Birleşik Kelimeler ve Bitişik Yazılan Birleşik Kelimeler',
    ({ duz }) => esles(duz, sozluk, ([kelime]) => harfBicimi(kelime, yazimlar[kucult(kelime)]))),
  kural('buyuk-harf', 'Cümle başında büyük harf', 'uyarı',
    'Kontrol et. Normal bir cümlenin ilk harfi büyük yazılır.',
    'herkes geldi.', 'Herkes geldi.', buyukHarf,
    ({ cumle, metin, duz }) => cumle.flatMap(({ bas, bit }) => {
      const harf = /^[“"‘'(]*([\p{Ll}])/u.exec(duz.slice(bas, bit));
      if (!harf || /^(?:e-posta|iPhone|iPad|e-Devlet)\b/u.test(metin.slice(bas, bit))) return [];
      const konum = bas + harf[0].length - harf[1].length;
      return [{ bas: konum, bit: konum + harf[1].length, yeni: buyult(harf[1]) }];
    })),
  kural('cift-bosluk', 'Çift boşluk', 'hata',
    'Düz metinde sözcükler arasında tek boşluk bırakılır.',
    'Bir  örnek', 'Bir örnek', noktalama,
    ({ duz }) => esles(duz, /(?<=[^\s]) {2,}(?=[^\s])/g, () => ' ')),
  kural('once-bosluk', 'Noktalama öncesinde boşluk', 'hata',
    'Noktalama işaretini önceki sözcüğe bitişik yazın.',
    'Evet , geldim.', 'Evet, geldim.', noktalama,
    ({ duz }) => esles(duz, /(?<=[\p{L}\p{M}\p{N})\]”])[ \t]+(?=[.,;:!?…])/gu, () => '')),
  kural('sonra-bosluk', 'Noktalama sonrasında boşluk', 'hata',
    'Noktalama işaretinden sonra metin devam ediyorsa boşluk bırakın.',
    'Evet,geldim.', 'Evet, geldim.', noktalama,
    ({ duz }) => {
      const korumali = maskele(duz, kisaltma, (parca, bit) =>
        /^(?:Prof|Doç|Dr|Arş|Gör|Öğr|Av|Sn|bkz|örn)\.$/.test(parca) && /^\p{L}/u.test(duz.slice(bit)) ? '' : parca);
      return esles(korumali, /(?<=[\p{L}\p{M}\p{N}_)”])(?:\.{3}|[.,;:!?…])(?=\p{L})/gu,
        ([isaret]) => isaret + ' ');
    }),
  kural('uc-nokta', 'Üç nokta karakteri', 'öneri',
    'Üç nokta için tek … karakterini tercih edebilirsiniz.',
    'Bekledim...', 'Bekledim…', 'Üç Nokta',
    ({ duz }) => esles(duz, /(?<!\.)\.{3}(?!\.)/g, () => '…'), false),
  kural('tirnak', 'Tırnak tutarlılığı', 'öneri',
    'Metinde düz ve tipografik çift tırnaklar karışık. Aynı biçimi kullanabilirsiniz.',
    '"Bir" ve “iki”', '“Bir” ve “iki”', 'Tırnak İşareti',
    // Düz çiftler (metinde tipografik tırnak da varsa) ve bir ucu düz, öbür ucu tipografik karışık çiftler.
    ({ duz, metin }) => esles(duz, /"[^"“”\r\n]+"|"[^"“”\r\n]+”|“[^"“”\r\n]+"/g,
      (m) => '“' + metin.slice(m.index + 1, m.index + m[0].length - 1) + '”')
      .filter((b) => /[“”]/.test(duz) || !/^"[^"]*"$/.test(duz.slice(b.bas, b.bit)))),
  kural('ozel-ad', 'Özel adlarda kesme işareti', 'uyarı',
    'Kontrol et. Özel ada gelen durum ekini kesme işaretiyle ayırın.',
    'Ankarada', "Ankara'da", 'Kesme İşareti',
    ({ duz }) => esles(duz, tam('(Ankara|İstanbul|İzmir|Bursa|Antalya|Konya|Edirne|Türkiye|Atatürk|Ayşe|Ahmet|Mehmet|Zeynep)((?:[dt][ae]n?)|(?:[y]?[aeıiuü])|(?:[n]?[ıiuü]n))'),
      ([, ad, ek]) => ad + "'" + ek)),
  kural('sayi-eki', 'Sayıların ekleri', 'hata',
    'Rakamla yazılan sayıya gelen çekim ekini kesme işaretiyle ayırın.',
    '2023te', "2023'te", 'Kesme İşareti',
    ({ duz }) => esles(duz, tam('(\\d+)([ \\t]*)([dt][ae]n|[dt][ae]|[yn][aeıiuü]|[n]?[ıiuü]n|[ıiuü]nc[ıiuü])'),
      ([, sayi, bosluk, ek]) => bosluk && /^(?:da|de)$/.test(ek) ? null : sayi + "'" + ek)),
  kural('kisaltma', 'Kısaltmalarda nokta', 'uyarı',
    'Kontrol et. Örnekteki türden kısaltmalarda nokta kullanılır.',
    'Prof Dr Kaya', 'Prof. Dr. Kaya', 'Kısaltmalar',
    ({ duz }) => esles(duz, tam('(?:Prof|Doç|Dr)(?!\\.)(?=[ \\t]+\\p{Lu})|(?:vb|vs)(?!\\.)(?=[ \\t]*[,;:!?\\n)]|[ \\t]*$)'),
      ([kelime]) => kelime + '.')),
  kural('tarih', 'Belirli tarihte ay adı', 'hata',
    'Gün numarasıyla belirtilen tarihte ay adı büyük harfle başlar.',
    '12 mart 2024', '12 Mart 2024', buyukHarf,
    ({ duz }) => esles(duz, tarih, ([, gun, ara, ay]) => gun + ara + harfBicimi('Ay', ay))),
  kural('ay-adi', 'Genel kullanımda ay adı', 'uyarı',
    'Kontrol et. Belirli tarih ifade etmeyen ay adı cümle içinde küçük harfle başlar.',
    'Bu Mart ayında', 'Bu mart ayında', buyukHarf,
    ({ duz, cumle }) => {
      const baslar = new Set(cumle.map(({ bas }) => bas + (duz.slice(bas).match(/^[“"‘'(]*/)?.[0].length ?? 0)));
      return esles(duz, belirsizAy, (m) =>
        m[0] === kucult(m[0]) || baslar.has(m.index) ||
        /(?:\d[ \t]+|\b(?:birinci|ikinci|üçüncü|on|yirmi|otuz|bir|iki|üç|dört|beş|altı|yedi|sekiz|dokuz)[ \t]+)$/iu.test(duz.slice(Math.max(0, m.index - 24), m.index))
          ? null : kucult(m[0]));
    }),
  kural('ardisik-tekrar', 'Art arda aynı sözcük', 'uyarı',
    'Kontrol et. İkileme veya bilinçli bir vurguysa bu tekrarı koruyun.',
    've ve', 've', 'İkilemelerin Yazılışı',
    ({ duz }) => ardisikTekrar(duz)),
  kural('uzun-cumle', 'Uzun cümle', 'uyarı',
    'Editoryal ölçüt. Cümle 40 veya daha fazla sözcük içeriyor. Bölmeyi değerlendirin.',
    'Bu çalışmada öğrencilerin okuma alışkanlıklarını anlamak için farklı okullardan toplanan anket yanıtları, öğretmenlerle yapılan görüşmeler ve dönem boyunca tutulan gözlem notları birlikte değerlendirilmiş, elde edilen bulgular önce sınıf düzeyine göre karşılaştırılmış, ardından okul koşulları ve aile desteği bakımından yeniden yorumlanmıştır.',
    'Çalışmada anket yanıtları, görüşmeler ve gözlem notları birlikte değerlendirildi. Bulgular önce sınıf düzeyine göre karşılaştırıldı. Ardından okul koşulları ve aile desteği bakımından yorumlandı.', 'Nokta',
    ({ metin, cumle }) => cumle.filter(({ bas, bit }) => sozcukler(metin.slice(bas, bit)).length >= 40)),
  kural('paragraf-tekrar', 'Paragrafta sık tekrar', 'öneri',
    'Editoryal ölçüt. Bir sözcük paragrafta en az dört kez geçiyor ve sözcüklerin en az %10’unu oluşturuyor.',
    'Bu sonuç önemli. Sonuç açık. Sonuç tartışıldı. Sonuç değişmedi.',
    'Bu sonuç önemli ve açık. Tartışmadan sonra da değişmedi.', 'İkilemelerin Yazılışı',
    ({ duz }) => paragrafTekrari(duz)),
];

function ardisikTekrar(duz) {
  const sonuc = [];
  let onceki;
  let tekrar;
  for (const kelime of sozcukler(duz)) {
    if (onceki && kucult(onceki[0]) === kucult(kelime[0]) &&
        /^[ \t]+$/.test(duz.slice(onceki.index + onceki[0].length, kelime.index))) {
      if (!tekrar) {
        tekrar = { bas: onceki.index, yeni: onceki[0] };
        sonuc.push(tekrar);
      }
      tekrar.bit = kelime.index + kelime[0].length;
    } else {
      tekrar = null;
    }
    onceki = kelime;
  }
  return sonuc;
}

function paragrafTekrari(duz) {
  const sonuc = [];
  for (const paragraf of duz.matchAll(/(?:[^\r\n]+(?:\r?\n(?![ \t]*\r?\n|$))?)+/g)) {
    const sayim = new Map();
    const kelimeler = sozcukler(paragraf[0]);
    for (const [kelime] of kelimeler) {
      const anahtar = kucult(kelime);
      sayim.set(anahtar, (sayim.get(anahtar) ?? 0) + 1);
    }
    const gosterilen = new Set();
    for (const kelime of kelimeler) {
      const anahtar = kucult(kelime[0]);
      const adet = sayim.get(anahtar);
      if (anahtar.length < 4 || adet < 4 || adet / kelimeler.length < 0.1 || gosterilen.has(anahtar)) continue;
      const bas = paragraf.index + kelime.index;
      sonuc.push({ bas, bit: bas + kelime[0].length, ayrinti: 'Bu paragrafta ' + adet + ' kez geçiyor.' });
      gosterilen.add(anahtar);
    }
  }
  return sonuc;
}

export const konumaGore = (a, b) => a.bas - b.bas || a.bit - b.bit;

export function denetle(metin, etkin = new Set(kurallar.filter((k) => k.varsayilan).map((k) => k.kod))) {
  const duz = maskele(metin, teknik, (parca) => parca.replace(/[.!?…,;:]+$/, ''));
  const baglam = { metin, duz, cumle: cumleler(metin) };
  return kurallar.filter(({ kod }) => etkin.has(kod)).flatMap((k) =>
    k.tara(baglam).map((bulgu) => ({
      ...bulgu, kod: k.kod, ad: k.ad, duzey: k.duzey, aciklama: k.aciklama,
      kaynak: 'Kural', alinti: metin.slice(bulgu.bas, bulgu.bit),
    }))).sort(konumaGore);
}

export function duzelt(metin, bulgu) {
  if (typeof bulgu.yeni !== 'string' || metin.slice(bulgu.bas, bulgu.bit) !== bulgu.alinti) return metin;
  return metin.slice(0, bulgu.bas) + bulgu.yeni + metin.slice(bulgu.bit);
}

export function hatalariUygula(metin, etkin) {
  for (;;) {
    const hatalar = denetle(metin, etkin).filter((b) => b.duzey === 'hata' && typeof b.yeni === 'string');
    if (!hatalar.length) return metin;
    const parcalar = [];
    let konum = 0;
    for (const bulgu of hatalar) {
      if (bulgu.bas < konum) continue;
      parcalar.push(metin.slice(konum, bulgu.bas), bulgu.yeni);
      konum = bulgu.bit;
    }
    const yeni = parcalar.join('') + metin.slice(konum);
    if (yeni === metin) return metin;
    metin = yeni;
  }
}
