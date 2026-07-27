async function tempHatalarSil(idx) {
  const entryId = window._lastSavedEntryId;
  if (!entryId) {
    tempHatalar.splice(idx, 1);
    renderMevcutHatalar();
    return;
  }
  showLoading('Siliniyor...');
  try {
    const h = tempHatalar[idx];
    if (h?.gorseller?.length > 0) {
      const paths = h.gorseller.filter(g => g.path).map(g => g.path);
      if (paths.length > 0) await sb.storage.from('kazi-dosyalar').remove(paths);
    }
    tempHatalar.splice(idx, 1);
    const hata = { var: tempHatalar.length > 0 };
    await sb.from('kayitlar').update({ hatalar: tempHatalar, hata }).eq('id', entryId);
    const proj = activeProject();
    const entry = proj?.entries.find(e => e.id === entryId);
    if (entry) { entry.hatalar = [...tempHatalar]; entry.hata = hata; }
    hideLoading();
    renderMevcutHatalar();
    toast('✅ Hata silindi!');
  } catch(err) { hideLoading(); toast('⚠️ ' + (err.message||'Bağlantı hatası'), true); }
}

function fotoGoster(url) {
  const modal = document.getElementById('fotoModal');
  document.getElementById('fotoModalImg').src = url;
  document.getElementById('fotoModalIndir').href = url;
  modal.style.display = 'flex';
}

// ─── ÇOKLU HATA SİSTEMİ ─────────────────────────────────
async function hataEkleVeKaydet() {
  const aciklama = document.getElementById('fHataAciklama').value.trim();
  if (tempHataTurler.length === 0 && !aciklama) {
    islemBildir('En az bir hata türü seç veya açıklama yaz!', null, true);
    return;
  }

  const entryId = window._lastSavedEntryId;
  if (!entryId) { islemBildir('Kayıt bulunamadı!', null, true); return; }

  showLoading('Kaydediliyor...');

  // Supabase'den güncel kayıt çek
  const { data: kayit, error: fetchErr } = await sb.from('kayitlar')
    .select('hatalar, hata').eq('id', entryId).single();
  if (fetchErr || !kayit) { hideLoading(); islemBildir('Kayıt alınamadı!', null, true); return; }

  const mevcutHatalar = Array.isArray(kayit.hatalar) ? [...kayit.hatalar] : [];

  // Görselleri yükle
  const yuklenenGorseller = [];
  for (const f of tempHataGorseller) {
    const path = `kayitlar/${entryId}/hata/${Date.now()}_${f.file.name}`;
    const { error: upErr } = await sb.storage.from('kazi-dosyalar').upload(path, f.file);
    if (!upErr) {
      const { data } = sb.storage.from('kazi-dosyalar').getPublicUrl(path);
      yuklenenGorseller.push({ url: data.publicUrl, name: f.file.name, path });
    }
  }

  const yeniHata = {
    turler: [...tempHataTurler],
    aciklama,
    gorseller: yuklenenGorseller,
    tarih: new Date().toISOString(),
    giderildi: false,
    giderilmeTarihi: null,
    giderilmeNotu: null,
    giderilmeGorseller: []
  };

  let yeniHatalar;
  if (_hataduzenleIdx !== null) {
    // Güncelleme - eski görselleri koru, yenilerini ekle, giderildi durumunu koru
    yeniHatalar = [...mevcutHatalar];
    const eskiKayit = yeniHatalar[_hataduzenleIdx] || {};
    const eskiGorseller = eskiKayit.gorseller || [];
    yeniHatalar[_hataduzenleIdx] = {
      ...yeniHata,
      gorseller: [...eskiGorseller, ...yuklenenGorseller],
      giderildi: eskiKayit.giderildi || false,
      giderilmeTarihi: eskiKayit.giderilmeTarihi || null,
      giderilmeNotu: eskiKayit.giderilmeNotu || null,
      giderilmeGorseller: eskiKayit.giderilmeGorseller || []
    };
  } else {
    // Yeni ekleme
    yeniHatalar = [...mevcutHatalar, yeniHata];
  }

  const hata = { var: yeniHatalar.length > 0 };
  const { error: updateErr } = await sb.from('kayitlar')
    .update({ hatalar: yeniHatalar, hata }).eq('id', entryId);

  hideLoading();
  if (updateErr) { islemBildir('Kaydedilemedi: ' + updateErr.message, null, true); return; }

  // Lokal state güncelle
  const proj = activeProject();
  const entry = proj?.entries.find(e => e.id === entryId);
  if (entry) { entry.hatalar = yeniHatalar; entry.hata = hata; }

  // Formu sıfırla
  tempHataTurler = [];
  tempHataGorseller = [];
  _hataduzenleIdx = null;
  tempHatalar = [...yeniHatalar];
  document.getElementById('fHataAciklama').value = '';
  document.getElementById('hataGorselOnizleme').innerHTML = '';
  document.querySelectorAll('.hata-type-btn').forEach(b => b.className = 'hata-type-btn');
  const btn = document.getElementById('hataEkleBtn');
  if (btn) btn.textContent = '💾 Hatayı Kaydet';
  document.getElementById('yeniHataForm').style.display = 'none';
  const yeniHataAcBtnEl = document.getElementById('yeniHataAcBtn'); if (yeniHataAcBtnEl) yeniHataAcBtnEl.textContent = '➕ Yeni Hata Ekle';

  renderMevcutHatalar();
  islemBildir(_hataduzenleIdx !== null ? 'Hata güncellendi!' : 'Hata kaydedildi!', 'dashboard');
}

