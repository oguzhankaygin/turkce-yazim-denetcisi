import { promptOlustur, yanitiDogrula } from './lib/claude.js';
import { istatistik } from './lib/metin.js';
import { denetle, duzelt, hatalariUygula, konumaGore, kurallar } from './lib/kurallar.js';

const al = (id) => document.getElementById(id);
const metin = al('metin');
const yanit = al('yanit');
const onizleme = al('onizleme');
const bulguListesi = al('bulgular');
const istemAlani = al('istem-alani');
const istem = al('istem');
const aktar = al('aktar');
const bicim = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 });
const duzeyler = ['hata', 'uyarı', 'öneri'];
const siniflar = { hata: 'hata', uyarı: 'uyari', öneri: 'oneri' };
const etkin = new Set(kurallar.filter((k) => k.varsayilan).map((k) => k.kod));

let kuralBulgulari = [];
let claudeYaniti = '';
let vurgular = [];
let seciliDugme;

function oge(etiket, icerik, sinif) {
  const sonuc = document.createElement(etiket);
  if (icerik !== undefined) sonuc.textContent = icerik;
  if (sinif) sonuc.className = sinif;
  return sonuc;
}

for (const kural of kurallar) {
  const kart = oge('div', undefined, 'kural');
  const etiket = oge('label');
  const kutu = oge('input');
  kutu.type = 'checkbox';
  kutu.checked = etkin.has(kural.kod);
  kutu.addEventListener('change', () => {
    if (kutu.checked) etkin.add(kural.kod);
    else etkin.delete(kural.kod);
    istemiTemizle();
    guncelle();
  });
  etiket.append(kutu, oge('span', kural.ad + ' · ' + kural.duzey));
  kart.append(etiket, oge('p', kural.aciklama),
    oge('p', kural.yanlis + ' → ' + kural.dogru), oge('p', kural.kaynak));
  al('kurallar').append(kart);
}

function onizlemeyiGoster(deger, bulgular) {
  vurgular = [];
  if (!deger) {
    onizleme.textContent = 'Metniniz burada görünecek.';
    return;
  }
  const olaylar = bulgular.flatMap(({ bas, bit, duzey }) => [
    { konum: bas, duzey, degisim: 1 }, { konum: bit, duzey, degisim: -1 },
  ]).sort((a, b) => a.konum - b.konum);
  const parcalar = document.createDocumentFragment();
  const sayim = { hata: 0, uyarı: 0, öneri: 0 };
  let bas = 0;
  for (const { konum, duzey, degisim } of olaylar) {
    if (konum > bas) {
      const parca = deger.slice(bas, konum);
      const renk = duzeyler.find((seviye) => sayim[seviye] > 0);
      if (renk) {
        const span = oge('span', parca, siniflar[renk]);
        parcalar.append(span);
        vurgular.push({ bas, bit: konum, span });
      } else {
        parcalar.append(parca);
      }
      bas = konum;
    }
    sayim[duzey] += degisim;
  }
  parcalar.append(deger.slice(bas));
  onizleme.replaceChildren(parcalar);
}

function bulguyaGit(bulgu, dugme) {
  seciliDugme?.removeAttribute('aria-current');
  seciliDugme = dugme;
  dugme.setAttribute('aria-current', 'true');
  let ilk;
  for (const { bas, bit, span } of vurgular) {
    const secili = bas < bulgu.bit && bit > bulgu.bas;
    span.classList.toggle('secili', secili);
    if (secili) ilk ??= span;
  }
  metin.setSelectionRange(bulgu.bas, bulgu.bit);
  ilk?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  al('durum').textContent = 'Bulgu metinde vurgulandı.';
}

function bulguKarti(bulgu) {
  const kart = oge('li');
  const konum = oge('button', undefined, 'bulgu-konum');
  konum.append(oge('span', bulgu.kaynak, 'rozet kaynak'),
    oge('span', bulgu.duzey, 'rozet ' + siniflar[bulgu.duzey]), oge('span', bulgu.ad));
  konum.addEventListener('click', () => bulguyaGit(bulgu, konum));
  const alinti = bulgu.alinti.trim() ? bulgu.alinti : '␠'.repeat(Math.min(bulgu.alinti.length, 8));
  const alintiKisa = alinti.length > 140 ? alinti.slice(0, 140) + '…' : alinti;
  kart.append(konum, oge('p', '“' + alintiKisa + '”'), oge('p', bulgu.aciklama));
  if (bulgu.ayrinti) kart.append(oge('p', bulgu.ayrinti, 'ikincil'));
  if (typeof bulgu.yeni === 'string') {
    kart.append(oge('p', bulgu.yeni ? 'Öneri “' + bulgu.yeni + '”' : 'Öneri · Bu bölümü kaldırın.'));
    const uygula = oge('button', 'Düzelt');
    uygula.setAttribute('aria-label', bulgu.ad + ' bulgusunu düzelt');
    uygula.addEventListener('click', () => {
      const yeni = duzelt(metin.value, bulgu);
      if (yeni === metin.value) return;
      metin.value = yeni;
      metin.focus();
      metin.setSelectionRange(bulgu.bas, bulgu.bas + bulgu.yeni.length);
      metinDegisti();
      al('durum').textContent = 'Düzeltme uygulandı.';
    });
    kart.append(uygula);
  }
  return kart;
}

