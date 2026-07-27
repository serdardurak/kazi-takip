// ─── FORM RESET ──────────────────────────────────────────
function resetForm() {
  tempMalzemeler = [];
  tempHataTurler = [];
  tempHatalar = [];
  const fields = { fTarih: new Date().toISOString().split('T')[0], fMetre: '', fNotlar: '', fMalzemeSelect: '', fMiktar: '', fBirim: 'adet' };
  Object.entries(fields).forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.value = val; });
  document.querySelectorAll('.hata-type-btn').forEach(b => b.className = 'hata-type-btn');
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) saveBtn.textContent = '💾 Kaydı Kaydet';
  ['malzemePanel','hataPanel','fotoPanel','kmzPanel','onayPanel'].forEach(id => document.getElementById(id)?.classList.remove('open'));
  const banner = document.getElementById('editBanner');
  if (banner) banner.style.display = 'none';
  window._lastSavedEntryId = null;
  _hataduzenleIdx = null;
  formDenetimSecimleri = [];
  const fBakimReset = document.getElementById('fBakim');
  if (fBakimReset) { fBakimReset.checked = false; }
  if (typeof bakimToggle === 'function') bakimToggle();
  if (typeof renderMalzemeChips === 'function') renderMalzemeChips();
  if (typeof updateBadges === 'function') updateBadges();
  if (typeof resetDosyaForm === 'function') resetDosyaForm();
  if (typeof renderEkipSelect === 'function') renderEkipSelect();
  if (typeof data !== 'undefined' && data.teams && data.teams.length === 0 && typeof loadTeams === 'function') loadTeams();
  if (typeof renderDenetimciSelect === 'function') renderDenetimciSelect();
  if (typeof data !== 'undefined' && data.denetimciler && data.denetimciler.length === 0 && typeof loadDenetimciler === 'function') loadDenetimciler();
  if (typeof renderMalzemeSelect === 'function') renderMalzemeSelect();
  if (typeof data !== 'undefined' && data.malzemeTurleri && data.malzemeTurleri.length === 0 && typeof loadMalzemeTurleri === 'function') loadMalzemeTurleri();
}

function resetDosyaForm() {
  tempFotograflar.forEach(f => { try { URL.revokeObjectURL(f.url); } catch(e) {} });
  tempHataGorseller.forEach(f => { try { URL.revokeObjectURL(f.url); } catch(e) {} });
  tempFotograflar = []; tempKmz = null; tempHataGorseller = [];
  ['fotografOnizleme','kmzOnizleme','hataGorselOnizleme'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = ''; });
  ['fFotograflar','fKmz','fHataGorsel'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const sayac = document.getElementById('fotografSayac');
  if (sayac) sayac.textContent = '0 / 150';
}

