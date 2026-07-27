function kmzIndir(url, ad) {
  // Android için en güvenilir yöntem
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', ad);
  a.setAttribute('target', '_blank');
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => document.body.removeChild(a), 500);
  toast('📥 KMZ açılıyor...');
}

function qrTabDegis(tab) {
  const btnLink = document.getElementById('qrTabBtnLink');
  const btnDosya = document.getElementById('qrTabBtnDosya');
  const tabLink = document.getElementById('qrTabLink');
  const tabDosya = document.getElementById('qrTabDosya');
  const aktifStil = 'flex:1;padding:10px;border:1.5px solid var(--yellow);background:var(--yellow);color:#0f172a;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit';
  const pasifStil = 'flex:1;padding:10px;border:1.5px solid var(--border);background:none;color:var(--muted);border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit';
  if (tab === 'dosya') {
    btnDosya.style.cssText = aktifStil;
    btnLink.style.cssText = pasifStil;
    tabDosya.style.display = 'block';
    tabLink.style.display = 'none';
  } else {
    btnLink.style.cssText = aktifStil;
    btnDosya.style.cssText = pasifStil;
    tabLink.style.display = 'block';
    tabDosya.style.display = 'none';
  }
}

function qrDosyaSecildi() {
  const input = document.getElementById('qrDosyaInput');
  const onizleme = document.getElementById('qrDosyaOnizleme');
  const f = input.files?.[0];
  if (!f) { _qrSeciliDosya = null; onizleme.style.display = 'none'; return; }
  const maxBoyut = 15 * 1024 * 1024; // 15MB
  if (f.size > maxBoyut) {
    toast('⚠️ Dosya çok büyük! En fazla 15MB olmalı.', true);
    input.value = '';
    _qrSeciliDosya = null;
    onizleme.style.display = 'none';
    return;
  }
  _qrSeciliDosya = f;
  const boyutMb = (f.size / (1024 * 1024)).toFixed(2);
  const ikon = f.type === 'application/pdf' ? '📄' : '🖼️';
  onizleme.innerHTML = `${ikon} <strong>${f.name}</strong><br><span style="color:var(--muted)">${boyutMb} MB</span>`;
  onizleme.style.display = 'block';
}

async function qrDosyaYukleVeOlustur() {
  if (!_qrSeciliDosya) { toast('⚠️ Lütfen bir PDF veya görsel seç!', true); return; }
  showLoading('Yükleniyor...');
  try {
    const path = `qr-dosyalar/${Date.now()}_${_qrSeciliDosya.name}`;
    const { error } = await sb.storage.from('kazi-dosyalar').upload(path, _qrSeciliDosya);
    hideLoading();
    if (error) { toast('⚠️ Yükleme başarısız: ' + error.message, true); return; }
    const { data } = sb.storage.from('kazi-dosyalar').getPublicUrl(path);
    const link = data.publicUrl;
    _qrSonLink = link;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(link)}`;
    document.getElementById('qrSonucImg').src = qrUrl;
    document.getElementById('qrSonucLink').textContent = _qrSeciliDosya.name;
    document.getElementById('qrSonucCard').style.display = 'block';
    document.getElementById('qrSonucCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
    toast('✅ Dosya yüklendi, QR kod oluşturuldu!');
  } catch (e) {
    hideLoading();
    toast('⚠️ Bir hata oluştu', true);
  }
}

function qrKodOlustur() {
  const input = document.getElementById('qrLinkInput');
  const deger = (input.value || '').trim();
  if (!deger) { toast('⚠️ Lütfen bir link veya metin gir!', true); return; }

  let link = deger;
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(deger) && !/^https?:\/\//i.test(deger)) {
    link = 'https://' + deger;
  }
  _qrSonLink = link;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(link)}`;
  document.getElementById('qrSonucImg').src = qrUrl;
  document.getElementById('qrSonucLink').textContent = link;
  document.getElementById('qrSonucCard').style.display = 'block';
  document.getElementById('qrSonucCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
  toast('✅ QR kod oluşturuldu!');
}

async function qrKodIndir() {
  if (!_qrSonLink) return;
  try {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(_qrSonLink)}`;
    const resp = await fetch(qrUrl);
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-kod_${new Date().toISOString().split('T')[0]}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('📥 QR kod indirildi!');
  } catch (e) {
    toast('⚠️ İndirme başarısız', true);
  }
}

function qrKodPaylas() {
  if (!_qrSonLink) return;
  paylas(_qrSonLink, 'QR Kod Linki');
}
