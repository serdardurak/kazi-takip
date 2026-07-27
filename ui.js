function silOnayla(mesaj, callback, ikon = '🗑', btnMetin = 'Evet, Sil', btnRenk = 'var(--red)') {
  const _modal = document.getElementById('silOnayModal');
  const _mesajEl = document.getElementById('silOnayMesaj');
  const _ikonEl = document.getElementById('silOnayIkon');
  const _btn = document.getElementById('silOnayBtn');
  if (!_modal || !_mesajEl) return;
  _mesajEl.textContent = mesaj;
  if (_ikonEl) _ikonEl.textContent = ikon;
  if (_btn) { _btn.textContent = btnMetin; _btn.style.background = btnRenk; }
  _modal.style.display = 'flex';
  _silCallback = callback;
}

async function silIptal() {
  document.getElementById('silOnayModal').style.display = 'none';
  _silCallback = null;
}

function bilgiModalGoster(baslik, mesaj, ikon = 'ℹ️') {
  document.getElementById('bilgiModalIkon').textContent = ikon;
  document.getElementById('bilgiModalBaslik').textContent = baslik;
  document.getElementById('bilgiModalMesaj').textContent = mesaj;
  document.getElementById('bilgiModal').style.display = 'flex';
}

function bilgiModalKapat() {
  document.getElementById('bilgiModal').style.display = 'none';
}

function islemBildir(mesaj, hedef, hata = false) {
  const el = document.getElementById('toast');
  const msgEl = document.getElementById('toastMsg');
  if (el._toastTimer) clearTimeout(el._toastTimer);
  const old = el.querySelector('.toast-undo-btn');
  if (old) old.remove();
  msgEl.textContent = (hata ? '❌ ' : '✅ ') + mesaj;
  el.className = 'toast show' + (hata ? ' error' : '');
  el._toastTimer = setTimeout(() => {
    el.className = 'toast';
    if (!hata) showView(hedef || _oncekiSayfa || 'dashboard');
  }, 1800);
}

function _navHistPush(name) {
  if (_navHistory[_navIndex] === name) { _updateNavArrows(); return; }
  _navHistory = _navHistory.slice(0, _navIndex + 1);
  _navHistory.push(name);
  _navIndex = _navHistory.length - 1;
  _updateNavArrows();
}

function _updateNavArrows() {
  const backBtn = document.getElementById('navBackBtn');
  const fwdBtn = document.getElementById('navFwdBtn');
  if (backBtn) backBtn.disabled = _navIndex <= 0;
  if (fwdBtn) fwdBtn.disabled = _navIndex >= _navHistory.length - 1;
}

function navGeri() {
  if (_navIndex <= 0) return;
  _navIndex--;
  showView(_navHistory[_navIndex], true);
}

function navIleri() {
  if (_navIndex >= _navHistory.length - 1) return;
  _navIndex++;
  showView(_navHistory[_navIndex], true);
}

// ─── NAVIGATION ──────────────────────────────────────────
function geriGit() {
  if (window._lastSavedEntryId && document.getElementById('detayEkleWrap')?.style.display !== 'none') {
    bitirDetay(); return;
  }
  showView(_oncekiSayfa || 'dashboard');
}

function yeniKayitAc() {
  const proj = activeProject();
  window._lastSavedEntryId = null;
  editingId = null;
  // Direkt DOM - showView çağırmadan
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('view-kayit').classList.add('active');
  document.getElementById('nav-kayit').classList.add('active');
  _navHistPush('kayit');
  const projSel = document.getElementById('projSelector');
  if (projSel) projSel.style.display = data.projects.length > 0 ? 'flex' : 'none';

  const bitmisBanner = document.getElementById('projebitmisBanner');
  if (proj?.bitti) {
    if (bitmisBanner) bitmisBanner.style.display = 'block';
    document.getElementById('kaziFormWrap').style.display = 'none';
    document.getElementById('detayEkleWrap').style.display = 'none';
    const kayitList = document.getElementById('kayitViewEntryList');
    if (kayitList) kayitList.style.display = 'none';
  } else {
    if (bitmisBanner) bitmisBanner.style.display = 'none';
    resetForm();
    resetDosyaForm();
    document.getElementById('kaziFormWrap').style.display = 'block';
    document.getElementById('detayEkleWrap').style.display = 'none';
    const kayitList = document.getElementById('kayitViewEntryList');
    if (kayitList) kayitList.style.display = 'none';
    renderDashboard();
  }
}

