const defaultWorks = [
  { id: 'inner-weather', title: 'Inner Weather', type: 'Fine Art Print', category: 'print', price: '₺1.850', color: '#8d82d8', image: 'assets/inner-weather.jpg', year: '2026', size: '30 × 40 cm', edition: '30', description: 'İç dünyamızın sessizce değişen iklimlerine dair katmanlı bir anlatı.' },
  { id: 'sundown-club', title: 'Sundown Club', type: 'Limited Edition / 30', category: 'print', price: '₺2.400', color: '#d7a0a1', image: 'assets/sundown-club.jpg', year: '2026', size: '40 × 50 cm', edition: '30', description: 'Günün son ışığına, dostluğa ve hatırlamak istediğimiz yaz akşamlarına.' },
  { id: 'blue-hour', title: 'Blue Hour', type: 'Original Digital', category: 'original', price: '₺3.200', color: '#8cc7c1', image: 'assets/blue-hour.jpg', year: '2026', size: '50 × 70 cm', edition: '1 / 1', description: 'Gece başlamadan hemen önceki o kısa, mavi ve sonsuz aralık.' },
  { id: 'soft-rebel', title: 'Soft Rebel', type: 'Fine Art Print', category: 'print', price: '₺1.950', color: '#e5c06f', image: 'assets/soft-rebel.jpg', year: '2025', size: '30 × 40 cm', edition: '40', description: 'Yumuşaklığın da başlı başına bir direniş olduğuna dair.' },
  { id: 'memory-garden', title: 'Memory Garden', type: 'Original Digital', category: 'original', price: '₺3.600', color: '#a8cf9d', image: 'assets/memory-garden.jpg', year: '2025', size: '50 × 70 cm', edition: '1 / 1', description: 'Çocukluğun renkleriyle büyüyen, kimsenin bilmediği bir bahçe.' },
  { id: 'other-side', title: 'The Other Side', type: 'Limited Edition / 20', category: 'print', price: '₺2.750', color: '#e68170', image: 'assets/other-side.jpg', year: '2025', size: '40 × 50 cm', edition: '20', description: 'Bir kararın hemen öncesinde duran iki ayrı olasılık.' }
];

const keys = { works: 'lilyum-design-works', legacy: 'ecren-isik-works', olderLegacy: 'selin-kara-works', favorites: 'lilyum-design-guest-favorites', briefs: 'lilyum-design-briefs', settings: 'lilyum-design-ai-settings' };
const parseStore = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const legacyWorks = parseStore(keys.legacy, parseStore(keys.olderLegacy, null));
let works = parseStore(keys.works, legacyWorks || defaultWorks).map((work, index) => {
  const fallback = defaultWorks[index % defaultWorks.length];
  return { ...fallback, ...work, image: work.image || fallback.image, id: work.id || `work-${Date.now()}-${index}`, category: work.category || (index % 2 ? 'original' : 'print') };
});
let favorites = parseStore(keys.favorites, []);
let briefs = parseStore(keys.briefs, []);
let aiSettings = parseStore(keys.settings, { endpoint: '', assistant: 'Lilyum AI' });
let activeFilter = 'all';
let railIndex = 0;
let selectedType = '';
let selectedMood = '';
let lastAnalysis = null;

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const escapeHTML = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const saveWorks = () => {
  try { localStorage.setItem(keys.works, JSON.stringify(works)); return true; }
  catch { showToast('Tarayıcı depolama alanı doldu. Daha küçük bir görsel dene.'); return false; }
};
const saveFavorites = () => localStorage.setItem(keys.favorites, JSON.stringify(favorites));
const saveBriefs = () => localStorage.setItem(keys.briefs, JSON.stringify(briefs));

function artMarkup(work, index, className = '', loading = 'lazy') {
  const priority = loading === 'eager' ? ' fetchpriority="high"' : '';
  return work.image ? `<img src="${work.image}" alt="${escapeHTML(work.title)}" class="${className}" loading="${loading}" decoding="async"${priority}>` : `<div class="generated-art variant-${index % 4}" style="background-color:${escapeHTML(work.color)}" role="img" aria-label="${escapeHTML(work.title)} için demo görsel alanı"><span></span><small class="demo-art-label">DEMO VISUAL</small></div>`;
}

function optimizeArtworkUpload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('image'));
      image.onload = () => {
        const maxEdge = 1600;
        const ratio = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
        const context = canvas.getContext('2d');
        context.fillStyle = '#f4f1e9';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', .84));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderStand() {
  $('#standRail').innerHTML = works.slice(0, 6).map((work, index) => `<article class="stand-card"><div class="stand-art">${artMarkup(work, index)}<button class="fav-btn ${favorites.includes(work.id) ? 'active' : ''}" data-favorite="${work.id}" aria-label="Favoriye ekle">${favorites.includes(work.id) ? '♥' : '♡'}</button></div><div class="stand-info"><div><b>${escapeHTML(work.title)}</b><span>${escapeHTML(work.type)}</span></div><b>${escapeHTML(work.price)}</b></div></article>`).join('');
  updateRail();
}

