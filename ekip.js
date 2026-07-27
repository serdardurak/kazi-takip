// ─── EKİPLER (KAZI EKİBİ) ─────────────────────────────────
async function loadTeams() {
  try {
    const { data: ekipler, error } = await sb.from('ekipler').select('*').order('ad', { ascending: true });
    if (error) { console.warn('Ekipler yüklenemedi:', error.message); return; }
    data.teams = ekipler || [];
    renderEkipSelect();
    renderEkipler();
    renderEkipFiltre();
  } catch (e) { console.warn('Ekipler yüklenemedi'); }
}

function renderEkipSelect() {
  const sel = document.getElementById('fEkip');
  if (!sel) return;
  const secili = sel.value;
  sel.innerHTML = '<option value="">Ekip seçilmedi</option>' + data.teams.map(t => `<option value="${t.id}">${t.ad}</option>`).join('');
  if (secili) sel.value = secili;
}

function renderEkipFiltre() {
  ['aylikRaporEkipFiltre'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const secili = sel.value;
    sel.innerHTML = '<option value="">Tüm Ekipler</option>' + data.teams.map(t => `<option value="${t.id}">${t.ad}</option>`).join('') + '<option value="__bos__">Ekip Atanmamış</option>';
    if (secili) sel.value = secili;
  });
}

function ekipYonetimAc() {
  const input = document.getElementById('ekipAdInput');
  if (input) { input.value = ''; delete input.dataset.editingId; }
  const btn = document.querySelector('#ekipYonetimModal button[onclick="ekipEkle()"]');
  if (btn) { btn.textContent = '+'; btn.style.background = '#8b5cf6'; }
  renderEkipler();
  document.getElementById('ekipYonetimModal').style.display = 'flex';
}

function renderEkipler() {
  const el = document.getElementById('ekipListesi');
  if (!el) return;
  if (data.teams.length === 0) {
    el.innerHTML = '<div style="font-size:12px;color:var(--muted);text-align:center;padding:8px 0">Henüz ekip eklenmedi.</div>';
    return;
  }
  el.innerHTML = data.teams.map(t => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:rgba(139,92,246,0.06);border:1px solid rgba(139,92,246,0.2);border-radius:8px;margin-bottom:6px">
      <span style="font-size:13px;color:var(--text);font-weight:600">👷 ${t.ad}</span>
      <div style="display:flex;align-items:center;gap:4px">
        <button onclick="ekipDuzenle('${t.id}')" style="background:none;border:none;color:var(--blue);font-size:14px;cursor:pointer;padding:2px 6px">✎</button>
        <button onclick="ekipSil('${t.id}')" style="background:none;border:none;color:var(--red);font-size:16px;cursor:pointer;padding:2px 6px">×</button>
      </div>
    </div>`).join('');
  renderYonetimOzet();
}

async function ekipDuzenle(id) {
  const t = data.teams.find(x => x.id === id);
  if (!t) return;
  const input = document.getElementById('ekipAdInput');
  const btn = document.querySelector('#ekipYonetimModal button[onclick="ekipEkle()"]');
  input.value = t.ad;
  input.focus();
  input.dataset.editingId = id;
  if (btn) { btn.textContent = '✓'; btn.style.background = '#10b981'; }
}

async function ekipEkle() {
  const input = document.getElementById('ekipAdInput');
  const ad = input?.value.trim();
  if (!ad) { toast('⚠️ Ekip adı girin', true); return; }
  const editingId = input.dataset.editingId;
  showLoading(editingId ? 'Güncelleniyor...' : 'Ekleniyor...');
  const { error } = editingId
    ? await sb.from('ekipler').update({ ad }).eq('id', editingId)
    : await sb.from('ekipler').insert({ ad });
  hideLoading();
  if (error) { toast('⚠️ ' + error.message, true); return; }
  input.value = '';
  delete input.dataset.editingId;
  const btn = document.querySelector('#ekipYonetimModal button[onclick="ekipEkle()"]');
  if (btn) { btn.textContent = '+'; btn.style.background = '#8b5cf6'; }
  toast(editingId ? '✅ Ekip güncellendi' : '✅ Ekip eklendi');
  await loadTeams();
}

function ekipSil(id) {
  const t = data.teams.find(x => x.id === id);
  silOnayla(`"${t?.ad || 'Bu ekip'}" silinsin mi? Bu ekibe atanmış kayıtlarda ekip bilgisi boşalır.`, async () => {
    showLoading('Siliniyor...');
    const { error } = await sb.from('ekipler').delete().eq('id', id);
    hideLoading();
    if (error) { toast('⚠️ ' + error.message, true); return; }
    toast('🗑 Ekip silindi');
    await loadTeams();
  });
}