// ─── DOSYA YÜKLEME ───────────────────────────────────────
function sikistir(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1080;
        let w = img.width, h = img.height;
        if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob(blob => {
          const yeni = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
          resolve({ file: yeni, url: URL.createObjectURL(yeni) });
        }, 'image/jpeg', 0.50);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function onFotografSec() {
  const files = document.getElementById('fFotograflar').files;
  const kalan = 150 - tempFotograflar.length;
  if (kalan <= 0) { islemBildir('Maksimum 150 fotoğraf!', null, true); return; }
  if (files.length > 5) { islemBildir('En fazla 5 fotoğraf seçin!', null, true); document.getElementById('fFotograflar').value = ''; return; }
  const eklenecek = Math.min(files.length, kalan);
  showLoading('Fotoğraflar işleniyor...');
  for (let i = 0; i < eklenecek; i++) { tempFotograflar.push(await sikistir(files[i])); }
  hideLoading();
  document.getElementById('fFotograflar').value = '';
  renderFotografOnizleme();
  const yukleBtn = document.getElementById('fotoYukleBtn');
  if (yukleBtn) yukleBtn.style.display = tempFotograflar.length > 0 ? 'block' : 'none';
  toast(`✅ ${eklenecek} fotoğraf eklendi (${tempFotograflar.length}/150)`);
}

async function onHataGorselSec() {
  const files = document.getElementById('fHataGorsel').files;
  if (!files.length) return;
  showLoading(`${files.length} görsel işleniyor...`);
  for (const f of files) { tempHataGorseller.push(await sikistir(f)); }
  hideLoading();
  document.getElementById('fHataGorsel').value = '';
  renderHataGorselOnizleme();
  toast(`✅ ${files.length} görsel eklendi (toplam: ${tempHataGorseller.length})`);
}

function onKmzSec() {
  const f = document.getElementById('fKmz').files[0];
  if (!f) return;
  tempKmz = { file: f, name: f.name };
  document.getElementById('kmzOnizleme').innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;background:var(--bg);border:1px solid #8b5cf6;border-radius:8px;padding:8px 12px">
      <span>📁</span><span style="color:var(--text);font-size:13px;flex:1">${f.name}</span>
      <button onclick="tempKmz=null;document.getElementById('kmzOnizleme').innerHTML='';document.getElementById('fKmz').value='';updateBadges()" style="background:none;border:none;color:var(--red);font-size:18px;cursor:pointer">×</button>
    </div>`;
  updateBadges();
}

function renderFotografOnizleme() {
  const div = document.getElementById('fotografOnizleme');
  if (!div) return;
  div.innerHTML = tempFotograflar.map((f, i) => `
    <div style="position:relative;display:inline-block">
      <img src="${f.url}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;border:2px solid var(--yellow)" loading="lazy"/>
      <button onclick="tempFotograflar.splice(${i},1);renderFotografOnizleme()" style="position:absolute;top:-6px;right:-6px;background:var(--red);border:none;color:white;border-radius:50%;width:20px;height:20px;font-size:12px;cursor:pointer">×</button>
    </div>`).join('');
  const sayac = document.getElementById('fotografSayac');
  if (sayac) sayac.textContent = `${tempFotograflar.length} / 150`;
  updateBadges();
}

function renderHataGorselOnizleme() {
  const div = document.getElementById('hataGorselOnizleme');
  if (!div) return;
  div.innerHTML = tempHataGorseller.map((f, i) => `
    <div style="position:relative;display:inline-block">
      <img src="${f.url}" style="width:70px;height:70px;object-fit:cover;border-radius:8px;border:2px solid var(--red)" loading="lazy"/>
      <button onclick="tempHataGorseller.splice(${i},1);renderHataGorselOnizleme()" style="position:absolute;top:-6px;right:-6px;background:var(--red);border:none;color:white;border-radius:50%;width:18px;height:18px;font-size:11px;cursor:pointer">×</button>
    </div>`).join('');
}

async function uploadDosyalar(entryId) {
  const urls = { fotograflar: [], kmz: null };
  for (const f of tempFotograflar) {
    const path = `kayitlar/${entryId}/fotograflar/${Date.now()}_${f.file.name}`;
    const { error } = await sb.storage.from('kazi-dosyalar').upload(path, f.file);
    if (!error) { const { data } = sb.storage.from('kazi-dosyalar').getPublicUrl(path); urls.fotograflar.push({ url: data.publicUrl, name: f.file.name, path }); }
  }
  if (tempKmz) {
    const proj = activeProject();
    const entry = proj?.entries.find(e => e.id === entryId);
    const tarih = entry?.tarih || new Date().toISOString().split('T')[0];
    const metre = entry?.kaziMetre || '';
    const ext = tempKmz.file.name.endsWith('.kml') ? '.kml' : '.kmz';
    const [yy,aa,gg] = tarih.split('-');
    const tarihFmt = `${gg}-${aa}-${yy}`;
    const kmzAd = `${proj?.name || 'proje'}_${tarihFmt}_${metre}m${ext}`.replace(/[\s/]/g, '_');
    const path = `kayitlar/${entryId}/kmz/${Date.now()}_${kmzAd}`;
    const { error } = await sb.storage.from('kazi-dosyalar').upload(path, tempKmz.file);
    if (!error) { const { data } = sb.storage.from('kazi-dosyalar').getPublicUrl(path); urls.kmz = { url: data.publicUrl, name: kmzAd, path }; }
  }
  return urls;
}

// ─── KAYIT EKLE / GÜNCELLE ───────────────────────────────
async function saveEntry() {
  const proj = activeProject();
  if (!proj) { islemBildir('Önce proje seçin!', null, true); return; }
  if (proj.bitti) { islemBildir('Bu proje tamamlanmış! Kayıt eklenemez.', null, true); return; }
  const tarih = document.getElementById('fTarih').value;
  const bakimMi = document.getElementById('fBakim')?.checked || false;
  const metre = bakimMi ? 0 : parseFloat(document.getElementById('fMetre').value);
  const notlar = document.getElementById('fNotlar').value.trim();
  if (!tarih || isNaN(metre) || metre < 0 || (!bakimMi && metre <= 0)) { islemBildir('Tarih ve geçerli kazı miktarı zorunlu!', null, true); return; }
  if (bakimMi && !notlar) { islemBildir('Bakım/onarım günü için açıklama zorunlu!', null, true); return; }
  try {
  showLoading('Kaydediliyor...');
  const ekipId = document.getElementById('fEkip')?.value || null;
  const denetimciId = formDenetimSecimleri[0]?.id || null;
  const insertObj = {
    proje_id: proj.id, tarih, kazi_metre: metre, ekip_id: ekipId, malzemeler: [], notlar, hata: { var: false }, hatalar: [], fotograflar: [], kmz: null, saha_onaylari: []
  };
  if (!_denetimciDesteklenmiyor) insertObj.denetimci_id = denetimciId;
  if (!_denetimSecimleriDesteklenmiyor) insertObj.denetim_secimleri = formDenetimSecimleri;
  let { data: inserted, error } = await sb.from('kayitlar').insert(insertObj).select().single();
  if (error && error.message && error.message.includes('saha_onaylari')) {
    _sahaOnaylariDesteklenmiyor = true;
    delete insertObj.saha_onaylari;
    ({ data: inserted, error } = await sb.from('kayitlar').insert(insertObj).select().single());
  }
  if (error && error.message && error.message.includes('denetim_secimleri')) {
    _denetimSecimleriDesteklenmiyor = true;
    delete insertObj.denetim_secimleri;
    ({ data: inserted, error } = await sb.from('kayitlar').insert(insertObj).select().single());
  }
  if (error && error.message && error.message.includes('denetimci_id')) {
    _denetimciDesteklenmiyor = true;
    delete insertObj.denetimci_id;
    ({ data: inserted, error } = await sb.from('kayitlar').insert(insertObj).select().single());
  }
  if (error) { hideLoading(); islemBildir('Kayıt eklenemedi: ' + error.message, null, true); return; }
  if (tempFotograflar.length > 0 || tempKmz) {
    showLoading('Dosyalar yükleniyor...');
    const dosyaUrls = await uploadDosyalar(inserted.id);
    await sb.from('kayitlar').update({ fotograflar: dosyaUrls.fotograflar, kmz: dosyaUrls.kmz }).eq('id', inserted.id);
  }
  hideLoading();
  resetDosyaForm();
  await yenile();
  editOverlayKapatOrtak();
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('view-dashboard').classList.add('active');
  const fTarih = document.getElementById('fTarih');
  if (fTarih) fTarih.value = new Date().toISOString().split('T')[0];
  const fMetre = document.getElementById('fMetre');
  if (fMetre) fMetre.value = '';
  const fNotlar = document.getElementById('fNotlar');
  if (fNotlar) fNotlar.value = '';
  const fEkipReset = document.getElementById('fEkip');
  if (fEkipReset) fEkipReset.value = '';
  formDenetimSecimleri = [];
  renderFormDenetimciListe();
  const fBakimReset = document.getElementById('fBakim');
  if (fBakimReset) { fBakimReset.checked = false; bakimToggle(); }
  toast('✅ Kazı kaydı eklendi!');
  } catch(err) { hideLoading(); islemBildir('Kayıt eklenemedi: ' + (err.message || 'Bağlantı hatası'), null, true); }
}

async function updateEntry() {
  const proj = activeProject();
  if (!proj || !editingId) return;
  const tarih = document.getElementById('fTarih').value;
  const bakimMi = document.getElementById('fBakim')?.checked || false;
  const metre = bakimMi ? 0 : parseFloat(document.getElementById('fMetre').value);
  const notlar = document.getElementById('fNotlar').value.trim();
  if (!tarih || isNaN(metre) || metre < 0 || (!bakimMi && metre <= 0)) { islemBildir('Tarih ve geçerli kazı miktarı zorunlu!', null, true); return; }
  if (bakimMi && !notlar) { islemBildir('Bakım/onarım günü için açıklama zorunlu!', null, true); return; }
  try {
  showLoading('Güncelleniyor...');
  const mevcutKayit = await getKayitAlan(editingId, 'fotograflar,kmz');
  const dosyaUrls = await uploadDosyalar(editingId);
  const tumFotograflar = [...(mevcutKayit?.fotograflar || []), ...dosyaUrls.fotograflar];
  const tumKmz = dosyaUrls.kmz || mevcutKayit?.kmz || null;
  const ekipId = document.getElementById('fEkip')?.value || null;
  const denetimciId = formDenetimSecimleri[0]?.id || null;
  const updateObj = {
    tarih, kazi_metre: metre, ekip_id: ekipId, malzemeler: tempMalzemeler, notlar, fotograflar: tumFotograflar, kmz: tumKmz
  };
  if (!_denetimciDesteklenmiyor) updateObj.denetimci_id = denetimciId;
  if (!_denetimSecimleriDesteklenmiyor) updateObj.denetim_secimleri = formDenetimSecimleri;
  let { error } = await sb.from('kayitlar').update(updateObj).eq('id', editingId);
  if (error && error.message && error.message.includes('denetim_secimleri')) {
    _denetimSecimleriDesteklenmiyor = true;
    delete updateObj.denetim_secimleri;
    ({ error } = await sb.from('kayitlar').update(updateObj).eq('id', editingId));
  }
  if (error && error.message && error.message.includes('denetimci_id')) {
    _denetimciDesteklenmiyor = true;
    delete updateObj.denetimci_id;
    ({ error } = await sb.from('kayitlar').update(updateObj).eq('id', editingId));
  }
  hideLoading();
  if (error) { islemBildir('Güncelleme hatası: ' + error.message, null, true); return; }
  editingId = null;
  resetDosyaForm();
  await yenile();
  editOverlayKapatOrtak();
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('view-dashboard').classList.add('active');
  toast('✅ Kayıt güncellendi!');
  } catch(err) { hideLoading(); islemBildir('Güncellenemedi: ' + (err.message || 'Bağlantı hatası'), null, true); }
}

// ─── PANEL TOGGLE ────────────────────────────────────────
function updateBadges() {
  const mb = document.getElementById('malzemeBadge');
  if (mb) { mb.style.display = tempMalzemeler.length > 0 ? 'block' : 'none'; mb.textContent = tempMalzemeler.length; }
  const fb = document.getElementById('fotoBadge');
  if (fb) { fb.style.display = tempFotograflar.length > 0 ? 'block' : 'none'; fb.textContent = tempFotograflar.length; }
  const kb = document.getElementById('kmzBadge');
  if (kb) kb.style.display = tempKmz ? 'block' : 'none';
}

// ─── FOTOĞRAF SİL ────────────────────────────────────────
async function fotografSil(entryId, idx, tip, hataIdx) {
  showLoading('Siliniyor...');

  if (tip === 'foto') {
    const kayit = await getKayitAlan(entryId, 'fotograflar');
    const fotograflar = [...(kayit?.fotograflar || [])];
    const foto = fotograflar[idx];
    if (foto?.path) await sb.storage.from('kazi-dosyalar').remove([foto.path]);
    fotograflar.splice(idx, 1);
    await sb.from('kayitlar').update({ fotograflar }).eq('id', entryId);
    // Lokal state güncelle - sadece foto div'ini yenile
    const proj = activeProject();
    const entry = proj?.entries.find(e => e.id === entryId);
    if (entry) entry.fotograflar = fotograflar;
    hideLoading();
    toast('✅ Fotoğraf silindi!');
    // body elementini ID ile bul, içindeki foto-listesi'ni güncelle
    const bodyEl = document.getElementById('body-' + entryId);
    if (bodyEl) {
      const fotoListesi = bodyEl.querySelector('.foto-listesi');
      if (fotoListesi) {
        fotoListesi.innerHTML = fotograflar.map((f, i) => `
          <div style="position:relative">
            <img src="${f.url}" onclick="fotoGoster('${f.url}')" loading="lazy" style="width:80px;height:80px;object-fit:cover;border-radius:8px;border:2px solid var(--yellow);cursor:pointer"/>
            <button onclick="window.open('${f.url}','_blank');toast('📥 Fotoğraf indiriliyor...')" class="foto-indir-btn">⬇</button>
            <button onclick="fotografSil('${entryId}',${i},'foto')" style="position:absolute;top:-6px;left:-6px;background:var(--red);border:none;color:white;border-radius:50%;width:20px;height:20px;font-size:12px;cursor:pointer;line-height:1">×</button>
          </div>`).join('');
        // Buton sayacını güncelle
        const projBtn = document.querySelector(`[onclick*="hizliDetay('${entryId}','foto')"] span`);
        if (projBtn) projBtn.textContent = fotograflar.length > 0 ? fotograflar.length + ' foto' : 'Fotoğraf';
      }
    }

  } else if (tip === 'kmz') {
    const kayit = await getKayitAlan(entryId, 'kmz');
    if (kayit?.kmz?.path) await sb.storage.from('kazi-dosyalar').remove([kayit.kmz.path]);
    const { error: ke } = await sb.from('kayitlar').update({ kmz: null }).eq('id', entryId);
    if (ke) { hideLoading(); islemBildir('KMZ silinemedi!', null, true); return; }
    const proj = activeProject();
    const entry = proj?.entries.find(e => e.id === entryId);
    if (entry) entry.kmz = null;
    hideLoading();
    toast('✅ KMZ silindi!');
    // Sadece KMZ div'ini kaldır
    const kmzDiv = document.querySelector(`#body-${entryId} .kmz-bolumu`);
    if (kmzDiv) kmzDiv.remove();

  } else if (tip === 'hata') {
    const kayit = await getKayitAlan(entryId, 'hatalar');
    const hatalar = [...(kayit?.hatalar || [])];
    if (hataIdx !== undefined && hatalar[hataIdx]) {
      const gorsel = hatalar[hataIdx].gorseller?.[idx];
      if (gorsel?.path) await sb.storage.from('kazi-dosyalar').remove([gorsel.path]);
      hatalar[hataIdx].gorseller.splice(idx, 1);
      const { error: he } = await sb.from('kayitlar').update({ hatalar }).eq('id', entryId);
      if (he) { hideLoading(); islemBildir('Görsel silinemedi!', null, true); return; }
      const proj = activeProject();
      const entry = proj?.entries.find(e => e.id === entryId);
      if (entry) entry.hatalar = hatalar;
    }
    hideLoading();
    toast('✅ Görsel silindi!');
    updateStats();
    requestAnimationFrame(() => {
      const body = document.getElementById('body-' + entryId);
      if (body) { body.classList.add('open'); const tog = document.getElementById('tog-' + entryId); if (tog) tog.textContent = '▲'; }
    });
  }
}

