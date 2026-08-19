const featureKeys = {
  cart: 'lilyum-design-cart',
  orders: 'lilyum-design-orders',
  profile: 'lilyum-design-profile',
  commerce: 'lilyum-design-commerce',
  catalog: 'lilyum-design-catalog-settings',
  language: 'lilyum-design-language'
};

let cart = parseStore(featureKeys.cart, []);
let orders = parseStore(featureKeys.orders, []);
let profile = parseStore(featureKeys.profile, { name: '', email: '', city: '' });
let commerceSettings = { enabled: false, provider: 'iyzico', endpoint: '', currency: 'TRY', freeShipping: 5000, ...parseStore(featureKeys.commerce, {}) };
let catalogSettings = parseStore(featureKeys.catalog, { endpoint: '' });
let archiveType = 'all';
let archiveYear = 'all';
let galleryIndex = 0;
let currentLanguage = localStorage.getItem(featureKeys.language) || 'tr';

const saveFeature = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const priceNumber = value => Number(String(value).replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
const money = value => new Intl.NumberFormat(currentLanguage === 'en' ? 'en-US' : 'tr-TR', { style: 'currency', currency: commerceSettings.currency || 'TRY', maximumFractionDigits: 0 }).format(value);
const providerNames = { iyzico: 'iyzico', stripe: 'Stripe', shopier: 'Shopier', custom: 'Özel altyapı' };

function isSecurePaymentUrl(value) {
  try {
    const url = new URL(value);
    const localPreview = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
    return url.protocol === 'https:' || localPreview;
  } catch { return false; }
}

const onlinePaymentReady = (settings = commerceSettings) => Boolean(settings.enabled && isSecurePaymentUrl(settings.endpoint));

function renderArchive() {
  const archive = works.flatMap((work, index) => {
    const year = work.year || (index < 3 ? '2026' : '2025');
    const base = [{ id: `${work.id}-artwork`, work, type: 'artwork', year, label: work.category === 'original' ? 'ORIGINAL WORK' : 'LIMITED PRINT', title: work.title }];
    if (index < 4) base.push({ id: `${work.id}-process`, work, type: index % 2 ? 'sketch' : 'process', year, label: index % 2 ? 'SKETCH NOTE' : 'PROCESS FRAME', title: `${work.title} / Study` });
    return base;
  });
  const filtered = archive.filter(item => (archiveType === 'all' || item.type === archiveType) && (archiveYear === 'all' || item.year === archiveYear));
  $('#archiveGrid').innerHTML = filtered.length ? filtered.map((item, index) => `<article class="archive-card ${item.type}" data-work="${item.work.id}"><div class="archive-art">${artMarkup(item.work, index)}</div><div><span>${escapeHTML(item.year)} / ${escapeHTML(item.label)}</span><h3>${escapeHTML(item.title)}</h3><i>↗</i></div></article>`).join('') : '<div class="archive-empty">Bu filtrede henüz bir kayıt yok.</div>';
}

function renderGallery() {
  if (!works.length) return;
  galleryIndex = (galleryIndex + works.length) % works.length;
  const work = works[galleryIndex];
  $('#galleryStage').innerHTML = `<article><div class="gallery-art">${artMarkup(work, galleryIndex)}</div><div class="gallery-copy"><span>LILYUM DESIGN / ${escapeHTML(work.year || '2026')}</span><h2>${escapeHTML(work.title)}</h2><p>${escapeHTML(work.description)}</p><div><b>${escapeHTML(work.type)}</b><strong>${escapeHTML(work.price)}</strong></div><button data-gallery-work="${work.id}">Eser ayrıntıları ↗</button></div></article>`;
  $('#galleryCounter').textContent = `${String(galleryIndex + 1).padStart(2, '0')} / ${String(works.length).padStart(2, '0')}`;
}

function renderCart() {
  cart = cart.filter(item => works.some(work => work.id === item.id) && item.qty > 0);
  saveFeature(featureKeys.cart, cart);
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const total = cart.reduce((sum, item) => {
    const work = works.find(entry => entry.id === item.id);
    return sum + priceNumber(work?.price) * item.qty;
  }, 0);
  $('#cartCount').textContent = count;
  $('#cartTitleCount').textContent = `(${count})`;
  $('#cartSubtotal').textContent = money(total);
  $('#checkoutTotal').textContent = money(total);
  $('#startCheckout').disabled = !count;
  const paymentReady = onlinePaymentReady();
  $('#checkoutCtaLabel').textContent = paymentReady ? 'Güvenli ödemeye geç' : 'Sipariş talebi oluştur';
  $('#checkoutSubmitLabel').textContent = paymentReady ? 'Ödeme sayfasına devam et' : 'Sipariş talebi oluştur';
  $('#cartItems').innerHTML = cart.length ? cart.map((item, index) => {
    const work = works.find(entry => entry.id === item.id);
    return `<article class="cart-item"><div class="cart-thumb">${artMarkup(work, index)}</div><div><span>${work.category === 'original' ? 'ORIGINAL' : 'LIMITED PRINT'}</span><h4>${escapeHTML(work.title)}</h4><p>${escapeHTML(item.size || work.size || '30 × 40 cm')} · ${escapeHTML(item.frame || 'Çerçevesiz')}<br>${escapeHTML(work.price)}</p><div class="qty"><button data-cart-dec="${index}">−</button><b>${item.qty}</b><button data-cart-inc="${index}">＋</button></div></div><button class="cart-remove" data-cart-remove="${index}" aria-label="Ürünü kaldır">×</button></article>`;
  }).join('') : '<div class="cart-empty"><i>◇</i><h4>Sepetin henüz boş.</h4><p>Sana eşlik edecek bir eser seçtiğinde burada göreceksin.</p><a href="#works" data-close="cartDrawer">Koleksiyona git →</a></div>';
}

function orderMailHref(order) {
  const customer = order.customer || {};
  const itemLines = order.items.map(item => {
    const work = works.find(entry => entry.id === item.id);
    return `• ${work?.title || item.title || 'Eser'} — ${item.size || ''} / ${item.frame || ''} / ${item.qty} adet`;
  });
  const body = [`Sipariş talebi: ${order.number}`, '', ...itemLines, '', `Toplam: ${order.total}`, '', `Ad soyad: ${customer.name || ''}`, `E-posta: ${customer.email || ''}`, `Telefon: ${customer.phone || ''}`, `Şehir: ${customer.city || ''}`, `Adres: ${customer.address || ''}`].join('\n');
  return `mailto:hello@lilyumdesigns.com?subject=${encodeURIComponent(`Lilyum Design sipariş talebi ${order.number}`)}&body=${encodeURIComponent(body)}`;
}

function renderOrders() {
  $('#orderCount').textContent = orders.length;
  $('#ordersList').innerHTML = orders.length ? orders.slice().reverse().map(order => `<article class="order-item"><div><span>${escapeHTML(order.date)} · ${escapeHTML(order.status)}</span><h4>${escapeHTML(order.number)}</h4><p>${order.items.length} eser · ${escapeHTML(order.total)}</p></div><a class="order-send" href="${orderMailHref(order)}">Stüdyoya gönder ↗</a></article>`).join('') : '<i>□</i><h4>Henüz sipariş talebin yok.</h4><p>Sepetinden oluşturduğun talepler burada görünür.</p>';
}

function renderProfile() {
  if (window.LilyumAccount?.isSignedIn()) return;
  $('#profileName').value = profile.name || '';
  $('#profileEmail').value = profile.email || '';
  $('#profileCity').value = profile.city || '';
}

function renderCommerce() {
  const paymentReady = onlinePaymentReady();
  const provider = commerceSettings.provider || 'iyzico';
  $('#paymentEnabled').checked = Boolean(commerceSettings.enabled);
  $('#paymentProvider').value = provider;
  $('#checkoutEndpoint').value = commerceSettings.endpoint || '';
  $('#shopCurrency').value = commerceSettings.currency || 'TRY';
  $('#freeShipping').value = commerceSettings.freeShipping ?? 5000;
  $('#commerceStatus').textContent = paymentReady ? `${providerNames[provider] || provider} READY`.toUpperCase() : commerceSettings.enabled ? 'SETUP NEEDED' : 'REQUEST MODE';
  $('#commerceStatus').classList.toggle('live', paymentReady);
  updatePaymentCheck(commerceSettings);
  $('#checkoutNote').textContent = paymentReady ? `${providerNames[provider] || 'Ödeme sağlayıcısı'} üzerinden güvenli ödeme sayfasına yönlendirileceksin. Lilyum Design kart bilgisi saklamaz.` : 'Kart bilgisi alınmaz. Talebin cihazına kaydedilir; ardından hazırlanan e-postayla stüdyoya iletebilirsin.';
  $('#checkoutCtaLabel').textContent = paymentReady ? 'Güvenli ödemeye geç' : 'Sipariş talebi oluştur';
  $('#checkoutSubmitLabel').textContent = paymentReady ? 'Ödeme sayfasına devam et' : 'Sipariş talebi oluştur';
}

function updatePaymentCheck(settings) {
  const check = $('#paymentCheck');
  const title = check.querySelector('b');
  const detail = check.querySelector('small');
  check.classList.remove('valid', 'invalid');
  if (!settings.enabled) {
    check.querySelector('span').textContent = '○';
    title.textContent = 'Sipariş talebi modu açık';
    detail.textContent = 'Online ödeme kapalı; mevcut talep akışı çalışmaya devam eder.';
    return false;
  }
  if (!settings.endpoint) {
    check.classList.add('invalid');
    check.querySelector('span').textContent = '!';
    title.textContent = 'Güvenli adres eksik';
    detail.textContent = 'Online ödeme için sunucu ödeme endpoint’ini ekle.';
    return false;
  }
  if (!isSecurePaymentUrl(settings.endpoint)) {
    check.classList.add('invalid');
    check.querySelector('span').textContent = '!';
    title.textContent = 'Adres güvenli değil';
    detail.textContent = 'Canlı ödemede yalnızca HTTPS adresi kabul edilir.';
    return false;
  }
  check.classList.add('valid');
  check.querySelector('span').textContent = '✓';
  title.textContent = `${providerNames[settings.provider] || 'Ödeme'} yapılandırması hazır`;
  detail.textContent = 'Kaydettiğinde sepette güvenli ödeme seçeneği etkinleşir.';
  return true;
}

function commerceFormValue() {
  return {
    enabled: $('#paymentEnabled').checked,
    provider: $('#paymentProvider').value,
    endpoint: $('#checkoutEndpoint').value.trim(),
    currency: $('#shopCurrency').value,
    freeShipping: Number($('#freeShipping').value) || 0
  };
}

function renderCatalogSync() {
  $('#catalogEndpoint').value = catalogSettings.endpoint || '';
  $('#catalogStatus').textContent = catalogSettings.endpoint ? 'ENDPOINT READY' : 'LOCAL ONLY';
  $('#catalogStatus').classList.toggle('live', Boolean(catalogSettings.endpoint));
}

window.renderFeatureLayers = () => {
  renderArchive();
  renderCart();
  renderOrders();
  renderProfile();
  renderCommerce();
  renderCatalogSync();
};

function addToCart(id) {
  const work = works.find(entry => entry.id === id);
  if (!work) { showToast('Bu eser artık koleksiyonda bulunmuyor.'); return; }
  const size = $('#workSize')?.value || work.size || '30 × 40 cm';
  const frame = $('#workFrame')?.value || 'Çerçevesiz';
  const item = cart.find(entry => entry.id === id && entry.size === size && entry.frame === frame);
  if (item) item.qty += 1; else cart.push({ id, size, frame, qty: 1 });
  saveFeature(featureKeys.cart, cart);
  renderCart();
  if ($('#workDialog').open) $('#workDialog').close();
  openPanel('cartDrawer');
  showToast('Eser sepete eklendi.');
}

function changeCart(index, delta) {
  const item = cart[Number(index)];
  if (!item) return;
  item.qty += delta;
  cart = cart.filter(entry => entry.qty > 0);
  renderCart();
}

const translations = {
  en: [
    ['.desktop-nav a:nth-child(1)', 'Stand'], ['.desktop-nav a:nth-child(2)', 'Works'], ['.desktop-nav a:nth-child(3)', 'AI Studio'], ['.desktop-nav a:nth-child(4)', 'About'],
    ['.hero .kicker', '<span></span> DIGITAL ILLUSTRATION · ORIGINAL WORKS'], ['.hero-copy h1', 'Beyond what<br><em>you imagined.</em>'], ['.hero-lead', 'Emotion-led collectible digital art for people and brands with character.'],
    ['#heroBrief', 'Tell me an idea <span>✦</span>'], ['.hero-cta .primary-btn', 'Explore the collection <span>↘</span>'],
    ['#works .section-heading h2', 'A new world begins<br><em>on your wall.</em>'], ['#openGallery', 'Fullscreen exhibition <span>↗</span>'],
    ['#archive .archive-head h2', 'The making matters<br><em>as much as the result.</em>'], ['#ai-studio h2', 'Tell your idea.<br><em>See its potential.</em>'],
    ['.process h2', 'From idea to<br><em>signature artwork.</em>'], ['#about h2', 'Making inner worlds<br><em>visible.</em>'], ['.final-cta>p', 'Have an idea?'], ['.final-cta h2', 'Let’s make it<br><em>unforgettable.</em>']
  ],
  tr: [
    ['.desktop-nav a:nth-child(1)', 'Stand'], ['.desktop-nav a:nth-child(2)', 'Eserler'], ['.desktop-nav a:nth-child(3)', 'AI Stüdyo'], ['.desktop-nav a:nth-child(4)', 'Hakkımda'],
    ['.hero .kicker', '<span></span> DİJİTAL İLLÜSTRASYON · ÖZGÜN İŞLER'], ['.hero-copy h1', 'Hayal ettiğin<br><em>şeyin ötesi.</em>'], ['.hero-lead', 'Karakteri olan insanlar ve markalar için duygusu yüksek, koleksiyonluk dijital sanat.'],
    ['#heroBrief', 'Bir fikir anlat <span>✦</span>'], ['.hero-cta .primary-btn', 'Koleksiyonu keşfet <span>↘</span>'],
    ['#works .section-heading h2', 'Yeni bir dünya<br><em>duvarında başlar.</em>'], ['#openGallery', 'Tam ekran sergi <span>↗</span>'],
    ['#archive .archive-head h2', 'Bitmiş işler kadar<br><em>oluş anları da.</em>'], ['#ai-studio h2', 'Fikrini anlat.<br><em>Olasılığını gör.</em>'],
    ['.process h2', 'Fikirden,<br><em>imza esere.</em>'], ['#about h2', 'İç dünyaları<br><em>görünür</em> kılıyorum.'], ['.final-cta>p', 'Bir fikrin mi var?'], ['.final-cta h2', 'Onu birlikte<br><em>unutulmaz</em> yapalım.']
  ]
};

function applyLanguage() {
  document.documentElement.lang = currentLanguage;
  translations[currentLanguage].forEach(([selector, html]) => { const element = $(selector); if (element) element.innerHTML = html; });
  $('#langToggle').innerHTML = currentLanguage === 'tr' ? 'TR <span>/</span> EN' : 'EN <span>/</span> TR';
  $('#mobileLang').textContent = currentLanguage === 'tr' ? 'TR / EN' : 'EN / TR';
  localStorage.setItem(featureKeys.language, currentLanguage);
  renderCart();
}

document.addEventListener('click', event => {
  const placeholder = event.target.closest('[data-placeholder-link]');
  if (placeholder) { event.preventDefault(); showToast('Bu sosyal profil henüz bağlanmadı.'); }
  const add = event.target.closest('[data-add-cart]');
  if (add) { event.preventDefault(); addToCart(add.dataset.addCart); return; }
  const increment = event.target.closest('[data-cart-inc]');
  if (increment) changeCart(increment.dataset.cartInc, 1);
  const decrement = event.target.closest('[data-cart-dec]');
  if (decrement) changeCart(decrement.dataset.cartDec, -1);
  const remove = event.target.closest('[data-cart-remove]');
  if (remove) { cart.splice(Number(remove.dataset.cartRemove), 1); renderCart(); }
  const galleryWork = event.target.closest('[data-gallery-work]');
  if (galleryWork) { $('#galleryDialog').close(); openWork(galleryWork.dataset.galleryWork); }
});

$('#archiveFilters').addEventListener('click', event => {
  const typeButton = event.target.closest('[data-archive]');
  const yearButton = event.target.closest('[data-year]');
  if (typeButton) { archiveType = typeButton.dataset.archive; $$('#archiveFilters [data-archive]').forEach(button => button.classList.toggle('active', button === typeButton)); }
  if (yearButton) { archiveYear = yearButton.dataset.year; $$('#archiveFilters [data-year]').forEach(button => button.classList.toggle('active', button === yearButton)); }
  if (typeButton || yearButton) renderArchive();
});

$('#openGallery').onclick = () => { galleryIndex = 0; renderGallery(); $('#galleryDialog').showModal(); };
$('#closeGallery').onclick = () => $('#galleryDialog').close();
$('#galleryPrev').onclick = () => { galleryIndex -= 1; renderGallery(); };
$('#galleryNext').onclick = () => { galleryIndex += 1; renderGallery(); };
$('#openCart').onclick = () => openPanel('cartDrawer');
function renderCheckoutPreview() {
  $('#checkoutPreview').innerHTML = cart.map(item => {
    const work = works.find(entry => entry.id === item.id);
    if (!work) return '';
    return `<article><div><b>${escapeHTML(work.title)}</b><small>${escapeHTML(item.size || work.size)} · ${escapeHTML(item.frame || 'Çerçevesiz')} · ${item.qty} adet</small></div><strong>${money(priceNumber(work.price) * item.qty)}</strong></article>`;
  }).join('');
}
function returnToCart() { if ($('#checkoutDialog').open) $('#checkoutDialog').close(); openPanel('cartDrawer'); }
$('#closeCheckout').onclick = returnToCart;
$('#checkoutDialog').addEventListener('cancel', event => { event.preventDefault(); returnToCart(); });
$('#startCheckout').onclick = () => {
  if (!cart.length) return;
  closePanel('cartDrawer');
  renderCheckoutPreview();
  const form = $('#checkoutForm');
  if (profile.name && !form.elements.name.value) form.elements.name.value = profile.name;
  if (profile.email && !form.elements.email.value) form.elements.email.value = profile.email;
  if (profile.city && !form.elements.city.value) form.elements.city.value = profile.city;
  $('#checkoutTotal').textContent = money(cart.reduce((sum, item) => sum + priceNumber(works.find(work => work.id === item.id)?.price) * item.qty, 0));
  $('#checkoutDialog').scrollTop = 0;
  $('#checkoutDialog').showModal();
};
$('#langToggle').onclick = () => { currentLanguage = currentLanguage === 'tr' ? 'en' : 'tr'; applyLanguage(); };

$('#referenceInput').onchange = event => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (file.size > 2_500_000) { showToast('Referans görseli 2.5 MB’dan küçük olmalı.'); event.target.value = ''; return; }
  const reader = new FileReader();
  reader.onload = () => { window.ecrenReferenceData = reader.result; $('#referencePreview').innerHTML = `<img src="${reader.result}" alt="Yüklenen proje referansı"><button type="button" id="removeReference">Kaldır ×</button>`; };
  reader.readAsDataURL(file);
};

