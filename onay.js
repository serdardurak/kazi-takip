// ─── SAHA ONAYI (bitmiş iş görsel/açıklama onayı) ─────────
function toggleYeniOnayForm() {
  const form = document.getElementById('yeniOnayForm');
  const btn = document.getElementById('yeniOnayAcBtn');
  const acik = form.style.display !== 'none';
  form.style.display = acik ? 'none' : 'block';
  btn.textContent = acik ? '➕ Saha Onayı Ekle' : '✕ Formu Kapat';
  if (!acik) {
    document.getElementById('fOnayAciklama').value = '';
    tempOnayGorseller = [];
    document.getElementById('onayGorselOnizleme').innerHTML = '';
    _onayDuzenleIdx = null;
  }
}

async function onOnayGorselSec() {
  const files = document.getElementById('fOnayGorsel').files;
  if (!files.length) return;
  showLoading(`${files.length} görsel işleniyor...`);
  for (const f of files) { tempOnayGorseller.push(await sikistir(f)); }
  hideLoading();
  document.getElementById('fOnayGorsel').value = '';
  renderOnayGorselOnizleme();
  toast(`✅ ${files.length} görsel eklendi (toplam: ${tempOnayGorseller.length})`);
}

function renderOnayGorselOnizleme() {
  const div = document.getElementById('onayGorselOnizleme');
  if (!div) return;
  div.innerHTML = tempOnayGorseller.map((f, i) => `
    <div style="position:relative;display:inline-block">
      <img src="${f.url}" style="width:70px;height:70px;object-fit:cover;border-radius:8px;border:2px solid #06b6d4" loading="lazy"/>
      <button onclick="tempOnayGorseller.splice(${i},1);renderOnayGorselOnizleme()" style="position:absolute;top:-6px;right:-6px;background:var(--red);border:none;color:white;border-radius:50%;width:18px;height:18px;font-size:11px;cursor:pointer">×</button>
    </div>`).join('');
}

async function onayEkleVeKaydet() {
  const aciklama = document.getElementById('fOnayAciklama').value.trim();
  if (!aciklama && tempOnayGorseller.length === 0) {
    islemBildir('Açıklama yaz veya en az bir fotoğraf ekle!', null, true);
    return;
  }

  const entryId = window._lastSavedEntryId;
  if (!entryId) { islemBildir('Kayıt bulunamadı!', null, true); return; }

  showLoading('Kaydediliyor...');

  const { data: kayit, error: fetchErr } = await sb.from('kayitlar')
    .select('saha_onaylari').eq('id', entryId).single();
  if (fetchErr) {
    hideLoading();
    if (fetchErr.message && fetchErr.message.includes('saha_onaylari')) {
      islemBildir('⚠️ "saha_onaylari" sütunu Supabase\'de bulunamadı. Lütfen önce ekleyin (alter table kayitlar add column saha_onaylari jsonb default \'[]\';)', null, true);
    } else {
      islemBildir('Kayıt alınamadı!', null, true);
    }
    return;
  }
  if (!kayit) { hideLoading(); islemBildir('Kayıt alınamadı!', null, true); return; }

  const mevcutOnaylar = Array.isArray(kayit.saha_onaylari) ? [...kayit.saha_onaylari] : [];

  const yuklenenGorseller = [];
  for (const f of tempOnayGorseller) {
    const path = `kayitlar/${entryId}/onay/${Date.now()}_${f.file.name}`;
    const { error: upErr } = await sb.storage.from('kazi-dosyalar').upload(path, f.file);
    if (!upErr) {
      const { data } = sb.storage.from('kazi-dosyalar').getPublicUrl(path);
      yuklenenGorseller.push({ url: data.publicUrl, name: f.file.name, path });
    }
  }

  const yeniOnay = {
    aciklama,
    gorseller: yuklenenGorseller,
    tarih: new Date().toISOString()
  };

  let yeniOnaylar;
  if (_onayDuzenleIdx !== null) {
    yeniOnaylar = [...mevcutOnaylar];
    const eskiGorseller = yeniOnaylar[_onayDuzenleIdx]?.gorseller || [];
    yeniOnaylar[_onayDuzenleIdx] = { ...yeniOnay, gorseller: [...eskiGorseller, ...yuklenenGorseller] };
  } else {
    yeniOnaylar = [...mevcutOnaylar, yeniOnay];
  }

  const { error: updateErr } = await sb.from('kayitlar')
    .update({ saha_onaylari: yeniOnaylar }).eq('id', entryId);

  hideLoading();
  if (updateErr) {
    if (updateErr.message && updateErr.message.includes('saha_onaylari')) {
      islemBildir('⚠️ "saha_onaylari" sütunu Supabase\'de bulunamadı. Lütfen önce ekleyin.', null, true);
    } else {
      islemBildir('Kaydedilemedi: ' + updateErr.message, null, true);
    }
    return;
  }

  const proj = activeProject();
  const entry = proj?.entries.find(e => e.id === entryId);
  if (entry) entry.sahaOnaylari = yeniOnaylar;

  tempOnayGorseller = [];
  _onayDuzenleIdx = null;
  tempOnaylar = [...yeniOnaylar];
  document.getElementById('fOnayAciklama').value = '';
  document.getElementById('onayGorselOnizleme').innerHTML = '';
  const btn = document.getElementById('onayEkleBtn');
  if (btn) btn.textContent = '💾 Onayı Kaydet';
  document.getElementById('yeniOnayForm').style.display = 'none';
  const yeniOnayAcBtnEl = document.getElementById('yeniOnayAcBtn'); if (yeniOnayAcBtnEl) yeniOnayAcBtnEl.textContent = '➕ Saha Onayı Ekle';

  renderMevcutOnaylar();
  updateBadges();
  toast(_onayDuzenleIdx !== null ? '✅ Saha onayı güncellendi!' : '✅ Saha onayı kaydedildi!');
}

