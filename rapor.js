// ─── GÜNLÜK RAPOR PAYLAŞMA ────────────────────────────────
function gunlukRaporPaylas(entryId) {
  const proj = activeProject();
  const entry = proj?.entries.find(e => e.id === entryId);
  if (!entry) return;
  const tarih = new Date(entry.tarih).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const ekip = entry.ekipId ? data.teams.find(t => t.id === entry.ekipId) : null;
  const denetimciListesi = denetimciGorunumleri(entry);
  const ekipStr = ekip ? `\n👷 Ekip: ${ekip.ad}` : '';
  const denStr = denetimciListesi.length > 0 ? `\n🕵️ Denetimci: ${denetimciListesi.map(d => `${d.vakitEtiket ? d.vakitEtiket + ' ' : ''}${d.ad}${d.kurum ? ' (' + d.kurum + ')' : ''}`).join(', ')}` : '';
  const malzStr = entry.malzemeler?.length > 0 ? entry.malzemeler.map(m => `   • ${m.name}: ${m.miktar} ${m.birim}`).join('\n') : '   • Yok';
  const hataStr = entry.hatalar?.length > 0 ? entry.hatalar.map((h, i) => `   #${i+1} ${h.turler?.join(', ') || ''} - ${h.aciklama || ''}${h.giderildi ? ' ✅ GİDERİLDİ' : ''}`).join('\n') : '   • Yok';
  const notStr = entry.notlar ? `\n📝 Not: ${entry.notlar}` : '';
  const metin = `📋 *GÜNLÜK KAZI RAPORU*\n📅 ${tarih}\n🏗 Proje: ${proj.name}${proj.location ? ' - ' + proj.location : ''}${ekipStr}${denStr}\n\n⛏ Günlük Kazı: *${entry.kaziMetre} m*${notStr}\n\n🧱 Malzeme:\n${malzStr}\n\n⚠️ Hata/Eksik:\n${hataStr}`;
  paylas(metin, 'Günlük Kazı Raporu');
}