function renderWorks() {
  const filtered = activeFilter === 'all' ? works : works.filter(work => work.category === activeFilter);
  $('#worksGrid').innerHTML = filtered.map((work, index) => `<article class="work-card reveal visible"><div class="work-art">${artMarkup(work, index)}<span class="work-tag">${work.category === 'original' ? 'ORIGINAL' : 'LIMITED PRINT'}</span><button class="fav-btn ${favorites.includes(work.id) ? 'active' : ''}" data-favorite="${work.id}" aria-label="Favoriye ekle">${favorites.includes(work.id) ? '♥' : '♡'}</button><button class="open-work" data-work="${work.id}" aria-label="${escapeHTML(work.title)} eserini incele"></button></div><div class="work-info"><h3>${escapeHTML(work.title)}</h3><strong>${escapeHTML(work.price)}</strong><p>${escapeHTML(work.type)}</p></div></article>`).join('');
}

function renderAdmin() {
  $('#totalWorks').textContent = works.length;
  $('#totalFavorites').textContent = favorites.length;
  $('#totalBriefs').textContent = briefs.length;
  $('#adminList').innerHTML = works.map((work, index) => `<div class="admin-row"><div class="admin-thumb">${artMarkup(work, index)}</div><input data-index="${index}" data-field="title" value="${escapeHTML(work.title)}" aria-label="Eser adı"><input data-index="${index}" data-field="type" value="${escapeHTML(work.type)}" aria-label="Eser türü"><input data-index="${index}" data-field="price" value="${escapeHTML(work.price)}" aria-label="Eser fiyatı"><label class="upload-label">GÖRSEL YÜKLE<input type="file" accept="image/*" data-upload="${index}"></label><button class="delete-work" data-delete="${index}" aria-label="Eseri sil">×</button></div>`).join('');
  $('#aiEndpoint').value = aiSettings.endpoint || '';
  $('#assistantName').value = aiSettings.assistant || 'Lilyum AI';
  updateAIStatus();
}

function renderUserPanel() {
  $('#favoriteCount').textContent = favorites.length;
  $('#favoriteTabCount').textContent = favorites.length;
  $('#projectCount').textContent = briefs.length;
  const favoriteWorks = favorites.map(id => works.find(work => work.id === id)).filter(Boolean);
  $('#favoritesList').innerHTML = favoriteWorks.length ? favoriteWorks.map((work, index) => { const watch = window.LilyumAccount?.getPriceWatch(work.id, work.price); return `<article class="user-item"><div class="user-thumb">${artMarkup(work, index)}</div><div><h4>${escapeHTML(work.title)}</h4><p>${escapeHTML(work.price)} · ${escapeHTML(work.type)}</p>${watch ? `<span class="price-watch ${watch.changed ? 'changed' : ''}">${escapeHTML(watch.text)}</span>` : ''}</div><button class="remove-fav" data-favorite="${work.id}" aria-label="Favoriden çıkar">×</button></article>`; }).join('') : '<i>♡</i><h4>Henüz bir favorin yok.</h4><p>Kalbine dokunan eserlerdeki kalp ikonuna dokun. Fiyat değiştiğinde burada göreceksin.</p>';
  $('#projectsList').innerHTML = briefs.length ? briefs.slice().reverse().map(brief => `<article class="brief-item"><span>${escapeHTML(brief.type || 'ÖZEL PROJE')} · ${escapeHTML(brief.date)}</span><h4>${escapeHTML(brief.title)}</h4><p>${escapeHTML(brief.price)} · ${escapeHTML(brief.duration)}</p></article>`).join('') : '<i>✦</i><h4>İlk fikrini bekliyoruz.</h4><p>AI Stüdyo’da bir brief oluşturduğunda burada görünecek.</p>';
}

function renderAll() { renderStand(); renderWorks(); renderAdmin(); renderUserPanel(); window.renderFeatureLayers?.(); }

window.lilyumSetFavorites = ids => { favorites = Array.isArray(ids) ? [...ids] : []; renderAll(); };
window.lilyumSetWorks = nextWorks => { if (!Array.isArray(nextWorks) || !nextWorks.length) return; works = nextWorks; saveWorks(); renderAll(); };

async function toggleFavorite(id) {
  const work = works.find(item => item.id === id);
  if (!work) return;
  if (!window.LilyumAccount?.isSignedIn()) { window.LilyumAccount?.openAuth('Favori eklemek için koleksiyon hesabına giriş yap.'); return; }
  try {
    const next = await window.LilyumAccount.toggleFavorite(id, work.price);
    if (!next) return;
    favorites = next;
    saveFavorites(); renderAll(); showToast(favorites.includes(id) ? 'Eser favorilerine eklendi ve fiyat takibi açıldı.' : 'Eser favorilerinden çıkarıldı.');
  } catch { showToast('Favori şu anda güncellenemedi. Lütfen tekrar dene.'); }
}

function updateRail() {
  const card = $('#standRail .stand-card');
  if (!card) return;
  const maxIndex = Math.max(0, works.slice(0, 6).length - (innerWidth < 640 ? 1 : innerWidth < 960 ? 2 : 3));
  railIndex = Math.min(railIndex, maxIndex);
  const step = card.getBoundingClientRect().width + 25;
  $('#standRail').style.transform = `translateX(-${railIndex * step}px)`;
  $('#railProgress').style.width = `${Math.max(18, ((railIndex + 1) / (maxIndex + 1)) * 100)}%`;
}