$('#referencePreview').onclick = event => {
  if (event.target.id !== 'removeReference') return;
  window.ecrenReferenceData = '';
  $('#referenceInput').value = '';
  $('#referencePreview').innerHTML = '<span>İsteğe bağlı: bir fotoğraf veya renk referansı yükle.</span>';
};

$('#profileForm').onsubmit = event => {
  event.preventDefault();
  if (window.LilyumAccount?.isSignedIn()) return;
  profile = { name: $('#profileName').value.trim(), email: $('#profileEmail').value.trim(), city: $('#profileCity').value.trim() };
  saveFeature(featureKeys.profile, profile);
  showToast('Profil bilgilerin bu cihazda kaydedildi.');
};

$('#saveCommerce').onclick = () => {
  if (!window.LilyumAccount?.isAdmin()) return;
  const nextSettings = commerceFormValue();
  if (nextSettings.enabled && !updatePaymentCheck(nextSettings)) { showToast('Online ödeme için güvenli HTTPS adresini tamamla.'); return; }
  commerceSettings = nextSettings;
  saveFeature(featureKeys.commerce, commerceSettings);
  renderCommerce();
  renderCart();
  showToast(onlinePaymentReady() ? 'Güvenli ödeme akışı etkinleştirildi.' : 'Sipariş talebi modu etkin.');
};