function bitirDetay() {
  const acikKalacakId = window._lastSavedEntryId;
  window._lastSavedEntryId = null;
  tempHatalar = [];
  tempMalzemeler = [];
  tempFotograflar = [];
  tempKmz = null;
  tempHataGorseller = [];
  _hataduzenleIdx = null;
  tempOnaylar = [];
  tempOnayGorseller = [];
  _onayDuzenleIdx = null;
  // Popup'ı kapat - altındaki ekran neyse ona geri dön
  document.getElementById('detayEkleWrap').style.display = 'none';
  document.body.style.overflow = '';
  const acikMenuyuGeriAc = () => {
    if (!acikKalacakId) return;
    const body = document.getElementById('body-' + acikKalacakId);
    const tog = document.getElementById('tog-' + acikKalacakId);
    const card = document.getElementById('card-' + acikKalacakId);
    if (body) body.classList.add('open');
    if (tog) tog.textContent = '▲';
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  if (data.activeProjectId) {
    loadEntries(data.activeProjectId, true).then(() => { renderDashboard(); acikMenuyuGeriAc(); });
  } else {
    renderDashboard();
    acikMenuyuGeriAc();
  }
}

function showView(name, fromHistory = false) {
  _oncekiSayfa = document.querySelector('.nav-btn.active')?.id?.replace('nav-', '') || 'dashboard';
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const viewEl = document.getElementById('view-' + name);
  const navEl = document.getElementById('nav-' + name);
  if (viewEl) viewEl.classList.add('active');
  if (navEl) navEl.classList.add('active');
  if (fromHistory) { _updateNavArrows(); } else { _navHistPush(name); }
  const hasProjSelector = ['dashboard', 'kayit', 'rapor'].includes(name);
  const projSel = document.getElementById('projSelector');
  if (projSel) projSel.style.display = hasProjSelector && data.projects.length > 0 ? 'flex' : 'none';
  if (name === 'dashboard') { renderDashboard(); if (data.activeProjectId) yenile(); }
  if (name === 'rapor') { if (_raporTab === 'aylik') renderAylikRapor(); else renderRapor(); }
  if (name === 'projeler') renderProjeler();
  if (name === 'kayit' && !editingId && !window._lastSavedEntryId) {
    resetForm();
    document.getElementById('kaziFormWrap').style.display = 'block';
    document.getElementById('detayEkleWrap').style.display = 'none';
  }
  if (name === 'giderler') loadGiderler();
  if (name === 'yonetim') { renderYonetimOzet(); if (typeof renderSilinenler === 'function') renderSilinenler(); }
  if (name === 'gider-ekle' && !editingGiderId) {
    resetGiderForm();
    const fb = document.getElementById('giderFormBaslik');
    if (fb) fb.textContent = '💸 Gider Ekle';
  }
}

function toggleProjModal() {
  const modal = document.getElementById('projModal');
  const isOpen = modal.style.display === 'flex';
  if (!isOpen) renderModalProjList();
  modal.style.display = isOpen ? 'none' : 'flex';
}

// ─── KAYIT DÜZENLEME OVERLAY'İ (ayrı sayfa gibi açılır) ────
function editOverlayAc() {
  if (_editOverlayAcik) return;
  const form = document.getElementById('kaziFormWrap');
  const hedef = document.getElementById('editKayitOverlayIcerik');
  const overlay = document.getElementById('editKayitOverlay');
  if (!form || !hedef || !overlay) return;
  _editOverlayOrijinalYer = { parent: form.parentNode, next: form.nextSibling };
  hedef.appendChild(form);
  form.style.display = 'block';
  overlay.style.display = 'block';
  document.body.style.overflow = 'hidden';
  _editOverlayAcik = true;
  // Form içindeki "Kayıt Düzenleniyor" banner'ı overlay başlığıyla tekrar ediyor, gizle
  const banner = document.getElementById('editBanner');
  if (banner) banner.style.display = 'none';
}

function editOverlayKapatOrtak() {
  if (!_editOverlayAcik) return;
  const form = document.getElementById('kaziFormWrap');
  const overlay = document.getElementById('editKayitOverlay');
  if (form && _editOverlayOrijinalYer) {
    if (_editOverlayOrijinalYer.next) {
      _editOverlayOrijinalYer.parent.insertBefore(form, _editOverlayOrijinalYer.next);
    } else {
      _editOverlayOrijinalYer.parent.appendChild(form);
    }
  }
  if (overlay) overlay.style.display = 'none';
  document.body.style.overflow = '';
  _editOverlayAcik = false;
  _editOverlayOrijinalYer = null;
}

function editOverlayGeriDon() {
  cancelEdit();
}

function editOverlayKapat() {
  cancelEdit();
}

function cancelEdit() {
  editOverlayKapatOrtak();
  editingId = null;
  window._lastSavedEntryId = null;
  resetForm();
  resetDosyaForm();
  showView('dashboard');
}

function bakimToggle() {
  const ck = document.getElementById('fBakim');
  const box = document.getElementById('fBakimBox');
  const metreWrap = document.getElementById('fMetreWrap');
  const metreLabel = document.getElementById('fMetreLabel');
  const metreInput = document.getElementById('fMetre');
  const notlarLabel = document.getElementById('fNotlarLabel');
  const notlar = document.getElementById('fNotlar');
  const baslikSpan = document.querySelector('#kaziFormWrap .card > div > span:last-child');
  if (!ck) return;
  if (ck.checked) {
    if (box) { box.style.background = '#10b981'; box.style.borderColor = '#10b981'; box.style.color = '#fff'; }
    metreInput.value = '0';
    metreInput.disabled = true;
    metreInput.style.opacity = '0.5';
    metreLabel.textContent = 'MİKTAR (m) — bakım günü';
    notlarLabel.textContent = 'AÇIKLAMA * (yapılan bakım/onarım çalışması)';
    notlar.placeholder = 'örn: Kadıköy hattında borulama onarımı yapıldı, arıza giderildi...';
    notlar.style.borderColor = '#10b981';
    if (baslikSpan) baslikSpan.textContent = 'GÜNLÜK SAHA KAYDI';
  } else {
    if (box) { box.style.background = 'var(--bg)'; box.style.borderColor = 'var(--border)'; box.style.color = 'transparent'; }
    metreInput.disabled = false;
    metreInput.style.opacity = '1';
    if (metreInput.value === '0') metreInput.value = '';
    metreLabel.textContent = 'MİKTAR (m) *';
    notlarLabel.textContent = 'NOTLAR';
    notlar.placeholder = 'Günlük notlar...';
    notlar.style.borderColor = '';
    if (baslikSpan) baslikSpan.textContent = 'GÜNLÜK KAZI KAYDI';
  }
}

// ─── LOADING ─────────────────────────────────────────────
function showLoading(msg = 'Yükleniyor...') {
  const el = document.getElementById('loadingOverlay');
  const msgEl = document.getElementById('loadingMsg');
  if (!el) return;
  if (msgEl) msgEl.textContent = msg;
  el.style.display = 'flex';
}

function hideLoading() {
  const el = document.getElementById('loadingOverlay');
  if (el) el.style.display = 'none';
}

// ─── TOAST ───────────────────────────────────────────────
function toast(msg, isError = false, undoFn = null, undoDuration = 5000) {
  const el = document.getElementById('toast');
  const msgEl = document.getElementById('toastMsg');
  // Önceki timer'ı temizle
  if (el._toastTimer) clearTimeout(el._toastTimer);
  // Önceki undo butonunu kaldır
  const old = el.querySelector('.toast-undo-btn');
  if (old) old.remove();
  msgEl.textContent = msg;
  el.className = 'toast show' + (isError ? ' error' : '');
  const dur = undoFn ? undoDuration : 2200;
  if (undoFn) {
    const btn = document.createElement('button');
    btn.className = 'toast-undo-btn';
    btn.textContent = '↩ Geri Al';
    btn.onclick = () => {
      clearTimeout(el._toastTimer);
      el.className = 'toast';
      undoFn();
    };
    el.appendChild(btn);
  }
  if (dur !== Infinity) {
    el._toastTimer = setTimeout(() => {
      el.className = 'toast';
      const b = el.querySelector('.toast-undo-btn');
      if (b) b.remove();
    }, dur);
  }
}

// ─── HELPERS ─────────────────────────────────────────────
function formatDate(d) {
  return new Date(d).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'long' });
}

function updateHeader() {
  const proj = activeProject();
  const badge = document.getElementById('activeBadge');
  const name = document.getElementById('activeName');
  if (proj) {
    badge.style.display = 'flex';
    name.textContent = proj.name;
  } else {
    badge.style.display = 'none';
  }
}