function openWork(id) {
  const work = works.find(item => item.id === id); if (!work) return;
  const index = works.indexOf(work);
  const sizes = work.category === 'original' ? [work.size || '50 × 70 cm'] : [...new Set([work.size || '30 × 40 cm', '50 × 70 cm'])];
  $('#workDetail').innerHTML = `<div class="detail-art">${artMarkup(work, index, '', 'eager')}</div><div class="detail-info"><p class="index">LILYUM DESIGN / ${work.category === 'original' ? 'ORIGINAL' : 'LIMITED PRINT'}</p><h2>${escapeHTML(work.title)}</h2><p>${escapeHTML(work.description)}</p><div class="detail-story"><span>${escapeHTML(work.year || '2026')} / STORY NOTE</span><p>Renk, ritim ve katmanlar eserin ana duygusunu taşıyacak biçimde kuruldu. Gerçek eskiz ve süreç görselleri yüklendiğinde bu hikâye alanı esere özel güncellenecek.</p></div><strong class="detail-price">${escapeHTML(work.price)}</strong><div class="product-options"><label><span>BOYUT</span><select id="workSize">${sizes.map(size => `<option>${escapeHTML(size)}</option>`).join('')}</select></label><label><span>SUNUM</span><select id="workFrame"><option>Çerçevesiz</option><option>Çerçeveli — teklif iste</option></select></label></div><div class="detail-meta"><div><span>FORMAT</span><b>${escapeHTML(work.type)}</b></div><div><span>TESLİMAT</span><b>3–5 iş günü</b></div><div><span>SERTİFİKA</span><b>İmzalı</b></div><div><span>EDITION</span><b>${escapeHTML(work.edition || (work.category === 'original' ? '1 / 1' : 'Sınırlı'))}</b></div></div><div class="detail-actions"><button class="request-work" data-add-cart="${work.id}">Sepete ekle</button><button class="favorite-work" data-favorite="${work.id}">${favorites.includes(work.id) ? '♥ Favorilerimde' : '♡ Favoriye ekle'}</button></div><button class="commission-link" data-request="${work.id}">Bu eserden ilham alan özel bir çalışma iste <span class="line-arrow" aria-hidden="true"></span></button></div>`;
  $('#workDialog').setAttribute('aria-label', `${work.title} eser detayı`);
  $('#workDialog').scrollTop = 0;
  $('#workDialog').showModal();
}

