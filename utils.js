// ─── UTILS ──────────────────────────────────────────────
// Bu dosya, tekrarlanan kod kalıplarını ve güvenlik yardımcılarını içerir.

// XSS KORUMASI: Kullanıcının serbestçe yazdığı metinler (açıklama vb.)
// innerHTML içine basılmadan önce MUTLAKA bu fonksiyondan geçirilmeli.
// Aksi halde biri açıklama alanına <img src=x onerror=...> gibi bir
// şey yazarsa tarayıcıda çalışır (stored XSS).
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Tekrarlanan sorgu deseni: kayitlar tablosundan tek bir kaydın
// belirli alanlarını id ile çekmek. Önceden 10+ yerde birebir
// tekrarlanıyordu; artık tek bir yerden yönetiliyor.
async function getKayitAlan(entryId, fields) {
  const { data, error } = await sb.from('kayitlar').select(fields).eq('id', entryId).single();
  if (error) {
    console.error('getKayitAlan hata:', error);
  }
  return data;
}