function onayDuzenle(idx) {
  const o = tempOnaylar[idx];
  if (!o) return;
  _onayDuzenleIdx = idx;
  document.getElementById('fOnayAciklama').value = o.aciklama || '';
  tempOnayGorseller = [];
  document.getElementById('onayGorselOnizleme').innerHTML = '';
  document.getElementById('yeniOnayForm').style.display = 'block';
  document.getElementById('yeniOnayAcBtn').textContent = '✕ Formu Kapat';
  const btn = document.getElementById('onayEkleBtn');
  if (btn) btn.textContent = '💾 Değişiklikleri Kaydet';
  document.getElementById('fOnayAciklama').scrollIntoView({ behavior: 'smooth' });
}

async function tempOnaylarSil(idx) {
  const entryId = window._lastSavedEntryId;
  if (!entryId) {
    tempOnaylar.splice(idx, 1);
    renderMevcutOnaylar();
    return;
  }
  silOnayla('Bu saha onayı kaydını silmek istediğine emin misin?', async () => {
    showLoading('Siliniyor...');
    try {
      const o = tempOnaylar[idx];
      if (o?.gorseller?.length > 0) {
        const paths = o.gorseller.filter(g => g.path).map(g => g.path);
        if (paths.length > 0) await sb.storage.from('kazi-dosyalar').remove(paths);
      }
      tempOnaylar.splice(idx, 1);
      const { error } = await sb.from('kayitlar').update({ saha_onaylari: tempOnaylar }).eq('id', entryId);
      const proj = activeProject();
      const entry = proj?.entries.find(e => e.id === entryId);
      if (entry) entry.sahaOnaylari = [...tempOnaylar];
      hideLoading();
      if (error) { islemBildir('Silinemedi: ' + error.message, null, true); return; }
      renderMevcutOnaylar();
      updateBadges();
      toast('✅ Saha onayı silindi!');
    } catch(err) { hideLoading(); islemBildir('⚠️ ' + (err.message||'Bağlantı hatası'), null, true); }
  });
}

function renderMevcutOnaylar(sadeceBak = false) {
  const div = document.getElementById('mevcutOnaylarList');
  const sayac = document.getElementById('onaySayac');
  if (!div) return;
  if (tempOnaylar.length === 0) { div.innerHTML = ''; if (sayac) sayac.textContent = ''; return; }
  if (sayac) sayac.textContent = `${tempOnaylar.length} onay`;
  div.innerHTML = tempOnaylar.map((o, i) => `
    <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.3);border-radius:8px;padding:10px;margin-bottom:8px">
      <div style="display:flex;gap:6px;margin-bottom:6px;align-items:center">
        <span style="flex:1;font-size:11px;color:var(--muted);font-weight:700">✅ ${o.tarih ? new Date(o.tarih).toLocaleDateString('tr-TR') : ''}</span>
        ${!sadeceBak ? `<button onclick="onayDuzenle(${i})" style="background:rgba(59,130,246,0.15);border:1px solid var(--blue);color:var(--blue);border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;font-family:inherit">✏️ Düzenle</button>
        <button onclick="tempOnaylarSil(${i})" style="background:rgba(239,68,68,0.15);border:1px solid var(--red);color:var(--red);border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;font-family:inherit">🗑 Sil</button>` : ''}
      </div>
      ${o.aciklama ? `<div style="color:#67e8f9;font-size:12px;white-space:pre-wrap">📋 ${escapeHtml(o.aciklama)}</div>` : ''}
      ${o.gorseller?.length > 0 ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">${o.gorseller.map((g, gi) => `
        <div style="position:relative">
          <img src="${g.url}" onclick="fotoGoster('${g.url}')" style="width:60px;height:60px;object-fit:cover;border-radius:6px;border:1px solid #06b6d4;cursor:pointer">
          ${!sadeceBak ? `<button onclick="silOnayla('Bu görseli silmek istediğine emin misin?', async () => {
            const g = tempOnaylar[${i}].gorseller[${gi}];
            if (g && g.path) await sb.storage.from('kazi-dosyalar').remove([g.path]);
            tempOnaylar[${i}].gorseller.splice(${gi},1);
            const entryId = window._lastSavedEntryId;
            const proj = activeProject();
            const entry = proj?.entries.find(e => e.id === entryId);
            if (entry) {
              entry.sahaOnaylari = [...tempOnaylar];
              await sb.from('kayitlar').update({ saha_onaylari: entry.sahaOnaylari }).eq('id', entryId);
            }
            renderMevcutOnaylar();
            toast('✅ Görsel silindi!');
          })" style="position:absolute;top:-6px;left:-6px;background:var(--red);border:none;color:white;border-radius:50%;width:18px;height:18px;font-size:11px;cursor:pointer;line-height:1">×</button>` : ''}
        </div>`).join('')}</div>` : ''}
    </div>`).join('');
}
