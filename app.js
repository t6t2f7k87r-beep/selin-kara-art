const defaultWorks = [
  { id: 'inner-weather', title: 'Inner Weather', type: 'Fine Art Print', category: 'print', price: '₺1.850', color: '#8d82d8', image: 'assets/inner-weather.jpg', year: '2026', size: '30 × 40 cm', edition: '30', description: 'İç dünyamızın sessizce değişen iklimlerine dair katmanlı bir anlatı.' },
  { id: 'sundown-club', title: 'Sundown Club', type: 'Limited Edition / 30', category: 'print', price: '₺2.400', color: '#d7a0a1', image: 'assets/sundown-club.jpg', year: '2026', size: '40 × 50 cm', edition: '30', description: 'Günün son ışığına, dostluğa ve hatırlamak istediğimiz yaz akşamlarına.' },
  { id: 'blue-hour', title: 'Blue Hour', type: 'Original Digital', category: 'original', price: '₺3.200', color: '#8cc7c1', image: 'assets/blue-hour.jpg', year: '2026', size: '50 × 70 cm', edition: '1 / 1', description: 'Gece başlamadan hemen önceki o kısa, mavi ve sonsuz aralık.' },
  { id: 'soft-rebel', title: 'Soft Rebel', type: 'Fine Art Print', category: 'print', price: '₺1.950', color: '#e5c06f', image: 'assets/soft-rebel.jpg', year: '2025', size: '30 × 40 cm', edition: '40', description: 'Yumuşaklığın da başlı başına bir direniş olduğuna dair.' },
  { id: 'memory-garden', title: 'Memory Garden', type: 'Original Digital', category: 'original', price: '₺3.600', color: '#a8cf9d', image: 'assets/memory-garden.jpg', year: '2025', size: '50 × 70 cm', edition: '1 / 1', description: 'Çocukluğun renkleriyle büyüyen, kimsenin bilmediği bir bahçe.' },
  { id: 'other-side', title: 'The Other Side', type: 'Limited Edition / 20', category: 'print', price: '₺2.750', color: '#e68170', image: 'assets/other-side.jpg', year: '2025', size: '40 × 50 cm', edition: '20', description: 'Bir kararın hemen öncesinde duran iki ayrı olasılık.' }
];

const keys = { works: 'ecren-isik-works', legacy: 'selin-kara-works', favorites: 'ecren-isik-favorites', briefs: 'ecren-isik-briefs', settings: 'ecren-isik-ai-settings' };
const parseStore = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const legacyWorks = parseStore(keys.legacy, null);
let works = parseStore(keys.works, legacyWorks || defaultWorks).map((work, index) => {
  const fallback = defaultWorks[index % defaultWorks.length];
  return { ...fallback, ...work, image: work.image || fallback.image, id: work.id || `work-${Date.now()}-${index}`, category: work.category || (index % 2 ? 'original' : 'print') };
});
let favorites = parseStore(keys.favorites, []);
let briefs = parseStore(keys.briefs, []);
let aiSettings = parseStore(keys.settings, { endpoint: '', assistant: 'Ecren AI' });
let activeFilter = 'all';
let railIndex = 0;
let selectedType = '';
let selectedMood = '';
let lastAnalysis = null;

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const escapeHTML = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const saveWorks = () => localStorage.setItem(keys.works, JSON.stringify(works));
const saveFavorites = () => localStorage.setItem(keys.favorites, JSON.stringify(favorites));
const saveBriefs = () => localStorage.setItem(keys.briefs, JSON.stringify(briefs));

function artMarkup(work, index, className = '') {
  return work.image ? `<img src="${work.image}" alt="${escapeHTML(work.title)}" class="${className}" loading="lazy" decoding="async">` : `<div class="generated-art variant-${index % 4}" style="background-color:${escapeHTML(work.color)}" role="img" aria-label="${escapeHTML(work.title)} için demo görsel alanı"><span></span><small class="demo-art-label">DEMO VISUAL</small></div>`;
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
  $('#assistantName').value = aiSettings.assistant || 'Ecren AI';
  updateAIStatus();
}

