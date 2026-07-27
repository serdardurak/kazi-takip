// Enter ile giriş
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loginSifre')?.addEventListener('keydown', e => { if (e.key === 'Enter') girisYap(); });
  document.getElementById('loginMail')?.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('loginSifre')?.focus(); });
});

sb.auth.onAuthStateChange((event, session) => {
  const loginEl = document.getElementById('loginEkrani');
  const headerEl = document.getElementById('appHeader');
  const mainEl   = document.getElementById('appMain');
  const navEl    = document.getElementById('appNav');
  if (session) {
    if (loginEl) loginEl.style.display = 'none';
    if (headerEl) headerEl.style.display = 'flex';
    if (mainEl)   mainEl.style.display   = 'block';
    if (navEl)    navEl.style.display    = 'flex';
    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
      loadTeams();
      loadDenetimciler();
      loadMalzemeTurleri();
      loadGiderKategorileri();
      loadProjects().then(async () => {
        const ids = data.projects.map(p => p.id);
        if (!data.activeProjectId || !ids.includes(data.activeProjectId)) {
          if (data.projects.length > 0) { setActiveProject(data.projects[0].id); updateHeader(); updateProjSelector(); }
        }
        if (data.activeProjectId) await loadEntries(data.activeProjectId);
        document.getElementById('gTarih').value = new Date().toISOString().split('T')[0];
      });
    }
  } else {
    if (loginEl) loginEl.style.display = 'flex';
    if (headerEl) headerEl.style.display = 'none';
    if (mainEl)   mainEl.style.display   = 'none';
    if (navEl)    navEl.style.display    = 'none';
  }
});

document.getElementById('silOnayBtn').addEventListener('click', async () => {
  document.getElementById('silOnayModal').style.display = 'none';
  if (_silCallback) { await _silCallback(); _silCallback = null; }
});

window.addEventListener('online', () => { onlineKontrol(); toast('✅ İnternet bağlantısı kuruldu'); });

window.addEventListener('offline', () => { onlineKontrol(); toast('⚠️ İnternet bağlantısı kesildi!', true); });

// ─── INIT ────────────────────────────────────────────────
// Mevcut oturumu kontrol et (sayfa yenilenince otomatik giriş)
// ─── GENEL HATA YAKALAMA (GÜVENLİK AĞI) ────────────────────
// Not: Kod tabanında try/catch kullanımı tutarsızdı (200 fonksiyondan
// sadece ~38'i try/catch içeriyordu). Her fonksiyonu tek tek elden
// geçirmek yerine, yakalanmamış her hatayı burada tek noktadan
// yakalayıp kullanıcıya bilgi veriyoruz — böylece sessiz başarısızlık
// veya boş/donmuş ekran yerine en azından bir uyarı görünüyor.
window.addEventListener('unhandledrejection', (e) => {
  console.error('Yakalanmamış hata (promise):', e.reason);
  try { hideLoading(); } catch (_) {}
  try { toast('⚠️ Beklenmeyen bir hata oluştu: ' + (e.reason?.message || 'Bilinmeyen hata'), true); } catch (_) {}
});
window.addEventListener('error', (e) => {
  console.error('Yakalanmamış hata:', e.error || e.message);
});

sb.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    document.getElementById('loginEkrani').style.display = 'none';
    document.getElementById('appHeader').style.display = 'flex';
    document.getElementById('appMain').style.display = 'block';
    document.getElementById('appNav').style.display = 'flex';
    _updateNavArrows();
    loadTeams();
    loadMalzemeTurleri();
    loadGiderKategorileri();
    loadProjects().then(async () => {
      const ids = data.projects.map(p => p.id);
      if (!data.activeProjectId || !ids.includes(data.activeProjectId)) {
        if (data.projects.length > 0) { setActiveProject(data.projects[0].id); updateHeader(); updateProjSelector(); }
      }
      if (data.activeProjectId) await loadEntries(data.activeProjectId);
      document.getElementById('gTarih').value = new Date().toISOString().split('T')[0];
    });
  }
});
