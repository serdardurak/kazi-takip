// ─── MALZEME TÜRLERİ ────────────────────────────────────────
async function loadMalzemeTurleri() {
  try {
    const { data: turler, error } = await sb.from('malzeme_turleri').select('*').order('ad', { ascending: true });
    if (error) { console.warn('Malzeme türleri yüklenemedi:', error.message); return; }
    data.malzemeTurleri = turler || [];
    renderMalzemeSelect();
    renderMalzemeTurleri();
  } catch (e) { console.warn('Malzeme türleri yüklenemedi'); }
}

function renderMalzemeSelect() {
  const sel = document.getElementById('fMalzemeSelect');
  if (!sel) return;
  const secili = sel.value;
  sel.innerHTML = '<option value="">Malzeme Seç</option>'
    + data.malzemeTurleri.map(t => `<option value="${t.ad}">${t.ad}</option>`).join('');
  if (secili) sel.value = secili;
}

function malzemeYonetimAc() {
  const input = document.getElementById('malzemeTuruAdInput');
  if (input) { input.value = ''; delete input.dataset.editingId; }
  const btn = document.querySelector('#malzemeYonetimModal button[onclick="malzemeTuruEkle()"]');
  if (btn) { btn.textContent = '+'; btn.style.background = 'var(--blue)'; }
  renderMalzemeTurleri();
  document.getElementById('malzemeYonetimModal').style.display = 'flex';
}

function renderMalzemeTurleri() {
  const el = document.getElementById('malzemeTuruListesi');
  if (!el) return;
  if (data.malzemeTurleri.length === 0) {
    el.innerHTML = '<div style="font-size:12px;color:var(--muted);text-align:center;padding:8px 0">Henüz malzeme türü eklenmedi.</div>';
    return;
  }
  el.innerHTML = data.malzemeTurleri.map(t => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.2);border-radius:8px;margin-bottom:6px">
      <span style="font-size:13px;color:var(--text);font-weight:600">🧱 ${t.ad}</span>
      <div style="display:flex;align-items:center;gap:4px">
        <button onclick="malzemeTuruDuzenle('${t.id}')" style="background:none;border:none;color:var(--blue);font-size:14px;cursor:pointer;padding:2px 6px">✎</button>
        <button onclick="malzemeTuruSil('${t.id}')" style="background:none;border:none;color:var(--red);font-size:16px;cursor:pointer;padding:2px 6px">×</button>
      </div>
    </div>`).join('');
  renderYonetimOzet();
}

async function malzemeTuruDuzenle(id) {
  const t = data.malzemeTurleri.find(x => x.id === id);
  if (!t) return;
  const input = document.getElementById('malzemeTuruAdInput');
  const btn = document.querySelector('#malzemeYonetimModal button[onclick="malzemeTuruEkle()"]');
  input.value = t.ad;
  input.focus();
  input.dataset.editingId = id;
  if (btn) { btn.textContent = '✓'; btn.style.background = '#10b981'; }
}

async function malzemeTuruEkle() {
  const input = document.getElementById('malzemeTuruAdInput');
  const ad = input?.value.trim();
  if (!ad) { toast('⚠️ Malzeme türü adı girin', true); return; }
  const editingId = input.dataset.editingId;
  showLoading(editingId ? 'Güncelleniyor...' : 'Ekleniyor...');
  const { error } = editingId
    ? await sb.from('malzeme_turleri').update({ ad }).eq('id', editingId)
    : await sb.from('malzeme_turleri').insert({ ad });
  hideLoading();
  if (error) { toast('⚠️ ' + error.message, true); return; }
  input.value = '';
  delete input.dataset.editingId;
  const btn = document.querySelector('#malzemeYonetimModal button[onclick="malzemeTuruEkle()"]');
  if (btn) { btn.textContent = '+'; btn.style.background = 'var(--blue)'; }
  toast(editingId ? '✅ Malzeme türü güncellendi' : '✅ Malzeme türü eklendi');
  await loadMalzemeTurleri();
}

function malzemeTuruSil(id) {
  const t = data.malzemeTurleri.find(x => x.id === id);
  silOnayla(`"${t?.ad || 'Bu malzeme türü'}" silinsin mi? Daha önce kaydedilmiş malzeme kayıtları etkilenmez.`, async () => {
    showLoading('Siliniyor...');
    const { error } = await sb.from('malzeme_turleri').delete().eq('id', id);
    hideLoading();
    if (error) { toast('⚠️ ' + error.message, true); return; }
    toast('🗑 Malzeme türü silindi');
    await loadMalzemeTurleri();
  });
}

function toggleYeniMalzemeForm() {
  const form = document.getElementById('yeniMalzemeForm');
  const btn = document.getElementById('yeniMalzemeAcBtn');
  const acik = form.style.display !== 'none';
  form.style.display = acik ? 'none' : 'block';
  btn.textContent = acik ? '➕ Yeni Malzeme Ekle' : '✕ Formu Kapat';
  if (!acik) {
    editingMalzemeIndex = null;
    document.getElementById('fMalzemeSelect').value = '';
    document.getElementById('fMiktar').value = '';
    document.getElementById('fBirim').value = 'adet';
    const kaydetBtn = document.getElementById('malzemeKaydetBtn');
    if (kaydetBtn) kaydetBtn.textContent = '💾 Ekle ve Kaydet';
  }
}

function malzemeDuzenle(entryId, i) {
  const m = tempMalzemeler[i];
  if (!m) return;
  editingMalzemeIndex = i;

  const form = document.getElementById('yeniMalzemeForm');
  form.style.display = 'block';
  document.getElementById('yeniMalzemeAcBtn').textContent = '✕ Formu Kapat';

  const sel = document.getElementById('fMalzemeSelect');
  const varMi = Array.from(sel.options).some(o => o.value === m.name);
  if (!varMi) {
    // Eski kayıtta, artık listede olmayan bir malzeme adı olabilir — görüntülemek için geçici seçenek ekle.
    const opt = document.createElement('option');
    opt.value = m.name;
    opt.textContent = `${m.name} (listede yok)`;
    sel.appendChild(opt);
  }
  sel.value = m.name;
  document.getElementById('fMiktar').value = m.miktar;
  document.getElementById('fBirim').value = m.birim;

  const kaydetBtn = document.getElementById('malzemeKaydetBtn');
  if (kaydetBtn) kaydetBtn.textContent = '💾 Güncelle';
  form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function renderMevcutMalzemeler(entryId, malzemeler, sadeceBak = false) {
  tempMalzemeler = [...malzemeler];
  const div = document.getElementById('mevcutMalzemeList');
  const sayac = document.getElementById('malzemeSayacBadge');
  if (!div) return;
  if (sayac) sayac.textContent = tempMalzemeler.length > 0 ? `${tempMalzemeler.length} malzeme` : '';
  if (tempMalzemeler.length === 0) { div.innerHTML = ''; return; }
  div.innerHTML = tempMalzemeler.map((m, i) => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);border-radius:8px;margin-bottom:6px;gap:8px">
      <span style="color:var(--text);font-size:13px">🧱 ${m.name} — <strong>${m.miktar} ${m.birim}</strong></span>
      ${!sadeceBak ? `<div style="display:flex;align-items:center;gap:4px;flex-shrink:0">
        <button onclick="malzemeDuzenle('${entryId}', ${i})" style="background:none;border:1px solid var(--blue);color:var(--blue);border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;font-family:inherit">✎</button>
        <button onclick="silOnayla('Bu malzemeyi silmek istediğine emin misin?', async () => {
        tempMalzemeler.splice(${i}, 1);
        renderMevcutMalzemeler('${entryId}', tempMalzemeler);
        const proj = activeProject();
        const entry = proj?.entries.find(e => e.id === '${entryId}');
        if (entry) {
          entry.malzemeler = [...tempMalzemeler];
          await sb.from('kayitlar').update({ malzemeler: entry.malzemeler }).eq('id', '${entryId}');
        }
        toast('✅ Malzeme silindi!');
      })" style="background:none;border:1px solid var(--red);color:var(--red);border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;font-family:inherit">🗑</button>
      </div>` : ''}
    </div>`).join('');
}

