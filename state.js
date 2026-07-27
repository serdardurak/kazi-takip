// ─── DATA ────────────────────────────────────────────────
let data = { projects: [], deletedProjects: [], teams: [], denetimciler: [], malzemeTurleri: [], giderKategorileri: [], activeProjectId: localStorage.getItem('aktifProje') || null };

let editingId = null;

let tempMalzemeler = [];

let tempHataTurler = [];

let hataGiderilmeTemp = {};

let tempOnaylar = [];

let tempOnayGorseller = [];

let _onayDuzenleIdx = null;

let _sahaOnaylariDesteklenmiyor = false;

let _denetimciDesteklenmiyor = false;

let _denetimSecimleriDesteklenmiyor = false;

let formDenetimSecimleri = [];

 // [{id, vakit}] - forma o an eklenmiş denetimciler
const VAKIT_ETIKETLERI = { sabah: '🌅 Sabah', ogle: '🌇 Öğleden Sonra', tumgun: '' };

let _editOverlayAcik = false;

let _editOverlayOrijinalYer = null;

 // { parent, next } - form elemanının normal yeri
let tempHatalar = [];

let tempFotograflar = [];

let tempKmz = null;

let tempHataGorseller = [];

// ─── SİLME ONAY ──────────────────────────────────────────
let _silCallback = null;

// ─── İŞLEM BİLDİRİM ─────────────────────────────────────
let _oncekiSayfa = 'dashboard';

// ─── SAYFA GEÇMİŞİ (İLERİ/GERİ) ─────────────────────────
let _navHistory = ['dashboard'];

let _navIndex = 0;

let _duzenlemeProjId = null;

let _bekleyenRaporMetni = '';

let _giderRaporAy = null;

// ─── QR KOD ──────────────────────────────────────────────
let _qrSonLink = '';

let _qrSeciliDosya = null;

// ─── GRAFİKLER ───────────────────────────────────────────
let _aktifGrafTab = 'gunluk';

// ─── GİDER KATEGORİLERİ ─────────────────────────────────────
// Tablo henüz oluşturulmadıysa (veya boşsa) bu varsayılan liste kullanılır.
const GIDER_KATEGORI_VARSAYILAN = ['Yemek', 'Yakıt', 'HGS', 'Market', 'Kırtasiye', 'Malzeme', 'İşçilik', 'Ulaşım', 'Konaklama'];

let _giderKategoriYukleniyor = null;

let _entryPage = 0;

const ENTRY_PAGE_SIZE = 30;

let _entryHasMore = false;

// Aktif projeyi Supabase'den yenile
let _yenileTimeout = null;

let _hataduzenleIdx = null;

let tempFotolar = [];

let editingMalzemeIndex = null;

// ─── AYLIK RAPOR (Tüm projeler, seçilen aya göre) ─────────
let _raporTab = 'proje';

let _aylikRaporAy = null;

let _aylikRaporPeriyot = 'ay';

 // 'ay' | 'tum' | 'aralik'
let _aylikRaporAralik = null;

// ─── GİDERLER ────────────────────────────────────────────
let giderler = [];

let editingGiderId = null;