// ─── KAYIT SİL ───────────────────────────────────────────
async function deleteEntry(id) {
  silOnayla('Bu kazı kaydını silmek istediğine emin misin?', async () => {
    showLoading('Siliniyor...');
    try {
    const { error } = await sb.from('kayitlar').delete().eq('id', id);
    if (error) { hideLoading(); islemBildir('Silinemedi: ' + error.message, null, true); return; }
    await yenile();
    hideLoading();
    islemBildir('Kayıt silindi.', 'dashboard');
    } catch(err) { hideLoading(); islemBildir('Silinemedi!', null, true); }
  });
}

function handleSave() {
  if (editingId) updateEntry(); else saveEntry();
}

async function startEdit(id) {
  // Formu düzenleme moduna al ve ayrı bir sayfa gibi (overlay) aç
  document.getElementById('detayEkleWrap').style.display = 'none';
  document.getElementById('kaziFormWrap').style.display = 'block';
  editOverlayAc();
  const projSel = document.getElementById('projSelector');
  if (projSel) projSel.style.display = 'flex';

  // Sonra veriyi yükle
  const proj = activeProject();
  if (!proj) return;
  let entry = proj.entries.find(e => e.id === id);
  if (!entry) {
    showLoading('Yükleniyor...');
    const kolonlarTek = () => {
      let k = 'id, tarih, kazi_metre, ekip_id, notlar, malzemeler, hatalar, hata, fotograflar, kmz';
      if (!_sahaOnaylariDesteklenmiyor) k += ', saha_onaylari';
      if (!_denetimciDesteklenmiyor) k += ', denetimci_id';
      if (!_denetimSecimleriDesteklenmiyor) k += ', denetim_secimleri';
      return k;
    };
    let { data, error } = await sb.from('kayitlar').select(kolonlarTek()).eq('id', id).single();
    if (error && error.message && error.message.includes('saha_onaylari')) {
      _sahaOnaylariDesteklenmiyor = true;
      ({ data, error } = await sb.from('kayitlar').select(kolonlarTek()).eq('id', id).single());
    }
    if (error && error.message && error.message.includes('denetim_secimleri')) {
      _denetimSecimleriDesteklenmiyor = true;
      ({ data, error } = await sb.from('kayitlar').select(kolonlarTek()).eq('id', id).single());
    }
    if (error && error.message && error.message.includes('denetimci_id')) {
      _denetimciDesteklenmiyor = true;
      ({ data, error } = await sb.from('kayitlar').select(kolonlarTek()).eq('id', id).single());
    }
    hideLoading();
    if (!data) { islemBildir('Kayıt bulunamadı!', null, true); return; }
    entry = { id: data.id, tarih: data.tarih, kaziMetre: parseFloat(data.kazi_metre), ekipId: data.ekip_id || null, denetimciId: data.denetimci_id || null, denetimSecimleri: data.denetim_secimleri || [], malzemeler: data.malzemeler || [], notlar: data.notlar || '', hatalar: data.hatalar || [], fotograflar: data.fotograflar || [], kmz: data.kmz || null, sahaOnaylari: data.saha_onaylari || [] };
  }

  editingId = id;
  tempMalzemeler = [...entry.malzemeler];
  tempFotograflar = [];
  tempKmz = null;
  tempHataGorseller = [];

  document.getElementById('fTarih').value = entry.tarih;
  document.getElementById('fMetre').value = entry.kaziMetre;
  document.getElementById('fNotlar').value = entry.notlar || '';
  const fBakimEl = document.getElementById('fBakim');
  if (fBakimEl) { fBakimEl.checked = Number(entry.kaziMetre) === 0; bakimToggle(); }
  renderEkipSelect();
  if (data.teams.length === 0) loadTeams();
  const fEkipEl = document.getElementById('fEkip');
  if (fEkipEl) fEkipEl.value = entry.ekipId || '';
  formDenetimSecimleri = denetimSecimleriNormalize(entry.denetimSecimleri, entry.denetimciId).map(s => ({ ...s }));
  renderDenetimciSelect();
  if (data.denetimciler.length === 0) loadDenetimciler();

  const fotoDiv = document.getElementById('fotografOnizleme');
  fotoDiv.innerHTML = entry.fotograflar?.length > 0 ? entry.fotograflar.map((f, i) => `
    <div style="position:relative;display:inline-block">
      <img src="${f.url}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;border:2px solid var(--yellow)" />
      <button onclick="mevcutFotoSil('${id}',${i})" style="position:absolute;top:-6px;right:-6px;background:var(--red);border:none;color:white;border-radius:50%;width:20px;height:20px;font-size:12px;cursor:pointer">×</button>
    </div>`).join('') : '';

  const kmzDiv = document.getElementById('kmzOnizleme');
  const projBitti = activeProject()?.bitti === true;
  kmzDiv.innerHTML = entry.kmz ? `
    <div style="display:flex;align-items:center;gap:8px;background:var(--bg);border:1px solid var(--blue);border-radius:8px;padding:8px 12px">
      <span>📁</span><span style="color:var(--text);font-size:13px;flex:1">${entry.kmz.name}</span>
      ${!projBitti ? `<button onclick="mevcutKmzSil('${id}')" style="background:none;border:none;color:var(--red);font-size:18px;cursor:pointer">×</button>` : ''}
    </div>` : '';

  const saveBtnEl = document.getElementById('saveBtn'); if (saveBtnEl) saveBtnEl.textContent = '✅ Güncelle';
  const banner = document.getElementById('editBanner');
  if (banner) banner.style.display = 'flex';
  if (tempMalzemeler.length > 0) document.getElementById('malzemePanel')?.classList.add('open');
  if (entry.fotograflar?.length > 0) document.getElementById('fotoPanel')?.classList.add('open');
  if (entry.kmz) document.getElementById('kmzPanel')?.classList.add('open');
  renderMalzemeChips();
  updateBadges();
}