$('#validateCommerce').onclick = () => {
  if (!window.LilyumAccount?.isAdmin()) return;
  const settings = commerceFormValue();
  const valid = updatePaymentCheck(settings);
  showToast(valid ? 'Yapılandırma geçerli; kaydederek etkinleştirebilirsin.' : settings.enabled ? 'Ödeme yapılandırmasını tamamla.' : 'Online ödeme şu an kapalı.');
};

['paymentEnabled', 'paymentProvider', 'checkoutEndpoint'].forEach(id => $(`#${id}`).addEventListener('input', () => updatePaymentCheck(commerceFormValue())));

async function syncCatalog(direction) {
  if (!window.LilyumAccount?.isAdmin()) return;
  const endpoint = $('#catalogEndpoint').value.trim();
  if (!endpoint) { showToast('Önce katalog endpoint adresini eklemelisin.'); return; }
  catalogSettings = { endpoint };
  saveFeature(featureKeys.catalog, catalogSettings);
  renderCatalogSync();
  try {
    const response = await fetch(endpoint, direction === 'pull' ? { credentials: 'include' } : { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ works }) });
    if (!response.ok) throw new Error('Catalog unavailable');
    if (direction === 'pull') {
      const payload = await response.json();
      if (!Array.isArray(payload.works)) throw new Error('Invalid catalog');
      works = payload.works.map((work, index) => ({ ...defaultWorks[index % defaultWorks.length], ...work, id: work.id || `work-${Date.now()}-${index}` }));
      saveWorks();
      renderAll();
    }
    showToast(direction === 'pull' ? 'Katalog sunucudan güncellendi.' : 'Katalog değişiklikleri sunucuya gönderildi.');
  } catch { showToast('Katalog senkronizasyonu başarısız; endpoint ve oturumu kontrol et.'); }
}