function guncelle() {
  const deger = metin.value;
  const dolu = Boolean(deger.trim());
  const ist = istatistik(deger);
  for (const alan of ['sozcuk', 'cumle', 'ortalama', 'atesman']) {
    al(alan).textContent = ist[alan] === null || (alan === 'ortalama' && !ist.cumle)
      ? '—' : bicim.format(ist[alan]);
  }

  kuralBulgulari = denetle(deger, etkin);
  const claude = claudeYaniti ? yanitiDogrula(claudeYaniti, deger) : null;
  const bulgular = [...kuralBulgulari, ...(claude?.bulgular ?? [])].sort(konumaGore);
  const adet = bulgular.length;
  al('bulgu-sayi').textContent = adet ? bicim.format(adet) + ' bulgu' : '';
  al('bos-bulgu').hidden = adet > 0;
  al('bos-bulgu').textContent = dolu ? 'Etkin kurallarla bulgu saptanmadı.' : 'Metin eklediğinizde bulgular burada görünür.';
  al('genel').textContent = claude?.genel ?? '';
  al('genel-alan').hidden = !claude?.genel;
  al('yanit-durum').textContent = claude
    ? claude.bulgular.length + ' öneri gösteriliyor. ' + claude.atilan + ' öneri eşleşmedi, yinelendi veya doğrulamayı geçemedi.'
    : '';

  onizlemeyiGoster(deger, bulgular);
  const kartlar = document.createDocumentFragment();
  for (const bulgu of bulgular) kartlar.append(bulguKarti(bulgu));
  bulguListesi.replaceChildren(kartlar);
  seciliDugme = undefined;
  al('toplu').disabled = !kuralBulgulari.some((b) => b.duzey === 'hata' && typeof b.yeni === 'string');
  al('claude-ac').disabled = !dolu;
  aktar.disabled = !dolu || !yanit.value.trim();
  al('kopyala').disabled = al('indir').disabled = !dolu;
}

function istemiTemizle() {
  istem.value = '';
  istemAlani.hidden = true;
  al('istem-durum').textContent = '';
}

function metinDegisti() {
  istemiTemizle();
  al('durum').textContent = '';
  guncelle();
}

metin.addEventListener('input', metinDegisti);
yanit.addEventListener('input', () => {
  aktar.disabled = !metin.value.trim() || !yanit.value.trim();
});
aktar.addEventListener('click', () => {
  try {
    yanitiDogrula(yanit.value, metin.value);
    claudeYaniti = yanit.value;
    guncelle();
  } catch (hata) {
    al('yanit-durum').textContent = hata.message;
  }
});

al('toplu').addEventListener('click', () => {
  metin.value = hatalariUygula(metin.value, etkin);
  metin.focus();
  metinDegisti();
  al('durum').textContent = 'Hata düzeyindeki düzeltmeler uygulandı.';
});

async function panoyaYaz(deger) {
  try {
    await navigator.clipboard.writeText(deger);
    return true;
  } catch {
    return false;
  }
}

al('claude-ac').addEventListener('click', async () => {
  const hazir = promptOlustur(metin.value, kuralBulgulari);
  istem.value = hazir;
  istemAlani.hidden = false;
  const kopyalama = panoyaYaz(hazir);
  window.open('https://claude.ai/new', '_blank', 'noopener,noreferrer');
  const kopyalandi = await kopyalama;
  if (istem.value !== hazir) return;
  al('istem-durum').textContent = kopyalandi
    ? 'İstem panoya kopyalandı.' : 'Seçili istemi elle kopyalayın.';
  if (!kopyalandi) {
    istem.focus();
    istem.select();
  }
});

al('kopyala').addEventListener('click', async () => {
  const deger = metin.value;
  const kopyalandi = await panoyaYaz(deger);
  if (metin.value !== deger) return;
  al('durum').textContent = kopyalandi ? 'Metin kopyalandı.' : 'Seçili metni elle kopyalayın.';
  if (!kopyalandi) {
    metin.focus();
    metin.select();
  }
});

al('indir').addEventListener('click', () => {
  const nesne = URL.createObjectURL(new Blob([metin.value], { type: 'text/plain;charset=utf-8' }));
  const baglanti = oge('a');
  baglanti.href = nesne;
  baglanti.download = 'duzeltilmis-metin.txt';
  baglanti.click();
  setTimeout(() => URL.revokeObjectURL(nesne), 1000);
});

al('temizle').addEventListener('click', () => {
  metin.value = yanit.value = claudeYaniti = '';
  metinDegisti();
  metin.focus();
  al('durum').textContent = 'Metin ve Claude yanıtı temizlendi.';
});

guncelle();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