function renderUserPanel() {
  $('#favoriteCount').textContent = favorites.length;
  $('#favoriteTabCount').textContent = favorites.length;
  $('#projectCount').textContent = briefs.length;
  const favoriteWorks = favorites.map(id => works.find(work => work.id === id)).filter(Boolean);
  $('#favoritesList').innerHTML = favoriteWorks.length ? favoriteWorks.map((work, index) => `<article class="user-item"><div class="user-thumb">${artMarkup(work, index)}</div><div><h4>${escapeHTML(work.title)}</h4><p>${escapeHTML(work.price)} · ${escapeHTML(work.type)}</p></div><button class="remove-fav" data-favorite="${work.id}" aria-label="Favoriden çıkar">×</button></article>`).join('') : '<i>♡</i><h4>Henüz bir favorin yok.</h4><p>Kalbine dokunan eserlerdeki kalp ikonuna dokun.</p>';
  $('#projectsList').innerHTML = briefs.length ? briefs.slice().reverse().map(brief => `<article class="brief-item"><span>${escapeHTML(brief.type || 'ÖZEL PROJE')} · ${escapeHTML(brief.date)}</span><h4>${escapeHTML(brief.title)}</h4><p>${escapeHTML(brief.price)} · ${escapeHTML(brief.duration)}</p></article>`).join('') : '<i>✦</i><h4>İlk fikrini bekliyoruz.</h4><p>AI Stüdyo’da bir brief oluşturduğunda burada görünecek.</p>';
}

function renderAll() { renderStand(); renderWorks(); renderAdmin(); renderUserPanel(); window.renderFeatureLayers?.(); }

function toggleFavorite(id) {
  favorites = favorites.includes(id) ? favorites.filter(item => item !== id) : [...favorites, id];
  saveFavorites(); renderAll(); showToast(favorites.includes(id) ? 'Eser favorilerine eklendi.' : 'Eser favorilerinden çıkarıldı.');
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
  $('#workDetail').innerHTML = `<div class="detail-art">${artMarkup(work, index)}</div><div class="detail-info"><p class="index">ECREN IŞIK / ${work.category === 'original' ? 'ORIGINAL' : 'LIMITED PRINT'}</p><h2>${escapeHTML(work.title)}</h2><p>${escapeHTML(work.description)}</p><div class="detail-story"><span>${escapeHTML(work.year || '2026')} / STORY NOTE</span><p>Renk, ritim ve katmanlar eserin ana duygusunu taşıyacak biçimde kuruldu. Gerçek eskiz ve süreç görselleri yüklendiğinde bu hikâye alanı esere özel güncellenecek.</p></div><strong class="detail-price">${escapeHTML(work.price)}</strong><div class="product-options"><label><span>BOYUT</span><select id="workSize">${sizes.map(size => `<option>${escapeHTML(size)}</option>`).join('')}</select></label><label><span>SUNUM</span><select id="workFrame"><option>Çerçevesiz</option><option>Çerçeveli — teklif iste</option></select></label></div><div class="detail-meta"><div><span>FORMAT</span><b>${escapeHTML(work.type)}</b></div><div><span>TESLİMAT</span><b>3–5 iş günü</b></div><div><span>SERTİFİKA</span><b>İmzalı</b></div><div><span>EDITION</span><b>${escapeHTML(work.edition || (work.category === 'original' ? '1 / 1' : 'Sınırlı'))}</b></div></div><div class="detail-actions"><button class="request-work" data-add-cart="${work.id}">Sepete ekle</button><button class="favorite-work" data-favorite="${work.id}">${favorites.includes(work.id) ? '♥ Favorilerimde' : '♡ Favoriye ekle'}</button></div><button class="commission-link" data-request="${work.id}">Bu eserden ilham alan özel bir çalışma iste →</button></div>`;
  $('#workDialog').setAttribute('aria-label', `${work.title} eser detayı`);
  $('#workDialog').scrollTop = 0;
  $('#workDialog').showModal();
}

