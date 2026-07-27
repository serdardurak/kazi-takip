 // {yil, ay} formatında
function giderRaporOnizle() {
  const filtreAy = document.getElementById('gAyFiltre')?.value || '';
  if (filtreAy) {
    const [yil, ay] = filtreAy.split('-').map(Number);
    _giderRaporAy = { yil, ay };
  } else {
    const simdi = new Date();
    _giderRaporAy = { yil: simdi.getFullYear(), ay: simdi.getMonth() + 1 };
  }
  _giderRaporGoster();
}

function giderRaporAyDegis(yon) {
  if (!_giderRaporAy || _giderRaporAy === 'tum' || _giderRaporAy?.ozel) return;
  let { yil, ay } = _giderRaporAy;
  ay += yon;
  if (ay > 12) { ay = 1; yil++; }
  if (ay < 1) { ay = 12; yil--; }
  _giderRaporAy = { yil, ay };
  _giderRaporGoster();
}

function _ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function giderOzelTarihAc() {
  const form = document.getElementById('giderOzelTarihForm');
  if (!form) return;
  const acik = form.style.display !== 'none';
  if (acik) { form.style.display = 'none'; return; }
  // Varsayılan değerler
  if (_giderRaporAy === 'tum' || _giderRaporAy?.ozel) {
    const ilk = [...giderler].sort((a,b)=>a.tarih.localeCompare(b.tarih))[0];
    const son = [...giderler].sort((a,b)=>b.tarih.localeCompare(a.tarih))[0];
    document.getElementById('giderOzelBas').value = _giderRaporAy?.bas || ilk?.tarih || new Date().toISOString().split('T')[0];
    document.getElementById('giderOzelBit').value = _giderRaporAy?.bit || son?.tarih || new Date().toISOString().split('T')[0];
  } else {
    const { yil, ay } = _giderRaporAy;
    let basVarsayilan = _ymd(new Date(yil, ay-1, 1));
    const bitVarsayilan = _ymd(new Date(yil, ay, 0));
    if (giderler.length > 0) {
      const ilkKayit = [...giderler].sort((a,b) => a.tarih.localeCompare(b.tarih))[0].tarih;
      if (ilkKayit > basVarsayilan && ilkKayit <= bitVarsayilan) basVarsayilan = ilkKayit;
    }
    document.getElementById('giderOzelBas').value = basVarsayilan;
    document.getElementById('giderOzelBit').value = bitVarsayilan;
  }
  form.style.display = 'block';
}

function giderOzelTarihUygula() {
  const bas = document.getElementById('giderOzelBas').value;
  const bit = document.getElementById('giderOzelBit').value;
  if (!bas || !bit || bas > bit) { toast('⚠️ Geçerli bir tarih aralığı seçin', true); return; }
  _giderRaporAy = { ozel: true, bas, bit };
  document.getElementById('giderOzelTarihForm').style.display = 'none';
  _giderRaporGoster();
}