async function malzemeEkleVeKaydet() {
  const name = document.getElementById('fMalzemeSelect').value;
  const miktar = parseFloat(document.getElementById('fMiktar').value);
  const birim = document.getElementById('fBirim').value;
  if (!name || isNaN(miktar) || miktar <= 0) { islemBildir('Malzeme ve miktar seçin!', null, true); return; }

  const entryId = window._lastSavedEntryId;
  if (!entryId) { islemBildir('Kayıt bulunamadı!', null, true); return; }

  showLoading('Kaydediliyor...');

  const oncekiListe = [...tempMalzemeler];
  const duzenlemeModu = editingMalzemeIndex !== null;
  if (duzenlemeModu) {
    tempMalzemeler[editingMalzemeIndex] = { name, miktar, birim };
  } else {
    tempMalzemeler.push({ name, miktar, birim });
  }
  const { error } = await sb.from('kayitlar').update({ malzemeler: tempMalzemeler }).eq('id', entryId);
  hideLoading();
  if (error) { tempMalzemeler = oncekiListe; islemBildir('Kaydedilemedi: ' + error.message, null, true); return; }
  // try/catch sarılı değil - satır bazlı hata yönetimi yeterli

  const proj = activeProject();
  const entry = proj?.entries.find(e => e.id === entryId);
  if (entry) entry.malzemeler = [...tempMalzemeler];

  // Formu sıfırla ve kapat
  editingMalzemeIndex = null;
  document.getElementById('fMalzemeSelect').value = '';
  document.getElementById('fMiktar').value = '';
  document.getElementById('fBirim').value = 'adet';
  document.getElementById('yeniMalzemeForm').style.display = 'none';
  document.getElementById('yeniMalzemeAcBtn').textContent = '➕ Yeni Malzeme Ekle';
  const kaydetBtn = document.getElementById('malzemeKaydetBtn');
  if (kaydetBtn) kaydetBtn.textContent = '💾 Ekle ve Kaydet';

  renderMevcutMalzemeler(entryId, tempMalzemeler);
  updateStats();
  toast(duzenlemeModu ? '✅ Malzeme güncellendi!' : '✅ Malzeme eklendi!');
}

// ─── MALZEME ─────────────────────────────────────────────
function removeMalzeme(idx) {
  tempMalzemeler.splice(idx, 1);
  renderMalzemeChips();
}

function renderMalzemeChips() {
  const el = document.getElementById('malzemeChips');
  if (!el) return;
  el.innerHTML = tempMalzemeler.map((m, i) =>
    `<div class="chip">${m.name} — ${m.miktar} ${m.birim}<button class="chip-del" onclick="removeMalzeme(${i})">×</button></div>`
  ).join('');
}