$('#pullCatalog').onclick = () => syncCatalog('pull');
$('#pushCatalog').onclick = () => syncCatalog('push');

$('#checkoutForm').onsubmit = async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = form.querySelector('button[type="submit"]');
  const totalValue = cart.reduce((sum, item) => sum + priceNumber(works.find(work => work.id === item.id)?.price) * item.qty, 0);
  const payload = { customer: Object.fromEntries(new FormData(form)), items: cart.map(item => ({ ...item, title: works.find(work => work.id === item.id)?.title })), amount: totalValue, currency: commerceSettings.currency, provider: commerceSettings.provider };
  submit.disabled = true;
  if (onlinePaymentReady()) {
    try {
      const response = await fetch(commerceSettings.endpoint, { method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error('Checkout unavailable');
      const result = await response.json();
      const checkoutUrl = new URL(result.checkoutUrl);
      if (!isSecurePaymentUrl(checkoutUrl.href)) throw new Error('Invalid checkout URL');
      window.location.assign(checkoutUrl.href);
      return;
    } catch { showToast('Ödeme servisine ulaşılamadı; ayarları kontrol et.'); }
  } else {
    const number = `LD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    orders.push({ number, date: new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date()), status: 'Gönderime hazır', total: money(totalValue), items: [...cart], customer: payload.customer });
    saveFeature(featureKeys.orders, orders);
    cart = [];
    renderCart();
    renderOrders();
    form.reset();
    $('#checkoutDialog').close();
    showToast(`${number} hazır. Siparişlerimden stüdyoya gönderebilirsin.`);
    openPanel('userPanel');
    const ordersTab = $('[data-user-tab="orders"]');
    ordersTab.click();
  }
  submit.disabled = false;
};

document.addEventListener('keydown', event => {
  if (!$('#galleryDialog').open) return;
  if (event.key === 'ArrowRight') { galleryIndex += 1; renderGallery(); }
  if (event.key === 'ArrowLeft') { galleryIndex -= 1; renderGallery(); }
});

let galleryTouchX = 0;
$('#galleryStage').addEventListener('touchstart', event => { galleryTouchX = event.touches[0].clientX; }, { passive: true });
$('#galleryStage').addEventListener('touchend', event => { const delta = event.changedTouches[0].clientX - galleryTouchX; if (Math.abs(delta) > 45) { galleryIndex += delta < 0 ? 1 : -1; renderGallery(); } }, { passive: true });

applyLanguage();
window.renderFeatureLayers();

if ('serviceWorker' in navigator && !['localhost', '127.0.0.1'].includes(location.hostname)) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js?v=20260819-1', { updateViaCache: 'none' }).then(registration => registration.update()).catch(() => {}));
}
