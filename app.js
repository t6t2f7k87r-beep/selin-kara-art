const defaultWorks = [
  { title: 'Quiet Riot', type: 'Fine Art Print', price: '₺1.850', color: '#bfd7ce', image: '' },
  { title: 'Sundown Club', type: 'Limited Edition / 30', price: '₺2.400', color: '#e9c176', image: '' },
  { title: 'Blue Hour', type: 'Fine Art Print', price: '₺1.850', color: '#9b9cc5', image: '' }
];
const storageKey = 'selin-kara-works';
let works = JSON.parse(localStorage.getItem(storageKey) || 'null') || defaultWorks;
const grid = document.querySelector('#worksGrid');
const adminList = document.querySelector('#adminList');
function saveWorks() { localStorage.setItem(storageKey, JSON.stringify(works)); }
function thumbnail(work) { return work.image ? `<img src="${work.image}" alt="${work.title}">` : `<span>${(work.title || '?')[0]}</span>`; }
function renderWorks() {
  grid.innerHTML = works.map(work => `<article class="work"><div class="work-image" style="background:${work.color};color:#fff">${thumbnail(work)}</div><div class="work-info"><div><b>${work.title}</b><br><span>${work.type}</span></div><b>${work.price}</b></div></article>`).join('');
  renderAdmin();
}
function renderAdmin() {
  adminList.innerHTML = works.map((work, index) => `<div class="admin-row"><div class="admin-thumb" style="background:${work.color}">${thumbnail(work)}</div><input data-index="${index}" data-field="title" value="${work.title}" aria-label="Eser adı"><input data-index="${index}" data-field="type" value="${work.type}" aria-label="Eser türü"><input data-index="${index}" data-field="price" value="${work.price}" aria-label="Fiyat"><label class="upload-label">GÖRSEL YÜKLE<input type="file" accept="image/*" data-upload="${index}"></label><button class="delete-work" data-delete="${index}" aria-label="Eseri sil">×</button></div>`).join('');
}
renderWorks();
adminList.addEventListener('input', event => { const input = event.target; if (!input.dataset.field) return; works[input.dataset.index][input.dataset.field] = input.value; saveWorks(); renderWorks(); });
adminList.addEventListener('click', event => { const button = event.target.closest('[data-delete]'); if (!button) return; works.splice(button.dataset.delete, 1); saveWorks(); renderWorks(); });
adminList.addEventListener('change', event => { const input = event.target; if (!input.dataset.upload || !input.files[0]) return; const reader = new FileReader(); reader.onload = () => { works[input.dataset.upload].image = reader.result; saveWorks(); renderWorks(); }; reader.readAsDataURL(input.files[0]); });
document.querySelector('#addWork').onclick = () => { works.push({ title: 'Yeni eser', type: 'Orijinal çizim', price: '₺0', color: '#e8654f', image: '' }); saveWorks(); renderWorks(); };
const briefDialog = document.querySelector('#briefDialog'); const adminDialog = document.querySelector('#adminDialog');
document.querySelector('#openBrief').onclick = () => briefDialog.showModal(); document.querySelector('#closeBrief').onclick = () => briefDialog.close(); document.querySelector('#openAdmin').onclick = () => adminDialog.showModal(); document.querySelector('#closeAdmin').onclick = () => adminDialog.close();
[briefDialog, adminDialog].forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); }));
document.querySelector('#generateBrief').onclick = () => { const idea = document.querySelector('#ideaInput').value.trim(); const out = document.querySelector('#aiResult'); if (!idea) { out.textContent = 'Önce fikrinden birkaç cümle paylaş; gerisini birlikte netleştirelim.'; out.classList.add('show'); return; } const words = idea.split(/\s+/).length; out.innerHTML = `<b>İlk proje yönü</b><br>Bu ${words} kelimelik brief, özgün bir proje için sağlam bir başlangıç. Atmosferi yüksek bir renk hikâyesi, ana konsept ve iki ayrı eskiz yönüyle ilerlemeyi öneriyorum. Tahmini süreç: 2–3 hafta.`; out.classList.add('show'); };
