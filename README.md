# Türkçe Yazım ve Biçim Denetçisi

Ödev, makale ve tez metinlerindeki yaygın yazım, noktalama ve biçim sorunlarını tarayıcıda bulur. Bulgular metin üzerinde vurgulanır ve önerilen düzeltmeler tek tek uygulanabilir.

[Tarayıcıda kullan](https://oguzhankaygin.github.io/turkce-yazim-denetcisi/)

## Nasıl çalışır?

1. **Kurallı denetim.** Metni yapıştırın. Bulgulardan birine tıklayarak metindeki yerini görün. Düzeltmeleri tek tek uygulayın veya yalnızca hata düzeyindeki bulguları topluca düzeltin. İstediğiniz kuralları açıp kapatabilir, son metni kopyalayabilir veya TXT olarak indirebilirsiniz.
2. **Claude’da aç.** Araç metninizi ve etkin kurallardan gelen bulguları Türkçe bir isteme dönüştürür, panoya kopyalar ve Claude’u yeni sekmede açar. İstemi kendi hesabınızla gönderirsiniz. Pano erişimi başarısız olursa hazır istemi elle kopyalayabilirsiniz.
3. **Claude’un yanıtını yapıştır.** JSON yanıtını yapıştırıp önerileri ekleyin. Araç şemayı ve alıntıların metinde birebir geçtiğini kontrol eder. Geçerli öneriler bulgu listesinde Claude rozetiyle görünür.

## Gizlilik

Kurallı denetim, düzeltmeler, istatistikler ve JSON doğrulaması cihazınızda çalışır. Sayfa girdilerinizi sunucuya göndermez ve tarayıcı depolamasına kaydetmez. **Temizle** düğmesi oturumdaki metni, hazırlanmış istemi ve Claude yanıtını temizler. İstemi Claude’a yapıştırıp gönderdiğinizde Claude, gönderdiğiniz içeriği kendi hizmet koşulları altında işler.

## Sınırlamalar

- Kurallar örüntülere ve sınırlı bir sözlüğe dayanır. Özellikle bağlaç, soru eki, özel ad ve tekrar uyarılarını bağlam içinde değerlendirin. Kural ayarları örnekleri ve ilgili TDK Yazım Kılavuzu konularını gösterir.
- Cümle sınırları noktalama ve paragraf boşluklarından, Türkçe hece sayısı ünlülerden tahmin edilir. Ateşman puanı bu sayımlara dayanır ve aralık dışı değerler gösterebilir.
- Claude alıntısı birden çok yerde geçiyorsa ilk eşleşme gösterilir. Önerinin dilsel uygunluğunu kullanıcı değerlendirir.
- Kaynakça için [Kaynakça Denetçisi](https://github.com/oguzhankaygin/kaynakca-denetcisi) kullanılabilir.

## Katkı

Site, GitHub Pages’te `docs/` klasöründen sunulmaya hazırdır. Yerelde `docs/` klasörünü bir statik HTTP önizlemesi ile açın. Bağımlılık veya derleme adımı yoktur.

Kurallar `docs/lib/kurallar.js`, sık yanlış yazımlar `docs/lib/sozcukler.js` dosyasındadır. Yeni kurallara hem yakalanması gereken bir örnek hem de doğru yazımı koruyan bir test ekleyin.

```sh
node --test tests/
for dosya in docs/*.js docs/lib/*.js; do node --check "$dosya" || exit; done
```

[MIT lisansı](LICENSE) ile dağıtılır.
