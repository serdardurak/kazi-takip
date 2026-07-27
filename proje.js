function projeFormAc() {
  _duzenlemeProjId = null;
  document.getElementById('projeFormBaslik').textContent = '🏗 Yeni Proje Oluştur';
  document.getElementById('projeFormBtn').textContent = 'Projeyi Oluştur';
  document.getElementById('pName').value = '';
  document.getElementById('pLoc').value = '';
  document.getElementById('pHedef').value = '';
  document.getElementById('projeForm').style.display = 'block';
  setTimeout(() => document.getElementById('pName').focus(), 100);
}

function projeFormKapat() {
  document.getElementById('projeForm').style.display = 'none';
  _duzenlemeProjId = null;
}

async function projeFormKaydet() {
  if (_duzenlemeProjId) {
    await updateProject(_duzenlemeProjId);
  } else {
    await createProject();
  }
}

function renderProjeToplamRapor(toplamMap) {
  const rapor = document.getElementById('projToplamRapor');
  if (!rapor || data.projects.length === 0) { if(rapor) rapor.style.display='none'; return; }
  rapor.style.display = 'block';

  const aktifProjeler = data.projects.filter(p => !p.bitti);
  const bitenProjeler = data.projects.filter(p => p.bitti === true);

  const toplamKazi = Object.values(toplamMap).reduce((s,v) => s+v, 0);
  const aktifKazi = aktifProjeler.reduce((s,p) => s + (toplamMap[p.id]||0), 0);
  const bitenKazi = bitenProjeler.reduce((s,p) => s + (toplamMap[p.id]||0), 0);
  const toplamHata = data.projects.reduce((s, p) =>
    s + (p.entries||[]).reduce((ss,e) => ss + (e.hatalar?.length || (e.hata?.var ? 1 : 0)), 0), 0);

  // Stat kartları kaldırıldı (HTML'de yok)

  // Aktif/biten detay
  const detayEl = document.getElementById('ptDetay');
  if (detayEl) {
    detayEl.innerHTML = `
      <div style="margin-top:4px">
        ${aktifProjeler.length > 0 ? `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:13px;color:var(--text)">🔨 Devam Eden (${aktifProjeler.length} proje)</span>
            <span style="font-size:14px;font-weight:700;color:var(--yellow)">${Math.round(aktifKazi).toLocaleString("tr-TR")} m</span>
          </div>` : ''}
        ${bitenProjeler.length > 0 ? `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:13px;color:var(--muted)">✅ Tamamlanan (${bitenProjeler.length} proje)</span>
            <span style="font-size:14px;font-weight:700;color:#10b981">${Math.round(bitenKazi).toLocaleString("tr-TR")} m</span>
          </div>` : ''}
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0 4px 0">
          <span style="font-size:13px;font-weight:900;color:var(--text);letter-spacing:0.5px">TOPLAM</span>
          <span style="font-size:15px;font-weight:900;color:var(--yellow)">${Math.round(toplamKazi).toLocaleString("tr-TR")} m</span>
        </div>
      </div>`;
  }
}

async function createProject() {
  const name = document.getElementById('pName').value.trim();
  const loc = document.getElementById('pLoc').value.trim();
  const hedef = parseFloat(document.getElementById('pHedef').value) || 0;
  if (!name) { toast('⚠️ Proje adı boş olamaz!', true); return; }
  showLoading('Proje oluşturuluyor...');
  try {
    const { data: inserted, error } = await sb.from('projeler').insert({ ad: name, konum: loc, hedef_metre: hedef || null }).select().single();
    if (error) { hideLoading(); toast('⚠️ Proje oluşturulamadı!', true); return; }
    const proj = { id: inserted.id, name: inserted.ad, location: inserted.konum || '', hedefMetre: inserted.hedef_metre || 0, bitti: false, entries: [] };
    data.projects.push(proj);
    setActiveProject(proj.id);
    projeFormKapat();
    updateHeader();
    updateProjSelector();
    hideLoading();
    showView('dashboard');
    await loadEntries(proj.id);
    renderDashboard();
    toast('✅ Proje oluşturuldu!');
  } catch(err) { hideLoading(); toast('⚠️ ' + (err.message||'Bağlantı hatası'), true); }
}