function openPanel(id) { const panel = document.getElementById(id); panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false'); setPageLock(true); }
function closePanel(id) { const panel = document.getElementById(id); panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true'); if (!document.querySelector('.side-panel.open, .cart-drawer.open, .mobile-menu.open, .desktop-menu.open')) setPageLock(false); }
function showToast(message) { $('#toast p').textContent = message; $('#toast').classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => $('#toast').classList.remove('show'), 2600); }
function goToAI(prefill = '') { $('#workDialog').open && $('#workDialog').close(); document.querySelector('#ai-studio').scrollIntoView({ behavior: 'smooth' }); if (prefill) { $('#ideaInput').value = prefill; updateBriefMeter(); } setTimeout(() => $('#ideaInput').focus(), 700); }

const hasAny = (text, words) => words.some(word => text.includes(word));
const formatRange = (low, high) => `${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(low)} – ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(high)}`;
const visualFeastRequested = value => String(value || '').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i').includes('saitcani sikmisler');

function launchVisualFeast() {
  document.querySelector('.visual-feast-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.className = 'visual-feast-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  const particles = Array.from({ length: 24 }, (_, index) => `<i style="--i:${index};--x:${(index * 47) % 101}%;--y:${(index * 73) % 97}%;--delay:${(index % 8) * -.11}s"></i>`).join('');
  overlay.innerHTML = `<div class="visual-feast-aura"></div><svg class="visual-feast-lily" viewBox="0 0 64 64"><use href="#lilyumBloom"></use></svg><div class="visual-feast-title"><span>SAİTCAN MODE / UNLOCKED</span><strong>GÖRSEL<br><em>ŞÖLEN</em></strong></div><div class="visual-feast-particles">${particles}</div>`;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 4300);
}

function localAnalysis(idea) {
  const type = selectedType || 'Kişisel eser';
  const mood = selectedMood || 'Özgün';
  const text = idea.toLocaleLowerCase('tr-TR');
  const visualFeast = visualFeastRequested(idea);
  const configs = {
    'Portre': { range: [4500, 7500], duration: '2–3 hafta', deliverable: 'Portre + 2 eskiz yönü' },
    'Albüm kapağı': { range: [7500, 12000], duration: '3–4 hafta', deliverable: 'Kapak + platform uyarlamaları' },
    'Marka işi': { range: [12000, 24000], duration: '4–6 hafta', deliverable: 'Ana görsel + kullanım seti' },
    'Kişisel eser': { range: [5000, 9000], duration: '2–4 hafta', deliverable: 'Özel eser + baskı dosyası' }
  };
  const palettes = {
    'Rüya gibi': ['#8d82d8','#f4b6c2','#d9ff43','#252642'],
    'Cesur': ['#c84f39','#d9ff43','#111111','#7b61ff'],
    'Minimal': ['#eeeae0','#1c1c1c','#9cb9b5','#d7c8aa'],
    'Nostaljik': ['#b96f58','#d9b86a','#405e64','#efe4d0'],
    'Özgün': ['#7b61ff','#c6533d','#d9ff43','#151515']
  };

  let palette = [...(palettes[mood] || palettes.Özgün)];
  if (hasAny(text, ['mavi', 'deniz', 'gökyüz'])) palette = ['#173b53','#6fa9b6','#d7c9a7','#792f43'];
  else if (hasAny(text, ['yeşil', 'orman', 'bahçe', 'doğa'])) palette = ['#173f35','#86a67b','#d8bd7c','#efe5d3'];
  else if (hasAny(text, ['kırmızı', 'tutku', 'ateş'])) palette = ['#8f2f28','#d85d3f','#d7b66f','#1a1718'];

  const isGift = hasAny(text, ['hediye', 'doğum günü', 'yıldönümü', 'yıl dönümü']);
  const isMemory = hasAny(text, ['anı', 'çocukluk', 'hatıra', 'geçmiş', 'özlem']);
  const isNature = hasAny(text, ['bahçe', 'orman', 'çiçek', 'doğa', 'deniz', 'gökyüz']);
  const isNight = hasAny(text, ['gece', 'ay', 'yıldız', 'karanlık']);
  const isMusic = hasAny(text, ['müzik', 'şarkı', 'albüm', 'ses']) || type === 'Albüm kapağı';
  const isRelationship = hasAny(text, ['kardeş', 'anne', 'baba', 'aile', 'sevgili', 'arkadaş', 'ikimiz', 'biz']);
  const complexityPoints = (idea.length > 170 ? 2 : idea.length > 80 ? 1 : 0) + (window.ecrenReferenceData ? 1 : 0) + ([isMemory,isNature,isNight,isMusic,isRelationship].filter(Boolean).length > 2 ? 1 : 0);
  const complexity = complexityPoints >= 3 ? 'Katmanlı' : complexityPoints >= 1 ? 'Dengeli' : 'Yalın';
  const multiplier = complexityPoints >= 3 ? 1.18 : complexityPoints >= 1 ? 1.08 : 1;
  const config = configs[type];

  const title = isNight ? 'Geceye Açılan Hafıza' : isRelationship && isMemory ? 'Birlikte Büyüyen Anı' : isMusic ? 'Sesin Görsel Yankısı' : isNature ? 'İçimizdeki Bahçe' : isGift ? 'Saklanan Bir Hediye' : 'Kişisel Bir Evren';
  const focus = isRelationship ? 'Bağ ve yakınlık' : isMemory ? 'Hafıza ve zaman' : isMusic ? 'Ritim ve kimlik' : isNature ? 'Doğa ve dönüşüm' : 'Kişisel ifade';
  const composition = type === 'Albüm kapağı' ? 'Merkezî ikon + güçlü siluet' : isRelationship ? 'İki odaklı dengeli sahne' : mood === 'Minimal' ? 'Geniş negatif alan' : 'Katmanlı sinematik derinlik';
  const symbols = [isMemory && 'anı katmanları', isNature && 'botanik izler', isNight && 'ışık halkası', isMusic && 'ritmik formlar', isRelationship && 'birbirine yaklaşan iki form'].filter(Boolean);
  if (!symbols.length) symbols.push('kişisel simge', 'ışık geçidi');

  const routes = [
    { name: 'Şiirsel Sessizlik', note: `${composition}; yumuşak ışık ve nefes alan doku.` },
    { name: 'Sembolik Hafıza', note: `${symbols.slice(0, 2).join(' ve ')} üzerinden anlatısal kurgu.` },
    { name: 'Cesur Çerçeve', note: `Daha grafik ritim, güçlü kontrast ve çağdaş sergi etkisi.` }
  ];

  const briefScore = Math.min(98, 38 + Math.floor(idea.length / 5) + (selectedType ? 10 : 0) + (selectedMood ? 10 : 0) + (window.ecrenReferenceData ? 8 : 0));
  if (visualFeast) return {
    title: 'Neon Zambak Patlaması',
    direction: 'Özel sürpriz modu açıldı: klasik zambak formu; neon renk, ışık halkaları ve çağdaş hareket diliyle tam ekran bir görsel şölene dönüşüyor.',
    type: 'Sürpriz mod',
    mood: 'Maksimum enerji',
    focus: 'Renk ve hareket',
    composition: 'Merkezî zambak + ışık patlaması',
    complexity: 'Şenlikli',
    symbols: ['zambak', 'ışık halkası', 'renk patlaması'],
    routes: [
      { name: 'Neon Bahçe', note: 'Canlı zambaklar ve renk geçişleriyle yükselen sahne.' },
      { name: 'Kozmik Çiçek', note: 'Işık halkaları, yıldız tozu ve ritmik hareket.' },
      { name: 'Klasik / Pop', note: 'Zarif botanik çizgiler ile cesur dijital rengin birleşimi.' }
    ],
    palette: ['#d8ff3e', '#ff715b', '#8067e8', '#7dd3fc'],
    confidence: 100,
    price: 'SÜRPRİZ',
    duration: 'ANINDA',
    deliverable: 'TAM EKRAN ŞÖLEN',
    insight: 'Bu mod yalnızca eğlenceli, soyut ve renkli bir görsel sürpriz üretir.',
    nextQuestion: 'Bir sonraki sürpriz modu hangi renk dünyasında açalım?',
    visualFeast: true
  };

  return {
    title,
    direction: `${mood} atmosferinde, ${focus.toLocaleLowerCase('tr-TR')} duygusunu merkeze alan bir ${type.toLocaleLowerCase('tr-TR')} yönü. Klasik ışık düzeni; dokulu dijital katmanlar ve çağdaş kompozisyonla yeniden yorumlanacak.`,
    type,
    mood,
    focus,
    composition,
    complexity,
    symbols,
    routes,
    palette,
    confidence: briefScore,
    price: formatRange(Math.round(config.range[0] * multiplier / 100) * 100, Math.round(config.range[1] * multiplier / 100) * 100),
    duration: complexityPoints >= 3 ? ({ '2–3 hafta': '3–4 hafta', '3–4 hafta': '4–5 hafta', '4–6 hafta': '5–7 hafta', '2–4 hafta': '3–5 hafta' }[config.duration] || config.duration) : config.duration,
    deliverable: config.deliverable,
    insight: isGift ? 'Hediye niteliği nedeniyle kişisel detaylar kompozisyonun ana imzasına dönüşmeli.' : 'En güçlü sonuç için tek bir ana duygu seçilip diğer öğeler onu desteklemeli.',
    nextQuestion: symbols.length < 2 ? 'Bu hikâyeyi temsil eden özel bir nesne veya mekân var mı?' : 'Kompozisyonda mutlaka görünmesini istediğin tek detay hangisi?'
  };
}

function normalizeAnalysis(base, external) {
  if (!external || typeof external !== 'object') return base;
  const palette = Array.isArray(external.palette) ? external.palette.filter(color => /^#[0-9a-f]{6}$/i.test(color)).slice(0, 4) : [];
  const routes = Array.isArray(external.routes) ? external.routes.slice(0, 3).map((route, index) => ({
    name: String(route?.name || base.routes[index]?.name || `Rota ${index + 1}`),
    note: String(route?.note || base.routes[index]?.note || '')
  })) : base.routes;
  return {
    ...base,
    title: typeof external.title === 'string' ? external.title.slice(0, 90) : base.title,
    direction: typeof external.direction === 'string' ? external.direction.slice(0, 500) : base.direction,
    focus: typeof external.focus === 'string' ? external.focus.slice(0, 80) : base.focus,
    composition: typeof external.composition === 'string' ? external.composition.slice(0, 120) : base.composition,
    complexity: typeof external.complexity === 'string' ? external.complexity.slice(0, 40) : base.complexity,
    insight: typeof external.insight === 'string' ? external.insight.slice(0, 260) : base.insight,
    nextQuestion: typeof external.nextQuestion === 'string' ? external.nextQuestion.slice(0, 220) : base.nextQuestion,
    price: typeof external.price === 'string' ? external.price.slice(0, 80) : base.price,
    duration: typeof external.duration === 'string' ? external.duration.slice(0, 60) : base.duration,
    deliverable: typeof external.deliverable === 'string' ? external.deliverable.slice(0, 120) : base.deliverable,
    confidence: Number.isFinite(Number(external.confidence)) ? Math.max(0, Math.min(100, Number(external.confidence))) : base.confidence,
    palette: palette.length === 4 ? palette : base.palette,
    routes
  };
}

async function analyzeProject() {
  const idea = $('#ideaInput').value.trim();
  if (idea.length < 15) { showToast('Fikrini biraz daha detaylandırmalısın.'); $('#ideaInput').focus(); return; }
  const button = $('#generateBrief'); button.classList.add('loading'); button.disabled = true;
  const base = localAnalysis(idea);
  let result = base;
  if (aiSettings.endpoint && !base.visualFeast) {
    try {
      const response = await fetch(aiSettings.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idea, type: selectedType, mood: selectedMood, referenceImage: window.ecrenReferenceData || '' }) });
      if (!response.ok) throw new Error('AI service unavailable');
      result = normalizeAnalysis(base, await response.json());
    } catch { result = base; showToast('Harici AI yanıt vermedi; akıllı brief motoru kullanıldı.'); }
  } else { await new Promise(resolve => setTimeout(resolve, 900)); }
  lastAnalysis = { ...result, idea };
  const palette = result.palette;
  const feastPreview = result.visualFeast ? `<div class="ai-feast-preview" aria-label="Özel görsel şölen"><div class="ai-feast-orbit"></div><svg viewBox="0 0 64 64"><use href="#lilyumBloom"></use></svg><span>SECRET MODE / COLOR IN BLOOM</span><strong>GÖRSEL ŞÖLEN</strong></div>` : '';
  $('#aiResult').innerHTML = `<div class="result-card ${result.visualFeast ? 'visual-feast-result' : ''}"><div class="result-top"><span>✦ ${escapeHTML(aiSettings.assistant || 'LILYUM AI')} / CREATIVE BRIEF</span><b>%${escapeHTML(result.confidence)} BRIEF SKORU</b></div>${feastPreview}<h3>${escapeHTML(result.title)}</h3><p>${escapeHTML(result.direction)}</p><div class="result-summary"><div><span>ANA DUYGU</span><b>${escapeHTML(result.focus)}</b></div><div><span>KOMPOZİSYON</span><b>${escapeHTML(result.composition)}</b></div><div><span>KARMAŞIKLIK</span><b>${escapeHTML(result.complexity)}</b></div></div><div class="palette">${palette.map(color => `<i style="background:${color}"></i>`).join('')}</div><div class="route-grid">${result.routes.map((route, index) => `<article class="route-card"><div class="route-visual" style="--r1:${palette[index % 4]};--r2:${palette[(index + 1) % 4]};--r3:${palette[(index + 2) % 4]};--r4:${palette[(index + 3) % 4]}"></div><span>ROTA 0${index + 1}</span><b>${escapeHTML(route.name)}</b><p>${escapeHTML(route.note)}</p></article>`).join('')}</div><small class="ai-disclaimer">Bunlar sanat yönü ve kompozisyon rotalarıdır; bitmiş eser önizlemesi değildir.${window.ecrenReferenceData ? ' Yüklenen referans brief analizine eklendi.' : ''}</small><div class="ai-insights"><article><span>SANAT DANIŞMANI NOTU</span><p>${escapeHTML(result.insight)}</p></article><article><span>SIRADAKİ SORU</span><p>${escapeHTML(result.nextQuestion)}</p></article></div><div class="result-metrics"><div><span>TAHMİNİ BÜTÇE</span><strong>${escapeHTML(result.price)}</strong></div><div><span>ÜRETİM SÜRESİ</span><strong>${escapeHTML(result.duration)}</strong></div><div><span>TESLİM</span><strong>${escapeHTML(result.deliverable)}</strong></div></div><button class="save-brief" id="saveBrief">Bu yaratıcı briefi hesabıma kaydet <span class="line-arrow" aria-hidden="true"></span></button></div>`;
  $('#aiResult').classList.add('show'); button.classList.remove('loading'); button.disabled = false;
  if (result.visualFeast) launchVisualFeast();
  $$('.ai-steps span').forEach((step, index) => step.classList.toggle('active', index <= 1));
}

