# Yapılan Değişiklikler

## 1. Modülerleştirme
7377 satırlık tek `index.html` dosyasındaki ~5700 satırlık JS kodu, aynı global
scope'u paylaşan 18 ayrı dosyaya bölündü (`js/` klasörü). Bu **klasik script**
yaklaşımıdır (ES module değil) — yani `onclick="..."` gibi mevcut 187 inline
olay bağlantısının **hiçbiri bozulmadı**, hepsi öncekiyle birebir aynı çalışır.

Dosya bölme işlemi elle değil, gerçek bir JS parser (Acorn AST) ile yapıldı ve
sonuç otomatik doğrulandı: hem her dosya tek başına, hem de hepsi birleşince
sözdizimsel olarak orijinaliyle birebir eşleşiyor (whitespace/yorum konumu
dışında tek bir karakter bile kaybolmadı — bkz. `verify.js`). Ayrıca jsdom ile
tüm dosyalar sırayla yüklenip gerçek bir sayfa açılışı simüle edildi;
hiçbir "tanımsız fonksiyon" hatası çıkmadı.

Dosyalar (yükleme sırası önemli, `index.html`'de bu sırayla referans veriliyor):
`config.js → state.js → utils.js → auth.js → ui.js → proje.js → ekip.js →
denetimci.js → malzeme.js → gider.js → kayit.js → hata.js → onay.js →
rapor.js → qr.js → grafik.js → yedekleme.js → main.js`

## 2. Güvenlik düzeltmeleri (XSS)
Kullanıcının serbestçe yazdığı metinler (açıklama alanları) `innerHTML`'e
escape edilmeden basılıyordu — biri açıklamaya `<img src=x onerror=...>` gibi
bir şey yazsa çalışırdı (stored XSS). `utils.js`'e bir `escapeHtml()`
fonksiyonu eklendi ve şu **9 noktada** uygulandı:
- `hata.js`, `onay.js`, `gider.js`, `rapor.js` (x4), `yedekleme.js` — açıklama
  alanlarının HTML'e basıldığı yerler.
- **En kritik olanı:** `mentionVurgula()` fonksiyonu (asıl kayıt detay
  ekranında kullanılıyor) hiç escape yapmıyordu — bu düzeltildi.

**Not (kod içinde değişmeyen bir konu):** Supabase anon key hâlâ kaynak
kodda ve bu normaldir; güvenlik tamamen Supabase tarafındaki RLS
politikalarınıza bağlı. Bunu Supabase Dashboard'dan doğrulamanız gerekiyor,
kod tarafında yapılabilecek bir şey değil.

## 3. Tekrarlanan kod tekilleştirildi
`sb.from('kayitlar').select(X).eq('id', entryId).single()` deseni 9 farklı
yerde birebir tekrarlanıyordu. Artık hepsi `utils.js`'teki tek bir
`getKayitAlan(entryId, fields)` yardımcısını çağırıyor.

## 4. Hata yönetimi
200 fonksiyondan sadece ~38'i try/catch içeriyordu. Tek tek her fonksiyonu
riskli şekilde değiştirmek yerine, `main.js`'e uygulama genelinde bir güvenlik
ağı eklendi: yakalanmamış her hata/promise reddi artık konsola loglanıyor ve
kullanıcıya bir toast mesajı gösteriliyor (sessiz başarısızlık veya donmuş
ekran yerine).

## Değişmeyenler / bilinçli olarak dokunulmayanlar
- 187 inline `onclick` handler'ı olduğu gibi bırakıldı (data-action'a geçiş,
  gerçek bir davranış değişikliği riski taşıdığı için ayrı bir adım olarak
  önerilir, bkz. sohbet).
- Excel/PDF export ve `navigator.share` metinlerine escapeHtml UYGULANMADI
  (bunlar HTML olarak render edilmiyor, düz metin/tablo hücresi; escape
  etmek görünür `&amp;` gibi bozuk karakterler üretirdi).