function openPanel(id) { const panel = document.getElementById(id); panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false'); setPageLock(true); }
function closePanel(id) { const panel = document.getElementById(id); panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true'); if (!document.querySelector('.side-panel.open, .cart-drawer.open, .mobile-menu.open, .desktop-menu.open')) setPageLock(false); }
function showToast(message) { $('#toast p').textContent = message; $('#toast').classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => $('#toast').classList.remove('show'), 2600); }
function goToAI(prefill = '') { $('#workDialog').open && $('#workDialog').close(); document.querySelector('#ai-studio').scrollIntoView({ behavior: 'smooth' }); if (prefill) $('#ideaInput').value = prefill; setTimeout(() => $('#ideaInput').focus(), 700); }

function localAnalysis(idea) {
  const type = selectedType || 'Kişisel eser';
  const mood = selectedMood || 'Özgün';
  const configs = {
    'Portre': { price: '₺4.500 – ₺7.500', duration: '2–3 hafta', deliverable: 'Portre + 2 eskiz yönü' },
    'Albüm kapağı': { price: '₺7.500 – ₺12.000', duration: '3–4 hafta', deliverable: 'Kapak + platform uyarlamaları' },
    'Marka işi': { price: '₺12.000 – ₺24.000', duration: '4–6 hafta', deliverable: 'Ana görsel + ticari kullanım' },
    'Kişisel eser': { price: '₺5.000 – ₺9.000', duration: '2–4 hafta', deliverable: 'Özel eser + baskı dosyası' }
  };
  const palettes = { 'Rüya gibi': ['#8d82d8','#f4b6c2','#d9ff43','#252642'], 'Cesur': ['#ff684e','#d9ff43','#111111','#7b61ff'], 'Minimal': ['#eeeae0','#1c1c1c','#9cb9b5','#d7c8aa'], 'Nostaljik': ['#d38b6d','#e5c06f','#405e64','#efe4d0'], 'Özgün': ['#7b61ff','#ff684e','#d9ff43','#0d0d0d'] };
  const keywords = idea.toLocaleLowerCase('tr-TR');
  const theme = keywords.includes('gece') ? 'Geceye Açılan Hafıza' : keywords.includes('aile') || keywords.includes('kardeş') ? 'Ortak Bir Hafıza' : keywords.includes('müzik') || type === 'Albüm kapağı' ? 'Sesin Görsel Yankısı' : keywords.includes('doğa') || keywords.includes('bahçe') ? 'İçimizdeki Bahçe' : 'Kişisel Bir Evren';
  return { title: theme, direction: `${mood} atmosferinde; duyguyu merkezine alan, Ecren’in dokulu renk diliyle şekillenen ${type.toLocaleLowerCase('tr-TR')} yönü. Anlatındaki ana semboller kompozisyonun görsel hafızasına dönüşecek.`, type, mood, palette: palettes[mood] || palettes.Özgün, confidence: Math.min(96, 72 + Math.floor(idea.length / 20)), ...configs[type] };
}

async function analyzeProject() {
  const idea = $('#ideaInput').value.trim();
  if (idea.length < 15) { showToast('Fikrini biraz daha detaylandırmalısın.'); $('#ideaInput').focus(); return; }
  const button = $('#generateBrief'); button.classList.add('loading'); button.disabled = true;
  let result;
  if (aiSettings.endpoint) {
    try {
      const response = await fetch(aiSettings.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idea, type: selectedType, mood: selectedMood, referenceImage: window.ecrenReferenceData || '' }) });
      if (!response.ok) throw new Error('AI service unavailable');
      result = { ...localAnalysis(idea), ...(await response.json()) };
    } catch { result = localAnalysis(idea); showToast('Harici AI yanıt vermedi; cihaz içi tahmin kullanıldı.'); }
  } else { await new Promise(resolve => setTimeout(resolve, 1100)); result = localAnalysis(idea); }
  lastAnalysis = { ...result, idea };
  $('#aiResult').innerHTML = `<div class="result-card"><div class="result-top"><span>✦ ${escapeHTML(aiSettings.assistant || 'ECREN AI')} ANALİZİ</span><b>%${escapeHTML(result.confidence)} UYUM</b></div><h3>${escapeHTML(result.title)}</h3><p>${escapeHTML(result.direction)}</p><div class="palette">${result.palette.map(color => `<i style="background:${color}"></i>`).join('')}</div><div class="moodboard"><article style="--m1:${result.palette[0]};--m2:${result.palette[1]}"><i></i><span>ROUTE 01 / SOFT FOCUS</span></article><article style="--m1:${result.palette[1]};--m2:${result.palette[2]}"><i></i><span>ROUTE 02 / SYMBOLIC</span></article><article style="--m1:${result.palette[2]};--m2:${result.palette[3]}"><i></i><span>ROUTE 03 / BOLD FRAME</span></article></div><small class="ai-disclaimer">Bu moodboard kompozisyon rotasıdır; gerçek eser önizlemesi değildir.${window.ecrenReferenceData ? ' Yüklenen referans proje briefine eklendi.' : ''}</small><div class="result-metrics"><div><span>TAHMİNİ BÜTÇE</span><strong>${escapeHTML(result.price)}</strong></div><div><span>ÜRETİM SÜRESİ</span><strong>${escapeHTML(result.duration)}</strong></div><div><span>TESLİM</span><strong>${escapeHTML(result.deliverable)}</strong></div></div><button class="save-brief" id="saveBrief">Bu proje briefini hesabıma kaydet →</button></div>`;
  $('#aiResult').classList.add('show'); button.classList.remove('loading'); button.disabled = false;
}

