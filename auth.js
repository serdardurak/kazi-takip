// ─── AUTH ─────────────────────────────────────────────────
async function girisYap() {
  const mail = document.getElementById('loginMail').value.trim();
  const sifre = document.getElementById('loginSifre').value;
  const hataEl = document.getElementById('loginHata');
  const btn = document.getElementById('loginBtn');
  if (!mail || !sifre) { hataEl.textContent = 'E-posta ve şifre gerekli.'; hataEl.style.display = 'block'; return; }
  btn.textContent = 'Giriş yapılıyor...'; btn.disabled = true;
  hataEl.style.display = 'none';
  const { error } = await sb.auth.signInWithPassword({ email: mail, password: sifre });
  if (error) {
    hataEl.textContent = 'Hatalı e-posta veya şifre.';
    hataEl.style.display = 'block';
    btn.textContent = 'Giriş Yap'; btn.disabled = false;
  }
  // Başarılıysa onAuthStateChange tetikler, uygulama açılır
}

async function cikisYap() {
  await sb.auth.signOut();
}
