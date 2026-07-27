// ─── VERİ YEDEKLEME ────────────────────────────────────
async function verileriYedekle() {
  showLoading('Yedek hazırlanıyor...');
  try {
    const [projelerRes, kayitlarRes, giderlerRes] = await Promise.all([
      sb.from('projeler').select('*'),
      sb.from('kayitlar').select('*'),
      sb.from('giderler').select('*')
    ]);
    const yedek = {
      olusturma_tarihi: new Date().toISOString(),
      uygulama: 'Kazı Takip', versiyon: '1.0',
      projeler: projelerRes.data || [],
      kayitlar: kayitlarRes.data || [],
      giderler: giderlerRes.data || []
    };
    const json = JSON.stringify(yedek, null, 2);
    const tarihStr = new Date().toLocaleString('tr-TR');
    const dosyaAdi = `kazi-takip-yedek_${new Date().toISOString().split('T')[0]}.json`;
    const ozet = `${yedek.projeler.length} proje, ${yedek.kayitlar.length} kayıt, ${yedek.giderler.length} gider`;
    hideLoading();

    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(json);
    const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kazı Takip Yedek</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0f172a;color:#e2e8f0;font-family:system-ui,sans-serif;padding:24px;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px}
  h2{color:#f59e0b;font-size:18px}
  p{color:#94a3b8;font-size:13px;text-align:center;line-height:1.6}
  a.btn{display:block;width:100%;max-width:320px;background:#f59e0b;color:#0f172a;border:none;border-radius:10px;padding:15px;font-size:15px;font-weight:900;cursor:pointer;text-align:center;text-decoration:none}
  .info{background:#1e293b;border:1px solid #334155;border-radius:8px;padding:12px;font-size:12px;color:#64748b;line-height:1.6;max-width:320px;text-align:center}
</style></head><body>
<h2>💾 Kazı Takip Yedek</h2>
<p>📅 ${tarihStr}<br>📊 ${ozet}</p>
<a class="btn" id="dlBtn" href="${dataUri}" download="${dosyaAdi}">📥 İndir: ${dosyaAdi}</a>
<div class="info">İndirme başlamazsa butona uzun basıp<br>"Bağlantıyı indir" seçeneğini deneyin.</div>
<script>
  // Sayfa açılınca otomatik indir
  window.addEventListener('load', function() {
    document.getElementById('dlBtn').click();
  });
<\/script>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  } catch(err) {
    hideLoading();
    toast('⚠️ Yedekleme hatası: ' + (err.message||'Bağlantı hatası'), true);
  }
}

// ─── VERİLERİ İÇE AKTAR (GÜVENLİ) ─────────────────────
async function verileriIceAktar(input) {
  const dosya = input.files[0];
  input.value = '';
  if (!dosya) return;

  let yedek;
  try {
    const metin = await dosya.text();
    yedek = JSON.parse(metin);
  } catch(e) {
    toast('⚠️ Geçersiz JSON dosyası!', true); return;
  }

  if (!yedek.projeler || !yedek.kayitlar) {
    toast('⚠️ Bu dosya geçerli bir Kazı Takip yedeği değil!', true); return;
  }

  // Mevcut ID'leri çek — ne ekleneceğini, ne atlanacağını önceden hesapla
  showLoading('Analiz ediliyor...');
  try {
    const [mProjeler, mKayitlar, mGiderler] = await Promise.all([
      sb.from('projeler').select('id'),
      sb.from('kayitlar').select('id'),
      sb.from('giderler').select('id')
    ]);
    hideLoading();

    const mevcutProjIds   = new Set((mProjeler.data||[]).map(r => r.id));
    const mevcutKayitIds  = new Set((mKayitlar.data||[]).map(r => r.id));
    const mevcutGiderIds  = new Set((mGiderler.data||[]).map(r => r.id));

    const yeniProjeler = (yedek.projeler||[]).filter(r => !mevcutProjIds.has(r.id));
    const yeniKayitlar = (yedek.kayitlar||[]).filter(r => !mevcutKayitIds.has(r.id));
    const yeniGiderler = (yedek.giderler||[]).filter(r => !mevcutGiderIds.has(r.id));

    const atlalanTopla =
      ((yedek.projeler||[]).length - yeniProjeler.length) +
      ((yedek.kayitlar||[]).length - yeniKayitlar.length) +
      ((yedek.giderler||[]).length - yeniGiderler.length);

    const toplamEklenecek = yeniProjeler.length + yeniKayitlar.length + yeniGiderler.length;

    if (toplamEklenecek === 0) {
      bilgiModalGoster(
        'Eklenecek Veri Yok',
        `Yedekteki tüm kayıtlar zaten Supabase'de mevcut.\n\nAtlanan kayıtlar:\n  • ${(yedek.projeler||[]).length} proje\n  • ${(yedek.kayitlar||[]).length} kazı kaydı\n  • ${(yedek.giderler||[]).length} gider`,
        'ℹ️'
      );
      return;
    }

    const mesaj =
      `📂 ${dosya.name}\n` +
      `📅 ${yedek.olusturma_tarihi ? new Date(yedek.olusturma_tarihi).toLocaleString('tr-TR') : 'Tarih bilinmiyor'}\n\n` +
      `✅ EKLENECEK (yeni kayıtlar):\n` +
      `  • ${yeniProjeler.length} proje\n` +
      `  • ${yeniKayitlar.length} kazı kaydı\n` +
      `  • ${yeniGiderler.length} gider\n\n` +
      `⏭ ATLANACAK (zaten mevcut): ${atlalanTopla} kayıt\n\n` +
      `🔒 Mevcut hiçbir veriye dokunulmaz.\nİşlem öncesi otomatik güvenlik yedeği indirilir.`;

    silOnayla(mesaj, async () => {

      // AŞAMA 1: İşlem öncesi otomatik güvenlik yedeği indir
      showLoading('Güvenlik yedeği alınıyor...');
      try {
        const [p2, k2, g2] = await Promise.all([
          sb.from('projeler').select('*'),
          sb.from('kayitlar').select('*'),
          sb.from('giderler').select('*')
        ]);
        const sigortaYedek = {
          olusturma_tarihi: new Date().toISOString(),
          uygulama: 'Kazı Takip',
          versiyon: '1.0',
          not: 'Import öncesi otomatik güvenlik yedeği',
          projeler: p2.data||[], kayitlar: k2.data||[],
          giderler: g2.data||[]
        };
        const blob = new Blob([JSON.stringify(sigortaYedek, null, 2)], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = `kazi-takip-SIGORTA_${new Date().toISOString().slice(0,19).replace(/[T:]/g,'-')}.json`;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
      } catch(sigortaErr) {
        // Sigorta alınamazsa kullanıcıyı uyar, devam etme
        hideLoading();
        toast('⚠️ Güvenlik yedeği alınamadı, import iptal edildi!', true);
        return;
      }

      // AŞAMA 2: Sadece yeni (eksik) kayıtları ekle — mevcut verilere dokunma
      showLoading('Veriler ekleniyor...');
      const hatalar = [];

      if (yeniProjeler.length) {
        const { error } = await sb.from('projeler').insert(yeniProjeler);
        if (error) hatalar.push('projeler: ' + error.message);
      }
      if (yeniKayitlar.length) {
        const { error } = await sb.from('kayitlar').insert(yeniKayitlar);
        if (error) hatalar.push('kayitlar: ' + error.message);
      }
      if (yeniGiderler.length) {
        const { error } = await sb.from('giderler').insert(yeniGiderler);
        if (error) hatalar.push('giderler: ' + error.message);
      }
      hideLoading();
      if (hatalar.length) {
        bilgiModalGoster(
          'Kısmi Hata',
          `Bazı tablolar yüklenemedi. Güvenlik yedeğini kullanabilirsiniz.\n\nHatalar:\n${hatalar.map(h => '  • ' + h).join('\n')}`,
          '⚠️'
        );
      } else {
        bilgiModalGoster(
          'Geri Yükleme Tamamlandı ✅',
          `${toplamEklenecek} kayıt başarıyla eklendi:\n\n  • ${yeniProjeler.length} proje\n  • ${yeniKayitlar.length} kazı kaydı\n  • ${yeniGiderler.length} gider\n\nTamam'a basınca sayfa yenilenecek.`,
          '✅'
        );
        document.getElementById('bilgiModal').querySelector('button').onclick = () => {
          bilgiModalKapat();
          location.reload();
        };
      }

    }, '📤', 'Ekle', '#d97706');

  } catch(err) {
    hideLoading();
    toast('⚠️ Analiz hatası: ' + (err.message||'Hata'), true);
  }
}

async function verileriExcelYedekle() {
  if (typeof XLSX === 'undefined') {
    showLoading('Excel kütüphanesi yükleniyor...');
    const s = document.createElement('script');
    s.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
    s.onload = () => { hideLoading(); verileriExcelYedekle(); };
    s.onerror = () => { hideLoading(); toast('⚠️ Excel kütüphanesi yüklenemedi', true); };
    document.head.appendChild(s);
    return;
  }

  showLoading('Excel hazırlanıyor...');
  try {
    const [projelerRes, kayitlarRes, giderlerRes, ekiplerRes, denetimcilerRes] = await Promise.all([
      sb.from('projeler').select('*'),
      sb.from('kayitlar').select('*'),
      sb.from('giderler').select('*'),
      sb.from('ekipler').select('*'),
      sb.from('denetimciler').select('*')
    ]);

    const wb = XLSX.utils.book_new();

    // Projeler sayfası
    const projData = (projelerRes.data||[]).map(p => ({
      'Proje Adı': p.ad, 'Konum': p.konum||'', 'Hedef Metre': p.hedef_metre||'',
      'Durum': p.bitti ? 'Tamamlandı' : 'Devam Ediyor', 'Oluşturma Tarihi': p.olusturma_tarihi
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(projData), '🏗 Projeler');

    // Kayıtlar sayfası
    const projMap = {};
    (projelerRes.data||[]).forEach(p => projMap[p.id] = p.ad);
    const ekipMap = {};
    (ekiplerRes.data||[]).forEach(t => ekipMap[t.id] = t.ad);
    const denetimciMap = {};
    (denetimcilerRes.data||[]).forEach(d => denetimciMap[d.id] = d.ad + (d.kurum ? ' (' + d.kurum + ')' : ''));
    const kayitData = (kayitlarRes.data||[]).map(k => ({
      'Proje': projMap[k.proje_id]||'', 'Tarih': k.tarih, 'Ekip': k.ekip_id ? (ekipMap[k.ekip_id]||'') : '',
      'Denetimci': denetimciRowMetni(k, denetimciMap), 'Kazı Metre': k.kazi_metre,
      'Notlar': k.notlar||'', 'Malzeme Sayısı': (k.malzemeler||[]).length,
      'Hata Sayısı': (k.hatalar||[]).length, 'Fotoğraf Sayısı': (k.fotograflar||[]).length,
      'KMZ': k.kmz?.name || ''
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kayitData), '📋 Kayıtlar');

    // Ekipler sayfası
    if ((ekiplerRes.data||[]).length > 0) {
      const ekipData = ekiplerRes.data.map(t => ({ 'Ekip Adı': t.ad }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ekipData), '👷 Ekipler');
    }

    // Denetimciler sayfası
    if ((denetimcilerRes.data||[]).length > 0) {
      const denetimciData = denetimcilerRes.data.map(d => ({ 'Denetimci Adı': d.ad, 'Kurum / Firma': d.kurum||'' }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(denetimciData), '🕵️ Denetimciler');
    }

    // Giderler sayfası
    const giderData = (giderlerRes.data||[]).map(g => ({
      'Tarih': g.tarih, 'Kategori': g.kategori, 'Açıklama': g.aciklama||'',
      'Tutar (₺)': g.tutar, 'Proje': projMap[g.proje_id]||''
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(giderData), '💸 Giderler');

    const tarihStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `kazi-takip-yedek_${tarihStr}.xlsx`);

    hideLoading();
    toast('✅ Excel yedeği indirildi!');
  } catch(err) {
    hideLoading();
    toast('⚠️ Excel yedekleme hatası: ' + (err.message||'Hata'), true);
  }
}

// ─── PDF TOPLU YEDEK ───────────────────────────────────
async function verileriPdfYedekle() {
  showLoading('PDF hazırlanıyor...');
  try {
    const [projelerRes, kayitlarRes, giderlerRes, ekiplerRes, denetimcilerRes] = await Promise.all([
      sb.from('projeler').select('*'),
      sb.from('kayitlar').select('*'),
      sb.from('giderler').select('*'),
      sb.from('ekipler').select('*'),
      sb.from('denetimciler').select('*')
    ]);

    const projMap = {};
    (projelerRes.data||[]).forEach(p => projMap[p.id] = p.ad);
    const ekipMap = {};
    (ekiplerRes.data||[]).forEach(t => ekipMap[t.id] = t.ad);
    const denetimciMap = {};
    (denetimcilerRes.data||[]).forEach(d => denetimciMap[d.id] = d.ad + (d.kurum ? ' (' + d.kurum + ')' : ''));

    const tarihStr = new Date().toLocaleDateString('tr-TR');
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{font-family:Arial,sans-serif;padding:20px;color:#1a1a1a;font-size:12px}
      h1{font-size:20px;border-bottom:2px solid #f59e0b;padding-bottom:8px}
      h2{font-size:15px;margin-top:24px;color:#1a1a1a;background:#f3f4f6;padding:6px 10px;border-radius:4px}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      th,td{border:1px solid #ddd;padding:5px 8px;text-align:left;font-size:11px}
      th{background:#f59e0b;color:#000}
      tr:nth-child(even){background:#f9fafb}
      .ozet{display:flex;gap:16px;margin:12px 0}
      .ozet div{background:#f3f4f6;padding:10px 16px;border-radius:8px;text-align:center}
      .ozet .v{font-size:18px;font-weight:bold;color:#f59e0b}
      thead{display:table-header-group}
      h2{page-break-after:avoid;break-after:avoid-page}
      tr{page-break-inside:avoid;break-inside:avoid-page}
      table{page-break-inside:auto}
    </style></head><body>`;

    html += `<h1>🏗 Kazı Takip - Genel Yedek Raporu</h1><p>Oluşturma Tarihi: ${tarihStr}</p>`;

    // Özet
    const toplamKazi = (kayitlarRes.data||[]).reduce((s,k)=>s+parseFloat(k.kazi_metre||0),0);
    const toplamGider = (giderlerRes.data||[]).reduce((s,g)=>s+parseFloat(g.tutar||0),0);
    html += `<div class="ozet">
      <div><div class="v">${(projelerRes.data||[]).length}</div>Proje</div>
      <div><div class="v">${(kayitlarRes.data||[]).length}</div>Kayıt</div>
      <div><div class="v">${Math.round(toplamKazi).toLocaleString('tr-TR')} m</div>Toplam Kazı</div>
      <div><div class="v">${(ekiplerRes.data||[]).length}</div>Ekip</div>
      <div><div class="v">${(denetimcilerRes.data||[]).length}</div>Denetimci</div>
      <div><div class="v">${Math.round(toplamGider).toLocaleString('tr-TR')} ₺</div>Toplam Gider</div>
    </div>`;

    // Projeler
    html += `<h2>🏗 Projeler (${(projelerRes.data||[]).length})</h2><table><tr><th>Proje Adı</th><th>Konum</th><th>Hedef</th><th>Durum</th></tr>`;
    (projelerRes.data||[]).forEach(p => {
      html += `<tr><td>${p.ad}</td><td>${p.konum||'-'}</td><td>${p.hedef_metre ? p.hedef_metre+' m' : '-'}</td><td>${p.bitti?'Tamamlandı':'Devam Ediyor'}</td></tr>`;
    });
    html += `</table>`;

    // Kayıtlar
    html += `<h2>📋 Kayıtlar (${(kayitlarRes.data||[]).length})</h2><table><tr><th>Proje</th><th>Tarih</th><th>Ekip</th><th>Denetimci</th><th>Metre</th><th>Notlar</th></tr>`;
    (kayitlarRes.data||[]).sort((a,b)=>a.tarih.localeCompare(b.tarih)).forEach(k => {
      html += `<tr><td>${projMap[k.proje_id]||'-'}</td><td>${new Date(k.tarih).toLocaleDateString('tr-TR')}</td><td>${k.ekip_id ? (ekipMap[k.ekip_id]||'-') : '-'}</td><td>${denetimciRowMetni(k, denetimciMap) || '-'}</td><td>${k.kazi_metre} m</td><td>${(k.notlar||'').substring(0,60)}</td></tr>`;
    });
    html += `</table>`;

    // Ekipler (detaylı)
    const ekipStats = {};
    (kayitlarRes.data||[]).forEach(k => {
      const key = k.ekip_id || '__bos__';
      if (!ekipStats[key]) ekipStats[key] = { toplam: 0, sayi: 0, projeler: new Set(), ilk: null, son: null };
      const s = ekipStats[key];
      s.toplam += parseFloat(k.kazi_metre || 0);
      s.sayi += 1;
      s.projeler.add(projMap[k.proje_id] || 'Bilinmeyen Proje');
      if (!s.ilk || k.tarih < s.ilk) s.ilk = k.tarih;
      if (!s.son || k.tarih > s.son) s.son = k.tarih;
    });
    html += `<h2>👷 Ekipler (${(ekiplerRes.data||[]).length})</h2>`;
    if ((ekiplerRes.data||[]).length === 0) {
      html += `<p style="color:#999">Henüz ekip tanımlanmamış.</p>`;
    } else {
      html += `<table><tr><th>Ekip</th><th>Toplam Kazı</th><th>Kayıt Sayısı</th><th>Çalıştığı Projeler</th><th>İlk / Son Kazı</th></tr>`;
      ekiplerRes.data.slice().sort((a,b)=>(ekipStats[b.id]?.toplam||0)-(ekipStats[a.id]?.toplam||0)).forEach(t => {
        const s = ekipStats[t.id];
        if (s) {
          html += `<tr><td>👷 ${t.ad}</td><td style="font-weight:700">${Math.round(s.toplam).toLocaleString('tr-TR')} m</td><td>${s.sayi}</td><td>${[...s.projeler].join(', ')}</td><td>${new Date(s.ilk).toLocaleDateString('tr-TR')} → ${new Date(s.son).toLocaleDateString('tr-TR')}</td></tr>`;
        } else {
          html += `<tr><td>👷 ${t.ad}</td><td colspan="4" style="color:#999">Henüz kayıt yok</td></tr>`;
        }
      });
      html += `</table>`;
    }
    if (ekipStats['__bos__']) {
      const s = ekipStats['__bos__'];
      html += `<h2 style="background:#fff3f3">⚠️ Ekip Atanmamış Kayıtlar</h2>
        <table><tr><th>Toplam Kazı</th><th>Kayıt Sayısı</th><th>Çalışılan Projeler</th><th>İlk / Son Kazı</th></tr>
        <tr><td style="font-weight:700">${Math.round(s.toplam).toLocaleString('tr-TR')} m</td><td>${s.sayi}</td><td>${[...s.projeler].join(', ')}</td><td>${new Date(s.ilk).toLocaleDateString('tr-TR')} → ${new Date(s.son).toLocaleDateString('tr-TR')}</td></tr></table>`;
    }

    // Denetimciler (detaylı)
    const denetimciStats = {};
    (kayitlarRes.data||[]).forEach(k => {
      const idler = denetimciIdListesi(k);
      const keys = idler.length > 0 ? idler : ['__bos__'];
      keys.forEach(key => {
        if (!denetimciStats[key]) denetimciStats[key] = { toplam: 0, sayi: 0, projeler: new Set(), ilk: null, son: null };
        const s = denetimciStats[key];
        s.toplam += parseFloat(k.kazi_metre || 0);
        s.sayi += 1;
        s.projeler.add(projMap[k.proje_id] || 'Bilinmeyen Proje');
        if (!s.ilk || k.tarih < s.ilk) s.ilk = k.tarih;
        if (!s.son || k.tarih > s.son) s.son = k.tarih;
      });
    });
    html += `<h2>🕵️ Denetimciler (${(denetimcilerRes.data||[]).length})</h2>`;
    if ((denetimcilerRes.data||[]).length === 0) {
      html += `<p style="color:#999">Henüz denetimci tanımlanmamış.</p>`;
    } else {
      html += `<table><tr><th>Denetimci</th><th>Toplam Kazı</th><th>Kayıt Sayısı</th><th>Denetlediği Projeler</th><th>İlk / Son Kazı</th></tr>`;
      denetimcilerRes.data.slice().sort((a,b)=>(denetimciStats[b.id]?.toplam||0)-(denetimciStats[a.id]?.toplam||0)).forEach(d => {
        const s = denetimciStats[d.id];
        const adKurum = d.ad + (d.kurum ? ' (' + d.kurum + ')' : '');
        if (s) {
          html += `<tr><td>🕵️ ${adKurum}</td><td style="font-weight:700">${Math.round(s.toplam).toLocaleString('tr-TR')} m</td><td>${s.sayi}</td><td>${[...s.projeler].join(', ')}</td><td>${new Date(s.ilk).toLocaleDateString('tr-TR')} → ${new Date(s.son).toLocaleDateString('tr-TR')}</td></tr>`;
        } else {
          html += `<tr><td>🕵️ ${adKurum}</td><td colspan="4" style="color:#999">Henüz kayıt yok</td></tr>`;
        }
      });
      html += `</table>`;
    }
    if (denetimciStats['__bos__']) {
      const s = denetimciStats['__bos__'];
      html += `<h2 style="background:#fff3f3">⚠️ Denetimci Atanmamış Kayıtlar</h2>
        <table><tr><th>Toplam Kazı</th><th>Kayıt Sayısı</th><th>Çalışılan Projeler</th><th>İlk / Son Kazı</th></tr>
        <tr><td style="font-weight:700">${Math.round(s.toplam).toLocaleString('tr-TR')} m</td><td>${s.sayi}</td><td>${[...s.projeler].join(', ')}</td><td>${new Date(s.ilk).toLocaleDateString('tr-TR')} → ${new Date(s.son).toLocaleDateString('tr-TR')}</td></tr></table>`;
    }

    // Giderler
    html += `<h2>💸 Giderler (${(giderlerRes.data||[]).length})</h2><table><tr><th>Tarih</th><th>Kategori</th><th>Açıklama</th><th>Tutar</th></tr>`;
    (giderlerRes.data||[]).sort((a,b)=>a.tarih.localeCompare(b.tarih)).forEach(g => {
      html += `<tr><td>${new Date(g.tarih).toLocaleDateString('tr-TR')}</td><td>${escapeHtml(g.kategori)}</td><td>${escapeHtml(g.aciklama||'-')}</td><td>${parseFloat(g.tutar).toLocaleString('tr-TR')} ₺</td></tr>`;
    });
    html += `</table>`;

    html += `</body></html>`;

    // Yeni pencerede aç ve yazdır
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 400);

    hideLoading();
    toast('✅ PDF için yazdırma ekranı açıldı! "PDF olarak kaydet" seçin.');
  } catch(err) {
    hideLoading();
    toast('⚠️ PDF yedekleme hatası: ' + (err.message||'Hata'), true);
  }
}

// ─── ONLINE/OFFLINE ALGILAMA ───────────────────────────
function onlineKontrol() {
  const banner = document.getElementById('offlineBanner');
  if (banner) banner.style.display = navigator.onLine ? 'none' : 'block';
}
