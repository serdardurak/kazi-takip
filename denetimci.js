// ─── DENETİMCİLER ─────────────────────────────────────────
async function loadDenetimciler() {
  try {
    const { data: denetimciler, error } = await sb.from('denetimciler').select('*').order('ad', { ascending: true });
    if (error) { console.warn('Denetimciler yüklenemedi:', error.message); return; }
    data.denetimciler = denetimciler || [];
    renderDenetimciSelect();
    renderDenetimciler();
    renderDenetimciFiltre();
  } catch (e) { console.warn('Denetimciler yüklenemedi'); }
}

function renderDenetimciFiltre() {
  ['aylikRaporDenetimciFiltre'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const secili = sel.value;
    sel.innerHTML = '<option value="">Tüm Denetimciler</option>' + data.denetimciler.map(d => `<option value="${d.id}">${d.ad}${d.kurum ? ' — ' + d.kurum : ''}</option>`).join('') + '<option value="__bos__">Denetimci Atanmamış</option>';
    if (secili) sel.value = secili;
  });
}

function renderDenetimciSelect() {
  const sel = document.getElementById('fDenetimciEkle');
  if (!sel) return;
  sel.innerHTML = '<option value="">Denetimci seçin...</option>' + data.denetimciler.map(d => `<option value="${d.id}">${d.ad}${d.kurum ? ' — ' + d.kurum : ''}</option>`).join('');
  renderFormDenetimciListe();
}

// ─── ÇOKLU DENETİMCİ SEÇİMİ (form içinde, vakitli) ─────────
function denetimSecimleriNormalize(secimler, eskiDenetimciId) {
  if (Array.isArray(secimler) && secimler.length > 0) return secimler;
  if (eskiDenetimciId) return [{ id: eskiDenetimciId, vakit: 'tumgun' }];
  return [];
}

// Ham bir supabase satırından (denetim_secimleri / denetimci_id) denetimci ID listesi çıkarır
function denetimciIdListesi(row) {
  return denetimSecimleriNormalize(row.denetim_secimleri, row.denetimci_id).map(s => s.id);
}

// Ham bir satır için, verilen id->isim haritasına göre görüntülenecek metni üretir (vakit etiketleriyle)
function denetimciRowMetni(row, denetimciMap) {
  const secimler = denetimSecimleriNormalize(row.denetim_secimleri, row.denetimci_id);
  if (secimler.length === 0) return '';
  return secimler.map(s => {
    const isim = denetimciMap[s.id] || 'Bilinmeyen Denetimci';
    const vakitEt = VAKIT_ETIKETLERI[s.vakit] || '';
    return vakitEt ? `${vakitEt} ${isim}` : isim;
  }).join(', ');
}

// Bir kayıt (entry) için ekranda gösterilecek denetimci bilgilerini döndürür
function denetimciGorunumleri(e) {
  const secimler = denetimSecimleriNormalize(e.denetimSecimleri, e.denetimciId);
  return secimler.map(s => {
    const d = data.denetimciler.find(x => x.id === s.id);
    if (!d) return null;
    return { ad: d.ad, kurum: d.kurum || '', vakitEtiket: VAKIT_ETIKETLERI[s.vakit] || '' };
  }).filter(Boolean);
}

function formDenetimciSatirEkle() {
  const vakit = document.getElementById('fDenetimciVakit')?.value || 'tumgun';
  const id = document.getElementById('fDenetimciEkle')?.value || '';
  if (!id) { toast('⚠️ Önce bir denetimci seçin', true); return; }
  if (formDenetimSecimleri.some(s => s.id === id && s.vakit === vakit)) { toast('⚠️ Bu denetimci bu vakit için zaten eklendi', true); return; }
  formDenetimSecimleri.push({ id, vakit });
  document.getElementById('fDenetimciEkle').value = '';
  renderFormDenetimciListe();
}

function formDenetimciSatirSil(index) {
  formDenetimSecimleri.splice(index, 1);
  renderFormDenetimciListe();
}

function renderFormDenetimciListe() {
  const wrap = document.getElementById('fDenetimciSeciliListe');
  if (!wrap) return;
  if (formDenetimSecimleri.length === 0) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = formDenetimSecimleri.map((s, i) => {
    const d = data.denetimciler.find(x => x.id === s.id);
    const adKurum = d ? (d.ad + (d.kurum ? ' — ' + d.kurum : '')) : 'Bilinmeyen denetimci';
    const vakitEt = VAKIT_ETIKETLERI[s.vakit] || '';
    return `<div style="display:flex;align-items:center;gap:8px;background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.3);border-radius:8px;padding:7px 10px">
      ${vakitEt ? `<span style="font-size:11px;color:#67e8f9;flex-shrink:0;font-weight:800;white-space:nowrap">${vakitEt}</span>` : ''}
      <span style="font-size:12.5px;color:var(--text);flex:1">🕵️ ${adKurum}</span>
      <button type="button" onclick="formDenetimciSatirSil(${i})" style="background:none;border:none;color:var(--red);font-size:15px;cursor:pointer;padding:2px 6px;flex-shrink:0">×</button>
    </div>`;
  }).join('');
}