function saveCurrentBrief() {
  if (!lastAnalysis) return;
  if (!window.LilyumAccount?.isSignedIn()) { window.LilyumAccount?.openAuth('Yaratıcı briefi kaydetmek için hesabına giriş yap.'); return; }
  briefs.push({ ...lastAnalysis, date: new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()) });
  saveBriefs(); renderUserPanel(); renderAdmin(); showToast('Yaratıcı brief hesabına kaydedildi.');
  $$('.ai-steps span').forEach(step => step.classList.add('active'));
  openPanel('userPanel');
}

function updateAIStatus() { const live = Boolean(aiSettings.endpoint); $('#aiConnectionStatus').textContent = live ? 'ENDPOINT READY' : 'LILYUM LOCAL AI'; $('#aiConnectionStatus').style.color = live ? '#d9ff43' : ''; }

document.addEventListener('click', event => {
  const favorite = event.target.closest('[data-favorite]'); if (favorite) { event.stopPropagation(); toggleFavorite(favorite.dataset.favorite); return; }
  const work = event.target.closest('[data-work]'); if (work) openWork(work.dataset.work);
  const closer = event.target.closest('[data-close]'); if (closer) closePanel(closer.dataset.close);
  const request = event.target.closest('[data-request]'); if (request) { const item = works.find(work => work.id === request.dataset.request); goToAI(`${item.title} eserinin hissinden yola çıkan, bana özel bir çalışma istiyorum. `); }
  if (event.target.id === 'saveBrief') saveCurrentBrief();
});