async function hizliDetay(entryId, tip, hataIdx = null) {
  // Açık olan tüm modalları kapat
  document.getElementById('silOnayModal').style.display = 'none';
  document.getElementById('raporOnizlemeModal').style.display = 'none';
  _silCallback = null;
  
  window._lastSavedEntryId = entryId;
  const proj = activeProject();
  const entry = proj?.entries.find(e => e.id === entryId);
  const sadeceBak = proj?.bitti === true;
  // Popup olarak aç - altındaki ekranı (dashboard/akordiyon) değiştirme
  document.getElementById('detayEkleWrap').style.display = 'block';
  document.body.style.overflow = 'hidden';
  if (entry) {
    const bilgi = document.getElementById('kaydedilenBilgi');
    if (bilgi) bilgi.textContent = `📅 ${new Date(entry.tarih).toLocaleDateString('tr-TR')} — ⛏ ${entry.kaziMetre} m`;
    if (tip === 'malzeme') {
      document.getElementById('mevcutMalzemeList').innerHTML = '<div style="color:var(--muted);font-size:12px">Yükleniyor...</div>';
      // Sadece görüntüleme modunda ekleme formunu gizle
      document.getElementById('yeniMalzemeForm').style.display = 'none';
      document.getElementById('yeniMalzemeAcBtn').style.display = sadeceBak ? 'none' : 'block';
      document.getElementById('yeniMalzemeAcBtn').textContent = '➕ Yeni Malzeme Ekle';
      editingMalzemeIndex = null;
      const kaydetBtn = document.getElementById('malzemeKaydetBtn');
      if (kaydetBtn) kaydetBtn.textContent = '💾 Ekle ve Kaydet';
      renderMalzemeSelect();
      if (data.malzemeTurleri.length === 0) loadMalzemeTurleri();
      getKayitAlan(entryId, 'malzemeler').then(data => {
        renderMevcutMalzemeler(entryId, data?.malzemeler || [], sadeceBak);
      });
    }
    if (tip === 'hata') {
      tempHatalar = (entry.hatalar || []).map(h => ({ ...h, gorseller: h.gorseller || [] }));
      tempHataTurler = []; tempHataGorseller = [];
      hataGiderilmeTemp = {};
      const fa = document.getElementById('fHataAciklama'); if (fa) fa.value = '';
      document.querySelectorAll('.hata-type-btn').forEach(b => b.className = 'hata-type-btn');
      const hgo = document.getElementById('hataGorselOnizleme'); if (hgo) hgo.innerHTML = '';
      _hataduzenleIdx = null;
      renderMevcutHatalar(sadeceBak);
      if (hataIdx !== null && tempHatalar[hataIdx]) setTimeout(() => hataDuzenle(hataIdx), 100);
      // Yeni hata ekleme butonunu gizle
      const yeniHataAcBtn = document.getElementById('yeniHataAcBtn');
      if (yeniHataAcBtn) yeniHataAcBtn.style.display = sadeceBak ? 'none' : 'block';
      const yeniHataForm = document.getElementById('yeniHataForm');
      if (yeniHataForm) yeniHataForm.style.display = 'none';
    }
  }

  if (tip === 'foto') {
    tempFotograflar = [];
    document.getElementById('fotografOnizleme').innerHTML = '';
    const _fs2 = document.getElementById('fotografSayac'); if (_fs2) _fs2.textContent = '0 seçildi';
    const yukleBtn = document.getElementById('fotoYukleBtn');
    if (yukleBtn) { yukleBtn.style.display = 'none'; yukleBtn.dataset.entryId = entryId; }
    // Fotoğraf ekleme butonu
    const fotoEkleBtn = document.querySelector('#fotoPanel > button');
    if (fotoEkleBtn) fotoEkleBtn.style.display = sadeceBak ? 'none' : 'block';
    const fotoSayac = document.getElementById('fotografSayac');
    if (fotoSayac) fotoSayac.style.display = sadeceBak ? 'none' : 'block';
    document.getElementById('mevcutFotolarList').innerHTML = '<div style="color:var(--muted);font-size:12px">Yükleniyor...</div>';
    const fotoData = await getKayitAlan(entryId, 'fotograflar');
    const fotograflar = fotoData?.fotograflar || [];
    renderMevcutFotolar(entryId, fotograflar, sadeceBak);
  }

  if (tip === 'onay') {
    tempOnaylar = (entry?.sahaOnaylari || []).map(o => ({ ...o, gorseller: o.gorseller || [] }));
    tempOnayGorseller = [];
    _onayDuzenleIdx = null;
    const fa = document.getElementById('fOnayAciklama'); if (fa) fa.value = '';
    const ogo = document.getElementById('onayGorselOnizleme'); if (ogo) ogo.innerHTML = '';
    renderMevcutOnaylar(sadeceBak);
    const yeniOnayAcBtn = document.getElementById('yeniOnayAcBtn');
    if (yeniOnayAcBtn) yeniOnayAcBtn.style.display = sadeceBak ? 'none' : 'block';
    const yeniOnayForm = document.getElementById('yeniOnayForm');
    if (yeniOnayForm) yeniOnayForm.style.display = 'none';
  }

  if (tip === 'kmz') {
    const kmzPanel = document.getElementById('kmzPanel');
    const mevcutKmzAlani = document.getElementById('mevcutKmzAlani');
    const kmzEkleAlani = document.getElementById('kmzEkleAlani');
    // Mevcut KMZ'yi göster
    if (mevcutKmzAlani && entry) {
      mevcutKmzAlani.innerHTML = '';
      if (entry.kmz) {
        const wrap = document.createElement('div');
        wrap.style.cssText = 'display:flex;align-items:center;gap:8px;background:rgba(139,92,246,0.1);border:1px solid #8b5cf6;border-radius:8px;padding:10px 12px';
        
        const ikon = document.createElement('span');
        ikon.textContent = '📁';
        ikon.style.fontSize = '20px';
        wrap.appendChild(ikon);
        
        const ad = document.createElement('span');
        ad.textContent = entry.kmz.name;
        ad.style.cssText = 'color:var(--text);font-size:12px;flex:1;word-break:break-all';
        wrap.appendChild(ad);
        
        const indirBtn = document.createElement('button');
        indirBtn.textContent = '⬇ İndir';
        indirBtn.style.cssText = 'color:#a78bfa;background:none;font-size:12px;border:1px solid #8b5cf6;border-radius:6px;padding:4px 8px;cursor:pointer';
        const kmzUrl = entry.kmz.url;
        const kmzAd = entry.kmz.name;
        indirBtn.addEventListener('click', function(ev) {
          ev.stopPropagation();
          ev.preventDefault();
          const a = document.createElement('a');
          a.href = kmzUrl;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => document.body.removeChild(a), 100);
          toast('📥 KMZ indiriliyor: ' + kmzAd);
        });
        wrap.appendChild(indirBtn);
        
        if (!sadeceBak) {
          const silBtn = document.createElement('button');
          silBtn.textContent = '🗑';
          silBtn.style.cssText = 'background:none;border:1px solid var(--red);color:var(--red);border-radius:6px;padding:4px 8px;font-size:12px;cursor:pointer';
          const entryId2 = entry.id;
          silBtn.addEventListener('click', function(ev) {
            ev.stopPropagation();
            mevcutKmzSil(entryId2);
          });
          wrap.appendChild(silBtn);
        }
        
        mevcutKmzAlani.appendChild(wrap);
        if (kmzEkleAlani) kmzEkleAlani.style.display = 'none';
      } else {
        if (kmzEkleAlani) kmzEkleAlani.style.display = sadeceBak ? 'none' : 'block';
      }
    }
    if (sadeceBak && kmzPanel) {
      const btns = kmzPanel.querySelectorAll('button:not([onclick*="mevcutKmzSil"])');
      btns.forEach(b => b.style.display = 'none');
    }
  }

  updateBadges();
  ['malzemePanel','hataPanel','fotoPanel','kmzPanel','onayPanel'].forEach(id => document.getElementById(id)?.classList.remove('open'));
  const panelMap = { malzeme: 'malzemePanel', hata: 'hataPanel', foto: 'fotoPanel', kmz: 'kmzPanel', onay: 'onayPanel' };
  const hedefPanel = document.getElementById(panelMap[tip]);
  if (hedefPanel) { hedefPanel.classList.add('open'); setTimeout(() => hedefPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100); }
}

async function mevcutFotoSil(entryId, idx) {
  silOnayla('Bu fotoğrafı silmek istediğine emin misin?', async () => {
    showLoading('Siliniyor...');
    try {
      const kayit = await getKayitAlan(entryId, 'fotograflar');
      const fotograflar = [...(kayit?.fotograflar || [])];
      const foto = fotograflar[idx];
      if (foto?.path) await sb.storage.from('kazi-dosyalar').remove([foto.path]);
      fotograflar.splice(idx, 1);
      await sb.from('kayitlar').update({ fotograflar }).eq('id', entryId);
      hideLoading();
      startEdit(entryId);
      toast('✅ Fotoğraf silindi!');
    } catch(err) { hideLoading(); toast('⚠️ ' + (err.message||'Hata'), true); }
  });
}