function hataEkle() {
  const aciklama = document.getElementById('fHataAciklama').value.trim();
  if (tempHataTurler.length === 0 && !aciklama) {
    islemBildir('En az bir hata türü seç veya açıklama yaz!', null, true);
    return;
  }
  const hataObj = {
    id: Date.now(),
    turler: [...tempHataTurler],
    aciklama,
    gorseller: [...(tempHataGorseller.map(f => ({ file: f.file, url: f.url, isNew: true })))]
  };
  if (_hataduzenleIdx !== null) {
    tempHatalar[_hataduzenleIdx] = { ...tempHatalar[_hataduzenleIdx], ...hataObj };
    _hataduzenleIdx = null;
    const ekleBtn = document.querySelector('[onclick="hataEkle()"]');
    if (ekleBtn) ekleBtn.textContent = '+ Hatayı Listeye Ekle';
    toast('✅ Hata güncellendi!');
  } else {
    tempHatalar.push(hataObj);
    toast(`✅ Hata eklendi! Toplam: ${tempHatalar.length}`);
  }
  tempHataTurler = [];
  tempHataGorseller = [];
  document.getElementById('fHataAciklama').value = '';
  document.getElementById('hataGorselOnizleme').innerHTML = '';
  document.querySelectorAll('.hata-type-btn').forEach(b => b.className = 'hata-type-btn');
  renderMevcutHatalar();
}