$('#openUser').onclick = () => window.LilyumAccount?.openAccount();
$('#openAdmin').onclick = () => window.LilyumAccount?.openAdmin();
$('#closeAdmin').onclick = () => $('#adminDialog').close();
$('#closeWork').onclick = () => $('#workDialog').close();
$('#heroBrief').onclick = () => goToAI(); $('#footerBrief').onclick = () => goToAI();
function setPageLock(locked) { document.body.style.overflow = locked ? 'hidden' : ''; }
function closeMobileMenu() { $('#mobileMenu').classList.remove('open'); $('#mobileMenu').setAttribute('aria-hidden', 'true'); $('#menuBtn').classList.remove('active'); $('#menuBtn').setAttribute('aria-expanded', 'false'); $('#menuBtn').setAttribute('aria-label', 'Menüyü aç'); document.body.classList.remove('mobile-nav-open'); setPageLock(false); }
window.lilyumCloseMobileMenu = closeMobileMenu;
$('#menuBtn').setAttribute('aria-expanded', 'false');
$('#menuBtn').onclick = () => { const opening = !$('#mobileMenu').classList.contains('open'); $('#mobileMenu').classList.toggle('open', opening); $('#mobileMenu').setAttribute('aria-hidden', String(!opening)); $('#menuBtn').classList.toggle('active', opening); $('#menuBtn').setAttribute('aria-expanded', String(opening)); $('#menuBtn').setAttribute('aria-label', opening ? 'Menüyü kapat' : 'Menüyü aç'); document.body.classList.toggle('mobile-nav-open', opening); setPageLock(opening); };
$$('#mobileMenu a[href^="#"]').forEach(link => link.onclick = closeMobileMenu);
$('#mobileUser').onclick = () => { closeMobileMenu(); window.LilyumAccount?.openAccount(); };
$('#mobileAdmin').onclick = () => { closeMobileMenu(); window.LilyumAccount?.openAdmin(); };
$('#mobileLang').onclick = () => $('#langToggle').click();
function openDesktopMenu() { $('#desktopMenu').classList.add('open'); $('#desktopMenu').setAttribute('aria-hidden', 'false'); setPageLock(true); }
function closeDesktopMenu() { $('#desktopMenu').classList.remove('open'); $('#desktopMenu').setAttribute('aria-hidden', 'true'); setPageLock(false); }
$('#desktopExplore').onclick = openDesktopMenu;
$('#closeDesktopMenu').onclick = closeDesktopMenu;
$$('#megaLinks a').forEach(link => {
  link.onmouseenter = () => {
    const index = Number(link.dataset.preview);
    $('#menuPreview').className = `preview-frame${index ? ` variant-${index}` : ''}`;
    $('#previewIndex').textContent = `0${index + 1} / 05`;
    $('#previewTitle').textContent = ['Curated digital worlds.', 'Art that stays with you.', 'See the work behind the work.', 'Turn a feeling into direction.', 'Meet the artist behind it.'][index];
  };
  link.onclick = closeDesktopMenu;
});
$('#railPrev').onclick = () => { railIndex = Math.max(0, railIndex - 1); updateRail(); };
$('#railNext').onclick = () => { railIndex += 1; updateRail(); };
window.addEventListener('resize', updateRail);
window.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if ($('#mobileMenu').classList.contains('open')) closeMobileMenu();
  else if ($('#cartDrawer').classList.contains('open')) closePanel('cartDrawer');
  else if ($('#userPanel').classList.contains('open')) closePanel('userPanel');
});