async function mevcutKmzSil(entryId) {
  showLoading('Siliniyor...');
  try {
    const kayit = await getKayitAlan(entryId, 'kmz');
    if (kayit?.kmz?.path) await sb.storage.from('kazi-dosyalar').remove([kayit.kmz.path]);
    await sb.from('kayitlar').update({ kmz: null }).eq('id', entryId);
    const proj = activeProject();
    const entry = proj?.entries.find(e => e.id === entryId);
    if (entry) entry.kmz = null;
    hideLoading();

    // KMZ silindi ekranını göster
    const mevcutKmzAlani = document.getElementById('mevcutKmzAlani');
    const kmzEkleAlani = document.getElementById('kmzEkleAlani');
    const kmzOnizleme = document.getElementById('kmzOnizleme');
    const fKmz = document.getElementById('fKmz');
    if (kmzOnizleme) kmzOnizleme.innerHTML = '';
    if (fKmz) fKmz.value = '';
    if (kmzEkleAlani) kmzEkleAlani.style.display = 'none';

    if (mevcutKmzAlani) {
      mevcutKmzAlani.innerHTML = `
        <div style="text-align:center;padding:20px;background:rgba(16,185,129,0.08);border:1.5px solid #10b981;border-radius:12px">
          <div style="font-size:36px;margin-bottom:8px">🗑</div>
          <div style="font-size:14px;font-weight:700;color:#10b981;margin-bottom:4px">KMZ Silindi</div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:14px">Yeni bir KMZ dosyası ekleyebilirsiniz.</div>
          <div style="display:flex;gap:8px;justify-content:center">
            <button id="yeniKmzEkleBtn" style="background:#8b5cf6;color:white;border:none;border-radius:8px;padding:10px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">📁 Yeni KMZ Ekle</button>
            <button id="kmzGeriBtn" style="background:none;border:1px solid var(--border);color:var(--sub);border-radius:8px;padding:10px 16px;font-size:13px;cursor:pointer;font-family:inherit">← Geri</button>
          </div>
        </div>`;
      document.getElementById('yeniKmzEkleBtn').addEventListener('click', () => {
        mevcutKmzAlani.innerHTML = '';
        if (kmzEkleAlani) kmzEkleAlani.style.display = 'block';
      });
      document.getElementById('kmzGeriBtn').addEventListener('click', () => bitirDetay());
    }
    const kmzPanel = document.getElementById('kmzPanel');
    if (kmzPanel) kmzPanel.classList.add('open');
    updateBadges();
  } catch(err) { hideLoading(); toast('⚠️ ' + (err.message||'Hata'), true); }
}

async function loadEntries(projeId, sessiz = false, sayfa = 0) {
  if (!projeId) return;
  if (!sessiz) showLoading('Yükleniyor...');
  try {
    const from = sayfa * ENTRY_PAGE_SIZE;
    const to = from + ENTRY_PAGE_SIZE - 1;
    const kolonlar = () => {
      let k = 'id, tarih, kazi_metre, ekip_id, notlar, malzemeler, hatalar, hata, fotograflar, kmz';
      if (!_sahaOnaylariDesteklenmiyor) k += ', saha_onaylari';
      if (!_denetimciDesteklenmiyor) k += ', denetimci_id';
      if (!_denetimSecimleriDesteklenmiyor) k += ', denetim_secimleri';
      return k;
    };
    let { data: kayitlar, error, count } = await sb.from('kayitlar')
      .select(kolonlar(), { count: 'exact' })
      .eq('proje_id', projeId)
      .order('tarih', { ascending: false })
      .range(from, to);
    // "saha_onaylari" sütunu henüz Supabase'de yoksa eski sütun listesiyle tekrar dene
    if (error && error.message && error.message.includes('saha_onaylari')) {
      _sahaOnaylariDesteklenmiyor = true;
      ({ data: kayitlar, error, count } = await sb.from('kayitlar')
        .select(kolonlar(), { count: 'exact' })
        .eq('proje_id', projeId)
        .order('tarih', { ascending: false })
        .range(from, to));
    }
    // "denetim_secimleri" sütunu henüz Supabase'de yoksa onsuz tekrar dene
    if (error && error.message && error.message.includes('denetim_secimleri')) {
      _denetimSecimleriDesteklenmiyor = true;
      ({ data: kayitlar, error, count } = await sb.from('kayitlar')
        .select(kolonlar(), { count: 'exact' })
        .eq('proje_id', projeId)
        .order('tarih', { ascending: false })
        .range(from, to));
    }
    // "denetimci_id" sütunu henüz Supabase'de yoksa onsuz tekrar dene
    if (error && error.message && error.message.includes('denetimci_id')) {
      _denetimciDesteklenmiyor = true;
      ({ data: kayitlar, error, count } = await sb.from('kayitlar')
        .select(kolonlar(), { count: 'exact' })
        .eq('proje_id', projeId)
        .order('tarih', { ascending: false })
        .range(from, to));
    }
    if (!sessiz) hideLoading();
    if (error) { islemBildir('Kayıtlar yüklenemedi!', null, true); return; }
    const proj = data.projects.find(p => p.id === projeId);
    if (proj) {
      const yeniKayitlar = kayitlar.map(k => ({
        id: k.id, tarih: k.tarih, kaziMetre: parseFloat(k.kazi_metre), ekipId: k.ekip_id || null,
        denetimciId: k.denetimci_id || null,
        denetimSecimleri: k.denetim_secimleri || [],
        malzemeler: k.malzemeler || [], notlar: k.notlar || '',
        hata: k.hata || { var: false }, hatalar: k.hatalar || [],
        fotograflar: k.fotograflar || [], kmz: k.kmz || null,
        sahaOnaylari: k.saha_onaylari || [],
      }));
      if (sayfa === 0) {
        proj.entries = yeniKayitlar;
      } else {
        proj.entries = [...proj.entries, ...yeniKayitlar];
      }
      _entryPage = sayfa;
      _entryHasMore = (from + kayitlar.length) < (count || 0);
    }
    renderDashboard();
    renderRapor();
  } catch(e) { if (!sessiz) hideLoading(); islemBildir('Kayıtlar yüklenemedi!', null, true); }
}

async function dahaFazlaYukle() {
  const proj = activeProject();
  if (!proj || !_entryHasMore) return;
  await loadEntries(proj.id, false, _entryPage + 1);
}

async function yenile() {
  const p = activeProject();
  if (!p) return;
  // Debounce: avoid multiple rapid refreshes
  if (_yenileTimeout) clearTimeout(_yenileTimeout);
  return new Promise(resolve => {
    _yenileTimeout = setTimeout(async () => {
      await loadEntries(p.id, true);
      resolve();
    }, 100);
  });
}

async function detayKaydet(tip) {
  const entryId = window._lastSavedEntryId || editingId;
  if (!entryId) { islemBildir('Kayıt bulunamadı!', null, true); return; }

  if (tip === 'malzeme') {
    showLoading('Malzemeler kaydediliyor...');
    const { error } = await sb.from('kayitlar').update({ malzemeler: tempMalzemeler }).eq('id', entryId);
    hideLoading();
    if (error) { islemBildir('Hata: ' + error.message, null, true); return; }
    // Lokal güncelle
    const proj = activeProject();
    const entry = proj?.entries.find(e => e.id === entryId);
    if (entry) entry.malzemeler = [...tempMalzemeler];
    updateBadges();
    renderMevcutMalzemeler(entryId, tempMalzemeler);
    toast('✅ Malzemeler kaydedildi!');

  } else if (tip === 'foto') {
    if (tempFotograflar.length === 0) { islemBildir('Önce fotoğraf seçin!', null, true); return; }
    if (!entryId) { islemBildir('Kayıt ID bulunamadı! Lütfen sayfayı yenileyip tekrar deneyin.', null, true); return; }
    showLoading(`${tempFotograflar.length} fotoğraf yükleniyor...`);
    // Mevcut fotoğrafları Supabase'den çek
    const kayit = await getKayitAlan(entryId, 'fotograflar');
    const mevcutFotolar = kayit?.fotograflar || [];
    const yeniFotolar = [];
    for (let fi = 0; fi < tempFotograflar.length; fi++) {
      const f = tempFotograflar[fi];
      const path = `kayitlar/${entryId}/fotograflar/${Date.now()}_${fi}_${f.file.name}`;
      const { error: upErr } = await sb.storage.from('kazi-dosyalar').upload(path, f.file);
      if (upErr) {
        toast(`⚠️ ${f.file.name} yüklenemedi: ${upErr.message}`, true);
      } else {
        const { data } = sb.storage.from('kazi-dosyalar').getPublicUrl(path);
        yeniFotolar.push({ url: data.publicUrl, name: f.file.name, path });
      }
    }
    const tumFotolar = [...mevcutFotolar, ...yeniFotolar];
    const { error } = await sb.from('kayitlar').update({ fotograflar: tumFotolar }).eq('id', entryId);
    hideLoading();
    if (error) { islemBildir('Hata: ' + error.message, null, true); return; }
    // Lokal güncelle
    const proj2 = activeProject();
    const entry2 = proj2?.entries.find(e => e.id === entryId);
    if (entry2) entry2.fotograflar = tumFotolar;
    tempFotograflar = [];
    document.getElementById('fotografOnizleme').innerHTML = '';
    const _fs = document.getElementById('fotografSayac'); if (_fs) _fs.textContent = '0 seçildi';
    const yukleBtn = document.getElementById('fotoYukleBtn');
    if (yukleBtn) yukleBtn.style.display = 'none';
    updateBadges();
    toast(`✅ ${yeniFotolar.length} fotoğraf yüklendi!`);
    renderMevcutFotolar(entryId, tumFotolar);

  } else if (tip === 'kmz') {
    if (!tempKmz) { islemBildir('Önce dosya seçin!', null, true); return; }
    showLoading('KMZ yükleniyor...');
    const proj = activeProject();
    const entry = proj?.entries.find(e => e.id === entryId);
    const tarih = entry?.tarih || new Date().toISOString().split('T')[0];
    const metre = entry?.kaziMetre || '';
    const ext = tempKmz.file.name.endsWith('.kml') ? '.kml' : '.kmz';
    const [yy,aa,gg] = tarih.split('-');
    const tarihFmt = `${gg}-${aa}-${yy}`;
    const kmzAd = `${proj?.name || 'proje'}_${tarihFmt}_${metre}m${ext}`.replace(/[\s/]/g, '_');
    const path = `kayitlar/${entryId}/kmz/${Date.now()}_${kmzAd}`;
    const { error: upErr } = await sb.storage.from('kazi-dosyalar').upload(path, tempKmz.file);
    if (upErr) { hideLoading(); islemBildir('KMZ yükleme hatası!', null, true); return; }
    const { data } = sb.storage.from('kazi-dosyalar').getPublicUrl(path);
    const kmzObj = { url: data.publicUrl, name: kmzAd, path };
    const { error } = await sb.from('kayitlar').update({ kmz: kmzObj }).eq('id', entryId);
    hideLoading();
    if (error) { islemBildir('Hata: ' + error.message, null, true); return; }
    // Lokal güncelle
    const proj3 = activeProject();
    const entry3 = proj3?.entries.find(e => e.id === entryId);
    if (entry3) entry3.kmz = kmzObj;
    tempKmz = null;
    document.getElementById('kmzOnizleme').innerHTML = '';
    document.getElementById('fKmz').value = '';
    document.getElementById('kmzPanel')?.classList.remove('open');
    updateBadges();
    updateStats();
    toast('✅ KMZ dosyası yüklendi!');
    bitirDetay();
  }
}