function _giderRaporGoster() {
  let basStr, bitStr, ayAdi, ikon;

  if (_giderRaporAy === 'tum') {
    if (giderler.length > 0) {
      const tarihler = giderler.map(g => g.tarih).sort();
      basStr = tarihler[0];
      bitStr = tarihler[tarihler.length-1];
    } else {
      const bugun = new Date().toISOString().split('T')[0];
      basStr = bugun; bitStr = bugun;
    }
    ayAdi = 'Tüm Zamanlar';
    ikon = '📊';
  } else if (_giderRaporAy?.ozel) {
    basStr = _giderRaporAy.bas;
    bitStr = _giderRaporAy.bit;
    ayAdi = 'Özel Aralık';
    ikon = '📊';
  } else {
    const { yil, ay } = _giderRaporAy;
    const ayBas = new Date(yil, ay - 1, 1);
    const ayBit = new Date(yil, ay, 0);
    basStr = _ymd(ayBas);
    bitStr = _ymd(ayBit);
    if (giderler.length > 0) {
      const ilkKayit = [...giderler].sort((a,b) => a.tarih.localeCompare(b.tarih))[0].tarih;
      if (ilkKayit > basStr && ilkKayit <= bitStr) basStr = ilkKayit;
    }
    ayAdi = ayBas.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    ikon = '📅';
  }

  const donemGiderler = giderler.filter(g => g.tarih >= basStr && g.tarih <= bitStr);
  const toplam = donemGiderler.reduce((s, g) => s + parseFloat(g.tutar||0), 0);
  const katMap = {};
  donemGiderler.forEach(g => { katMap[g.kategori] = (katMap[g.kategori]||0) + parseFloat(g.tutar||0); });
  const katStr = Object.entries(katMap).sort((a,b) => b[1]-a[1])
    .map(([k,t]) => `${k}|${t.toLocaleString('tr-TR')} ₺`).join('\n');

  const katSatirlar = Object.entries(katMap).sort((a,b) => b[1]-a[1]);
  const katHTML = katSatirlar.map(([k,t]) => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
      <span style="font-size:13px">${k}</span>
      <span style="font-size:13px;font-weight:700;color:var(--yellow);white-space:nowrap;margin-left:12px">${t.toLocaleString('tr-TR')} ₺</span>
    </div>`).join('');

  // Tarih aralığı ve hafta sayısı (her durumda hesapla)
  const basD = new Date(basStr + 'T12:00:00');
  const bitD = new Date(bitStr + 'T12:00:00');
  const fmt = d => `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
  const tarihAralikStr = `${fmt(basD)} - ${fmt(bitD)}`;
  const gunSayisi = new Set(donemGiderler.map(g => g.tarih)).size;
  const haftaSayisi = (gunSayisi / 7).toFixed(1);
  const haftaStr = gunSayisi > 0 ? `${haftaSayisi} hafta (${gunSayisi} gün)` : '';

  const satirlar = katSatirlar.map(([k,t])=>`${k}: ${t.toLocaleString('tr-TR')} ₺`);
  const maxLen = Math.max(20, ...satirlar.map(s => s.length), `TOPLAM: ${toplam.toLocaleString('tr-TR')} ₺`.length);
  const cizgi = '─'.repeat(maxLen);
  const metin = `💸 GİDER RAPORU\n\n${ikon} ${ayAdi}${tarihAralikStr ? `\n📆 ${tarihAralikStr}` : ''}\n${cizgi}\n${satirlar.join('\n') || 'Kayıt yok'}\n${cizgi}\nTOPLAM: ${toplam.toLocaleString('tr-TR')} ₺`;

  const icerik = document.getElementById('raporOnizlemeIcerik');
  if (icerik) {
    icerik.style.fontFamily = 'inherit';
    icerik.style.whiteSpace = 'normal';
    icerik.innerHTML = `
      <div style="font-size:15px;font-weight:900;margin-bottom:8px">💸 GİDER RAPORU</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:2px">${ikon} ${ayAdi}</div>
      ${tarihAralikStr ? `<div style="font-size:11px;color:var(--muted);margin-bottom:8px">📆 ${tarihAralikStr}</div>` : '<div style="margin-bottom:8px"></div>'}
      ${katSatirlar.length > 0 ? katHTML : '<div style="color:var(--muted);text-align:center;padding:12px">Kayıt yok</div>'}
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;margin-top:2px;border-top:2px solid var(--border)">
        <span style="font-weight:900;font-size:13px">TOPLAM</span>
        <span style="font-weight:900;font-size:14px;color:var(--yellow)">${toplam.toLocaleString('tr-TR')} ₺</span>
      </div>`;
  }
  const label = document.getElementById('raporOnizlemeAyLabel');
  if (label) label.textContent = ayAdi;
  const nav = document.getElementById('raporOnizlemeAyNav');
  if (nav) nav.style.display = 'flex';
  const pdfBtn = document.getElementById('raporOnizlemePdfBtn');
  if (pdfBtn) pdfBtn.style.display = 'block';
  const isOzelVeTum = _giderRaporAy === 'tum' || _giderRaporAy?.ozel;
  document.querySelectorAll('#raporOnizlemeAyNav > div button').forEach(b => b.style.visibility = isOzelVeTum ? 'hidden' : 'visible');
  const modal = document.getElementById('raporOnizlemeModal');
  if (modal) modal.style.display = 'flex';

  // Paylaş butonuna bağla
  window._raporOnizlemeMevcutMetin = metin;
  window._giderRaporVeri = { ayAdi, ikon, basStr, bitStr, tarihAralikStr, haftaStr, donemGiderler, katSatirlar, toplam };
}

function giderRaporPaylas() {
  if (giderler.length === 0) { toast('⚠️ Gider kaydı yok', true); return; }
  giderRaporOnizle();
}

function loadGiderKategorileri() {
  // Aynı anda birden fazla çağrı gelirse (örn. açılışta iki farklı init akışı),
  // hepsi aynı tek isteği bekler — bu sayede tohumlama asla iki kez tetiklenmez.
  if (_giderKategoriYukleniyor) return _giderKategoriYukleniyor;
  _giderKategoriYukleniyor = _loadGiderKategorileriGercek().finally(() => { _giderKategoriYukleniyor = null; });
  return _giderKategoriYukleniyor;
}

async function _loadGiderKategorileriGercek() {
  try {
    const { data: katlar, error } = await sb.from('gider_kategorileri').select('*').order('ad', { ascending: true });
    if (error) { console.warn('Gider kategorileri yüklenemedi (tablo henüz yok olabilir):', error.message); renderGiderKategoriSelect(); return; }

    // Tablo var ama boş ve daha önce hiç tohumlanmamışsa, varsayılan kategorileri
    // bir kereye mahsus DB'ye ekle ki "Yönetim"den düzenlenebilir/silinebilir olsunlar.
    if ((katlar || []).length === 0 && !localStorage.getItem('giderKategoriTohumlandi')) {
      localStorage.setItem('giderKategoriTohumlandi', '1'); // önce kilitle ki paralel çağrı tekrar denemesin
      const { error: seedErr } = await sb.from('gider_kategorileri').insert(GIDER_KATEGORI_VARSAYILAN.map(ad => ({ ad })));
      if (!seedErr) {
        const { data: yeniKatlar } = await sb.from('gider_kategorileri').select('*').order('ad', { ascending: true });
        data.giderKategorileri = yeniKatlar || [];
        renderGiderKategoriSelect();
        renderGiderKategoriListesi();
        renderYonetimOzet();
        return;
      }
    }

    data.giderKategorileri = katlar || [];
    renderGiderKategoriSelect();
    renderGiderKategoriListesi();
    renderYonetimOzet();
  } catch (e) { console.warn('Gider kategorileri yüklenemedi'); renderGiderKategoriSelect(); }
}

function renderGiderKategoriSelect() {
  const sel = document.getElementById('gKategoriSelect');
  if (!sel) return;
  const secili = sel.value;
  const kaynak = (data.giderKategorileri && data.giderKategorileri.length > 0)
    ? data.giderKategorileri.map(k => k.ad)
    : GIDER_KATEGORI_VARSAYILAN;
  sel.innerHTML = '<option value="">Seçin...</option>'
    + kaynak.map(ad => `<option>${ad}</option>`).join('')
    + '<option>Diğer</option>';
  if (secili) sel.value = secili;
}

function giderKategoriYonetimAc() {
  const input = document.getElementById('giderKategoriAdInput');
  if (input) { input.value = ''; delete input.dataset.editingId; }
  const btn = document.querySelector('#giderKategoriYonetimModal button[onclick="giderKategoriEkle()"]');
  if (btn) { btn.textContent = '+'; btn.style.background = '#10b981'; }
  renderGiderKategoriListesi();
  document.getElementById('giderKategoriYonetimModal').style.display = 'flex';
}

function renderGiderKategoriListesi() {
  const el = document.getElementById('giderKategoriListesi');
  if (!el) return;
  if (!data.giderKategorileri || data.giderKategorileri.length === 0) {
    el.innerHTML = `<div style="font-size:12px;color:var(--muted);text-align:center;padding:8px 0">Henüz özel kategori eklenmedi. Varsayılan liste kullanılıyor: ${GIDER_KATEGORI_VARSAYILAN.join(', ')}.</div>`;
    return;
  }
  el.innerHTML = data.giderKategorileri.map(k => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:8px;margin-bottom:6px">
      <span style="font-size:13px;color:var(--text);font-weight:600">💸 ${k.ad}</span>
      <div style="display:flex;align-items:center;gap:4px">
        <button onclick="giderKategoriDuzenle('${k.id}')" style="background:none;border:none;color:var(--blue);font-size:14px;cursor:pointer;padding:2px 6px">✎</button>
        <button onclick="giderKategoriSil('${k.id}')" style="background:none;border:none;color:var(--red);font-size:16px;cursor:pointer;padding:2px 6px">×</button>
      </div>
    </div>`).join('');
}

async function giderKategoriDuzenle(id) {
  const k = data.giderKategorileri.find(x => x.id === id);
  if (!k) return;
  const input = document.getElementById('giderKategoriAdInput');
  const btn = document.querySelector('#giderKategoriYonetimModal button[onclick="giderKategoriEkle()"]');
  input.value = k.ad;
  input.focus();
  input.dataset.editingId = id;
  if (btn) { btn.textContent = '✓'; btn.style.background = '#10b981'; }
}

async function giderKategoriEkle() {
  const input = document.getElementById('giderKategoriAdInput');
  const ad = input?.value.trim();
  if (!ad) { toast('⚠️ Kategori adı girin', true); return; }
  const editingId = input.dataset.editingId;
  showLoading(editingId ? 'Güncelleniyor...' : 'Ekleniyor...');
  const { error } = editingId
    ? await sb.from('gider_kategorileri').update({ ad }).eq('id', editingId)
    : await sb.from('gider_kategorileri').insert({ ad });
  hideLoading();
  if (error) { toast('⚠️ ' + error.message + (error.message.includes('does not exist') ? '\n"gider_kategorileri" tablosu Supabase\'de oluşturulmamış olabilir.' : ''), true); return; }
  input.value = '';
  delete input.dataset.editingId;
  const btn = document.querySelector('#giderKategoriYonetimModal button[onclick="giderKategoriEkle()"]');
  if (btn) { btn.textContent = '+'; btn.style.background = '#10b981'; }
  toast(editingId ? '✅ Kategori güncellendi' : '✅ Kategori eklendi');
  await loadGiderKategorileri();
}

function giderKategoriSil(id) {
  const k = data.giderKategorileri.find(x => x.id === id);
  silOnayla(`"${k?.ad || 'Bu kategori'}" silinsin mi? Daha önce kaydedilmiş giderler etkilenmez.`, async () => {
    showLoading('Siliniyor...');
    const { error } = await sb.from('gider_kategorileri').delete().eq('id', id);
    hideLoading();
    if (error) { toast('⚠️ ' + error.message, true); return; }
    toast('🗑 Kategori silindi');
    await loadGiderKategorileri();
  });
}

function gKategoriDegis() {
  const v = document.getElementById('gKategoriSelect').value;
  document.getElementById('gKategoriOzelWrap').style.display = v === 'Diğer' ? 'block' : 'none';
}

async function loadGiderler() {
  showLoading('Giderler yükleniyor...');
  try {
    const { data: result, error } = await sb.from('giderler')
      .select('*')
      .order('tarih', { ascending: false });
    hideLoading();
    if (error) { toast('⚠️ Giderler yüklenemedi!', true); return; }
    giderler = result || [];
    renderAyFiltre();
    renderGiderList();
    renderGiderOzet();
  } catch(e) { hideLoading(); toast('⚠️ Bağlantı hatası!', true); }
}

function gOzetAyDegis(yon) {
  const sel = document.getElementById('gAyFiltre');
  if (!sel) return;
  let yil, ay;
  const mevcut = sel.value;
  if (mevcut && /^\d{4}-\d{2}$/.test(mevcut)) {
    [yil, ay] = mevcut.split('-').map(Number);
  } else {
    const simdi = new Date();
    yil = simdi.getFullYear(); ay = simdi.getMonth() + 1;
  }
  ay += yon;
  if (ay > 12) { ay = 1; yil++; }
  if (ay < 1) { ay = 12; yil--; }
  const ayStr = `${yil}-${String(ay).padStart(2, '0')}`;
  if (![...sel.options].some(o => o.value === ayStr)) {
    const opt = document.createElement('option');
    opt.value = ayStr;
    opt.textContent = new Date(yil, ay - 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    sel.appendChild(opt);
  }
  sel.value = ayStr;
  renderGiderList();
}

function renderAyFiltre() {
  const aylar = [...new Set(giderler.map(g => g.tarih.substring(0, 7)))].sort().reverse();
  const sel = document.getElementById('gAyFiltre');
  const cur = sel.value;
  sel.innerHTML = '<option value="">Tüm Zamanlar</option>';
  aylar.forEach(ay => {
    const [yil, mo] = ay.split('-');
    const label = new Date(yil, mo - 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    sel.innerHTML += `<option value="${ay}" ${ay === cur ? 'selected' : ''}>${label}</option>`;
  });
}

function renderGiderOzet() {
  const simdi = new Date();
  const ayStr = `${simdi.getFullYear()}-${String(simdi.getMonth() + 1).padStart(2, '0')}`;
  const buAy = giderler.filter(g => g.tarih.startsWith(ayStr));
  const toplamAy = buAy.reduce((s, g) => s + parseFloat(g.tutar), 0);
  const toplamTum = giderler.reduce((s, g) => s + parseFloat(g.tutar), 0);
  const buAyGunSayisi = new Set(buAy.map(g => g.tarih)).size;
  document.getElementById('gToplamAy').textContent = toplamAy.toLocaleString('tr-TR') + ' ₺';
  document.getElementById('gAdetAy').textContent = buAyGunSayisi;
  document.getElementById('gToplamTum').textContent = toplamTum.toLocaleString('tr-TR') + ' ₺';
  gTahminGuncelle(simdi, toplamAy);

  const ayFiltre = document.getElementById('gAyFiltre')?.value || '';
  if (!ayFiltre) {
    const cardTitle = document.querySelector('#giderOzetCard .card-title');
    if (cardTitle) {
      const ayAdi = simdi.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
      cardTitle.textContent = `📊 ${ayAdi} Özet`;
    }
  }
}

function gTahminGuncelle(simdi, toplamAy) {
  const wrap = document.getElementById('gTahminWrap');
  const el = document.getElementById('gTahminAySonu');
  const label = document.getElementById('gTahminLabel');
  if (!wrap || !el) return;
  const bugununGunu = simdi.getDate();
  const ayinToplamGunu = new Date(simdi.getFullYear(), simdi.getMonth() + 1, 0).getDate();
  if (toplamAy <= 0 || bugununGunu < 1) { wrap.style.display = 'none'; return; }
  const gunlukOrt = toplamAy / bugununGunu;
  const tahmin = gunlukOrt * ayinToplamGunu;
  wrap.style.display = 'flex';
  el.textContent = tahmin.toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' ₺';
  const ayAdi = simdi.toLocaleDateString('tr-TR', { month: 'long' });
  if (label) label.textContent = `${ayAdi} Sonu Tahmini (~${bugununGunu}/${ayinToplamGunu} gün)`;
}

function renderGiderList() {
  const ayFiltre = document.getElementById('gAyFiltre').value;
  const katFiltre = document.getElementById('gKatFiltre').value;
  let liste = [...giderler].sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
  if (ayFiltre) liste = liste.filter(g => g.tarih.startsWith(ayFiltre));
  if (katFiltre) liste = liste.filter(g => g.kategori === katFiltre);

  // Filtre aktifse özet kartını güncelle
  if (ayFiltre || katFiltre) {
    const filtreGunSayisi = new Set(liste.map(g => g.tarih)).size;
    const filtreToplam = liste.reduce((s, g) => s + parseFloat(g.tutar), 0);
    const gAdetEl = document.getElementById('gAdetAy');
    const gToplamAyEl = document.getElementById('gToplamAy');
    if (gAdetEl) gAdetEl.textContent = filtreGunSayisi;
    if (gToplamAyEl) gToplamAyEl.textContent = filtreToplam.toLocaleString('tr-TR') + ' ₺';
    const cardTitle = document.querySelector('#giderOzetCard .card-title');
    if (cardTitle) {
      if (ayFiltre) {
        const [yil, ay] = ayFiltre.split('-');
        const ayAdi = new Date(yil, ay - 1).toLocaleDateString('tr-TR', { month: 'long' });
        if (liste.length > 0) {
          const tarihler = liste.map(g => g.tarih).sort();
          const ilk = tarihler[0].split('-').reverse().join('.');
          const son = tarihler[tarihler.length - 1].split('-').reverse().join('.');
          cardTitle.innerHTML = `📊 ${ayAdi} / ${yil}<br><span style="font-size:11px;font-weight:500;color:var(--muted)">${ilk} ile ${son} arası</span>`;
        } else {
          cardTitle.innerHTML = `📊 ${ayAdi} / ${yil}<br><span style="font-size:11px;font-weight:500;color:var(--muted)">Kayıt yok</span>`;
        }
      } else {
        cardTitle.textContent = '📊 Filtre Özeti';
      }
    }
    // Sadece gerçek bugünkü ay seçiliyse tahmini göster, aksi halde gizle
    const simdiF = new Date();
    const buAyStrF = `${simdiF.getFullYear()}-${String(simdiF.getMonth()+1).padStart(2,'0')}`;
    if (ayFiltre === buAyStrF && !katFiltre) {
      gTahminGuncelle(simdiF, filtreToplam);
    } else {
      const wrap = document.getElementById('gTahminWrap');
      if (wrap) wrap.style.display = 'none';
    }
  } else {
    // Tüm zamanlar — her kartı doğru değerle doldur
    const simdi = new Date();
    const ayStr = `${simdi.getFullYear()}-${String(simdi.getMonth()+1).padStart(2,'0')}`;
    const buAyListe = giderler.filter(g => g.tarih.startsWith(ayStr));
    const buAyToplam = buAyListe.reduce((s, g) => s + parseFloat(g.tutar), 0);
    const buAyGunSayisi = new Set(buAyListe.map(g => g.tarih)).size;
    const tumToplam = giderler.reduce((s, g) => s + parseFloat(g.tutar), 0);

    const gAdetEl     = document.getElementById('gAdetAy');
    const gToplamAyEl = document.getElementById('gToplamAy');
    const gToplamTumEl= document.getElementById('gToplamTum');
    if (gToplamAyEl)  gToplamAyEl.textContent  = buAyToplam.toLocaleString('tr-TR') + ' ₺';
    if (gAdetEl)      gAdetEl.textContent       = buAyGunSayisi;
    if (gToplamTumEl) gToplamTumEl.textContent  = tumToplam.toLocaleString('tr-TR') + ' ₺';
    const cardTitle = document.querySelector('#giderOzetCard .card-title');
    if (cardTitle) {
      const ayAdi = simdi.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
      cardTitle.textContent = `📊 ${ayAdi} Özet`;
    }
    gTahminGuncelle(simdi, buAyToplam);
  }

  const container = document.getElementById('giderList');
  if (liste.length === 0) {
    container.innerHTML = `<div class="empty"><div class="empty-text">Kayıt bulunamadı.</div></div>`;
    return;
  }

  // Kategoriye göre toplam
  const katMap = {};
  liste.forEach(g => { katMap[g.kategori] = (katMap[g.kategori] || 0) + parseFloat(g.tutar); });
  const genelToplam = liste.reduce((s,g) => s + parseFloat(g.tutar), 0);

  // Tarihe göre grupla
  const tarihGruplari = {};
  liste.forEach(g => {
    if (!tarihGruplari[g.tarih]) tarihGruplari[g.tarih] = [];
    tarihGruplari[g.tarih].push(g);
  });

  const tarihGruplariHTML = Object.entries(tarihGruplari).map(([tarih, items]) => {
    const gunToplam = items.reduce((s, g) => s + parseFloat(g.tutar), 0);
    const gunId = 'gun_' + tarih.replace(/-/g, '');
    return `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;margin-bottom:8px;overflow:hidden">
        <!-- Tarih başlığı - tıklanabilir -->
        <div onclick="toggleGunDetay('${gunId}')" style="display:flex;align-items:center;padding:12px 14px;cursor:pointer;gap:8px">
          <div style="flex:1">
            <div style="font-size:14px;font-weight:700;color:var(--text)">📅 ${new Date(tarih).toLocaleDateString('tr-TR', {weekday:'short', day:'numeric', month:'long'})}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px">${items.length} işlem</div>
          </div>
          <div style="font-size:15px;font-weight:900;color:var(--yellow)">${gunToplam.toLocaleString('tr-TR')} ₺</div>
          <div id="${gunId}_tog" style="color:var(--muted);font-size:12px">▼</div>
        </div>
        <!-- Detay satırları -->
        <div id="${gunId}" style="display:none;border-top:1px solid var(--border)">
          ${items.map(g => `
            <div style="display:flex;align-items:center;padding:10px 14px;gap:8px;border-bottom:1px solid rgba(51,65,85,0.5)">
              <div style="font-size:20px">${giderIkon(g.kategori)}</div>
              <div style="flex:1">
                <div style="font-size:13px;font-weight:600;color:var(--text)">${g.kategori}</div>
                ${g.aciklama ? `<div style="font-size:11px;color:var(--muted)">${escapeHtml(g.aciklama)}</div>` : ''}
              </div>
              <div style="font-size:14px;font-weight:700;color:var(--yellow)">${parseFloat(g.tutar).toLocaleString('tr-TR')} ₺</div>
              <button onclick="editGider('${g.id}')" style="background:none;border:1px solid var(--blue);color:var(--blue);border-radius:6px;padding:5px 8px;font-size:12px;cursor:pointer">✏️</button>
              <button onclick="deleteGider('${g.id}')" style="background:none;border:1px solid var(--red);color:var(--red);border-radius:6px;padding:5px 8px;font-size:12px;cursor:pointer">🗑</button>
            </div>`).join('')}
        </div>
      </div>`;
  }).join('');

  container.innerHTML = `
    <div class="card" style="margin-bottom:10px">
      <div class="card-title">💸 Gider Özeti</div>
      ${Object.entries(katMap).sort((a,b) => b[1]-a[1]).map(([kat, top]) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border)">
          <span style="color:var(--text);font-size:13px">${giderIkon(kat)} ${kat}</span>
          <span style="color:var(--yellow);font-weight:700;font-size:13px">${top.toLocaleString('tr-TR')} ₺</span>
        </div>`).join('')}
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;margin-top:4px">
        <span style="color:var(--sub);font-size:13px;font-weight:700">TOPLAM</span>
        <span style="color:var(--yellow);font-weight:900;font-size:16px">${genelToplam.toLocaleString('tr-TR')} ₺</span>
      </div>
    </div>
    <div id="giderListesiDetay" style="display:none">
      <div class="section-title">TARİHE GÖRE (${liste.length})</div>
      ${tarihGruplariHTML}
    </div>`;
}

function toggleGiderListesi() {
  const detay = document.getElementById('giderListesiDetay');
  if (!detay) return;
  detay.style.display = detay.style.display !== 'none' ? 'none' : 'block';
}

function toggleGunDetay(gunId) {
  const el = document.getElementById(gunId);
  const tog = document.getElementById(gunId + '_tog');
  if (!el) return;
  const acik = el.style.display === 'none';
  el.style.display = acik ? 'block' : 'none';
  if (tog) tog.textContent = acik ? '▲' : '▼';
}

function giderIkon(kat) {
  const ikonlar = { 'Yemek': '🍽', 'Yakıt': '⛽', 'HGS': '🛣', 'Market': '🛒', 'Kırtasiye': '📎', 'Malzeme': '🧱', 'İşçilik': '👷', 'Ulaşım': '🚗', 'Konaklama': '🏨' };
  return ikonlar[kat] || '💸';
}

async function saveGider() {
  const tarih = document.getElementById('gTarih').value;
  const katSec = document.getElementById('gKategoriSelect').value;
  const kategori = katSec === 'Diğer' ? (document.getElementById('gKategoriOzel').value || 'Diğer') : katSec;
  const aciklama = document.getElementById('gAciklama').value.trim();
  const tutar = parseFloat(document.getElementById('gTutar').value);
  if (!tarih || !kategori || isNaN(tutar)) { islemBildir('Tarih, kategori ve tutar zorunlu!', null, true); return; }

  const guncelleniyor = !!editingGiderId;
  showLoading(guncelleniyor ? 'Güncelleniyor...' : 'Kaydediliyor...');
  try {

  if (guncelleniyor) {
    const { error } = await sb.from('giderler').update({ tarih, kategori, aciklama, tutar }).eq('id', editingGiderId);
    hideLoading();
    if (error) { islemBildir('Güncellenemedi: ' + error.message, null, true); return; }
    const idx = giderler.findIndex(g => g.id === editingGiderId);
    if (idx !== -1) giderler[idx] = { ...giderler[idx], tarih, kategori, aciklama, tutar };
  } else {
    const { data: inserted, error } = await sb.from('giderler').insert({ tarih, kategori, aciklama, tutar }).select().single();
    hideLoading();
    if (error) { islemBildir('Kaydedilemedi: ' + error.message, null, true); return; }
    giderler.unshift(inserted);
  }

  editingGiderId = null;
  resetGiderForm();
  renderAyFiltre();
  renderGiderOzet();
  renderGiderList();
  islemBildir(guncelleniyor ? 'Gider güncellendi!' : 'Gider eklendi!', 'giderler');
  } catch(err) { hideLoading(); islemBildir('Kaydedilemedi!', null, true); }
}

function editGider(id) {
  const g = giderler.find(x => x.id === id);
  if (!g) return;
  editingGiderId = id;
  document.getElementById('gTarih').value = g.tarih;
  if (typeof renderGiderKategoriSelect === 'function') renderGiderKategoriSelect();
  const katSel = document.getElementById('gKategoriSelect');
  const katVarMi = Array.from(katSel.options).some(o => o.value === g.kategori);
  if (katVarMi) {
    katSel.value = g.kategori;
    document.getElementById('gKategoriOzelWrap').style.display = 'none';
  } else {
    katSel.value = 'Diğer';
    document.getElementById('gKategoriOzelWrap').style.display = 'block';
    document.getElementById('gKategoriOzel').value = g.kategori || '';
  }
  document.getElementById('gAciklama').value = g.aciklama || '';
  document.getElementById('gTutar').value = g.tutar;
  document.getElementById('gSaveBtn').textContent = '✅ Güncelle';
  document.getElementById('gCancelBtn').style.display = 'block';
  document.getElementById('giderFormBaslik').textContent = '✏️ Gider Düzenle';
  showView('gider-ekle');
}

function cancelGiderEdit() {
  editingGiderId = null;
  resetGiderForm();
  showView('giderler');
}

function resetGiderForm() {
  document.getElementById('gTarih').value = new Date().toISOString().split('T')[0];
  if (typeof renderGiderKategoriSelect === 'function') renderGiderKategoriSelect();
  document.getElementById('gKategoriSelect').value = '';
  document.getElementById('gAciklama').value = '';
  document.getElementById('gTutar').value = '';
  document.getElementById('gKategoriOzelWrap').style.display = 'none';
  document.getElementById('gSaveBtn').textContent = '💾 Gideri Kaydet';
  document.getElementById('gCancelBtn').style.display = 'none';
}

async function deleteGider(id) {
  silOnayla('Bu gideri silmek istediğine emin misin?', async () => {
    showLoading('Siliniyor...');
    const { error } = await sb.from('giderler').delete().eq('id', id);
    hideLoading();
    if (error) { islemBildir('Silinemedi: ' + error.message, null, true); return; }
    giderler = giderler.filter(g => g.id !== id);
    renderGiderList();
    renderGiderOzet();
    renderAyFiltre();
    islemBildir('Gider silindi.', 'giderler');
  });
}