$('#filterPills').onclick = event => { const button = event.target.closest('[data-filter]'); if (!button) return; activeFilter = button.dataset.filter; $$('#filterPills button').forEach(item => item.classList.toggle('active', item === button)); renderWorks(); };
function updateBriefMeter() {
  const length = $('#ideaInput').value.trim().length;
  const score = Math.min(100, Math.round((length / 180) * 70) + (selectedType ? 15 : 0) + (selectedMood ? 15 : 0));
  $('#charCount').textContent = $('#ideaInput').value.length;
  $('#briefMeterFill').style.width = `${Math.max(8, score)}%`;
  $('#briefMeterLabel').textContent = score >= 80 ? 'Çok güçlü' : score >= 55 ? 'İyi' : score >= 30 ? 'Gelişiyor' : 'Başlangıç';
}
$('#projectTypes').onclick = event => { const button = event.target.closest('[data-type]'); if (!button) return; selectedType = button.dataset.type; $$('#projectTypes button').forEach(item => item.classList.toggle('active', item === button)); updateBriefMeter(); };
$('#moods').onclick = event => { const button = event.target.closest('[data-mood]'); if (!button) return; selectedMood = button.dataset.mood; $$('#moods button').forEach(item => item.classList.toggle('active', item === button)); updateBriefMeter(); };
$('#ideaInput').oninput = updateBriefMeter;
$('#ideaStarters').onclick = event => {
  const button = event.target.closest('[data-prompt-starter]');
  if (!button) return;
  const input = $('#ideaInput');
  const addition = button.dataset.promptStarter;
  input.value = `${input.value}${input.value.trim() ? '\n' : ''}${addition}`.slice(0, 600);
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
  updateBriefMeter();
};
$('#generateBrief').onclick = analyzeProject;

$$('[data-user-tab]').forEach(button => button.onclick = () => { $$('[data-user-tab]').forEach(item => item.classList.toggle('active', item === button)); $$('.user-view').forEach(view => view.classList.toggle('active', view.id === `${button.dataset.userTab}View`)); });
$$('[data-admin-tab]').forEach(button => button.onclick = () => { const tabMap = { ai: 'adminAI', commerce: 'adminCommerce', collection: 'adminCollection' }; const titleMap = { ai: 'AI Ayarları', commerce: 'Satış', collection: 'Koleksiyon' }; $$('[data-admin-tab]').forEach(item => item.classList.toggle('active', item === button)); $$('.admin-tab').forEach(tab => tab.classList.toggle('active', tab.id === tabMap[button.dataset.adminTab])); $('#adminTitle').textContent = titleMap[button.dataset.adminTab]; });