async function fotograflariYukle() {
  const btn = document.getElementById('fotoYukleBtn');
  const entryId = btn?.dataset.entryId || window._lastSavedEntryId;
  if (!entryId || tempFotograflar.length === 0) { location.reload(); return; }

  showLoading('Fotoğraflar yükleniyor...');

  const kayit = await getKayitAlan(entryId, 'fotograflar');
  const eskiFotolar = kayit?.fotograflar || [];

  for (let i = 0; i < tempFotograflar.length; i++) {
    const f = tempFotograflar[i];
    const path = `kayitlar/${entryId}/foto/${Date.now()}${i}${i}.jpg`;
    await sb.storage.from('kazi-dosyalar').upload(path, f.file);
    const { data: urlData } = sb.storage.from('kazi-dosyalar').getPublicUrl(path);
    eskiFotolar.push({ url: urlData.publicUrl, name: f.file.name, path });
  }

  await sb.from('kayitlar').update({ fotograflar: eskiFotolar }).eq('id', entryId);
  location.reload();
}

async function renderMevcutFotolar(entryId, fotograflar, sadeceBak = false) {
  tempFotolar = [...fotograflar];
  const div = document.getElementById('mevcutFotolarList');
  const sayac = document.getElementById('fotoSayacBadge');
  if (!div) return;
  if (sayac) sayac.textContent = tempFotolar.length > 0 ? `${tempFotolar.length} fotoğraf` : '';
  if (tempFotolar.length === 0) { div.innerHTML = ''; return; }
  div.innerHTML = tempFotolar.map((f, i) => `
    <div style="position:relative">
      <img src="${f.url}" onclick="fotoGoster('${f.url}')" loading="lazy" class="foto-thumb"/>
      <button onclick="window.open('${f.url}','_blank');toast('📥 Fotoğraf indiriliyor...')" class="foto-indir-btn">⬇</button>
      ${!sadeceBak ? `<button onclick="silOnayla('Bu görseli silmek istediğine emin misin?', async () => {
        const foto = tempFotolar[${i}];
        if (foto && foto.path) await sb.storage.from('kazi-dosyalar').remove([foto.path]);
        tempFotolar.splice(${i}, 1);
        const proj = activeProject();
        const entry = proj?.entries.find(e => e.id === '${entryId}');
        if (entry) {
          entry.fotograflar = [...tempFotolar];
          await sb.from('kayitlar').update({ fotograflar: entry.fotograflar }).eq('id', '${entryId}');
        }
        renderMevcutFotolar('${entryId}', tempFotolar);
        toast('✅ Fotoğraf silindi!');
      })" class="foto-sil-btn">×</button>` : ''}
    </div>`).join('');
}

// Sadece istatistik kartlarını güncelle - tam render yerine
function updateStats() {
  const proj = activeProject();
  if (!proj) return;
  const kaziEntries = proj.entries.filter(e => Number(e.kaziMetre) > 0);
  const total = proj.entries.reduce((s, e) => s + e.kaziMetre, 0);
  const avg = kaziEntries.length > 0 ? (total / kaziEntries.length).toFixed(1) : total.toFixed(1);
  const toplamHata = proj.entries.reduce((s, e) => s + (e.hatalar?.length || (e.hata?.var ? 1 : 0)), 0);
  const sm = document.getElementById('statMetre');
  const so = document.getElementById('statOrt');
  const sh = document.getElementById('statHata');
  if (sm) sm.textContent = total.toLocaleString('tr-TR', {maximumFractionDigits:0}) + ' m';
  const statGunEl = document.getElementById('statGun');
  if (statGunEl) statGunEl.textContent = kaziEntries.length;
  if (so) so.textContent = avg + ' m';
  if (sh) sh.textContent = toplamHata;
}

// ─── DASHBOARD ───────────────────────────────────────────
function renderDashboard() {
  const proj = activeProject();
  const empty = document.getElementById('dashEmpty');
  const content = document.getElementById('dashContent');
  if (!proj) { empty.style.display = 'block'; content.style.display = 'none'; return; }
  empty.style.display = 'none'; content.style.display = 'block';

  const kaziEntries = proj.entries.filter(e => Number(e.kaziMetre) > 0);
  const total = proj.entries.reduce((s, e) => s + e.kaziMetre, 0);
  const avg = kaziEntries.length ? (total / kaziEntries.length).toFixed(1) : '-';
  document.getElementById('statMetre').textContent = total.toLocaleString('tr-TR', {maximumFractionDigits:0}) + ' m';
  const statKayit = document.getElementById('statKayit');
  if (statKayit) statKayit.textContent = kaziEntries.length;
  const statGunEl = document.getElementById('statGun');
  if (statGunEl) statGunEl.textContent = kaziEntries.length;
  document.getElementById('statOrt').textContent = avg !== '-' ? avg + ' m' : '-';
  const toplamHata = proj.entries.reduce((s, e) => s + (e.hatalar?.length || (e.hata?.var ? 1 : 0)), 0);
  document.getElementById('statHata').textContent = toplamHata;

  // İlerleme çubuğu
  const progBar = document.getElementById('ilerlemeBar');
  const progText = document.getElementById('ilerlemeText');
  const progCard = document.getElementById('ilerlemeCard');
  if (progCard) {
    const hm = parseFloat(proj.hedefMetre) || 0;
    if (hm > 0) {
      const yuzde = Math.min(100, ((total / hm) * 100)).toFixed(1);
      const kalan = Math.max(0, hm - total).toFixed(0);
      progCard.style.display = 'block';
      if (progText) progText.textContent = `%${yuzde}`;
      const ilerlemeBaslik = document.querySelector('#ilerlemeCard .hedef-baslik');
      if (ilerlemeBaslik) ilerlemeBaslik.textContent = `🎯 HEDEF METRAJ: ${hm} m`;
      if (progBar) {
        progBar.style.width = yuzde + '%';
        progBar.style.background = parseFloat(yuzde) >= 100 ? '#10b981' : parseFloat(yuzde) >= 75 ? '#f59e0b' : '#3b82f6';
      }
      const yapilan = document.getElementById('ilerlemeYapilan');
      const hedefEl = document.getElementById('ilerlemeHedef');
      const kalanEl = document.getElementById('ilerlemeKalan');
      if (yapilan) yapilan.textContent = total.toLocaleString('tr-TR') + ' m';
      if (hedefEl) hedefEl.textContent = hm + ' m';
      const avgGun = kaziEntries.length > 0 ? total / kaziEntries.length : 0;
      const tahminiGun = avgGun > 0 ? Math.ceil(parseFloat(kalan) / avgGun) : 0;
      if (kalanEl) kalanEl.textContent = kalan + ' m';
      const tahminiEl = document.getElementById('ilerlemeTahmini');
      if (tahminiEl) tahminiEl.textContent = tahminiGun > 0 ? `~${tahminiGun} iş günü` : '-';
    } else {
      progCard.style.display = 'none';
    }
  }

  const aramaKelime = (document.getElementById('kayitArama')?.value || '').toLowerCase().trim();
  const sorted = [...proj.entries]
    .sort((a, b) => new Date(b.tarih) - new Date(a.tarih))
    .filter(e => {
      if (!aramaKelime) return true;
      return formatDate(e.tarih).toLowerCase().includes(aramaKelime) ||
        String(e.kaziMetre).includes(aramaKelime) ||
        (e.notlar || '').toLowerCase().includes(aramaKelime) ||
        (e.malzemeler || []).some(m => m.name.toLowerCase().includes(aramaKelime));
    });
  const list = document.getElementById('entryList');

  if (sorted.length === 0) {
    list.innerHTML = aramaKelime
      ? `<div class="empty" style="grid-column:1/-1"><div class="empty-text">🔍 "${aramaKelime}" için sonuç yok.</div></div>`
      : `<div class="empty" style="grid-column:1/-1"><div class="empty-text">Henüz kayıt yok.</div><button onclick="showView('kayit')" style="margin-top:16px;background:var(--yellow);color:#0f172a;border:none;border-radius:10px;padding:14px 32px;font-size:15px;font-weight:900;cursor:pointer;font-family:inherit">➕ Kayıt Ekle</button></div>`;
    return;
  }

  list.innerHTML = sorted.map(e => {
    const ekipAdi = e.ekipId ? (data.teams.find(t => t.id === e.ekipId)?.ad || '') : '';
    const denetimciListesi = denetimciGorunumleri(e);
    const hataVar = e.hatalar?.length > 0 || e.hata?.var;
    const tarihKisa = new Date(e.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    const gunKisa = new Date(e.tarih).toLocaleDateString('tr-TR', { weekday: 'short' });

    const ustMeta = [];
    if (e.malzemeler?.length > 0) ustMeta.push(`🧱 ${e.malzemeler.length}`);
    if (e.fotograflar?.length > 0) ustMeta.push(`📷 ${e.fotograflar.length}`);
    if (e.kmz) ustMeta.push(`📁 KMZ`);
    if (e.notlar) ustMeta.push(`📝`);
    if (hataVar) ustMeta.push(`⚠️ ${e.hatalar?.length > 0 ? e.hatalar.length : ''}`);

    const altMeta = [];
    if (ekipAdi) altMeta.push(`👷 ${ekipAdi}`);
    denetimciListesi.forEach(d => altMeta.push(`🕵️ ${d.vakitEtiket ? d.vakitEtiket + ' ' : ''}${d.ad}`));
    const cizgiRengi = hataVar ? 'var(--red)' : 'var(--border)';

    return `
    <div id="card-${e.id}" style="background:var(--card);border:1px solid ${hataVar ? 'rgba(239,68,68,0.5)' : 'var(--border)'};border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.3)">

      <!-- Üst satır - tıklayınca menü akordiyon olarak açılır -->
      <div onclick="toggleEntry('${e.id}')" style="cursor:pointer">
        <div style="height:4px;background:${cizgiRengi}"></div>
        <div style="padding:10px 12px;position:relative">
          <span id="tog-${e.id}" style="position:absolute;top:9px;right:10px;color:var(--muted);font-size:11px">▼</span>
          <div style="padding-right:16px">
            <span style="font-size:14px;font-weight:700;color:var(--text)">${gunKisa} ${tarihKisa}</span>${ustMeta.length > 0 ? ` <span style="font-size:10.5px;font-weight:600;color:var(--muted)">· ${ustMeta.join('&nbsp;&nbsp;')}</span>` : ''}
          </div>
          <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:8px;margin-top:6px">
            <div>${altMeta.length > 0 ? `<span style="font-size:10.5px;color:var(--muted)">${altMeta.join('&nbsp;&nbsp;')}</span>` : ''}</div>
            <span style="font-size:16px;font-weight:900;color:${Number(e.kaziMetre) === 0 ? '#a78bfa' : 'var(--yellow)'};white-space:nowrap">${Number(e.kaziMetre) === 0 ? '🔧 Bakım' : `⛏ ${e.kaziMetre} m`}</span>
          </div>
        </div>
      </div>

      <!-- Menü - akordiyon, varsayılan gizli -->
      <div id="body-${e.id}" class="entry-body">
        <div style="display:flex;flex-wrap:wrap;gap:6px;padding:10px;background:rgba(0,0,0,0.2)">
          <button onclick="hizliDetay('${e.id}','malzeme')" style="flex:1 1 22%;min-width:64px;background:rgba(59,130,246,0.15);border:1.5px solid var(--blue);color:var(--blue);border-radius:10px;padding:9px 2px;font-size:18px;cursor:pointer;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:2px">
            🧱<span style="font-size:9px;font-weight:700">${e.malzemeler?.length > 0 ? e.malzemeler.length+' malz.' : 'Malzeme'}</span>
          </button>
          <button onclick="hizliDetay('${e.id}','hata')" style="flex:1 1 22%;min-width:64px;background:${(e.hatalar?.length > 0 || e.hata?.var) ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.06)'};border:1.5px solid ${(e.hatalar?.length > 0 || e.hata?.var) ? 'var(--red)' : '#4b1a1a'};color:#fca5a5;border-radius:10px;padding:9px 2px;font-size:18px;cursor:pointer;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:2px">
            ⚠️<span style="font-size:9px;font-weight:700">${e.hatalar?.length > 0 ? e.hatalar.length+' Hata' : e.hata?.var ? 'Hata Var' : 'Hata'}</span>
          </button>
          <button onclick="hizliDetay('${e.id}','foto')" style="flex:1 1 22%;min-width:64px;background:rgba(16,185,129,0.1);border:1.5px solid #064e3b;color:#10b981;border-radius:10px;padding:9px 2px;font-size:18px;cursor:pointer;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:2px">
            📷<span style="font-size:9px;font-weight:700">${e.fotograflar?.length > 0 ? e.fotograflar.length+' foto' : 'Fotoğraf'}</span>
          </button>
          <button onclick="hizliDetay('${e.id}','kmz')" style="flex:1 1 22%;min-width:64px;background:rgba(139,92,246,0.1);border:1.5px solid ${e.kmz ? '#8b5cf6' : '#3b1f6e'};color:#a78bfa;border-radius:10px;padding:9px 2px;font-size:18px;cursor:pointer;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:2px">
            📁<span style="font-size:9px;font-weight:700">${e.kmz ? 'KMZ ✓' : 'KMZ'}</span>
          </button>
          <button onclick="hizliDetay('${e.id}','onay')" style="flex:1 1 22%;min-width:64px;background:${e.sahaOnaylari?.length > 0 ? 'rgba(6,182,212,0.2)' : 'rgba(6,182,212,0.08)'};border:1.5px solid ${e.sahaOnaylari?.length > 0 ? '#06b6d4' : '#0e4a52'};color:#06b6d4;border-radius:10px;padding:9px 2px;font-size:18px;cursor:pointer;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:2px">
            ✅<span style="font-size:9px;font-weight:700">${e.sahaOnaylari?.length > 0 ? e.sahaOnaylari.length+' Onay' : 'Saha Onay'}</span>
          </button>
          <button onclick="toggleDetay('${e.id}')" style="flex:1 1 22%;min-width:64px;background:rgba(100,116,139,0.1);border:1.5px solid var(--border);color:var(--sub);border-radius:10px;padding:9px 2px;font-size:18px;cursor:pointer;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:2px">
            👁️<span style="font-size:9px;font-weight:700">Detay</span>
          </button>
          ${proj.bitti !== true ? `
          <button onclick="startEdit('${e.id}')" style="flex:1 1 22%;min-width:64px;background:rgba(59,130,246,0.1);border:1.5px solid var(--blue);color:var(--blue);border-radius:10px;padding:9px 2px;font-size:18px;cursor:pointer;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:2px">
            ✏️<span style="font-size:9px;font-weight:700">Düzenle</span>
          </button>
          <button onclick="deleteEntry('${e.id}')" style="flex:1 1 22%;min-width:64px;background:rgba(239,68,68,0.08);border:1.5px solid #4b1a1a;color:var(--red);border-radius:10px;padding:9px 2px;font-size:18px;cursor:pointer;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:2px">
            🗑<span style="font-size:9px;font-weight:700">Sil</span>
          </button>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
  const dahaFazlaBtn = document.getElementById('dahaFazlaBtn');
  if (dahaFazlaBtn) dahaFazlaBtn.style.display = _entryHasMore ? 'block' : 'none';

  // Kayıt ekleme sayfasındaki liste de güncelle
  const kayitList = document.getElementById('kayitViewEntryList');
  if (kayitList) kayitList.innerHTML = list.innerHTML;
}

function aramaYap(val) {
  renderDashboard();
}

function toggleEntry(id) {
  const body = document.getElementById('body-' + id);
  const tog = document.getElementById('tog-' + id);
  if (!body) return;
  const open = body.classList.toggle('open');
  if (tog) tog.textContent = open ? '▲' : '▼';
}

function detayModalKapat() {
  geriGit();
}

function mentionVurgula(text) {
  if (!text) return '';
  // ÖNCE escape et, SONRA @mention span'ini ekle — aksi halde
  // açıklamaya yazılan <script>/<img onerror> gibi içerik doğrudan çalışırdı.
  return escapeHtml(text).replace(/@(\S+)/g, '<span class="detay-mention">@$1</span>');
}

function toggleDetay(id) {
  const proj = activeProject();
  const e = proj?.entries.find(x => x.id === id);
  if (!e) return;

  const tarihObj = new Date(e.tarih);
  const gunAdi = tarihObj.toLocaleDateString('tr-TR', { weekday: 'long' }).toUpperCase();
  const tarihStr = tarihObj.toLocaleDateString('tr-TR', {day:'numeric', month:'long', year:'numeric'});
  const bakimMi = Number(e.kaziMetre) === 0;
  const icerik = document.getElementById('detayModalIcerik');

  document.getElementById('detayGunAdi').textContent = gunAdi;
  document.getElementById('detayHeaderTarih').textContent = tarihStr;
  document.getElementById('detayProjeAdi').textContent = `🏗 ${proj.name}${proj.location ? ' · ' + proj.location : ''}`;
  const statEl = document.getElementById('detayHeaderStat');
  const statLblEl = document.getElementById('detayHeaderStatLbl');
  statEl.textContent = bakimMi ? '🔧' : Number(e.kaziMetre).toLocaleString('tr-TR') + ' m';
  statLblEl.textContent = bakimMi ? 'Bakım/Onarım' : 'Kazıldı';
  document.getElementById('detayHeaderStatWrap').className = 'detay-header-stat' + (bakimMi ? ' bakim' : '');

  const hataSayisi = e.hatalar?.length || 0;
  const onaySayisi = e.sahaOnaylari?.length || 0;
  const fotoSayisi = (e.fotograflar?.length || 0) + (e.hatalar || []).reduce((s,h) => s + (h.gorseller?.length||0), 0) + (e.sahaOnaylari || []).reduce((s,o) => s + (o.gorseller?.length||0), 0);
  const chips = [];
  if (e.malzemeler?.length > 0) chips.push(`<span class="detay-chip">🧱 <b>${e.malzemeler.length}</b> malzeme</span>`);
  if (fotoSayisi > 0) chips.push(`<span class="detay-chip">📷 <b>${fotoSayisi}</b> fotoğraf</span>`);
  if (hataSayisi > 0) chips.push(`<span class="detay-chip">⚠️ <b style="color:#fca5a5">${hataSayisi}</b> hata</span>`);
  if (onaySayisi > 0) chips.push(`<span class="detay-chip">✅ <b style="color:#10b981">${onaySayisi}</b> onay</span>`);
  if (e.kmz) chips.push(`<span class="detay-chip">📁 KMZ</span>`);
  if (e.ekipId && data.teams.find(t => t.id === e.ekipId)) chips.push(`<span class="detay-chip">👷 <b>${data.teams.find(t => t.id === e.ekipId).ad}</b></span>`);
  denetimciGorunumleri(e).forEach(den => {
    chips.push(`<span class="detay-chip">🕵️ ${den.vakitEtiket ? den.vakitEtiket + ' ' : ''}<b>${den.ad}</b>${den.kurum ? ' · ' + den.kurum : ''}</span>`);
  });
  const chipRow = document.getElementById('detayChipRow');
  chipRow.innerHTML = chips.join('');
  chipRow.style.display = chips.length > 0 ? 'flex' : 'none';

  // Hata + onay kayıtlarını tek zaman çizelgesinde birleştir
  const tlItems = [
    ...(e.hatalar || []).map(h => ({ tip: 'hata', veri: h })),
    ...(e.sahaOnaylari || []).map(o => ({ tip: 'onay', veri: o }))
  ];

  icerik.innerHTML = `
    ${e.notlar ? `<div class="detay-metin" style="padding-top:16px">📝 ${mentionVurgula(e.notlar)}</div>` : ''}
    ${e.malzemeler?.length > 0 ? `
      <div class="detay-sec-label">🧱 Malzemeler</div>
      ${e.malzemeler.map(m => `<div class="detay-malzeme-row"><span>${m.name}</span><span>${m.miktar} ${m.birim}</span></div>`).join('')}` : ''}
    ${e.fotograflar?.length > 0 ? `
      <div class="detay-sec-label">📷 Fotoğraflar (${e.fotograflar.length})</div>
      <div class="detay-foto-grid">
        ${e.fotograflar.map(f => `<img src="${f.url}" onclick="fotoGoster('${f.url}')" loading="lazy" class="detay-foto-thumb"/>`).join('')}
      </div>` : ''}
    ${e.kmz ? `
      <div class="detay-sec-label">📁 Dosya</div>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="color:var(--text);font-size:13px;flex:1">${e.kmz.name}</span>
        <button onclick="window.open('${e.kmz.url}','_blank');toast('📥 KMZ indiriliyor...')" style="color:var(--sub);background:none;font-size:12px;border:1px solid var(--border);border-radius:6px;padding:5px 10px;cursor:pointer">İndir ⬇</button>
      </div>` : ''}
    ${tlItems.length > 0 ? `
      <div class="detay-sec-label">📋 Saha Kayıtları (${tlItems.length})</div>
      <div class="detay-timeline">
        ${tlItems.map(item => {
          if (item.tip === 'hata') {
            const h = item.veri;
            const saat = h.tarih ? new Date(h.tarih).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) : '';
            return `<div class="detay-tl-item">
              <span class="detay-tl-dot hata">⚠</span>
              <div class="detay-tl-card">
                <div class="detay-tl-top">
                  <span class="detay-tl-etiket">${h.turler?.length > 0 ? h.turler[0] : 'Hata'}</span>
                  ${h.turler?.length > 1 ? h.turler.slice(1).map(t => `<span class="detay-tl-tag">${t}</span>`).join('') : ''}
                  ${saat ? `<span class="detay-tl-tarih">${saat}</span>` : ''}
                </div>
                ${h.aciklama ? `<div class="detay-metin">${mentionVurgula(h.aciklama)}</div>` : ''}
                ${h.gorseller?.length > 0 ? `<div class="detay-foto-grid">${h.gorseller.map(g=>`<img src="${g.url}" onclick="fotoGoster('${g.url}')" loading="lazy" class="detay-foto-thumb"/>`).join('')}</div>` : ''}
                <div style="display:flex;margin-top:9px">
                  <span class="detay-tl-pill ${h.giderildi ? 'cozuldu' : 'acik'}">${h.giderildi ? '✓ Giderildi' : '● Açık'}</span>
                </div>
                ${h.giderildi && h.giderilmeNotu ? `<div class="detay-tl-cozum">
                  <span class="detay-tl-cozum-ikon">↳</span>
                  <div class="detay-tl-cozum-metin">
                    <div class="detay-tl-cozum-baslik">Çözüm notu</div>
                    <div class="detay-metin">${mentionVurgula(h.giderilmeNotu)}</div>
                  </div>
                </div>` : ''}
              </div>
            </div>`;
          } else {
            const o = item.veri;
            const saat = o.tarih ? new Date(o.tarih).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) : '';
            return `<div class="detay-tl-item">
              <span class="detay-tl-dot onay">✓</span>
              <div class="detay-tl-card">
                <div class="detay-tl-top">
                  <span class="detay-tl-etiket">Saha Onayı</span>
                  ${saat ? `<span class="detay-tl-tarih">${saat}</span>` : ''}
                </div>
                ${o.aciklama ? `<div class="detay-metin">${mentionVurgula(o.aciklama)}</div>` : ''}
                ${o.gorseller?.length > 0 ? `<div class="detay-foto-grid">${o.gorseller.map(g=>`<img src="${g.url}" onclick="fotoGoster('${g.url}')" loading="lazy" class="detay-foto-thumb"/>`).join('')}</div>` : ''}
                <div style="display:flex;margin-top:9px">
                  <span class="detay-tl-pill cozuldu">✓ Onaylandı</span>
                </div>
              </div>
            </div>`;
          }
        }).join('')}
      </div>` : ''}
    <div style="display:flex;gap:8px;margin-top:20px;flex-wrap:wrap">
      <button onclick="gunlukRaporPaylas('${e.id}')" style="flex:1;min-width:100px;background:none;border:1px solid var(--border);color:var(--text);border-radius:9px;padding:11px 6px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit">📤 Paylaş</button>
      <button onclick="gunlukRaporPdf('${e.id}')" style="flex:1;min-width:100px;background:rgba(239,68,68,0.1);border:1px solid var(--red);color:var(--red);border-radius:9px;padding:11px 6px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit">📄 PDF</button>
      ${proj.bitti !== true ? `<button onclick="startEdit('${e.id}')" style="flex:1;min-width:100px;background:var(--yellow);border:none;color:#0f172a;border-radius:9px;padding:11px 6px;font-size:12.5px;font-weight:800;cursor:pointer;font-family:inherit">✏️ Düzenle</button>` : ''}
    </div>`;

  showView('detay');
}