function saveCurrentBrief() {
  if (!lastAnalysis) return;
  briefs.push({ ...lastAnalysis, date: new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()) });
  saveBriefs(); renderUserPanel(); renderAdmin(); showToast('Proje briefin hesabına kaydedildi.'); openPanel('userPanel');
}

function updateAIStatus() { const live = Boolean(aiSettings.endpoint); $('#aiConnectionStatus').textContent = live ? 'ENDPOINT READY' : 'LOCAL AI'; $('#aiConnectionStatus').style.color = live ? '#d9ff43' : ''; }

document.addEventListener('click', event => {
  const favorite = event.target.closest('[data-favorite]'); if (favorite) { event.stopPropagation(); toggleFavorite(favorite.dataset.favorite); return; }
  const work = event.target.closest('[data-work]'); if (work) openWork(work.dataset.work);
  const closer = event.target.closest('[data-close]'); if (closer) closePanel(closer.dataset.close);
  const request = event.target.closest('[data-request]'); if (request) { const item = works.find(work => work.id === request.dataset.request); goToAI(`${item.title} eserinin hissinden yola çıkan, bana özel bir çalışma istiyorum. `); }
  if (event.target.id === 'saveBrief') saveCurrentBrief();
});

$('#openUser').onclick = () => openPanel('userPanel');
$('#openAdmin').onclick = () => { renderAdmin(); $('#adminDialog').showModal(); };
$('#closeAdmin').onclick = () => $('#adminDialog').close();
$('#closeWork').onclick = () => $('#workDialog').close();
$('#heroBrief').onclick = () => goToAI(); $('#footerBrief').onclick = () => goToAI();
function setPageLock(locked) { document.body.style.overflow = locked ? 'hidden' : ''; }
function closeMobileMenu() { $('#mobileMenu').classList.remove('open'); $('#mobileMenu').setAttribute('aria-hidden', 'true'); $('#menuBtn').classList.remove('active'); $('#menuBtn').setAttribute('aria-expanded', 'false'); $('#menuBtn').setAttribute('aria-label', 'Menüyü aç'); document.body.classList.remove('mobile-nav-open'); setPageLock(false); }
$('#menuBtn').setAttribute('aria-expanded', 'false');
$('#menuBtn').onclick = () => { const opening = !$('#mobileMenu').classList.contains('open'); $('#mobileMenu').classList.toggle('open', opening); $('#mobileMenu').setAttribute('aria-hidden', String(!opening)); $('#menuBtn').classList.toggle('active', opening); $('#menuBtn').setAttribute('aria-expanded', String(opening)); $('#menuBtn').setAttribute('aria-label', opening ? 'Menüyü kapat' : 'Menüyü aç'); document.body.classList.toggle('mobile-nav-open', opening); setPageLock(opening); };
$$('#mobileMenu a[href^="#"]').forEach(link => link.onclick = closeMobileMenu);
$('#mobileUser').onclick = () => { closeMobileMenu(); openPanel('userPanel'); };
$('#mobileAdmin').onclick = () => { closeMobileMenu(); renderAdmin(); $('#adminDialog').showModal(); };
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
$('#projectTypes').onclick = event => { const button = event.target.closest('[data-type]'); if (!button) return; selectedType = button.dataset.type; $$('#projectTypes button').forEach(item => item.classList.toggle('active', item === button)); };
$('#moods').onclick = event => { const button = event.target.closest('[data-mood]'); if (!button) return; selectedMood = button.dataset.mood; $$('#moods button').forEach(item => item.classList.toggle('active', item === button)); };
$('#ideaInput').oninput = () => $('#charCount').textContent = $('#ideaInput').value.length;
$('#generateBrief').onclick = analyzeProject;