async function renderMevcutHatalar(sadeceBak = false) {
  const div = document.getElementById('mevcutHatalarList');
  const sayac = document.getElementById('hataSayac');
  if (!div) return;
  if (tempHatalar.length === 0) { div.innerHTML = ''; if (sayac) sayac.textContent = ''; return; }
  if (sayac) sayac.textContent = `${tempHatalar.length} hata`;
  div.innerHTML = tempHatalar.map((h, i) => `
    <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:10px;margin-bottom:8px">
      <div style="display:flex;gap:6px;margin-bottom:6px;align-items:center">
        <span style="flex:1;font-size:11px;color:var(--muted);font-weight:700">#${i+1} HATA ${h.giderildi ? `<span class="giderildi-badge">✅ Giderildi</span>` : ''}</span>
        ${!sadeceBak ? `<button onclick="hataDuzenle(${i})" style="background:rgba(59,130,246,0.15);border:1px solid var(--blue);color:var(--blue);border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;font-family:inherit">✏️ Düzenle</button>
        <button onclick="tempHatalarSil(${i})" style="background:rgba(239,68,68,0.15);border:1px solid var(--red);color:var(--red);border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;font-family:inherit">🗑 Sil</button>` : ''}
      </div>
      ${h.turler.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px">${h.turler.map(t => `<span style="background:rgba(239,68,68,0.2);color:#fca5a5;border-radius:20px;padding:2px 8px;font-size:11px">${t}</span>`).join('')}</div>` : ''}
      ${h.aciklama ? `<div style="color:#fca5a5;font-size:12px;white-space:pre-wrap">📋 ${escapeHtml(h.aciklama)}</div>` : ''}
      ${h.gorseller?.length > 0 ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">${h.gorseller.map((g, gi) => `
        <div style="position:relative">
          <img src="${g.url}" onclick="fotoGoster('${g.url}')" style="width:60px;height:60px;object-fit:cover;border-radius:6px;border:1px solid var(--red);cursor:pointer">
          ${!sadeceBak ? `<button onclick="silOnayla('Bu görseli silmek istediğine emin misin?', async () => { 
            const g = tempHatalar[${i}].gorseller[${gi}];
            if (g && g.path) await sb.storage.from('kazi-dosyalar').remove([g.path]);
            tempHatalar[${i}].gorseller.splice(${gi},1);
            const entryId = window._lastSavedEntryId;
            const proj = activeProject();
            const entry = proj?.entries.find(e => e.id === entryId);
            if (entry) {
              entry.hatalar = [...tempHatalar];
              await sb.from('kayitlar').update({ hatalar: entry.hatalar }).eq('id', entryId);
            }
            renderMevcutHatalar(); 
            toast('✅ Görsel silindi!');
          })" style="position:absolute;top:-6px;left:-6px;background:var(--red);border:none;color:white;border-radius:50%;width:18px;height:18px;font-size:11px;cursor:pointer;line-height:1">×</button>` : ''}
        </div>`).join('')}</div>` : ''}
      ${h.giderildi ? `
        <div style="margin-top:8px;padding:8px 10px;background:rgba(16,185,129,0.06);border-left:3px solid #10b981;border-radius:4px">
          <div style="font-size:11px;color:#10b981;font-weight:700">✅ GİDERİLDİ ${h.giderilmeTarihi ? '(' + new Date(h.giderilmeTarihi).toLocaleDateString('tr-TR') + ')' : ''}</div>
          ${h.giderilmeNotu ? `<div style="font-size:12px;color:var(--text);margin-top:2px;white-space:pre-wrap">${h.giderilmeNotu.replace(/</g,'&lt;')}</div>` : ''}
          ${h.giderilmeGorseller?.length > 0 ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">${h.giderilmeGorseller.map(g => `<img src="${g.url}" onclick="fotoGoster('${g.url}')" style="width:56px;height:56px;object-fit:cover;border-radius:6px;border:1px solid #10b981;cursor:pointer">`).join('')}</div>` : ''}
          ${!sadeceBak ? `<button onclick="hataGiderilmeGeriAl(${i})" style="width:100%;background:none;border:1px solid var(--border);color:var(--sub);border-radius:8px;padding:7px;font-size:11px;cursor:pointer;font-family:inherit;margin-top:8px">↩️ Giderildi İşaretini Geri Al</button>` : ''}
        </div>
      ` : (!sadeceBak ? (
          hataGiderilmeTemp[i]
          ? `<div style="margin-top:8px;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.3);border-radius:8px;padding:10px">
              <label class="field-label" style="margin-top:0;color:#10b981">GİDERİLDİ AÇIKLAMASI</label>
              <textarea id="hataGiderilmeNot-${i}" placeholder="Ne yapıldı, nasıl giderildi..." style="height:56px"></textarea>
              <input type="file" id="hataGiderilmeFoto-${i}" accept="image/*" multiple style="display:none" onchange="onHataGiderilmeFotoSec(${i})" />
              <button onclick="document.getElementById('hataGiderilmeFoto-${i}').click()" style="width:100%;background:rgba(16,185,129,0.12);border:1px solid #10b981;color:#10b981;border-radius:8px;padding:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:6px">📷 Kanıt Fotoğrafı Ekle</button>
              <div id="hataGiderilmeOnizleme-${i}" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px"></div>
              <div style="display:flex;gap:8px;margin-top:8px">
                <button onclick="hataGiderilmeIptal(${i})" style="flex:1;background:none;border:1px solid var(--border);color:var(--sub);border-radius:8px;padding:9px;font-size:12px;cursor:pointer;font-family:inherit">İptal</button>
                <button onclick="hataGiderildiKaydet(${i})" style="flex:2;background:#10b981;color:white;border:none;border-radius:8px;padding:9px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">✅ Giderildi Olarak Kaydet</button>
              </div>
            </div>`
          : `<button onclick="hataGiderilmeAc(${i})" style="width:100%;background:rgba(16,185,129,0.1);border:1.5px solid #10b981;color:#10b981;border-radius:8px;padding:9px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:8px">✅ Giderildi Olarak İşaretle</button>`
        ) : '')}
    </div>`).join('');
}