$('#adminList').addEventListener('input', event => { const input = event.target; if (!input.dataset.field || !window.LilyumAccount?.isAdmin()) return; works[input.dataset.index][input.dataset.field] = input.value; saveWorks(); });
$('#adminList').addEventListener('change', async event => {
  const input = event.target;
  if (input.dataset.field) { window.LilyumAccount?.saveWork(works[input.dataset.index]).catch(() => showToast('Sunucu kaydı güncellenemedi.')); renderAll(); return; }
  if (input.dataset.upload !== undefined && input.files?.[0]) {
    if (input.files[0].size > 8_000_000) { showToast('Görsel 8 MB’dan küçük olmalı.'); input.value = ''; return; }
    const index = Number(input.dataset.upload);
    const previous = works[index].image;
    try {
      const remoteUrl = await window.LilyumAccount?.uploadArtwork(input.files[0], works[index].id);
      works[index].image = remoteUrl || await optimizeArtworkUpload(input.files[0]);
      if (!saveWorks()) works[index].image = previous;
      else { await window.LilyumAccount?.saveWork(works[index]); showToast('Eser görseli güvenle güncellendi.'); }
      renderAll();
    } catch { works[index].image = previous; showToast('Bu görsel işlenemedi. JPG veya PNG dene.'); }
  }
});
$('#adminList').addEventListener('click', async event => { const button = event.target.closest('[data-delete]'); if (!button || !window.LilyumAccount?.isAdmin()) return; const index = Number(button.dataset.delete); const work = works[index]; try { await window.LilyumAccount.deleteWork(work.id); works.splice(index, 1); saveWorks(); renderAll(); showToast('Eser koleksiyondan kaldırıldı.'); } catch { showToast('Eser silinemedi.'); } });
$('#addWork').onclick = async () => { if (!window.LilyumAccount?.isAdmin()) return; const work = { id: `work-${Date.now()}`, title: 'Yeni eser', type: 'Fine Art Print', category: 'print', price: '₺0', color: '#7b61ff', image: '', year: String(new Date().getFullYear()), size: '30 × 40 cm', edition: '30', description: 'Yeni koleksiyon eseri.' }; works.unshift(work); saveWorks(); renderAll(); try { await window.LilyumAccount.saveWork(work); } catch {} showToast('Yeni eser eklendi.'); };
$('#saveAISettings').onclick = () => { if (!window.LilyumAccount?.isAdmin()) return; aiSettings = { endpoint: $('#aiEndpoint').value.trim(), assistant: $('#assistantName').value.trim() || 'Lilyum AI' }; localStorage.setItem(keys.settings, JSON.stringify(aiSettings)); updateAIStatus(); showToast('AI ayarları kaydedildi.'); };

let motionFrame = 0;
window.addEventListener('scroll', () => {
  if (motionFrame) return;
  motionFrame = requestAnimationFrame(() => {
    $('#siteHeader').classList.toggle('scrolled', scrollY > 30);
    const scrollable = document.documentElement.scrollHeight - innerHeight;
    $('#scrollProgress').style.transform = `scaleX(${scrollable > 0 ? scrollY / scrollable : 0})`;
    motionFrame = 0;
  });
}, { passive: true });
window.addEventListener('pointermove', event => { $('#cursorGlow').style.left = `${event.clientX}px`; $('#cursorGlow').style.top = `${event.clientY}px`; const card = $('#heroStage .main-card'); if (card && innerWidth > 900) card.style.transform = `rotate(${3 + (event.clientX / innerWidth - .5) * 5}deg) translate(${(event.clientX / innerWidth - .5) * 10}px, ${(event.clientY / innerHeight - .5) * 8}px)`; }, { passive: true });
const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.style.transitionDelay = `${entry.target.dataset.delay || 0}ms`; entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), { threshold: .12 });
$$('.reveal').forEach(element => observer.observe(element));

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  setTimeout(() => $('#introLoader').classList.add('done'), sessionStorage.getItem('ecren-intro-seen') ? 180 : 1250);
  sessionStorage.setItem('ecren-intro-seen', '1');
} else { $('#introLoader').classList.add('done'); }

$$('.magnetic,.primary-btn').forEach(button => {
  button.addEventListener('pointermove', event => {
    if (innerWidth < 961) return;
    const rect = button.getBoundingClientRect();
    button.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * .12}px, ${(event.clientY - rect.top - rect.height / 2) * .16}px)`;
  });
  button.addEventListener('pointerleave', () => button.style.transform = '');
});

const clickBloomPalettes = [
  ['#ff715b', '#d8ff3e', '#8067e8'],
  ['#e7c47e', '#f2eee6', '#ff715b'],
  ['#7dd3fc', '#d8ff3e', '#a98cf8']
];
let clickBloomIndex = 0;
document.addEventListener('pointerdown', event => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  const interactive = event.target.closest('button,a,.payment-switch,[data-work]');
  if (!interactive || interactive.matches(':disabled,[aria-disabled="true"]')) return;
  const [left, center, right] = clickBloomPalettes[clickBloomIndex++ % clickBloomPalettes.length];
  const bloom = document.createElement('span');
  bloom.className = 'lily-click-bloom';
  bloom.setAttribute('aria-hidden', 'true');
  bloom.style.left = `${event.clientX}px`;
  bloom.style.top = `${event.clientY}px`;
  bloom.style.setProperty('--bloom-left', left);
  bloom.style.setProperty('--bloom-center', center);
  bloom.style.setProperty('--bloom-right', right);
  bloom.innerHTML = '<svg viewBox="0 0 64 64"><use href="#lilyumBloom"></use></svg>';
  document.body.appendChild(bloom);
  bloom.addEventListener('animationend', () => bloom.remove(), { once: true });
  setTimeout(() => bloom.remove(), 1100);
}, { passive: true });

renderAll();

const preloadArtwork = () => defaultWorks.forEach(work => {
  if (!work.image) return;
  const image = new Image();
  image.decoding = 'async';
  image.src = work.image;
});
if ('requestIdleCallback' in window) requestIdleCallback(preloadArtwork, { timeout: 1200 });
else setTimeout(preloadArtwork, 350);