function gunlukRaporPdf(entryId) {
  const proj = activeProject();
  const e = proj?.entries.find(x => x.id === entryId);
  if (!e) return;

  const bakimMi = Number(e.kaziMetre) === 0;
  const tarihObj = new Date(e.tarih);
  const tarihStr = tarihObj.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const olusturmaStr = new Date().toLocaleDateString('tr-TR');
  const ekip = e.ekipId ? data.teams.find(t => t.id === e.ekipId) : null;
  const denetimciListesi = denetimciGorunumleri(e);

  const malzRows = (e.malzemeler || []).map(m => `<tr><td>${m.name}</td><td style="font-weight:700">${m.miktar} ${m.birim}</td></tr>`).join('') || '';

  const fotoBlok = (title, urls) => urls.length > 0 ? `
    <h2>${title} (${urls.length})</h2>
    <div class="foto-grid">
      ${urls.map(u => `<img src="${u}" class="foto-buyuk"/>`).join('')}
    </div>` : '';

  const hataBlok = (e.hatalar || []).map((h, i) => `
    <div class="hata-kutu">
      <div class="hata-baslik">
        <span>#${i+1} ${h.turler?.join(', ') || 'Hata'}</span>
        <span class="pill ${h.giderildi ? 'yesil' : 'kirmizi'}">${h.giderildi ? '✓ Giderildi' : '● Açık'}</span>
      </div>
      ${h.aciklama ? `<div class="p-metin">${escapeHtml(h.aciklama)}</div>` : ''}
      ${h.gorseller?.length > 0 ? `<div class="foto-grid">${h.gorseller.map(g => `<img src="${g.url}" class="foto-buyuk"/>`).join('')}</div>` : ''}
      ${h.giderildi && h.giderilmeNotu ? `<div class="cozum-kutu"><b>Çözüm notu:</b> ${h.giderilmeNotu}</div>` : ''}
    </div>`).join('');

  const onayBlok = (e.sahaOnaylari || []).map((o, i) => `
    <div class="hata-kutu">
      <div class="hata-baslik">
        <span>#${i+1} Saha Onayı</span>
        ${o.tarih ? `<span class="pill yesil">${new Date(o.tarih).toLocaleDateString('tr-TR')}</span>` : ''}
      </div>
      ${o.aciklama ? `<div class="p-metin">${escapeHtml(o.aciklama)}</div>` : ''}
      ${o.gorseller?.length > 0 ? `<div class="foto-grid">${o.gorseller.map(g => `<img src="${g.url}" class="foto-buyuk"/>`).join('')}</div>` : ''}
    </div>`).join('');

  const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8">
  <title>Günlük Saha Raporu - ${tarihStr}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #1a1a1a; font-size: 13px; max-width: 900px; margin: 0 auto; }
    h1 { font-size: 20px; color: #92400e; border-bottom: 3px solid #f59e0b; padding-bottom: 8px; margin-bottom: 4px; }
    .meta { font-size: 12px; color: #666; margin-bottom: 18px; }
    .stats { display: flex; gap: 12px; margin: 16px 0; flex-wrap: wrap; }
    .stat-box { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 10px 16px; text-align: center; min-width: 110px; }
    .stat-val { font-size: 19px; font-weight: bold; color: #b45309; }
    .stat-lbl { font-size: 10px; color: #78716c; margin-top: 2px; }
    h2 { font-size: 14px; background: #f3f4f6; padding: 7px 10px; border-radius: 4px; margin: 22px 0 10px; border-left: 4px solid #f59e0b; page-break-after: avoid; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    th { background: #f59e0b; color: #fff; padding: 6px 8px; text-align: left; font-size: 11px; }
    td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 12px; }
    tr:nth-child(even) td { background: #f9fafb; }
    .p-metin { font-size: 13px; line-height: 1.6; white-space: pre-wrap; margin-bottom: 8px; }
    /* Fotoğraflar okunabilecek kadar büyük — sayfa başına 2 sütun */
    .foto-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 10px 0; }
    .foto-buyuk { width: 100%; height: 260px; object-fit: cover; border-radius: 6px; border: 1px solid #ddd; display: block; break-inside: avoid; page-break-inside: avoid; }
    .hata-kutu { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; margin-bottom: 12px; }
    .hata-baslik { display: flex; justify-content: space-between; align-items: center; font-weight: 700; margin-bottom: 6px; font-size: 13px; }
    .pill { font-size: 10px; font-weight: 800; border-radius: 20px; padding: 3px 9px; }
    .pill.kirmizi { background: #fee2e2; color: #b91c1c; }
    .pill.yesil { background: #d1fae5; color: #065f46; }
    .cozum-kutu { background: #ecfdf5; border-left: 3px solid #10b981; border-radius: 4px; padding: 8px 10px; font-size: 12px; margin-top: 6px; }
    .footer { margin-top: 24px; font-size: 10px; color: #999; border-top: 1px solid #e5e7eb; padding-top: 8px; }
    @page { margin: 14mm 12mm; }
    @media print { body { padding: 0; } }
  </style></head><body>
  <h1>📋 Günlük Saha Raporu</h1>
  <div class="meta">🏗 ${proj.name}${proj.location ? ' - ' + proj.location : ''} &nbsp;|&nbsp; 📅 ${tarihStr}${ekip ? ` &nbsp;|&nbsp; 👷 ${ekip.ad}` : ''}${denetimciListesi.length > 0 ? ` &nbsp;|&nbsp; 🕵️ ${denetimciListesi.map(d => `${d.vakitEtiket ? d.vakitEtiket + ' ' : ''}${d.ad}${d.kurum ? ' (' + d.kurum + ')' : ''}`).join(', ')}` : ''} &nbsp;|&nbsp; Oluşturma: ${olusturmaStr}</div>

  <div class="stats">
    <div class="stat-box"><div class="stat-val">${bakimMi ? '🔧' : Number(e.kaziMetre).toLocaleString('tr-TR') + ' m'}</div><div class="stat-lbl">${bakimMi ? 'Bakım/Onarım' : 'Kazıldı'}</div></div>
    <div class="stat-box"><div class="stat-val">${e.malzemeler?.length || 0}</div><div class="stat-lbl">Malzeme</div></div>
    <div class="stat-box"><div class="stat-val">${e.hatalar?.length || 0}</div><div class="stat-lbl">Hata</div></div>
    <div class="stat-box"><div class="stat-val">${e.sahaOnaylari?.length || 0}</div><div class="stat-lbl">Saha Onayı</div></div>
  </div>

  ${e.notlar ? `<h2>📝 Notlar</h2><div class="p-metin">${e.notlar}</div>` : ''}

  ${malzRows ? `<h2>🧱 Malzemeler</h2><table><tr><th>Malzeme</th><th>Miktar</th></tr>${malzRows}</table>` : ''}

  ${fotoBlok('📷 Fotoğraflar', (e.fotograflar || []).map(f => f.url))}

  ${hataBlok ? `<h2>⚠️ Hatalar</h2>${hataBlok}` : ''}

  ${onayBlok ? `<h2>✅ Saha Onayları</h2>${onayBlok}` : ''}

  <div class="footer">Kazı Takip Uygulaması &nbsp;|&nbsp; ${olusturmaStr} tarihinde oluşturulmuştur</div>
  </body></html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
  toast('✅ PDF için yazdırma ekranı açıldı! "PDF olarak kaydet" seçin.');
}

function projeRaporPdf() {
  const proj = activeProject();
  if (!proj || proj.entries.length === 0) { toast('⚠️ Proje veya kayıt yok', true); return; }

  const kaziEntries = proj.entries.filter(e => Number(e.kaziMetre) > 0);
  const toplam = proj.entries.reduce((s, e) => s + e.kaziMetre, 0);
  const gun = kaziEntries.length;
  const ort = gun > 0 ? (toplam / gun).toFixed(1) : '0';
  const hataCount = proj.entries.filter(e => e.hatalar?.length > 0 || e.hata?.var).length;
  const tarihler = proj.entries.map(e => new Date(e.tarih));
  const ilk = new Date(Math.min(...tarihler)).toLocaleDateString('tr-TR');
  const son = new Date(Math.max(...tarihler)).toLocaleDateString('tr-TR');
  const kaziTarihler = kaziEntries.map(e => new Date(e.tarih));
  const takvimGunSayisi = kaziEntries.length > 0 ? Math.round((Math.max(...kaziTarihler) - Math.min(...kaziTarihler)) / 86400000) + 1 : 0;
  const ortTakvim = takvimGunSayisi > 0 ? (toplam / takvimGunSayisi).toFixed(1) : '0';
  const tarihStr = new Date().toLocaleDateString('tr-TR');

  // Malzeme özeti
  const malzMap = {};
  proj.entries.forEach(e => (e.malzemeler || []).forEach(m => {
    malzMap[m.name] = (malzMap[m.name] || 0) + parseFloat(m.miktar || 0);
  }));
  const malzRows = Object.entries(malzMap).map(([n, t]) =>
    `<tr><td>${n}</td><td>${t}</td></tr>`
  ).join('') || '<tr><td colspan="2" style="color:#999">Malzeme kaydı yok</td></tr>';

  // Ekip / Denetimci özetleri
  const ekipMapPdf = {};
  proj.entries.forEach(e => {
    const key = e.ekipId || '__bos__';
    if (!ekipMapPdf[key]) ekipMapPdf[key] = 0;
    ekipMapPdf[key] += parseFloat(e.kaziMetre || 0);
  });
  const ekipRowsPdf = Object.entries(ekipMapPdf).sort((a, b) => b[1] - a[1]).map(([eid, toplam]) => {
    const isim = eid === '__bos__' ? 'Ekip Atanmamış' : (data.teams.find(t => t.id === eid)?.ad || 'Bilinmeyen Ekip');
    return `<tr><td>${isim}</td><td style="font-weight:700">${toplam.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m</td></tr>`;
  }).join('') || '<tr><td colspan="2" style="color:#999">Kayıt yok</td></tr>';

  const denMapPdf = {};
  proj.entries.forEach(e => {
    const secimler = denetimSecimleriNormalize(e.denetimSecimleri, e.denetimciId);
    const keys = secimler.length > 0 ? secimler.map(s => s.id) : ['__bos__'];
    keys.forEach(key => { denMapPdf[key] = (denMapPdf[key] || 0) + parseFloat(e.kaziMetre || 0); });
  });
  const denRowsPdf = Object.entries(denMapPdf).sort((a, b) => b[1] - a[1]).map(([did, toplam]) => {
    const d = data.denetimciler.find(x => x.id === did);
    const isim = did === '__bos__' ? 'Denetimci Atanmamış' : (d ? d.ad + (d.kurum ? ' (' + d.kurum + ')' : '') : 'Bilinmeyen Denetimci');
    return `<tr><td>${isim}</td><td style="font-weight:700">${toplam.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m</td></tr>`;
  }).join('') || '<tr><td colspan="2" style="color:#999">Kayıt yok</td></tr>';

  // Günlük kazı geçmişi
  const sortedEntries = [...proj.entries].sort((a, b) => new Date(a.tarih) - new Date(b.tarih));
  const entryRows = sortedEntries.map(e => {
    const hataVar = e.hatalar?.length > 0 || e.hata?.var;
    const malzStr = (e.malzemeler || []).map(m => `${m.name} ${m.miktar} ${m.birim}`).join(', ') || '-';
    const ekipAdi = e.ekipId ? (data.teams.find(t => t.id === e.ekipId)?.ad || '-') : '-';
    const denStr = denetimciGorunumleri(e).map(d => d.ad).join(', ') || '-';
    return `<tr${hataVar ? ' style="background:#fff5f5"' : ''}>
      <td>${new Date(e.tarih).toLocaleDateString('tr-TR')}</td>
      <td style="font-weight:700">${Number(e.kaziMetre) === 0 ? '🔧 Bakım' : e.kaziMetre + ' m'}</td>
      <td>${ekipAdi}</td>
      <td>${denStr}</td>
      <td>${malzStr}</td>
      <td>${hataVar ? '⚠️' : ''} ${(e.notlar || '').substring(0, 60)}</td>
    </tr>`;
  }).join('');

  // Hedef satırı
  const hedefHtml = proj.hedefMetre > 0 ? `
    <div class="stat-box">
      <div class="stat-val">${((toplam / proj.hedefMetre) * 100).toFixed(0)}%</div>
      <div class="stat-lbl">Hedef İlerlemesi</div>
    </div>
    <div class="stat-box">
      <div class="stat-val">${Math.max(0, proj.hedefMetre - toplam).toLocaleString('tr-TR')} m</div>
      <div class="stat-lbl">Kalan Metraj</div>
    </div>` : '';

  const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8">
  <title>${proj.name} - Proje Raporu</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #1a1a1a; font-size: 12px; max-width: 900px; margin: 0 auto; }
    h1 { font-size: 20px; color: #92400e; border-bottom: 3px solid #f59e0b; padding-bottom: 8px; margin-bottom: 4px; }
    .meta { font-size: 11px; color: #666; margin-bottom: 18px; }
    .stats { display: flex; gap: 12px; margin: 16px 0; flex-wrap: wrap; }
    .stat-box { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 10px 16px; text-align: center; min-width: 100px; }
    .stat-val { font-size: 20px; font-weight: bold; color: #b45309; }
    .stat-lbl { font-size: 10px; color: #78716c; margin-top: 2px; }
    h2 { font-size: 13px; background: #f3f4f6; padding: 6px 10px; border-radius: 4px; margin: 20px 0 8px; border-left: 4px solid #f59e0b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #f59e0b; color: #fff; padding: 6px 8px; text-align: left; font-size: 11px; }
    td { border: 1px solid #e5e7eb; padding: 5px 8px; font-size: 11px; }
    tr:nth-child(even) td { background: #f9fafb; }
    .footer { margin-top: 24px; font-size: 10px; color: #999; border-top: 1px solid #e5e7eb; padding-top: 8px; }
    thead { display: table-header-group; }
    h2 { page-break-after: avoid; break-after: avoid-page; }
    tr { page-break-inside: avoid; break-inside: avoid-page; }
    table { page-break-inside: auto; }
    @media print { body { padding: 10px; } }
  </style></head><body>
  <h1>⛏ ${proj.name}${proj.location ? ' — ' + proj.location : ''}</h1>
  <div class="meta">📄 Proje Raporu &nbsp;|&nbsp; Oluşturma: ${tarihStr} &nbsp;|&nbsp; Dönem: ${ilk} → ${son}</div>

  <div class="stats">
    <div class="stat-box"><div class="stat-val">${toplam.toLocaleString('tr-TR')} m</div><div class="stat-lbl">Toplam Kazı</div></div>
    <div class="stat-box"><div class="stat-val">${gun}</div><div class="stat-lbl">Toplam Gün</div></div>
    <div class="stat-box"><div class="stat-val">${ort} m</div><div class="stat-lbl">Günlük Ort. (çalışılan gün)</div></div>
    <div class="stat-box"><div class="stat-val">${ortTakvim} m</div><div class="stat-lbl">Günlük Ort. (takvim günü)</div></div>
    <div class="stat-box"><div class="stat-val">${hataCount}</div><div class="stat-lbl">Hatalı Gün</div></div>
    ${proj.hedefMetre > 0 ? `<div class="stat-box"><div class="stat-val">${proj.hedefMetre.toLocaleString('tr-TR')} m</div><div class="stat-lbl">Hedef Metraj</div></div>` : ''}
    ${hedefHtml}
  </div>

  <h2>🧱 Malzeme Özeti</h2>
  <table>
    <tr><th>Malzeme</th><th>Toplam Miktar</th></tr>
    ${malzRows}
  </table>

  <h2>👷 Ekiplere Göre Toplam</h2>
  <table>
    <tr><th>Ekip</th><th>Toplam</th></tr>
    ${ekipRowsPdf}
  </table>

  <h2>🕵️ Denetimcilere Göre Toplam</h2>
  <table>
    <tr><th>Denetimci</th><th>Toplam</th></tr>
    ${denRowsPdf}
  </table>

  <h2>📅 Günlük Kazı Geçmişi</h2>
  <table>
    <tr><th>Tarih</th><th>Kazı (m)</th><th>Ekip</th><th>Denetimci</th><th>Malzeme</th><th>Not / Durum</th></tr>
    ${entryRows}
  </table>

  <div class="footer">Kazı Takip Uygulaması &nbsp;|&nbsp; ${tarihStr} tarihinde oluşturulmuştur</div>
  </body></html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
  toast('✅ PDF için yazdırma ekranı açıldı! "PDF olarak kaydet" seçin.');
}

function projeRaporPaylas() {
  const proj = activeProject();
  if (!proj || proj.entries.length === 0) { toast('⚠️ Proje veya kayıt yok', true); return; }
  const kaziEntries = proj.entries.filter(e => Number(e.kaziMetre) > 0);
  const toplam = proj.entries.reduce((s, e) => s + e.kaziMetre, 0);
  const ort = kaziEntries.length > 0 ? (toplam / kaziEntries.length).toFixed(1) : '0';
  const hataCount = proj.entries.filter(e => e.hatalar?.length > 0 || e.hata?.var).length;
  const tarihlerMs = proj.entries.map(e => new Date(e.tarih).getTime());
  const ilk = new Date(Math.min(...tarihlerMs)).toLocaleDateString('tr-TR');
  const son = new Date(Math.max(...tarihlerMs)).toLocaleDateString('tr-TR');
  const kaziTarihlerMs = kaziEntries.map(e => new Date(e.tarih).getTime());
  const takvimGunSayisi = kaziEntries.length > 0 ? Math.round((Math.max(...kaziTarihlerMs) - Math.min(...kaziTarihlerMs)) / 86400000) + 1 : 0;
  const ortTakvim = takvimGunSayisi > 0 ? (toplam / takvimGunSayisi).toFixed(1) : '0';
  const hedefStr = proj.hedefMetre > 0 ? `\n🎯 Hedef: ${proj.hedefMetre} m (%${((toplam/proj.hedefMetre)*100).toLocaleString("tr-TR",{maximumFractionDigits:0})} tamamlandı)` : '';
  const malzMap = {};
  proj.entries.forEach(e => (e.malzemeler || []).forEach(m => { malzMap[m.name] = (malzMap[m.name] || 0) + parseFloat(m.miktar || 0); }));
  const malzStr = Object.entries(malzMap).length > 0 ? Object.entries(malzMap).map(([n, t]) => `   • ${n}: ${t}`).join('\n') : '   • Yok';
  const ekipMapP = {};
  proj.entries.forEach(e => { const key = e.ekipId || '__bos__'; ekipMapP[key] = (ekipMapP[key] || 0) + parseFloat(e.kaziMetre || 0); });
  const ekipStrP = Object.entries(ekipMapP).sort((a, b) => b[1] - a[1]).map(([eid, t]) => {
    const isim = eid === '__bos__' ? 'Ekip Atanmamış' : (data.teams.find(x => x.id === eid)?.ad || 'Bilinmeyen Ekip');
    return `   • ${isim}: ${t.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m`;
  }).join('\n') || '   • Yok';
  const denMapP = {};
  proj.entries.forEach(e => {
    const secimler = denetimSecimleriNormalize(e.denetimSecimleri, e.denetimciId);
    const keys = secimler.length > 0 ? secimler.map(s => s.id) : ['__bos__'];
    keys.forEach(key => { denMapP[key] = (denMapP[key] || 0) + parseFloat(e.kaziMetre || 0); });
  });
  const denStrP = Object.entries(denMapP).sort((a, b) => b[1] - a[1]).map(([did, t]) => {
    const d = data.denetimciler.find(x => x.id === did);
    const isim = did === '__bos__' ? 'Denetimci Atanmamış' : (d ? d.ad + (d.kurum ? ' (' + d.kurum + ')' : '') : 'Bilinmeyen Denetimci');
    return `   • ${isim}: ${t.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m`;
  }).join('\n') || '   • Yok';
  const hataEntries = proj.entries.filter(e => e.hatalar?.length > 0 || e.hata?.var);
  const hataStr = hataEntries.length > 0 ? hataEntries.map(e => {
    const tarih = new Date(e.tarih).toLocaleDateString('tr-TR');
    const hatalar = e.hatalar?.length > 0
      ? e.hatalar.map(h => `      - ${h.turler?.join(', ') || 'Belirtilmemiş'}${h.aciklama ? ': ' + h.aciklama : ''}${h.giderildi ? ' ✅ GİDERİLDİ' : ''}`).join('\n')
      : `      - ${e.hata?.turler?.join(', ') || 'Belirtilmemiş'}${e.hata?.aciklama ? ': ' + e.hata.aciklama : ''}`;
    return `   📅 ${tarih}\n${hatalar}`;
  }).join('\n') : '   • Yok';
  const metin = `📊 *PROJE RAPORU*\n🏗 ${proj.name}${proj.location ? ' - ' + proj.location : ''}\n\n📅 ${ilk} → ${son}\n⛏ Toplam Kazı: *${toplam.toLocaleString("tr-TR",{maximumFractionDigits:0})} m*\n📈 Günlük Ort. (çalışılan gün): ${ort} m\n📊 Günlük Ort. (takvim günü): ${ortTakvim} m\n📅 Kazı Günü: ${kaziEntries.length} gün${hedefStr}\n⚠️ Hatalı Gün: ${hataCount}\n\n👷 Ekiplere Göre:\n${ekipStrP}\n\n🕵️ Denetimcilere Göre:\n${denStrP}\n\n🧱 Toplam Malzeme:\n${malzStr}\n\n⚠️ Hata Detayları:\n${hataStr}`;
  paylas(metin, 'Proje Raporu');
}

function paylas(metin, baslik) {
  _bekleyenRaporMetni = metin;
  const modal = document.getElementById('raporOnizlemeModal');
  const icerik = document.getElementById('raporOnizlemeIcerik');
  const nav = document.getElementById('raporOnizlemeAyNav');
  const pdfBtn = document.getElementById('raporOnizlemePdfBtn');
  if (nav) nav.style.display = 'none';
  if (pdfBtn) pdfBtn.style.display = 'none';
  if (modal && icerik) {
    icerik.textContent = metin;
    modal.style.display = 'flex';
  } else {
    raporOnizlemePaylas();
  }
}

function raporOnizlemePaylas() {
  document.getElementById('raporOnizlemeModal').style.display = 'none';
  const metin = window._raporOnizlemeMevcutMetin || _bekleyenRaporMetni;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(metin)}`;
  window.open(waUrl, '_blank');
}

// ─── RAPOR ───────────────────────────────────────────────
function renderRapor() {
  const proj = activeProject();
  const empty = document.getElementById('raporEmpty');
  const content = document.getElementById('raporContent');
  if (!proj) { empty.style.display = 'block'; content.style.display = 'none'; return; }
  empty.style.display = 'none'; content.style.display = 'block';

  const kaziEntries = proj.entries.filter(e => Number(e.kaziMetre) > 0);
  const total = proj.entries.reduce((s, e) => s + e.kaziMetre, 0);
  const avg = kaziEntries.length ? (total / kaziEntries.length) : 0;
  const avgStr = avg > 0 ? avg.toLocaleString('tr-TR', {maximumFractionDigits:1}) + ' m' : '-';
  const hataCount = proj.entries.filter(e => e.hatalar?.length > 0 || e.hata?.var).length;
  const titleEl = document.getElementById('raporTitle');

  document.getElementById('rStatMetre').textContent = total.toLocaleString('tr-TR', {maximumFractionDigits:0}) + ' m';
  document.getElementById('rStatGun').textContent = kaziEntries.length;
  document.getElementById('rStatOrt').textContent = avgStr;

  const rStatOrtTakvimEl = document.getElementById('rStatOrtTakvim');
  if (rStatOrtTakvimEl) {
    if (kaziEntries.length > 0) {
      const tarihler = kaziEntries.map(e => new Date(e.tarih).getTime());
      const takvimGunSayisi = Math.round((Math.max(...tarihler) - Math.min(...tarihler)) / 86400000) + 1;
      const avgTakvim = takvimGunSayisi > 0 ? (total / takvimGunSayisi) : 0;
      rStatOrtTakvimEl.textContent = avgTakvim > 0 ? avgTakvim.toLocaleString('tr-TR', {maximumFractionDigits:1}) + ' m' : '-';
    } else {
      rStatOrtTakvimEl.textContent = '-';
    }
  }

  // Tahmini gün hesapla
  let tahminiGunSonuc = 0;
  const hedefCard = document.getElementById('raporHedefCard');
  if (hedefCard) {
    if (proj.hedefMetre > 0) {
      hedefCard.style.display = 'block';
      const yuzde = Math.min(100, (total / proj.hedefMetre) * 100).toFixed(1);
      const kalan = Math.max(0, proj.hedefMetre - total).toFixed(1);
      const bar = document.getElementById('raporHedefBar');
      if (bar) { bar.style.width = yuzde + '%'; bar.style.background = yuzde >= 100 ? '#10b981' : yuzde >= 75 ? '#f59e0b' : '#3b82f6'; }
      const yuzdeEl = document.getElementById('raporHedefYuzde');
      if (yuzdeEl) yuzdeEl.textContent = '%' + yuzde;
      const yapilan = document.getElementById('raporYapilan');
      if (yapilan) yapilan.textContent = total.toLocaleString('tr-TR', {maximumFractionDigits:0}) + ' m';
      const hedefEl = document.getElementById('raporHedef');
      if (hedefEl) hedefEl.textContent = proj.hedefMetre + ' m';
      const kalanEl = document.getElementById('raporKalan');
      if (kalanEl) kalanEl.textContent = kalan + ' m';
      const avgGunR = kaziEntries.length > 0 ? total / kaziEntries.length : 0;
      const kalanSayi = Math.max(0, proj.hedefMetre - total);
      tahminiGunSonuc = (avgGunR > 0 && kalanSayi > 0) ? Math.ceil(kalanSayi / avgGunR) : 0;
      const raporTahmini = document.getElementById('raporTahmini');
      const raporTahminiSatir = document.getElementById('raporTahminiSatir');
      if (raporTahmini) raporTahmini.textContent = tahminiGunSonuc > 0 ? `~${tahminiGunSonuc} iş günü` : 'Tamamlandı';
      if (raporTahminiSatir) raporTahminiSatir.style.display = 'block';
    } else {
      hedefCard.style.display = 'none';
    }
  }

  // Title en sonda set et
  if (titleEl) {
    const tahminiLabel = proj.hedefMetre > 0
      ? (tahminiGunSonuc > 0 ? ` <span style="font-size:12px;color:var(--muted);font-weight:400">(${tahminiGunSonuc} gün kaldı)</span>` : ` <span style="font-size:12px;color:#10b981;font-weight:400">(Tamamlandı)</span>`)
      : '';
    titleEl.innerHTML = `📊 ${proj.name}${tahminiLabel}`;
  }
  setTimeout(grafikCiz, 100);

  const hataCard = document.getElementById('hataOzetCard');
  if (hataCount > 0) {
    hataCard.style.display = 'block';
    const hataEntries = proj.entries.filter(e => e.hatalar?.length > 0 || e.hata?.var).sort((a,b) => new Date(b.tarih)-new Date(a.tarih));
    document.getElementById('hataOzetBody').innerHTML = hataEntries.map(e =>
      `<tr>
              <td>${new Date(e.tarih).toLocaleDateString('tr-TR')}</td>
              <td>${e.hatalar?.length > 0 ? e.hatalar.map(h => h.turler?.join('/') || '-').join(' | ') : (e.hata?.turler?.join(', ') || '-')}</td>
              <td style="color:#fca5a5">${escapeHtml(e.hatalar?.length > 0 ? e.hatalar.map(h => h.aciklama || '').filter(Boolean).join(' | ') : (e.hata?.aciklama || '-'))}</td>
            </tr>`
    ).join('');
  } else hataCard.style.display = 'none';

  const map = {};
  proj.entries.forEach(e => e.malzemeler.forEach(m => {
    const k = m.name + '||' + m.birim;
    map[k] = (map[k] || 0) + parseFloat(m.miktar || 0);
  }));
  const ozet = Object.entries(map).map(([k, t]) => { const [n, b] = k.split('||'); return { n, t, b }; });
  const ozCard = document.getElementById('malzemeOzetCard');
  if (ozet.length > 0) {
    ozCard.style.display = 'block';
    document.getElementById('malzemeOzetBody').innerHTML = ozet.map(m =>
      `<tr><td>${m.n}</td><td style="color:var(--yellow);font-weight:700">${m.t}</td><td>${m.b}</td></tr>`
    ).join('');
  } else ozCard.style.display = 'none';

  const sorted = [...proj.entries].sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
  document.getElementById('raporEntryBody').innerHTML = sorted.map(e => {
    const ekipAdi = e.ekipId ? (data.teams.find(t => t.id === e.ekipId)?.ad || '-') : '-';
    const denStr = denetimciGorunumleri(e).map(d => d.ad).join(', ') || '-';
    return `<tr><td>${new Date(e.tarih).toLocaleDateString('tr-TR')}</td><td>${ekipAdi}</td><td>${denStr}</td><td style="color:${Number(e.kaziMetre) === 0 ? '#a78bfa' : 'var(--yellow)'};font-weight:700">${Number(e.kaziMetre) === 0 ? '🔧 Bakım' : Number(e.kaziMetre).toLocaleString('tr-TR', {maximumFractionDigits:0}) + ' m'}</td><td>${e.malzemeler.length} çeşit</td></tr>`;
  }).join('');

  // Ekiplere göre toplam
  const ekipMapR = {};
  proj.entries.forEach(e => {
    const key = e.ekipId || '__bos__';
    if (!ekipMapR[key]) ekipMapR[key] = { toplam: 0 };
    ekipMapR[key].toplam += parseFloat(e.kaziMetre || 0);
  });
  const ekipGirisR = Object.entries(ekipMapR).sort((a, b) => b[1].toplam - a[1].toplam);
  const ekipBodyR = document.getElementById('rEkipOzetBody');
  if (ekipBodyR) {
    ekipBodyR.innerHTML = ekipGirisR.length > 0 ? ekipGirisR.map(([eid, v]) => {
      const isim = eid === '__bos__' ? 'Ekip Atanmamış' : (data.teams.find(t => t.id === eid)?.ad || 'Bilinmeyen Ekip');
      return `<div class="rp-summary-row"><span class="rp-summary-name">${isim}</span><span class="rp-summary-val">${v.toplam.toLocaleString('tr-TR', {maximumFractionDigits:0})} m</span></div>`;
    }).join('') : '<div class="rp-summary-empty">Kayıt yok</div>';
  }
  const badgeEkipR = document.getElementById('rEkipSayacBadge');
  if (badgeEkipR) badgeEkipR.textContent = ekipGirisR.length;

  // Denetimcilere göre toplam
  const denMapR = {};
  proj.entries.forEach(e => {
    const secimler = denetimSecimleriNormalize(e.denetimSecimleri, e.denetimciId);
    const keys = secimler.length > 0 ? secimler.map(s => s.id) : ['__bos__'];
    keys.forEach(key => {
      if (!denMapR[key]) denMapR[key] = { toplam: 0 };
      denMapR[key].toplam += parseFloat(e.kaziMetre || 0);
    });
  });
  const denGirisR = Object.entries(denMapR).sort((a, b) => b[1].toplam - a[1].toplam);
  const denBodyR = document.getElementById('rDenetimciOzetBody');
  if (denBodyR) {
    denBodyR.innerHTML = denGirisR.length > 0 ? denGirisR.map(([did, v]) => {
      const d = data.denetimciler.find(x => x.id === did);
      const isim = did === '__bos__' ? 'Denetimci Atanmamış' : (d ? d.ad + (d.kurum ? ' (' + d.kurum + ')' : '') : 'Bilinmeyen Denetimci');
      return `<div class="rp-summary-row"><span class="rp-summary-name">${isim}</span><span class="rp-summary-val">${v.toplam.toLocaleString('tr-TR', {maximumFractionDigits:0})} m</span></div>`;
    }).join('') : '<div class="rp-summary-empty">Kayıt yok</div>';
  }
  const badgeDenR = document.getElementById('rDenetimciSayacBadge');
  if (badgeDenR) badgeDenR.textContent = denGirisR.length;
}

 // {yil, ay}
function raporTabDegis(tab) {
  _raporTab = tab;
  const btnProje = document.getElementById('raporTabBtnProje');
  const btnAylik = document.getElementById('raporTabBtnAylik');
  const tabProje = document.getElementById('raporProjeTab');
  const tabAylik = document.getElementById('raporAylikTab');
  const aktifStil = 'flex:1;padding:10px;border:1.5px solid var(--yellow);background:var(--yellow);color:#0f172a;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit';
  const pasifStil = 'flex:1;padding:10px;border:1.5px solid var(--border);background:none;color:var(--muted);border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit';
  if (tab === 'aylik') {
    if (btnProje) btnProje.style.cssText = pasifStil;
    if (btnAylik) btnAylik.style.cssText = aktifStil;
    if (tabProje) tabProje.style.display = 'none';
    if (tabAylik) tabAylik.style.display = 'block';
    renderAylikRapor();
  } else {
    if (btnAylik) btnAylik.style.cssText = pasifStil;
    if (btnProje) btnProje.style.cssText = aktifStil;
    if (tabAylik) tabAylik.style.display = 'none';
    if (tabProje) tabProje.style.display = 'block';
    renderRapor();
  }
}

 // { bas, bit }
function aylikRaporPeriyotDegis(p) {
  _aylikRaporPeriyot = p;
  const btnAy = document.getElementById('aylikPeriyotBtnAy');
  const btnTum = document.getElementById('aylikPeriyotBtnTum');
  const btnAralik = document.getElementById('aylikPeriyotBtnAralik');
  const aySeciciWrap = document.getElementById('aylikAySeciciWrap');
  const aralikSeciciWrap = document.getElementById('aylikAralikSeciciWrap');
  const aktifStil = 'flex:1;padding:9px;border:1.5px solid var(--yellow);background:var(--yellow);color:#0f172a;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit';
  const pasifStil = 'flex:1;padding:9px;border:1.5px solid var(--border);background:none;color:var(--muted);border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit';
  if (btnAy) btnAy.style.cssText = p === 'ay' ? aktifStil : pasifStil;
  if (btnTum) btnTum.style.cssText = p === 'tum' ? aktifStil : pasifStil;
  if (btnAralik) btnAralik.style.cssText = p === 'aralik' ? aktifStil : pasifStil;
  if (aySeciciWrap) aySeciciWrap.style.display = p === 'ay' ? 'flex' : 'none';
  if (aralikSeciciWrap) aralikSeciciWrap.style.display = p === 'aralik' ? 'flex' : 'none';
  if (p === 'aralik' && !_aylikRaporAralik) {
    const now = new Date();
    const ayBasi = new Date(now.getFullYear(), now.getMonth(), 1);
    _aylikRaporAralik = { bas: _ymd(ayBasi), bit: _ymd(now) };
    const basInput = document.getElementById('aylikRaporAralikBas');
    const bitInput = document.getElementById('aylikRaporAralikBit');
    if (basInput) basInput.value = _aylikRaporAralik.bas;
    if (bitInput) bitInput.value = _aylikRaporAralik.bit;
  }
  renderAylikRapor();
}

function aylikRaporAralikDegis() {
  const bas = document.getElementById('aylikRaporAralikBas')?.value;
  const bit = document.getElementById('aylikRaporAralikBit')?.value;
  if (!bas || !bit) return;
  if (bas > bit) { toast('⚠️ Başlangıç tarihi bitişten sonra olamaz', true); return; }
  _aylikRaporAralik = { bas, bit };
  renderAylikRapor();
}

function aylikRaporAyDegis(yon) {
  if (!_aylikRaporAy) { const now = new Date(); _aylikRaporAy = { yil: now.getFullYear(), ay: now.getMonth() + 1 }; }
  let { yil, ay } = _aylikRaporAy;
  ay += yon;
  if (ay > 12) { ay = 1; yil++; }
  if (ay < 1) { ay = 12; yil--; }
  _aylikRaporAy = { yil, ay };
  renderAylikRapor();
}

function aylikRaporAyInputDegis() {
  const val = document.getElementById('aylikRaporAyInput')?.value; // "YYYY-MM"
  if (!val) return;
  const [yil, ay] = val.split('-').map(Number);
  _aylikRaporAy = { yil, ay };
  renderAylikRapor();
}

async function renderAylikRapor() {
  if (!_aylikRaporAy) {
    const now = new Date();
    _aylikRaporAy = { yil: now.getFullYear(), ay: now.getMonth() + 1 };
  }
  const { yil, ay } = _aylikRaporAy;
  const input = document.getElementById('aylikRaporAyInput');
  if (input) input.value = `${yil}-${String(ay).padStart(2, '0')}`;
  renderEkipFiltre();
  renderDenetimciFiltre();

  const tumZamanlar = _aylikRaporPeriyot === 'tum';
  const aralikMi = _aylikRaporPeriyot === 'aralik';
  const baslikEl = document.getElementById('aylikRaporBaslik');
  if (baslikEl) baslikEl.textContent = tumZamanlar ? '♾️ Tüm Zamanlar Kazı Raporu' : (aralikMi ? '📆 Özel Tarih Aralığı Raporu' : '🗓️ Aylık Kazı Raporu');

  let basStr, bitStr;
  if (aralikMi) {
    basStr = _aylikRaporAralik?.bas || _ymd(new Date());
    bitStr = _aylikRaporAralik?.bit || _ymd(new Date());
  } else {
    basStr = `${yil}-${String(ay).padStart(2, '0')}-01`;
    bitStr = _ymd(new Date(yil, ay, 0));
  }

  showLoading('Yükleniyor...');
  let kayitlar = [];
  try {
    const aylikKolonlar = () => `proje_id, tarih, kazi_metre, ekip_id, denetimci_id${!_denetimSecimleriDesteklenmiyor ? ', denetim_secimleri' : ''}`;
    let sorgu = sb.from('kayitlar').select(aylikKolonlar()).order('tarih', { ascending: false });
    if (!tumZamanlar) sorgu = sorgu.gte('tarih', basStr).lte('tarih', bitStr);
    let kayitRes = await sorgu;
    if (kayitRes.error && kayitRes.error.message && kayitRes.error.message.includes('denetim_secimleri')) {
      _denetimSecimleriDesteklenmiyor = true;
      let sorgu2 = sb.from('kayitlar').select(aylikKolonlar()).order('tarih', { ascending: false });
      if (!tumZamanlar) sorgu2 = sorgu2.gte('tarih', basStr).lte('tarih', bitStr);
      kayitRes = await sorgu2;
    }
    if (kayitRes.error) throw kayitRes.error;
    kayitlar = kayitRes.data || [];
  } catch (err) {
    hideLoading();
    toast('⚠️ ' + (err.message || 'Kayıtlar alınamadı'), true);
    return;
  }
  hideLoading();

  const tumProjeler = {};
  data.projects.forEach(p => tumProjeler[p.id] = p.name);
  (data.deletedProjects || []).forEach(p => tumProjeler[p.id] = p.name + ' (silindi)');

  const tumEkipler = {};
  data.teams.forEach(t => tumEkipler[t.id] = t.ad);

  const tumDenetimciler = {};
  data.denetimciler.forEach(d => tumDenetimciler[d.id] = d.ad + (d.kurum ? ' (' + d.kurum + ')' : ''));

  // Ekip filtresi uygula
  const ekipFiltre = document.getElementById('aylikRaporEkipFiltre')?.value || '';
  let filtreli = kayitlar;
  if (ekipFiltre === '__bos__') filtreli = kayitlar.filter(k => !k.ekip_id);
  else if (ekipFiltre) filtreli = kayitlar.filter(k => k.ekip_id === ekipFiltre);

  // Denetimci filtresi uygula
  const denetimciFiltre = document.getElementById('aylikRaporDenetimciFiltre')?.value || '';
  if (denetimciFiltre === '__bos__') filtreli = filtreli.filter(k => denetimciIdListesi(k).length === 0);
  else if (denetimciFiltre) filtreli = filtreli.filter(k => denetimciIdListesi(k).includes(denetimciFiltre));

  const toplamMetre = filtreli.reduce((s, k) => s + parseFloat(k.kazi_metre || 0), 0);
  const projeSet = new Set(filtreli.map(k => k.proje_id));
  const kaziKayitlari = filtreli.filter(k => parseFloat(k.kazi_metre || 0) > 0);

  // Günlük ortalama hesapları
  const calisilanGunler = new Set(kaziKayitlari.map(k => k.tarih));
  const calisilanGunSayisi = calisilanGunler.size;
  const ortCalisilanGun = calisilanGunSayisi > 0 ? (toplamMetre / calisilanGunSayisi) : 0;

  let takvimGunSayisi = 0;
  if (tumZamanlar) {
    if (kaziKayitlari.length > 0) {
      const tarihler = kaziKayitlari.map(k => new Date(k.tarih).getTime());
      const minT = Math.min(...tarihler), maxT = Math.max(...tarihler);
      takvimGunSayisi = Math.round((maxT - minT) / 86400000) + 1;
    }
  } else {
    const b = new Date(basStr), e = new Date(bitStr);
    takvimGunSayisi = Math.round((e - b) / 86400000) + 1;
  }
  const ortTakvimGun = takvimGunSayisi > 0 ? (toplamMetre / takvimGunSayisi) : 0;

  const gunlukOrtEl = document.getElementById('aStatGunlukOrt');
  const gunlukOrtTakvimEl = document.getElementById('aStatGunlukOrtTakvim');
  if (gunlukOrtEl) gunlukOrtEl.textContent = calisilanGunSayisi > 0 ? ortCalisilanGun.toLocaleString('tr-TR', { maximumFractionDigits: 1 }) + ' m' : '-';
  if (gunlukOrtTakvimEl) gunlukOrtTakvimEl.textContent = takvimGunSayisi > 0 ? ortTakvimGun.toLocaleString('tr-TR', { maximumFractionDigits: 1 }) + ' m' : '-';

  document.getElementById('aStatMetre').textContent = toplamMetre.toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' m';
  document.getElementById('aStatKayit').textContent = kaziKayitlari.length;
  document.getElementById('aStatProje').textContent = projeSet.size;

  const projeMap = {};
  filtreli.forEach(k => {
    if (!projeMap[k.proje_id]) projeMap[k.proje_id] = { toplam: 0, sayi: 0 };
    projeMap[k.proje_id].toplam += parseFloat(k.kazi_metre || 0);
    if (parseFloat(k.kazi_metre || 0) > 0) projeMap[k.proje_id].sayi += 1;
  });
  const ozetGiris = Object.entries(projeMap).sort((a, b) => b[1].toplam - a[1].toplam);
  const ozetCard = document.getElementById('aylikProjeOzetCard');
  if (ozetGiris.length > 0) {
    ozetCard.style.display = 'block';
    document.getElementById('aylikProjeOzetBody').innerHTML = ozetGiris.map(([pid, v]) =>
      `<div class="rp-summary-row"><span class="rp-summary-name">${tumProjeler[pid] || 'Bilinmeyen Proje'}</span><span class="rp-summary-val">${v.toplam.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m</span></div>`
    ).join('');
  } else { ozetCard.style.display = 'none'; }

  const ekipMap = {};
  filtreli.forEach(k => {
    const key = k.ekip_id || '__bos__';
    if (!ekipMap[key]) ekipMap[key] = { toplam: 0, sayi: 0 };
    ekipMap[key].toplam += parseFloat(k.kazi_metre || 0);
    if (parseFloat(k.kazi_metre || 0) > 0) ekipMap[key].sayi += 1;
  });
  const ekipOzetGiris = Object.entries(ekipMap).sort((a, b) => b[1].toplam - a[1].toplam);
  const ekipOzetCard = document.getElementById('aylikEkipOzetCard');
  if (ekipOzetGiris.length > 0) {
    ekipOzetCard.style.display = 'block';
    document.getElementById('aylikEkipOzetBody').innerHTML = ekipOzetGiris.map(([eid, v]) =>
      `<div class="rp-summary-row"><span class="rp-summary-name">${eid === '__bos__' ? 'Ekip Atanmamış' : (tumEkipler[eid] || 'Bilinmeyen Ekip')}</span><span class="rp-summary-val">${v.toplam.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m</span></div>`
    ).join('');
  } else { ekipOzetCard.style.display = 'none'; }

  const denetimciMap = {};
  filtreli.forEach(k => {
    const idler = denetimciIdListesi(k);
    const keys = idler.length > 0 ? idler : ['__bos__'];
    keys.forEach(key => {
      if (!denetimciMap[key]) denetimciMap[key] = { toplam: 0, sayi: 0 };
      denetimciMap[key].toplam += parseFloat(k.kazi_metre || 0);
      if (parseFloat(k.kazi_metre || 0) > 0) denetimciMap[key].sayi += 1;
    });
  });
  const denetimciOzetGiris = Object.entries(denetimciMap).sort((a, b) => b[1].toplam - a[1].toplam);
  const denetimciOzetCard = document.getElementById('aylikDenetimciOzetCard');
  if (denetimciOzetGiris.length > 0) {
    denetimciOzetCard.style.display = 'block';
    document.getElementById('aylikDenetimciOzetBody').innerHTML = denetimciOzetGiris.map(([did, v]) =>
      `<div class="rp-summary-row"><span class="rp-summary-name">${did === '__bos__' ? 'Denetimci Atanmamış' : (tumDenetimciler[did] || 'Bilinmeyen Denetimci')}</span><span class="rp-summary-val">${v.toplam.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m</span></div>`
    ).join('');
  } else { denetimciOzetCard.style.display = 'none'; }

  const body = document.getElementById('aylikRaporBody');
  const bos = document.getElementById('aylikRaporBos');
  if (filtreli.length === 0) {
    body.innerHTML = '';
    bos.textContent = tumZamanlar ? 'Kayıt bulunamadı.' : (aralikMi ? 'Bu tarih aralığında kayıt bulunamadı.' : 'Bu ayda kayıt bulunamadı.');
    bos.style.display = 'block';
  } else {
    bos.style.display = 'none';
    body.innerHTML = filtreli.map(k =>
      `<tr><td>${new Date(k.tarih).toLocaleDateString('tr-TR')}</td><td>${tumProjeler[k.proje_id] || 'Bilinmeyen Proje'}</td><td>${k.ekip_id ? (tumEkipler[k.ekip_id] || 'Bilinmeyen Ekip') : '-'}</td><td>${denetimciRowMetni(k, tumDenetimciler) || '-'}</td><td style="color:${Number(k.kazi_metre) === 0 ? '#a78bfa' : 'var(--yellow)'};font-weight:700">${Number(k.kazi_metre) === 0 ? '🔧 Bakım' : Number(k.kazi_metre).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' m'}</td></tr>`
    ).join('');
  }

  window._aylikRaporVeri = { yil, ay, tumZamanlar, aralikMi, basStr, bitStr, kayitlar: filtreli, kaziKayitSayisi: kaziKayitlari.length, tumProjeler, tumEkipler, tumDenetimciler, toplamMetre, ozetGiris, ekipOzetGiris, denetimciOzetGiris, calisilanGunSayisi, ortCalisilanGun, takvimGunSayisi, ortTakvimGun, ekipFiltreAd: ekipFiltre === '__bos__' ? 'Ekip Atanmamış' : (ekipFiltre ? (tumEkipler[ekipFiltre] || '') : ''), denetimciFiltreAd: denetimciFiltre === '__bos__' ? 'Denetimci Atanmamış' : (denetimciFiltre ? (tumDenetimciler[denetimciFiltre] || '') : '') };
}

function aylikRaporPaylas() {
  const veri = window._aylikRaporVeri;
  if (!veri || veri.kayitlar.length === 0) { toast('⚠️ Kayıt yok', true); return; }
  const donemAdi = veri.tumZamanlar ? 'Tüm Zamanlar' : (veri.aralikMi ? `${new Date(veri.basStr).toLocaleDateString('tr-TR')} – ${new Date(veri.bitStr).toLocaleDateString('tr-TR')}` : new Date(veri.yil, veri.ay - 1, 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }));
  const baslikMetin = veri.tumZamanlar ? 'TÜM ZAMANLAR KAZI RAPORU' : (veri.aralikMi ? 'ÖZEL TARİH ARALIĞI RAPORU' : 'AYLIK KAZI RAPORU');
  const filtreStr = (veri.ekipFiltreAd ? `\n👷 Ekip: ${veri.ekipFiltreAd}` : '') + (veri.denetimciFiltreAd ? `\n🕵️ Denetimci: ${veri.denetimciFiltreAd}` : '');
  const satirlar = veri.ozetGiris.map(([pid, v]) => `${veri.tumProjeler[pid] || 'Bilinmeyen Proje'}: ${v.toplam.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m (${v.sayi} kayıt)`);
  const ortStr = veri.calisilanGunSayisi > 0 ? `\n📈 Günlük Ort.: ${veri.ortCalisilanGun.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} m (çalışılan gün) / ${veri.ortTakvimGun.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} m (takvim günü)` : '';
  const metin = `🗓️ *${baslikMetin}*\n📅 ${donemAdi}${filtreStr}${ortStr}\n\n${satirlar.join('\n')}\n\nTOPLAM: ${veri.toplamMetre.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m (${veri.kaziKayitSayisi} kayıt)`;
  paylas(metin, veri.tumZamanlar ? 'Tüm Zamanlar Kazı Raporu' : (veri.aralikMi ? 'Özel Tarih Aralığı Raporu' : 'Aylık Kazı Raporu'));
}

function aylikRaporPdf() {
  const veri = window._aylikRaporVeri;
  if (!veri || veri.kayitlar.length === 0) { toast('⚠️ Kayıt yok', true); return; }
  const donemAdi = veri.tumZamanlar ? 'Tüm Zamanlar' : (veri.aralikMi ? `${new Date(veri.basStr).toLocaleDateString('tr-TR')} – ${new Date(veri.bitStr).toLocaleDateString('tr-TR')}` : new Date(veri.yil, veri.ay - 1, 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }));
  const tarihStr = new Date().toLocaleDateString('tr-TR');

  const projeRows = veri.ozetGiris.map(([pid, v]) =>
    `<tr><td>${veri.tumProjeler[pid] || 'Bilinmeyen Proje'}</td><td style="font-weight:700">${v.toplam.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m</td><td>${v.sayi}</td></tr>`
  ).join('') || '<tr><td colspan="3" style="color:#999">Kayıt yok</td></tr>';

  const ekipRows = veri.ekipOzetGiris.map(([eid, v]) =>
    `<tr><td>${eid === '__bos__' ? 'Ekip Atanmamış' : (veri.tumEkipler[eid] || 'Bilinmeyen Ekip')}</td><td style="font-weight:700">${v.toplam.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m</td><td>${v.sayi}</td></tr>`
  ).join('') || '<tr><td colspan="3" style="color:#999">Kayıt yok</td></tr>';

  const denetimciRows = veri.denetimciOzetGiris.map(([did, v]) =>
    `<tr><td>${did === '__bos__' ? 'Denetimci Atanmamış' : (veri.tumDenetimciler[did] || 'Bilinmeyen Denetimci')}</td><td style="font-weight:700">${v.toplam.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m</td><td>${v.sayi}</td></tr>`
  ).join('') || '<tr><td colspan="3" style="color:#999">Kayıt yok</td></tr>';

  const sorted = [...veri.kayitlar].sort((a, b) => new Date(a.tarih) - new Date(b.tarih));
  const detayRows = sorted.map(k =>
    `<tr><td>${new Date(k.tarih).toLocaleDateString('tr-TR')}</td><td>${veri.tumProjeler[k.proje_id] || 'Bilinmeyen Proje'}</td><td>${k.ekip_id ? (veri.tumEkipler[k.ekip_id] || '-') : '-'}</td><td>${denetimciRowMetni(k, veri.tumDenetimciler) || '-'}</td><td style="font-weight:700">${Number(k.kazi_metre) === 0 ? '🔧 Bakım' : Number(k.kazi_metre).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' m'}</td></tr>`
  ).join('');

  const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8">
  <title>${veri.tumZamanlar ? 'Tüm Zamanlar' : (veri.aralikMi ? 'Özel Tarih Aralığı' : 'Aylık')} Kazı Raporu - ${donemAdi}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #1a1a1a; font-size: 12px; max-width: 900px; margin: 0 auto; }
    h1 { font-size: 20px; color: #92400e; border-bottom: 3px solid #f59e0b; padding-bottom: 8px; margin-bottom: 4px; }
    .meta { font-size: 11px; color: #666; margin-bottom: 18px; }
    .stats { display: flex; gap: 12px; margin: 16px 0; flex-wrap: wrap; }
    .stat-box { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 10px 16px; text-align: center; min-width: 100px; }
    .stat-val { font-size: 20px; font-weight: bold; color: #b45309; }
    .stat-lbl { font-size: 10px; color: #78716c; margin-top: 2px; }
    h2 { font-size: 13px; background: #f3f4f6; padding: 6px 10px; border-radius: 4px; margin: 20px 0 8px; border-left: 4px solid #f59e0b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #f59e0b; color: #fff; padding: 6px 8px; text-align: left; font-size: 11px; }
    td { border: 1px solid #e5e7eb; padding: 5px 8px; font-size: 11px; }
    tr:nth-child(even) td { background: #f9fafb; }
    .footer { margin-top: 24px; font-size: 10px; color: #999; border-top: 1px solid #e5e7eb; padding-top: 8px; }
    thead { display: table-header-group; }
    h2 { page-break-after: avoid; break-after: avoid-page; }
    tr { page-break-inside: avoid; break-inside: avoid-page; }
    table { page-break-inside: auto; }
    @media print { body { padding: 10px; } }
  </style></head><body>
  <h1>${veri.tumZamanlar ? '♾️ Tüm Zamanlar Kazı Raporu' : (veri.aralikMi ? '📆 Özel Tarih Aralığı Raporu' : '🗓️ Aylık Kazı Raporu')}</h1>
  <div class="meta">📅 ${donemAdi} &nbsp;|&nbsp; Oluşturma: ${tarihStr}${veri.ekipFiltreAd ? ` &nbsp;|&nbsp; 👷 Ekip Filtresi: ${veri.ekipFiltreAd}` : ''}${veri.denetimciFiltreAd ? ` &nbsp;|&nbsp; 🕵️ Denetimci Filtresi: ${veri.denetimciFiltreAd}` : ''}</div>

  <div class="stats">
    <div class="stat-box"><div class="stat-val">${veri.toplamMetre.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m</div><div class="stat-lbl">Toplam Kazı</div></div>
    <div class="stat-box"><div class="stat-val">${veri.kaziKayitSayisi}</div><div class="stat-lbl">Kayıt Sayısı</div></div>
    <div class="stat-box"><div class="stat-val">${new Set(veri.kayitlar.map(k => k.proje_id)).size}</div><div class="stat-lbl">Aktif Proje</div></div>
    <div class="stat-box"><div class="stat-val">${veri.calisilanGunSayisi > 0 ? veri.ortCalisilanGun.toLocaleString('tr-TR', { maximumFractionDigits: 1 }) + ' m' : '-'}</div><div class="stat-lbl">Günlük Ort. (çalışılan gün)</div></div>
    <div class="stat-box"><div class="stat-val">${veri.takvimGunSayisi > 0 ? veri.ortTakvimGun.toLocaleString('tr-TR', { maximumFractionDigits: 1 }) + ' m' : '-'}</div><div class="stat-lbl">Günlük Ort. (takvim günü)</div></div>
  </div>

  <h2>🏗 Projelere Göre Toplam</h2>
  <table>
    <tr><th>Proje</th><th>Toplam</th><th>Kayıt</th></tr>
    ${projeRows}
  </table>

  <h2>👷 Ekiplere Göre Toplam</h2>
  <table>
    <tr><th>Ekip</th><th>Toplam</th><th>Kayıt</th></tr>
    ${ekipRows}
  </table>

  <h2>🕵️ Denetimcilere Göre Toplam</h2>
  <table>
    <tr><th>Denetimci</th><th>Toplam</th><th>Kayıt</th></tr>
    ${denetimciRows}
  </table>

  <h2>📋 Kazı Detayları</h2>
  <table>
    <tr><th>Tarih</th><th>Proje</th><th>Ekip</th><th>Denetimci</th><th>Kazı (m)</th></tr>
    ${detayRows}
  </table>

  <div class="footer">Kazı Takip Uygulaması &nbsp;|&nbsp; ${tarihStr} tarihinde oluşturulmuştur</div>
  </body></html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
  toast('✅ PDF için yazdırma ekranı açıldı! "PDF olarak kaydet" seçin.');
}

// ─── EXCEL EXPORT ────────────────────────────────────────
function giderRaporPdf() {
  const veri = window._giderRaporVeri;
  if (!veri || veri.donemGiderler.length === 0) { toast('⚠️ Gider kaydı yok', true); return; }
  const tarihStr = new Date().toLocaleDateString('tr-TR');

  const katRows = veri.katSatirlar.map(([k, t]) =>
    `<tr><td>${k}</td><td style="font-weight:700">${t.toLocaleString('tr-TR')} ₺</td><td>${veri.toplam > 0 ? ((t / veri.toplam) * 100).toFixed(0) : 0}%</td></tr>`
  ).join('') || '<tr><td colspan="3" style="color:#999">Kayıt yok</td></tr>';

  const sorted = [...veri.donemGiderler].sort((a, b) => a.tarih.localeCompare(b.tarih));
  const detayRows = sorted.map(g =>
    `<tr><td>${new Date(g.tarih).toLocaleDateString('tr-TR')}</td><td>${escapeHtml(g.kategori)}</td><td>${escapeHtml(g.aciklama || '-')}</td><td style="font-weight:700">${parseFloat(g.tutar).toLocaleString('tr-TR')} ₺</td></tr>`
  ).join('');

  const gunSayisi = new Set(veri.donemGiderler.map(g => g.tarih)).size;

  const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8">
  <title>Gider Raporu - ${veri.ayAdi}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #1a1a1a; font-size: 12px; max-width: 900px; margin: 0 auto; }
    h1 { font-size: 20px; color: #92400e; border-bottom: 3px solid #f59e0b; padding-bottom: 8px; margin-bottom: 4px; }
    .meta { font-size: 11px; color: #666; margin-bottom: 18px; }
    .stats { display: flex; gap: 12px; margin: 16px 0; flex-wrap: wrap; }
    .stat-box { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 10px 16px; text-align: center; min-width: 100px; }
    .stat-val { font-size: 20px; font-weight: bold; color: #b45309; }
    .stat-lbl { font-size: 10px; color: #78716c; margin-top: 2px; }
    h2 { font-size: 13px; background: #f3f4f6; padding: 6px 10px; border-radius: 4px; margin: 20px 0 8px; border-left: 4px solid #f59e0b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #f59e0b; color: #fff; padding: 6px 8px; text-align: left; font-size: 11px; }
    td { border: 1px solid #e5e7eb; padding: 5px 8px; font-size: 11px; }
    tr:nth-child(even) td { background: #f9fafb; }
    .footer { margin-top: 24px; font-size: 10px; color: #999; border-top: 1px solid #e5e7eb; padding-top: 8px; }
    thead { display: table-header-group; }
    h2 { page-break-after: avoid; break-after: avoid-page; }
    tr { page-break-inside: avoid; break-inside: avoid-page; }
    table { page-break-inside: auto; }
    @media print { body { padding: 10px; } }
  </style></head><body>
  <h1>💸 Gider Raporu</h1>
  <div class="meta">${veri.ikon} ${veri.ayAdi}${veri.tarihAralikStr ? ` &nbsp;|&nbsp; 📆 ${veri.tarihAralikStr}` : ''} &nbsp;|&nbsp; Oluşturma: ${tarihStr}</div>

  <div class="stats">
    <div class="stat-box"><div class="stat-val">${veri.toplam.toLocaleString('tr-TR')} ₺</div><div class="stat-lbl">Toplam Gider</div></div>
    <div class="stat-box"><div class="stat-val">${veri.donemGiderler.length}</div><div class="stat-lbl">Kayıt Sayısı</div></div>
    <div class="stat-box"><div class="stat-val">${gunSayisi}</div><div class="stat-lbl">Gün Sayısı</div></div>
    <div class="stat-box"><div class="stat-val">${veri.katSatirlar.length}</div><div class="stat-lbl">Kategori Sayısı</div></div>
  </div>

  <h2>📂 Kategoriye Göre Toplam</h2>
  <table>
    <tr><th>Kategori</th><th>Toplam</th><th>Oran</th></tr>
    ${katRows}
  </table>

  <h2>📋 Gider Detayları</h2>
  <table>
    <tr><th>Tarih</th><th>Kategori</th><th>Açıklama</th><th>Tutar</th></tr>
    ${detayRows}
  </table>

  <div class="footer">Kazı Takip Uygulaması &nbsp;|&nbsp; ${tarihStr} tarihinde oluşturulmuştur</div>
  </body></html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
  toast('✅ PDF için yazdırma ekranı açıldı! "PDF olarak kaydet" seçin.');
}

function exportExcel(filtreliKayitlar, dosyaEki) {
  if (typeof XLSX === 'undefined') {
    showLoading('Excel kütüphanesi yükleniyor...');
    const s = document.createElement('script');
    s.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
    s.onload = () => { hideLoading(); exportExcel(filtreliKayitlar, dosyaEki); };
    s.onerror = () => { hideLoading(); toast('⚠️ Excel kütüphanesi yüklenemedi', true); };
    document.head.appendChild(s);
    return;
  }
  const proj = activeProject();
  if (!proj) { islemBildir('Önce proje seçin!', null, true); return; }
  if (proj.entries.length === 0) { islemBildir('Kayıt yok!', null, true); return; }
  const kayitlar = filtreliKayitlar || proj.entries;
  const sorted = [...kayitlar].sort((a, b) => new Date(a.tarih) - new Date(b.tarih));
  const wb = XLSX.utils.book_new();
  const bugun = new Date().toLocaleDateString('tr-TR');
  const kaziEntriesXls = proj.entries.filter(e => Number(e.kaziMetre) > 0);
  const toplam = proj.entries.reduce((s, e) => s + e.kaziMetre, 0);
  const ort = kaziEntriesXls.length > 0 ? (toplam / kaziEntriesXls.length).toFixed(1) : '0';
  const tarihlerMsXls = kaziEntriesXls.map(e => new Date(e.tarih).getTime());
  const takvimGunSayisiXls = kaziEntriesXls.length > 0 ? Math.round((Math.max(...tarihlerMsXls) - Math.min(...tarihlerMsXls)) / 86400000) + 1 : 0;
  const ortTakvimXls = takvimGunSayisiXls > 0 ? (toplam / takvimGunSayisiXls).toFixed(1) : '0';
  const hataCount = proj.entries.filter(e => e.hatalar?.length > 0 || e.hata?.var).length;

  // ── YARDIMCI STİL FONKSİYONLARI ───────────────────────
  const stil = (font = {}, fill = {}, alignment = {}, border = false) => ({
    font: { name: 'Calibri', sz: 11, ...font },
    fill: Object.keys(fill).length ? { patternType: 'solid', fgColor: fill } : { patternType: 'none' },
    alignment: { vertical: 'center', wrapText: true, ...alignment },
    border: border ? {
      top: { style: 'thin', color: { rgb: 'D1D5DB' } },
      bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
      left: { style: 'thin', color: { rgb: 'D1D5DB' } },
      right: { style: 'thin', color: { rgb: 'D1D5DB' } },
    } : {}
  });

  const hucreYaz = (ws, ref, value, s) => {
    ws[ref] = { v: value, t: typeof value === 'number' ? 'n' : 's', s };
  };

  // ══════════════════════════════════════════════════════
  // SAYFA 1 — ÖZET RAPOR
  // ══════════════════════════════════════════════════════
  const wsOzet = {};
  wsOzet['!ref'] = 'A1:F30';
  wsOzet['!cols'] = [{ wch: 2 }, { wch: 28 }, { wch: 30 }, { wch: 2 }, { wch: 18 }, { wch: 18 }];
  wsOzet['!rows'] = Array(30).fill({ hpt: 18 });
  wsOzet['!rows'][0] = { hpt: 10 };
  wsOzet['!rows'][1] = { hpt: 42 };
  wsOzet['!rows'][2] = { hpt: 8 };
  wsOzet['!rows'][4] = { hpt: 22 };

  // Ana başlık
  hucreYaz(wsOzet, 'B2', '⛏  KAZI TAKİP SİSTEMİ', stil(
    { bold: true, sz: 22, color: { rgb: 'F59E0B' } },
    { rgb: '0F172A' }, { horizontal: 'left' }
  ));
  hucreYaz(wsOzet, 'C2', 'PROJE RAPORU', stil(
    { bold: true, sz: 16, color: { rgb: '94A3B8' } },
    { rgb: '0F172A' }, { horizontal: 'left' }
  ));

  // Ayırıcı başlık
  hucreYaz(wsOzet, 'B4', 'PROJE BİLGİLERİ', stil(
    { bold: true, sz: 10, color: { rgb: 'F59E0B' } },
    { rgb: '1E293B' }, { horizontal: 'left' }
  ));

  const projBilgi = [
    ['Proje Adı', proj.name],
    ['Konum / Bölge', proj.location || '-'],
    ['Rapor Tarihi', bugun],
  ];
  projBilgi.forEach(([etiket, deger], i) => {
    hucreYaz(wsOzet, `B${5 + i}`, etiket, stil(
      { bold: true, sz: 11, color: { rgb: '64748B' } },
      { rgb: '1E293B' }, { horizontal: 'left' }, true
    ));
    hucreYaz(wsOzet, `C${5 + i}`, deger, stil(
      { sz: 11, color: { rgb: 'E2E8F0' } },
      { rgb: '1E293B' }, { horizontal: 'left' }, true
    ));
  });

  // İstatistik kartları başlık
  hucreYaz(wsOzet, 'B9', 'İSTATİSTİKLER', stil(
    { bold: true, sz: 10, color: { rgb: 'F59E0B' } },
    { rgb: '1E293B' }, { horizontal: 'left' }
  ));

  const istatistikler = [
    ['📏 Toplam Kazı', `${toplam.toLocaleString("tr-TR",{maximumFractionDigits:0})} m`, 'F59E0B', '1C1917'],
    ['📅 Toplam Gün', `${kaziEntriesXls.length} gün`, '3B82F6', '0C1A2E'],
    ['📈 Günlük Ort. (çalışılan gün)', `${ort} m`, '10B981', '052E16'],
    ['📊 Günlük Ort. (takvim günü)', `${ortTakvimXls} m`, 'EC4899', '2D0A1F'],
    ['⚠️ Hatalı İşlem', `${hataCount} adet`, hataCount > 0 ? 'EF4444' : '10B981', hataCount > 0 ? '2D0A0A' : '052E16'],
  ];
  istatistikler.forEach(([etiket, deger, renk, bg], i) => {
    hucreYaz(wsOzet, `B${10 + i}`, etiket, stil(
      { bold: true, sz: 12, color: { rgb: renk } },
      { rgb: bg }, { horizontal: 'left' }, true
    ));
    hucreYaz(wsOzet, `C${10 + i}`, deger, stil(
      { bold: true, sz: 14, color: { rgb: renk } },
      { rgb: bg }, { horizontal: 'center' }, true
    ));
  });

  XLSX.utils.book_append_sheet(wb, wsOzet, '📊 Özet');

  // ══════════════════════════════════════════════════════
  // SAYFA 2 — GÜNLÜK KAYITLAR
  // ══════════════════════════════════════════════════════
  const wsKayit = {};
  const kBasliklar = ['No', 'Tarih', 'Kazı (m)', 'Ekip', 'Denetimci', 'Malzemeler', 'Notlar', 'Hatalı?', 'Hata Türü', 'Hata Açıklaması'];
  const kCols = 'ABCDEFGHIJ';
  wsKayit['!cols'] = [{ wch: 5 }, { wch: 13 }, { wch: 10 }, { wch: 18 }, { wch: 24 }, { wch: 42 }, { wch: 32 }, { wch: 10 }, { wch: 22 }, { wch: 40 }];
  wsKayit['!rows'] = [{ hpt: 24 }];

  // Başlık satırı
  kBasliklar.forEach((baslik, i) => {
    hucreYaz(wsKayit, `${kCols[i]}1`, baslik, stil(
      { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
      { rgb: '1E3A5F' },
      { horizontal: 'center' },
      true
    ));
  });
  wsKayit['A1'].s.border = { bottom: { style: 'thick', color: { rgb: 'F59E0B' } } };

  // Veri satırları
  sorted.forEach((e, i) => {
    const row = i + 2;
    const isEven = i % 2 === 0;
    const isHata = (e.hatalar?.length > 0) || e.hata?.var;
    const bgNormal = isEven ? 'F1F5F9' : 'FFFFFF';
    const bgHata = isEven ? 'FEE2E2' : 'FEF2F2';
    const bg = isHata ? bgHata : bgNormal;

    wsKayit['!rows'].push({ hpt: 18 });

    const ekipAdiXls = e.ekipId ? (data.teams.find(t => t.id === e.ekipId)?.ad || '-') : '-';
    const denStrXls = denetimciGorunumleri(e).map(d => `${d.vakitEtiket ? d.vakitEtiket + ' ' : ''}${d.ad}`).join(', ') || '-';

    const satirVeriler = [
      i + 1,
      new Date(e.tarih).toLocaleDateString('tr-TR'),
      e.kaziMetre,
      ekipAdiXls,
      denStrXls,
      e.malzemeler.map(m => `${m.name}: ${m.miktar} ${m.birim}`).join(' | ') || '-',
      e.notlar || '-',
      isHata ? '⚠ EVET' : '✓ Hayır',
      isHata ? (e.hatalar?.length > 0 ? e.hatalar.map(h => h.turler?.join('/') || '').filter(Boolean).join(' | ') : (e.hata?.turler?.join(', ') || '-')) : '-',
      isHata ? (e.hatalar?.length > 0 ? e.hatalar.map(h => h.aciklama || '').filter(Boolean).join(' | ') : (e.hata?.aciklama || '-')) : '-',
    ];

    satirVeriler.forEach((v, j) => {
      const col = kCols[j];
      const ref = `${col}${row}`;
      const isKazi = col === 'C';
      const isHataCol = col === 'H';
      hucreYaz(wsKayit, ref, v, stil(
        {
          sz: 10,
          bold: isKazi,
          color: { rgb: isKazi ? 'D97706' : isHataCol && isHata ? 'DC2626' : isHataCol ? '16A34A' : '1E293B' }
        },
        { rgb: bg },
        { horizontal: (col === 'A' || col === 'C' || col === 'H') ? 'center' : 'left' },
        true
      ));
    });
  });

  wsKayit['!ref'] = `A1:J${sorted.length + 1}`;
  XLSX.utils.book_append_sheet(wb, wsKayit, '📋 Günlük Kayıtlar');

  // ══════════════════════════════════════════════════════
  // SAYFA 3 — MALZEME ÖZETİ
  // ══════════════════════════════════════════════════════
  const malzemeMap = {};
  sorted.forEach(e => e.malzemeler.forEach(m => {
    const k = `${m.name}||${m.birim}`;
    malzemeMap[k] = (malzemeMap[k] || 0) + parseFloat(m.miktar || 0);
  }));
  const malzemeListesi = Object.entries(malzemeMap).map(([k, t]) => {
    const [name, birim] = k.split('||');
    return [name, t, birim];
  });

  if (malzemeListesi.length > 0) {
    const wsMalzeme = {};
    wsMalzeme['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 12 }];
    wsMalzeme['!rows'] = [{ hpt: 24 }];

    ['Malzeme Adı', 'Toplam Miktar', 'Birim'].forEach((b, i) => {
      hucreYaz(wsMalzeme, `${'ABC'[i]}1`, b, stil(
        { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
        { rgb: '065F46' }, { horizontal: 'center' }, true
      ));
    });

    malzemeListesi.forEach(([name, miktar, birim], i) => {
      const row = i + 2;
      const bg = i % 2 === 0 ? 'ECFDF5' : 'FFFFFF';
      wsMalzeme['!rows'].push({ hpt: 20 });
      hucreYaz(wsMalzeme, `A${row}`, name, stil({ sz: 11, color: { rgb: '064E3B' } }, { rgb: bg }, { horizontal: 'left' }, true));
      hucreYaz(wsMalzeme, `B${row}`, miktar, stil({ bold: true, sz: 13, color: { rgb: '059669' } }, { rgb: bg }, { horizontal: 'center' }, true));
      hucreYaz(wsMalzeme, `C${row}`, birim, stil({ sz: 11, color: { rgb: '064E3B' } }, { rgb: bg }, { horizontal: 'center' }, true));
    });

    wsMalzeme['!ref'] = `A1:C${malzemeListesi.length + 1}`;
    XLSX.utils.book_append_sheet(wb, wsMalzeme, '🧱 Malzeme Özeti');
  }

  // ══════════════════════════════════════════════════════
  // SAYFA 4 — HATALI İŞLEMLER
  // ══════════════════════════════════════════════════════
  const hataListesi = sorted.filter(e => e.hatalar?.length > 0 || e.hata?.var);
  if (hataListesi.length > 0) {
    const wsHata = {};
    wsHata['!cols'] = [{ wch: 5 }, { wch: 13 }, { wch: 11 }, { wch: 28 }, { wch: 48 }];
    wsHata['!rows'] = [{ hpt: 24 }];

    ['No', 'Tarih', 'Kazı (m)', 'Hata Türü', 'Açıklama'].forEach((b, i) => {
      hucreYaz(wsHata, `${'ABCDE'[i]}1`, b, stil(
        { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
        { rgb: '7F1D1D' }, { horizontal: 'center' }, true
      ));
    });

    hataListesi.forEach((e, i) => {
      const row = i + 2;
      const bg = i % 2 === 0 ? 'FEE2E2' : 'FEF2F2';
      wsHata['!rows'].push({ hpt: 20 });
      const tumTurler = e.hatalar?.length > 0 ? e.hatalar.map(h => h.turler?.join('/') || '').filter(Boolean).join(' | ') : (e.hata?.turler?.join(', ') || '-');
      const tumAciklama = e.hatalar?.length > 0 ? e.hatalar.map(h => h.aciklama || '').filter(Boolean).join(' | ') : (e.hata?.aciklama || '-');
      const vals = [
        i + 1,
        new Date(e.tarih).toLocaleDateString('tr-TR'),
        e.kaziMetre,
        tumTurler,
        tumAciklama,
      ];
      vals.forEach((v, j) => {
        const col = 'ABCDE'[j];
        hucreYaz(wsHata, `${col}${row}`, v, stil(
          { sz: 10, bold: col === 'C', color: { rgb: col === 'C' ? 'B91C1C' : '7F1D1D' } },
          { rgb: bg },
          { horizontal: (col === 'A' || col === 'C') ? 'center' : 'left' },
          true
        ));
      });
    });

    wsHata['!ref'] = `A1:E${hataListesi.length + 1}`;
    XLSX.utils.book_append_sheet(wb, wsHata, '⚠ Hatalı İşlemler');
  }

  const dosyaTarih = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
  XLSX.writeFile(wb, `${proj.name}_${dosyaEki || dosyaTarih}.xlsx`, { cellStyles: true });
  toast('✅ Excel indirildi!');
}