function hataGiderilmeAc(i) {
  hataGiderilmeTemp[i] = { gorseller: [] };
  renderMevcutHatalar();
}

function hataGiderilmeIptal(i) {
  (hataGiderilmeTemp[i]?.gorseller || []).forEach(f => { try { URL.revokeObjectURL(f.url); } catch(e) {} });
  delete hataGiderilmeTemp[i];
  renderMevcutHatalar();
}

async function onHataGiderilmeFotoSec(i) {
  const input = document.getElementById(`hataGiderilmeFoto-${i}`);
  const files = input.files;
  if (!files.length) return;
  showLoading('Fotoğraflar işleniyor...');
  for (const f of files) { hataGiderilmeTemp[i].gorseller.push(await sikistir(f)); }
  hideLoading();
  input.value = '';
  renderHataGiderilmeOnizleme(i);
}

function renderHataGiderilmeOnizleme(i) {
  const onizleme = document.getElementById(`hataGiderilmeOnizleme-${i}`);
  if (!onizleme) return;
  onizleme.innerHTML = (hataGiderilmeTemp[i]?.gorseller || []).map((f, gi) => `
    <div style="position:relative;display:inline-block">
      <img src="${f.url}" style="width:56px;height:56px;object-fit:cover;border-radius:6px;border:2px solid #10b981" loading="lazy"/>
      <button onclick="hataGiderilmeTemp[${i}].gorseller.splice(${gi},1);renderHataGiderilmeOnizleme(${i})" style="position:absolute;top:-6px;right:-6px;background:var(--red);border:none;color:white;border-radius:50%;width:18px;height:18px;font-size:11px;cursor:pointer">×</button>
    </div>`).join('');
}