$$('[data-user-tab]').forEach(button => button.onclick = () => { $$('[data-user-tab]').forEach(item => item.classList.toggle('active', item === button)); $$('.user-view').forEach(view => view.classList.toggle('active', view.id === `${button.dataset.userTab}View`)); });
$$('[data-admin-tab]').forEach(button => button.onclick = () => { const tabMap = { ai: 'adminAI', commerce: 'adminCommerce', collection: 'adminCollection' }; const titleMap = { ai: 'AI Ayarları', commerce: 'Satış', collection: 'Koleksiyon' }; $$('[data-admin-tab]').forEach(item => item.classList.toggle('active', item === button)); $$('.admin-tab').forEach(tab => tab.classList.toggle('active', tab.id === tabMap[button.dataset.adminTab])); $('#adminTitle').textContent = titleMap[button.dataset.adminTab]; });

$('#adminList').addEventListener('input', event => { const input = event.target; if (!input.dataset.field) return; works[input.dataset.index][input.dataset.field] = input.value; saveWorks(); });
$('#adminList').addEventListener('change', event => {
  const input = event.target;
  if (input.dataset.field) { renderAll(); return; }
  if (input.dataset.upload !== undefined && input.files?.[0]) {
    if (input.files[0].size > 2_500_000) { showToast('Görsel 2.5 MB’dan küçük olmalı.'); return; }
    const reader = new FileReader(); reader.onload = () => { works[Number(input.dataset.upload)].image = reader.result; saveWorks(); renderAll(); showToast('Eser görseli güncellendi.'); }; reader.readAsDataURL(input.files[0]);
  }
});
$('#adminList').addEventListener('click', event => { const button = event.target.closest('[data-delete]'); if (!button) return; works.splice(Number(button.dataset.delete), 1); saveWorks(); renderAll(); showToast('Eser koleksiyondan kaldırıldı.'); });
$('#addWork').onclick = () => { works.unshift({ id: `work-${Date.now()}`, title: 'Yeni eser', type: 'Fine Art Print', category: 'print', price: '₺0', color: '#7b61ff', image: '', year: String(new Date().getFullYear()), size: '30 × 40 cm', edition: '30', description: 'Yeni koleksiyon eseri.' }); saveWorks(); renderAll(); showToast('Yeni eser eklendi.'); };
$('#saveAISettings').onclick = () => { aiSettings = { endpoint: $('#aiEndpoint').value.trim(), assistant: $('#assistantName').value.trim() || 'Ecren AI' }; localStorage.setItem(keys.settings, JSON.stringify(aiSettings)); updateAIStatus(); showToast('AI ayarları kaydedildi.'); };

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

renderAll();