async function updateProject(id) {
  const name = document.getElementById('pName').value.trim();
  const loc = document.getElementById('pLoc').value.trim();
  const hedef = parseFloat(document.getElementById('pHedef').value) || 0;
  if (!name) { toast('⚠️ Proje adı boş olamaz!', true); return; }
  showLoading('Güncelleniyor...');
  try {
    const { error } = await sb.from('projeler').update({ ad: name, konum: loc || null, hedef_metre: hedef || null }).eq('id', id);
    if (error) throw error;
    const proj = data.projects.find(p => p.id === id);
    if (proj) { proj.name = name; proj.location = loc; proj.hedefMetre = hedef; }
    projeFormKapat();
    hideLoading();
    updateHeader();
    updateProjSelector();
    renderProjeler();
    renderDashboard();
    toast('✅ Proje güncellendi!');
  } catch(err) { hideLoading(); toast('⚠️ ' + (err.message||'Hata'), true); }
}

function renameProject(id) {
  const proj = data.projects.find(p => p.id === id);
  if (!proj) return;
  _duzenlemeProjId = id;
  document.getElementById('projeFormBaslik').textContent = '✏️ Projeyi Düzenle';
  document.getElementById('projeFormBtn').textContent = 'Güncelle';
  document.getElementById('pName').value = proj.name;
  document.getElementById('pLoc').value = proj.location || '';
  document.getElementById('pHedef').value = proj.hedefMetre || '';
  document.getElementById('projeForm').style.display = 'block';
  document.getElementById('projeForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => document.getElementById('pName').focus(), 300);
}

function activeProject() {
  return data.projects.find(p => p.id === data.activeProjectId) || null;
}

function setActiveProject(id) {
  data.activeProjectId = id;
  localStorage.setItem('aktifProje', id || '');
}

// ─── PROJE RENAME ────────────────────────────────────────
// ─── LOAD PROJECTS FROM SUPABASE ─────────────────────────
async function loadProjects() {
  showLoading('Projeler yükleniyor...');
  try {
  const { data: projeler, error } = await sb.from('projeler').select('id, ad, konum, hedef_metre, bitti, silindi, olusturma_tarihi').order('olusturma_tarihi', { ascending: true });
  hideLoading();
  if (error) { hideLoading(); toast('⚠️ Bağlantı hatası: ' + error.message, true); return; }
  data.projects = projeler.filter(p => !p.silindi).map(p => ({
    id: p.id, name: p.ad, location: p.konum || '',
    hedefMetre: p.hedef_metre ? parseFloat(p.hedef_metre) : 0,
    bitti: p.bitti === true,
    entries: []
  }));
  data.deletedProjects = projeler.filter(p => p.silindi === true).map(p => ({
    id: p.id, name: p.ad, location: p.konum || '',
    hedefMetre: p.hedef_metre ? parseFloat(p.hedef_metre) : 0,
    bitti: p.bitti === true,
    entries: []
  }));
  updateHeader();
  updateProjSelector();
  renderDashboard();
  renderProjeler();
  } catch(e) { hideLoading(); toast('⚠️ Bağlantı hatası!', true); }
}

function updateProjSelector() {
  const sel = document.getElementById('projSelect');
  if (!sel) return;
  sel.onchange = null;
  sel.innerHTML = '<option value="">-- Seçin --</option>';
  data.projects.forEach(p => {
    const o = document.createElement('option');
    o.value = p.id;
    o.textContent = p.name + (p.location ? ` (${p.location})` : '');
    if (p.id === data.activeProjectId) o.selected = true;
    sel.appendChild(o);
  });
  sel.onchange = (e) => { if (e.target.value) switchProject(e.target.value); };
}

async function switchProject(id) {
  try {
    setActiveProject(id);
    updateHeader();
    updateProjSelector();
    renderProjeler();
    await loadEntries(id);
    renderProjeler();
    // Eğer kayıt ekleme sayfasındaysak bitti durumunu güncelle
    const kayitView = document.getElementById('view-kayit');
    if (kayitView?.classList.contains('active')) {
      const proj = activeProject();
      const bitmisBanner = document.getElementById('projebitmisBanner');
      if (proj?.bitti) {
        if (bitmisBanner) bitmisBanner.style.display = 'block';
        document.getElementById('kaziFormWrap').style.display = 'none';
        document.getElementById('detayEkleWrap').style.display = 'none';
      } else {
        if (bitmisBanner) bitmisBanner.style.display = 'none';
        document.getElementById('kaziFormWrap').style.display = 'block';
      }
    }
  } catch(e) { toast('⚠️ Proje değiştirilemedi!', true); }
}

async function projeDetayAc(id) {
  const p = data.projects.find(x => x.id === id);
  if (!p) return;
  const modal = document.getElementById('projeDetayModal');
  const icerik = document.getElementById('projeDetayIcerik');
  const aktifBtn = document.getElementById('projeDetayAktifBtn');
  icerik.innerHTML = '<div style="text-align:center;color:var(--muted);padding:20px 0">Yükleniyor...</div>';
  modal.style.display = 'flex';

  const kodMap = {};
  data.projects.forEach((pr, i) => { kodMap[pr.id] = 'P-' + String(i + 1).padStart(2, '0'); });

  let kayitlar = [];
  try {
    let { data: rows, error } = await sb.from('kayitlar').select('tarih, kazi_metre, ekip_id, denetimci_id, denetim_secimleri').eq('proje_id', id).order('tarih', { ascending: false });
    if (error && error.message && error.message.includes('denetim_secimleri')) {
      _denetimSecimleriDesteklenmiyor = true;
      ({ data: rows, error } = await sb.from('kayitlar').select('tarih, kazi_metre, ekip_id, denetimci_id').eq('proje_id', id).order('tarih', { ascending: false }));
    }
    if (error) throw error;
    kayitlar = rows || [];
  } catch (e) {
    icerik.innerHTML = '<div style="text-align:center;color:var(--red);padding:20px 0">⚠️ Kayıtlar yüklenemedi</div>';
    return;
  }

  const bitti = p.bitti === true;
  const isActive = p.id === data.activeProjectId;
  const kaziKayitlari = kayitlar.filter(k => parseFloat(k.kazi_metre || 0) > 0);
  const toplam = kayitlar.reduce((s, k) => s + parseFloat(k.kazi_metre || 0), 0);
  const kayitSayisi = kaziKayitlari.length;
  const yuzde = p.hedefMetre > 0 ? Math.min(100, (toplam / p.hedefMetre) * 100) : 0;
  const calisilanGunler = new Set(kaziKayitlari.map(k => k.tarih));
  const gunlukOrt = calisilanGunler.size > 0 ? toplam / calisilanGunler.size : 0;
  const kalan = p.hedefMetre > 0 ? Math.max(0, p.hedefMetre - toplam) : 0;
  const tahminiGun = (gunlukOrt > 0 && kalan > 0) ? Math.ceil(kalan / gunlukOrt) : 0;

  const durum = bitti
    ? `<span class="scard-durum tamam-rozet">✓ TAMAMLANDI</span>`
    : isActive
      ? `<span class="scard-durum canli"><span class="dot"></span>SAHADA</span>`
      : `<span class="scard-durum">DEVAM EDİYOR</span>`;

  const ruler = p.hedefMetre > 0
    ? `<div class="scard-ruler" style="margin-top:10px"><div class="scard-ruler-fill" style="width:${yuzde}%"></div></div>
       <div class="scard-ruler-labels"><span>0m</span><span class="scard-ruler-pct">%${yuzde.toFixed(0)}</span><span>${p.hedefMetre.toLocaleString('tr-TR')}m</span></div>`
    : '';

  const sonKayitlar = kayitlar.slice(0, 15).map(k => {
    const ekip = k.ekip_id ? data.teams.find(t => t.id === k.ekip_id) : null;
    const denetimciListesi = denetimSecimleriNormalize(k.denetim_secimleri, k.denetimci_id)
      .map(s => data.denetimciler.find(d => d.id === s.id))
      .filter(Boolean)
      .map(d => '🕵️ ' + d.ad);
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px dashed var(--border);font-size:12px">
      <div>
        <div style="color:var(--text)">${new Date(k.tarih).toLocaleDateString('tr-TR')}</div>
        <div style="color:var(--sub);font-size:11px">${[ekip ? '👷 ' + ekip.ad : '', ...denetimciListesi].filter(Boolean).join(' · ') || '-'}</div>
      </div>
      <div style="color:${Number(k.kazi_metre) === 0 ? '#a78bfa' : 'var(--yellow)'};font-weight:700">${Number(k.kazi_metre) === 0 ? '🔧 Bakım' : Number(k.kazi_metre).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' m'}</div>
    </div>`;
  }).join('') || '<div style="text-align:center;color:var(--muted);padding:14px 0">Henüz kayıt yok.</div>';

  icerik.innerHTML = `
    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:6px">
      <span class="scard-kod">${kodMap[p.id] || ''}</span>
      ${durum}
    </div>
    <div style="font-size:16px;font-weight:800;text-transform:uppercase;color:${bitti ? 'var(--text)' : 'var(--yellow)'}">${p.name}</div>
    ${p.location ? `<div style="font-size:12px;color:var(--sub);margin-top:2px">📍 ${p.location}</div>` : ''}
    ${ruler}
    <div class="stats-row" style="margin-top:12px">
      <div class="stat-card" style="border-top-color:#f59e0b">
        <div class="stat-icon">⛏</div>
        <div class="stat-value" style="color:#f59e0b">${Math.round(toplam).toLocaleString('tr-TR')} m</div>
        <div class="stat-label">Toplam Kazı</div>
      </div>
      <div class="stat-card" style="border-top-color:#3b82f6">
        <div class="stat-icon">📅</div>
        <div class="stat-value" style="color:#3b82f6">${kayitSayisi}</div>
        <div class="stat-label">Kayıt Sayısı</div>
      </div>
      ${!bitti && tahminiGun > 0 ? `<div class="stat-card" style="border-top-color:#8b5cf6">
        <div class="stat-icon">📈</div>
        <div class="stat-value" style="color:#8b5cf6">≈${tahminiGun}</div>
        <div class="stat-label">Gün Kaldı</div>
      </div>` : ''}
    </div>
    <div class="card-title" style="margin-top:14px;margin-bottom:6px;font-size:13px">📋 Son Kayıtlar</div>
    <div>${sonKayitlar}</div>
  `;

  if (bitti) {
    aktifBtn.style.display = 'none';
  } else {
    aktifBtn.style.display = 'block';
    aktifBtn.textContent = isActive ? '✓ Şu An Aktif Proje' : '🔄 Bu Projeyi Aktif Yap';
    aktifBtn.disabled = isActive;
    aktifBtn.style.opacity = isActive ? '0.6' : '1';
    aktifBtn.onclick = async () => {
      if (isActive) return;
      await switchProject(id);
      modal.style.display = 'none';
      toast('✅ Aktif proje değiştirildi: ' + p.name);
    };
  }
}

function renderModalProjList() {
  const list = document.getElementById('modalProjList');
  list.innerHTML = data.projects.map(p => {
    const isActive = p.id === data.activeProjectId;
    return `<div onclick="switchProject('${p.id}');toggleProjModal()" style="padding:12px 16px;cursor:pointer;border-bottom:1px solid var(--border);background:${isActive ? 'rgba(245,158,11,0.1)' : 'transparent'};display:flex;align-items:center;gap:10px">
      ${isActive ? '<span style="color:var(--yellow)">●</span>' : '<span style="color:var(--muted)">○</span>'}
      <div>
        <div style="font-size:14px;font-weight:600;color:var(--text)">${p.name}</div>
        ${p.location ? `<div style="font-size:11px;color:var(--muted)">${p.location}</div>` : ''}
      </div>
    </div>`;
  }).join('');
}

function renderProjeler() {
  const list = document.getElementById('projList');
  const card = document.getElementById('projListCard');
  if (!list || !card) return;
  if (data.projects.length === 0) { card.style.display = 'none'; } else { card.style.display = 'block'; }

  // Tüm projelerin toplam metrajını çek
  sb.from('kayitlar').select('proje_id, kazi_metre').then(({ data: kayitlar }) => {
    if (kayitlar) {
      const toplamMap = {};
      const kayitSayiMap = {};
      kayitlar.forEach(k => {
        toplamMap[k.proje_id] = (toplamMap[k.proje_id] || 0) + parseFloat(k.kazi_metre || 0);
        if (parseFloat(k.kazi_metre || 0) > 0) kayitSayiMap[k.proje_id] = (kayitSayiMap[k.proje_id] || 0) + 1;
      });
      renderProjeToplamRapor(toplamMap);
      const kodMap = {};
      data.projects.forEach((p, i) => { kodMap[p.id] = 'P-' + String(i + 1).padStart(2, '0'); });

      list.innerHTML = [...data.projects].sort((a,b) => (a.bitti===true ? 1 : 0) - (b.bitti===true ? 1 : 0)).map(p => {
        const isActive = p.id === data.activeProjectId;
        const toplam = toplamMap[p.id] || 0;
        const bitti = p.bitti === true;
        const kayitSayisi = kayitSayiMap[p.id] || 0;
        const gunlukOrt = kayitSayisi > 0 ? toplam / kayitSayisi : 0;
        const kalan = p.hedefMetre > 0 ? Math.max(0, p.hedefMetre - toplam) : 0;
        const tahminiGun = (gunlukOrt > 0 && kalan > 0) ? Math.ceil(kalan / gunlukOrt) : 0;
        const yuzde = p.hedefMetre > 0 ? Math.min(100, (toplam / p.hedefMetre) * 100) : 0;
        const tahminiStr = (!bitti && tahminiGun > 0) ? ` · ≈${tahminiGun} gün kaldı` : '';

        const durum = bitti
          ? `<span class="scard-durum tamam-rozet">✓ TAMAMLANDI</span>`
          : isActive
            ? `<span class="scard-durum canli"><span class="dot"></span>SAHADA</span>`
            : `<span class="scard-durum">DEVAM EDİYOR</span>`;

        const ruler = p.hedefMetre > 0
          ? `<div class="scard-ruler"><div class="scard-ruler-fill" style="width:${yuzde}%"></div></div>
             <div class="scard-ruler-labels"><span>0m</span><span class="scard-ruler-pct">%${yuzde.toFixed(0)}</span><span>${p.hedefMetre.toLocaleString("tr-TR")}m</span></div>
             <div class="scard-meta" style="margin-top:4px">⛏ ${Math.round(toplam).toLocaleString("tr-TR")} m kazıldı · ${kayitSayisi} kayıt${tahminiStr}</div>`
          : `<div class="scard-meta">⛏ ${Math.round(toplam).toLocaleString("tr-TR")} m kazıldı · ${kayitSayisi} kayıt</div>`;

        return `<div class="scard ${bitti ? 'tamam' : (isActive ? 'aktif' : '')}">
          <div class="scard-top">
            <span class="scard-kod">${kodMap[p.id]}</span>
            ${durum}
            <div class="scard-icobtn-group">
              ${!bitti
                ? `<button class="scard-icobtn tamamla" onclick="projeKapat('${p.id}')" title="Tamamla">✓</button>`
                : `<button class="scard-icobtn ac" onclick="projeAc('${p.id}')" title="Yeniden Aç">↺</button>`
              }
              <button class="scard-icobtn duzenle" onclick="renameProject('${p.id}')" title="Düzenle">✎</button>
              <button class="scard-icobtn sil" onclick="silOnayla('Bu projeyi silmek istediğine emin misin?', async () => { await deleteProject('${p.id}'); })" title="Sil">✕</button>
            </div>
          </div>
          <div onclick="projeDetayAc('${p.id}')">
            <div class="scard-isim">${p.name}</div>
            ${p.location ? `<div class="scard-konum">📍 ${p.location}</div>` : ''}
          </div>
          <div class="scard-divider"></div>
          ${ruler}
        </div>`;
      }).join('');
    }
    // Silinenler bölümünü güncelle
    renderSilinenler();
  });
}

function renderSilinenler() {
  const wrap = document.getElementById('silinenlerCard');
  if (!wrap) return;
  const deleted = data.deletedProjects || [];
  wrap.style.display = 'block';
  document.getElementById('silinenlerSayi').textContent = deleted.length;
  const list = document.getElementById('silinenlerList');
  if (deleted.length === 0) {
    list.innerHTML = `<div style="font-size:12px;color:var(--muted);text-align:center;padding:12px 0">Silinmiş proje yok. Bir projeyi sildiğinde burada görünür ve istersen geri getirebilirsin.</div>`;
    return;
  }
  list.innerHTML = deleted.map(p => `
    <div style="display:flex;align-items:center;padding:12px 14px;border-bottom:1px solid var(--border);gap:10px;opacity:0.75">
      <div style="flex:1">
        <div style="font-size:14px;font-weight:600;color:var(--muted)">🗑 ${p.name}</div>
        ${p.location ? `<div style="font-size:11px;color:var(--muted)">${p.location}</div>` : ''}
      </div>
      <button onclick="projeyiGeriGetir('${p.id}')" style="background:none;border:1px solid #10b981;color:#10b981;border-radius:6px;padding:5px 8px;font-size:12px;cursor:pointer" title="Geri Getir">↩ Geri Al</button>
      <button onclick="projeyiKaliciSil('${p.id}')" style="background:none;border:1px solid var(--red);color:var(--red);border-radius:6px;padding:5px 8px;font-size:12px;cursor:pointer" title="Kalıcı Sil">🗑</button>
    </div>
  `).join('');
}

async function projeKapat(id) {
  silOnayla(
    'Bu projeyi tamamlandı olarak işaretlemek istiyor musun?',
    async () => {
      showLoading('Güncelleniyor...');
      try {
        const { error } = await sb.from('projeler').update({ bitti: true }).eq('id', id);
        if (error) {
          hideLoading();
          toast('⚠️ Hata: ' + error.message + '\nSupabase\'de "bitti" kolonu ekli mi?', true);
          return;
        }
        const proj = data.projects.find(p => p.id === id);
        if (proj) proj.bitti = true;
        hideLoading();
        await loadProjects();
        toast('✅ Proje tamamlandı olarak işaretlendi!');
      } catch(err) { hideLoading(); toast('⚠️ ' + (err.message||'Bağlantı hatası'), true); }
    },
    '✅', 'Evet, Tamamla', '#10b981'
  );
}

async function projeAc(id) {
  showLoading('Güncelleniyor...');
  try {
    await sb.from('projeler').update({ bitti: false }).eq('id', id);
    const proj = data.projects.find(p => p.id === id);
    if (proj) proj.bitti = false;
    hideLoading();
    await loadProjects();
    toast('✅ Proje yeniden açıldı!');
  } catch(err) { hideLoading(); toast('⚠️ ' + (err.message||'Hata'), true); }
}

async function deleteProject(id) {
  showLoading('Siliniyor...');
  try {
    const { error } = await sb.from('projeler').update({ silindi: true }).eq('id', id);
    if (error) throw error;
    const proj = data.projects.find(p => p.id === id);
    if (proj) {
      data.deletedProjects = data.deletedProjects || [];
      data.deletedProjects.push(proj);
      data.projects = data.projects.filter(p => p.id !== id);
    }
    if (data.activeProjectId === id) {
      const newId = data.projects.length > 0 ? data.projects[0].id : null;
      setActiveProject(newId);
      if (newId) await loadEntries(newId);
    }
    hideLoading();
    updateHeader();
    updateProjSelector();
    renderProjeler();
    renderDashboard();
    toast('🗑 Proje "Silinenler" bölümüne taşındı.');
  } catch(err) { hideLoading(); toast('⚠️ ' + (err.message || 'Hata'), true); }
}

async function projeyiGeriGetir(id) {
  showLoading('Geri getiriliyor...');
  try {
    const { error } = await sb.from('projeler').update({ silindi: false }).eq('id', id);
    if (error) throw error;
    const proj = (data.deletedProjects || []).find(p => p.id === id);
    if (proj) {
      data.deletedProjects = data.deletedProjects.filter(p => p.id !== id);
      data.projects.push(proj);
    }
    hideLoading();
    updateHeader();
    updateProjSelector();
    renderProjeler();
    renderDashboard();
    toast('✅ Proje geri getirildi: ' + (proj?.name || ''));
  } catch(err) { hideLoading(); toast('⚠️ ' + (err.message || 'Hata'), true); }
}

async function projeyiKaliciSil(id) {
  silOnayla(
    'Bu proje ve tüm kayıtları kalıcı olarak silinecek. Geri alınamaz!',
    async () => {
      showLoading('Kalıcı siliniyor...');
      try {
        const { error } = await sb.from('projeler').delete().eq('id', id);
        if (error) throw error;
        data.deletedProjects = (data.deletedProjects || []).filter(p => p.id !== id);
        hideLoading();
        renderProjeler();
        toast('🗑 Proje kalıcı olarak silindi.');
      } catch(err) { hideLoading(); toast('⚠️ ' + (err.message || 'Hata'), true); }
    },
    '⚠️', 'Kalıcı Sil', 'var(--red)'
  );
}