async function hataGiderildiKaydet(i) {
  const entryId = window._lastSavedEntryId;
  if (!entryId) { islemBildir('Kayıt bulunamadı!', null, true); return; }
  const notEl = document.getElementById(`hataGiderilmeNot-${i}`);
  const not = notEl ? notEl.value.trim() : '';
  showLoading('Kaydediliyor...');
  try {
    const gorseller = hataGiderilmeTemp[i]?.gorseller || [];
    const fotoUrls = [];
    for (const f of gorseller) {
      const path = `kayitlar/${entryId}/hata/${i}/giderilme/${Date.now()}_${f.file.name}`;
      const { error: upErr } = await sb.storage.from('kazi-dosyalar').upload(path, f.file);
      if (!upErr) {
        const { data: pub } = sb.storage.from('kazi-dosyalar').getPublicUrl(path);
        fotoUrls.push({ url: pub.publicUrl, name: f.file.name, path });
      }
    }
    tempHatalar[i] = {
      ...tempHatalar[i],
      giderildi: true,
      giderilmeTarihi: new Date().toISOString(),
      giderilmeNotu: not || null,
      giderilmeGorseller: fotoUrls
    };
    const { error } = await sb.from('kayitlar').update({ hatalar: tempHatalar }).eq('id', entryId);
    if (error) { hideLoading(); islemBildir('Kaydedilemedi: ' + error.message, null, true); return; }
    const proj = activeProject();
    const entry = proj?.entries.find(e => e.id === entryId);
    if (entry) entry.hatalar = [...tempHatalar];
    delete hataGiderilmeTemp[i];
    hideLoading();
    renderMevcutHatalar();
    toast('✅ Eksik "giderildi" olarak işaretlendi!');
  } catch (err) { hideLoading(); islemBildir('⚠️ ' + (err.message || 'Bağlantı hatası'), null, true); }
}

async function hataGiderilmeGeriAl(i) {
  const entryId = window._lastSavedEntryId;
  if (!entryId) { islemBildir('Kayıt bulunamadı!', null, true); return; }
  showLoading('Güncelleniyor...');
  try {
    tempHatalar[i] = {
      ...tempHatalar[i],
      giderildi: false,
      giderilmeTarihi: null,
      giderilmeNotu: null,
      giderilmeGorseller: []
    };
    const { error } = await sb.from('kayitlar').update({ hatalar: tempHatalar }).eq('id', entryId);
    if (error) { hideLoading(); islemBildir('Güncellenemedi: ' + error.message, null, true); return; }
    const proj = activeProject();
    const entry = proj?.entries.find(e => e.id === entryId);
    if (entry) entry.hatalar = [...tempHatalar];
    hideLoading();
    renderMevcutHatalar();
    toast('↩️ Giderildi işareti geri alındı.');
  } catch (err) { hideLoading(); islemBildir('⚠️ ' + (err.message || 'Bağlantı hatası'), null, true); }
}

function toggleYeniHataForm() {
  const form = document.getElementById('yeniHataForm');
  const btn = document.getElementById('yeniHataAcBtn');
  const acik = form.style.display !== 'none';
  form.style.display = acik ? 'none' : 'block';
  btn.textContent = acik ? '➕ Yeni Hata Ekle' : '✕ Formu Kapat';
  if (!acik) form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hataDuzenle(idx) {
  const h = tempHatalar[idx];
  if (!h) return;
  _hataduzenleIdx = idx;
  // Formu doldur
  tempHataTurler = [...h.turler];
  document.getElementById('fHataAciklama').value = h.aciklama || '';
  document.querySelectorAll('.hata-type-btn').forEach(btn => {
    btn.className = 'hata-type-btn' + (tempHataTurler.includes(btn.textContent) ? ' selected' : '');
  });
  // Buton metnini değiştir
  // Formu aç
  document.getElementById('yeniHataForm').style.display = 'block';
  document.getElementById('yeniHataAcBtn').textContent = '✕ Formu Kapat';
  const ekleBtn = document.getElementById('hataEkleBtn');
  if (ekleBtn) ekleBtn.textContent = '✅ Hatayı Güncelle';
  document.getElementById('fHataAciklama').scrollIntoView({ behavior: 'smooth' });
}

// ─── HATA ────────────────────────────────────────────────
function toggleHataTur(btn, tur) {
  if (tempHataTurler.includes(tur)) {
    tempHataTurler = tempHataTurler.filter(t => t !== tur);
    btn.className = 'hata-type-btn';
  } else {
    tempHataTurler.push(tur);
    btn.className = 'hata-type-btn selected';
  }
}