function denetimciYonetimAc() {
  const adInput = document.getElementById('denetimciAdInput');
  const kurumInput = document.getElementById('denetimciKurumInput');
  if (adInput) { adInput.value = ''; delete adInput.dataset.editingId; }
  if (kurumInput) kurumInput.value = '';
  const btn = document.querySelector('#denetimciYonetimModal button[onclick="denetimciEkle()"]');
  if (btn) { btn.textContent = '+'; btn.style.background = '#06b6d4'; }
  renderDenetimciler();
  document.getElementById('denetimciYonetimModal').style.display = 'flex';
}

function renderDenetimciler() {
  const el = document.getElementById('denetimciListesi');
  if (!el) return;
  if (data.denetimciler.length === 0) {
    el.innerHTML = '<div style="font-size:12px;color:var(--muted);text-align:center;padding:8px 0">Henüz denetimci eklenmedi.</div>';
    return;
  }
  el.innerHTML = data.denetimciler.map(d => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:rgba(6,182,212,0.06);border:1px solid rgba(6,182,212,0.2);border-radius:8px;margin-bottom:6px">
      <div>
        <div style="font-size:13px;color:var(--text);font-weight:600">🕵️ ${d.ad}</div>
        ${d.kurum ? `<div style="font-size:11px;color:var(--sub);margin-top:1px">${d.kurum}</div>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:4px">
        <button onclick="denetimciDuzenle('${d.id}')" style="background:none;border:none;color:var(--blue);font-size:14px;cursor:pointer;padding:2px 6px">✎</button>
        <button onclick="denetimciSil('${d.id}')" style="background:none;border:none;color:var(--red);font-size:16px;cursor:pointer;padding:2px 6px">×</button>
      </div>
    </div>`).join('');
  renderYonetimOzet();
}

// ─── YÖNETİM (ekip / denetmen / malzeme türü / gider kategorisi sayaçları) ────
function renderYonetimOzet() {
  const ekipEl = document.getElementById('yonetimEkipSayac');
  const denEl = document.getElementById('yonetimDenetimciSayac');
  const malEl = document.getElementById('yonetimMalzemeSayac');
  const gkEl = document.getElementById('yonetimGiderKatSayac');
  if (ekipEl) ekipEl.textContent = (data.teams || []).length;
  if (denEl) denEl.textContent = (data.denetimciler || []).length;
  if (malEl) malEl.textContent = (data.malzemeTurleri || []).length;
  if (gkEl) gkEl.textContent = (data.giderKategorileri || []).length;

  const projSayEl = document.getElementById('yonetimProjeSayisi');
  const ozetEkipEl = document.getElementById('yonetimOzetEkip');
  const ozetDenEl = document.getElementById('yonetimOzetDenetimci');
  const ozetMalEl = document.getElementById('yonetimOzetMalzeme');
  if (projSayEl) projSayEl.textContent = (data.projects || []).length;
  if (ozetEkipEl) ozetEkipEl.textContent = (data.teams || []).length;
  if (ozetDenEl) ozetDenEl.textContent = (data.denetimciler || []).length;
  if (ozetMalEl) ozetMalEl.textContent = (data.malzemeTurleri || []).length;
}

async function denetimciDuzenle(id) {
  const d = data.denetimciler.find(x => x.id === id);
  if (!d) return;
  const adInput = document.getElementById('denetimciAdInput');
  const kurumInput = document.getElementById('denetimciKurumInput');
  const btn = document.querySelector('#denetimciYonetimModal button[onclick="denetimciEkle()"]');
  adInput.value = d.ad;
  kurumInput.value = d.kurum || '';
  adInput.focus();
  adInput.dataset.editingId = id;
  if (btn) { btn.textContent = '✓'; btn.style.background = '#10b981'; }
}

async function denetimciEkle() {
  const adInput = document.getElementById('denetimciAdInput');
  const kurumInput = document.getElementById('denetimciKurumInput');
  const ad = adInput?.value.trim();
  const kurum = kurumInput?.value.trim() || null;
  if (!ad) { toast('⚠️ Denetimci adı girin', true); return; }
  const editingId = adInput.dataset.editingId;
  showLoading(editingId ? 'Güncelleniyor...' : 'Ekleniyor...');
  const { error } = editingId
    ? await sb.from('denetimciler').update({ ad, kurum }).eq('id', editingId)
    : await sb.from('denetimciler').insert({ ad, kurum });
  hideLoading();
  if (error) { toast('⚠️ ' + error.message, true); return; }
  adInput.value = '';
  kurumInput.value = '';
  delete adInput.dataset.editingId;
  const btn = document.querySelector('#denetimciYonetimModal button[onclick="denetimciEkle()"]');
  if (btn) { btn.textContent = '+'; btn.style.background = '#06b6d4'; }
  toast(editingId ? '✅ Denetimci güncellendi' : '✅ Denetimci eklendi');
  await loadDenetimciler();
}

function denetimciSil(id) {
  const d = data.denetimciler.find(x => x.id === id);
  silOnayla(`"${d?.ad || 'Bu denetimci'}" silinsin mi? Bu denetimciye atanmış kayıtlarda denetimci bilgisi boşalır.`, async () => {
    showLoading('Siliniyor...');
    const { error } = await sb.from('denetimciler').delete().eq('id', id);
    hideLoading();
    if (error) { toast('⚠️ ' + error.message, true); return; }
    toast('🗑 Denetimci silindi');
    await loadDenetimciler();
  });
}
