function grafTab(tip) {
  _aktifGrafTab = tip;
  ['gunluk','aylik','proje'].forEach(t => {
    const btn = document.getElementById('grafTab' + t.charAt(0).toUpperCase() + t.slice(1));
    if (btn) {
      if (t === tip) {
        btn.style.background = 'var(--yellow)'; btn.style.color = '#0f172a'; btn.style.borderColor = 'var(--yellow)';
      } else {
        btn.style.background = 'none'; btn.style.color = 'var(--muted)'; btn.style.borderColor = 'var(--border)';
      }
    }
  });
  grafikCiz();
}

function grafikCiz() {
  const canvas = document.getElementById('grafikCanvas');
  const legend = document.getElementById('grafikLegend');
  if (!canvas) return;
  const proj = activeProject();

  // Canvas boyut
  const W = canvas.offsetWidth || 320;
  const H = 200;
  canvas.width = W * window.devicePixelRatio;
  canvas.height = H * window.devicePixelRatio;
  canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  ctx.clearRect(0, 0, W, H);

  if (_aktifGrafTab === 'gunluk') {
    if (!proj || !proj.entries.length) { _grafBosBilgi(ctx, W, H, 'Kayıt yok'); return; }
    const sorted = [...proj.entries].sort((a,b) => a.tarih.localeCompare(b.tarih)).slice(-30);
    const max = Math.max(...sorted.map(e => e.kaziMetre));
    const pad = { top:30, bot:40, left:10, right:10 };
    const bw = (W - pad.left - pad.right) / sorted.length - 2;
    ctx.fillStyle = 'rgba(245,158,11,0.15)';
    sorted.forEach((e, i) => {
      const bh = ((e.kaziMetre / max) * (H - pad.top - pad.bot)) || 2;
      const x = pad.left + i * ((W - pad.left - pad.right) / sorted.length);
      const y = H - pad.bot - bh;
      ctx.fillStyle = 'rgba(245,158,11,0.7)';
      ctx.beginPath();
      ctx.roundRect(x, y, Math.max(bw, 2), bh, 3);
      ctx.fill();
      // Metraj etiketi
      if (bw > 14) {
        ctx.fillStyle = '#f59e0b';
        ctx.font = `bold ${Math.max(8, Math.min(11, bw-2))}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(Math.round(e.kaziMetre), x + bw/2, y - 4);
      }
    });
    // X ekseni - tarihler
    ctx.fillStyle = '#64748b';
    ctx.font = `${Math.max(8, 10 - sorted.length/5)}px sans-serif`;
    ctx.textAlign = 'center';
    sorted.forEach((e, i) => {
      if (sorted.length <= 10 || i % Math.ceil(sorted.length/8) === 0) {
        const x = pad.left + i * ((W - pad.left - pad.right) / sorted.length) + bw/2;
        const d = new Date(e.tarih);
        ctx.fillText(`${d.getDate()}/${d.getMonth()+1}`, x, H - pad.bot + 14);
      }
    });
    if (legend) legend.textContent = `Son ${sorted.length} günlük kazı (m)`;

  } else if (_aktifGrafTab === 'aylik') {
    if (!proj || !proj.entries.length) { _grafBosBilgi(ctx, W, H, 'Kayıt yok'); return; }
    const ayMap = {};
    proj.entries.forEach(e => {
      const ay = e.tarih.substring(0,7);
      ayMap[ay] = (ayMap[ay]||0) + e.kaziMetre;
    });
    const aylar = Object.entries(ayMap).sort((a,b) => a[0].localeCompare(b[0]));
    const max = Math.max(...aylar.map(a => a[1]));
    const pad = { top:20, bot:40, left:10, right:10 };
    const bw = (W - pad.left - pad.right) / aylar.length - 4;
    ctx.textAlign = 'center';
    aylar.forEach(([ay, toplam], i) => {
      const bh = ((toplam / max) * (H - pad.top - pad.bot)) || 2;
      const x = pad.left + i * ((W - pad.left - pad.right) / aylar.length);
      const y = H - pad.bot - bh;
      ctx.fillStyle = 'rgba(59,130,246,0.7)';
      ctx.beginPath();
      ctx.roundRect(x, y, Math.max(bw,2), bh, 3);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px sans-serif';
      const [yil,m] = ay.split('-');
      ctx.fillText(`${m}/${yil.slice(2)}`, x + bw/2, H - pad.bot + 14);
      ctx.fillStyle = '#f59e0b';
      ctx.font = '9px sans-serif';
      ctx.fillText(Math.round(toplam)+'m', x + bw/2, y - 4);
    });
    if (legend) legend.textContent = 'Aylık toplam kazı (m)';

  } else if (_aktifGrafTab === 'proje') {
    const projler = data.projects.filter(p => p.entries && p.entries.length > 0);
    if (!projler.length) { _grafBosBilgi(ctx, W, H, 'Proje verisi yok'); return; }
    const toplamlar = projler.map(p => p.entries.reduce((s,e) => s+e.kaziMetre, 0));
    const genelToplam = toplamlar.reduce((s,t) => s+t, 0);
    const renkler = ['#f59e0b','#3b82f6','#10b981','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316'];
    const cx = W/2, cy = H/2 - 10, r = Math.min(W,H)/2 - 30;
    let aci = -Math.PI/2;
    toplamlar.forEach((t, i) => {
      const dilim = (t / genelToplam) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, aci, aci + dilim);
      ctx.closePath();
      ctx.fillStyle = renkler[i % renkler.length];
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();
      aci += dilim;
    });
    if (legend) legend.innerHTML = projler.map((p,i) =>
      `<span style="color:${renkler[i%renkler.length]}">■</span> ${p.name}: ${Math.round(toplamlar[i]).toLocaleString('tr-TR')} m`
    ).join('&nbsp;&nbsp;');
  }
}

function _grafBosBilgi(ctx, W, H, mesaj) {
  ctx.fillStyle = '#64748b';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(mesaj, W/2, H/2);
}
