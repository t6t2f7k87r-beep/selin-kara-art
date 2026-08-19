(() => {
  'use strict';

  const config = window.LILYUM_CONFIG || {};
  const demoKeys = {
    accounts: 'lilyum-demo-accounts-v1',
    session: 'lilyum-demo-session-v1',
    favorites: id => `lilyum-demo-favorites-v1:${id}`,
    profile: id => `lilyum-demo-profile-v1:${id}`
  };
  const state = { mode: 'demo', client: null, user: null, profile: null, favorites: [], snapshots: {} };
  const demoOwnerIdentity = Object.freeze({
    id: 'lilyum-owner-ecren-isik',
    email: 'studio@lilyum.local',
    username: 'ecren isik',
    name: 'Ecren Işık',
    role: 'admin',
    createdAt: '2026-08-19T00:00:00.000Z'
  });
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const notify = message => typeof window.showToast === 'function' ? window.showToast(message) : undefined;
  const parsePrice = value => Number(String(value || '').replace(/[^\d]/g, '')) || 0;
  const formatPrice = value => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value);
  const safeId = () => crypto.randomUUID?.() || `user-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const canonical = value => String(value || '').trim().toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');
  const canBootstrapLocalOwner = () => ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);

  async function hashPassword(password, salt) {
    const bytes = new TextEncoder().encode(`${salt}:${password}`);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  function setMessage(message = '', success = false) {
    const target = $('#authMessage');
    if (!target) return;
    target.textContent = message;
    target.classList.toggle('success', success);
  }

  function setBusy(form, busy) {
    const button = form?.querySelector('button[type="submit"]');
    if (button) button.disabled = busy;
  }

  function profileName() {
    return state.profile?.display_name || state.user?.user_metadata?.display_name || state.user?.name || state.user?.email?.split('@')[0] || 'sanatsever';
  }

  function isAdmin() { return state.profile?.role === 'admin'; }
  function isSignedIn() { return Boolean(state.user); }

  function renderIdentity() {
    const adminAllowed = isAdmin();
    const signedIn = isSignedIn();
    $$('[data-guest-only]').forEach(element => { element.hidden = signedIn; });
    $$('[data-auth-only]').forEach(element => { element.hidden = !signedIn; });
    ['#openAdmin', '#mobileAdmin'].forEach(selector => { const element = $(selector); if (element) element.hidden = !adminAllowed; });
    const accountAdmin = $('#accountAdmin');
    if (accountAdmin) accountAdmin.hidden = !adminAllowed;
    const adminDialog = $('#adminDialog');
    adminDialog?.classList.toggle('authorized', adminAllowed);
    if (adminDialog) adminDialog.inert = !adminAllowed;
    const greeting = $('#accountGreeting');
    const email = $('#accountEmail');
    if (greeting) greeting.textContent = profileName();
    if (email) email.textContent = isAdmin() && state.mode === 'demo' ? 'Özel stüdyo hesabı' : (state.user?.email || '');
    const profileNameInput = $('#profileName');
    const profileEmailInput = $('#profileEmail');
    const profileCityInput = $('#profileCity');
    if (profileNameInput) profileNameInput.value = state.profile?.display_name || state.user?.user_metadata?.display_name || state.user?.name || '';
    if (profileEmailInput) profileEmailInput.value = state.user?.email || '';
    if (profileCityInput) profileCityInput.value = state.profile?.city || '';
    $('.user-dot')?.classList.toggle('authenticated', signedIn);
    const adminName = $('.admin-profile b');
    if (adminName && adminAllowed) adminName.textContent = profileName();
  }

  function applyFavorites(records = []) {
    state.favorites = records.map(record => record.artwork_id || record.id).filter(Boolean);
    state.snapshots = Object.fromEntries(records.map(record => [record.artwork_id || record.id, Number(record.price_at_save ?? record.priceAtSave ?? 0)]));
    window.lilyumSetFavorites?.(state.favorites);
  }

  function demoAccounts() { return read(demoKeys.accounts, []); }

  async function demoSignUp(name, email, password) {
    const normalizedEmail = email.trim().toLocaleLowerCase('tr-TR');
    const accounts = demoAccounts();
    if (accounts.some(account => account.email === normalizedEmail)) throw new Error('Bu e-posta ile daha önce hesap oluşturulmuş.');
    const salt = safeId();
    const account = { id: safeId(), email: normalizedEmail, name: name.trim(), salt, passwordHash: await hashPassword(password, salt), role: 'member', createdAt: new Date().toISOString() };
    accounts.push(account);
    write(demoKeys.accounts, accounts);
    write(demoKeys.session, account.id);
    state.user = { id: account.id, email: account.email, name: account.name, user_metadata: { display_name: account.name } };
    state.profile = { id: account.id, display_name: account.name, city: '', role: account.role };
    write(demoKeys.profile(account.id), state.profile);
  }

  async function demoSignIn(identifier, password) {
    const normalized = canonical(identifier);
    const accounts = demoAccounts();
    let account = accounts.find(item => canonical(item.email) === normalized || canonical(item.username) === normalized || canonical(item.name) === normalized);
    if (!account && canBootstrapLocalOwner() && normalized === canonical(demoOwnerIdentity.name)) {
      const salt = safeId();
      account = { ...demoOwnerIdentity, salt, passwordHash: await hashPassword(password, salt) };
      accounts.push(account);
      write(demoKeys.accounts, accounts);
    }
    if (!account || account.passwordHash !== await hashPassword(password, account.salt)) throw new Error('E-posta veya şifre hatalı.');
    write(demoKeys.session, account.id);
    state.user = { id: account.id, email: account.email, name: account.name, user_metadata: { display_name: account.name } };
    state.profile = read(demoKeys.profile(account.id), { id: account.id, display_name: account.name, city: '', role: account.role });
  }

  function restoreDemoSession() {
    const sessionId = read(demoKeys.session, null);
    const account = demoAccounts().find(item => item.id === sessionId);
    if (!account) return;
    state.user = { id: account.id, email: account.email, name: account.name, user_metadata: { display_name: account.name } };
    state.profile = read(demoKeys.profile(account.id), { id: account.id, display_name: account.name, city: '', role: account.role });
  }

  function demoFavoriteRecords() { return state.user ? read(demoKeys.favorites(state.user.id), []) : []; }

  function rowToWork(row) {
    return {
      id: row.id,
      title: row.title,
      type: row.type_label,
      category: row.category,
      price: formatPrice(row.price_amount),
      color: row.color || '#8067e8',
      image: row.image_url || '',
      year: String(row.year || new Date().getFullYear()),
      size: row.size_label || '',
      edition: row.edition_label || '',
      description: row.description || ''
    };
  }

  function workToRow(work) {
    return {
      id: work.id,
      title: work.title,
      type_label: work.type,
      category: work.category,
      price_amount: parsePrice(work.price),
      color: work.color || '#8067e8',
      image_url: work.image?.startsWith('data:') ? null : (work.image || null),
      year: Number(work.year) || new Date().getFullYear(),
      size_label: work.size || '',
      edition_label: work.edition || '',
      description: work.description || '',
      published: true,
      updated_at: new Date().toISOString()
    };
  }

  async function loadRemoteWorks() {
    if (!state.client) return;
    const { data, error } = await state.client.from('artworks').select('*').eq('published', true).order('display_order').order('created_at');
    if (!error && data?.length) window.lilyumSetWorks?.(data.map(rowToWork));
  }

  async function loadProfile() {
    if (!state.user) { state.profile = null; return; }
    if (state.mode === 'demo') {
      state.profile = read(demoKeys.profile(state.user.id), state.profile || { id: state.user.id, display_name: profileName(), city: '', role: 'member' });
      return;
    }
    const { data } = await state.client.from('profiles').select('id, display_name, city, role').eq('id', state.user.id).maybeSingle();
    state.profile = data || { id: state.user.id, display_name: state.user.user_metadata?.display_name || '', city: '', role: 'member' };
  }

  async function loadFavorites() {
    if (!state.user) { applyFavorites([]); return; }
    if (state.mode === 'demo') { applyFavorites(demoFavoriteRecords()); return; }
    const { data, error } = await state.client.from('favorites').select('artwork_id, price_at_save').eq('user_id', state.user.id).order('created_at');
    if (!error) applyFavorites(data || []);
  }

  async function refreshAccount() {
    await loadProfile();
    await loadFavorites();
    renderIdentity();
  }

  function selectAuthTab(tab = 'login') {
    $$('.auth-tabs [data-auth-tab]').forEach(item => item.classList.toggle('active', item.dataset.authTab === tab));
    $$('.auth-form').forEach(form => form.classList.toggle('active', form.id === `${tab}Form`));
    const title = $('#authTitle');
    if (title) title.innerHTML = tab === 'register' ? 'Koleksiyonunu<br><em>oluştur.</em>' : 'Koleksiyonuna<br><em>geri dön.</em>';
  }

  function openAuth(message = '', tab = 'login') {
    selectAuthTab(tab);
    setMessage(message);
    const dialog = $('#authDialog');
    if (dialog && !dialog.open) dialog.showModal();
  }

  function closeAuth() { const dialog = $('#authDialog'); if (dialog?.open) dialog.close(); }

  async function openAccount() {
    if (!isSignedIn()) { openAuth('Favorilerini ve fiyat değişikliklerini görmek için giriş yap.'); return; }
    await refreshAccount();
    window.openPanel?.('userPanel');
  }

  function openAdmin() {
    if (!isAdmin()) { notify('Bu alan yalnızca doğrulanmış stüdyo sahibine açıktır.'); return; }
    window.renderAdmin?.();
    const dialog = $('#adminDialog');
    if (dialog && !dialog.open) dialog.showModal();
  }

  async function toggleFavorite(id, priceLabel) {
    if (!state.user) { openAuth('Favori eklemek için koleksiyon hesabına giriş yap.'); return null; }
    const current = state.favorites.includes(id);
    const price = parsePrice(priceLabel);
    if (state.mode === 'demo') {
      const records = demoFavoriteRecords();
      const next = current ? records.filter(record => record.id !== id) : [...records, { id, priceAtSave: price, createdAt: new Date().toISOString() }];
      write(demoKeys.favorites(state.user.id), next);
      applyFavorites(next);
    } else if (current) {
      const { error } = await state.client.from('favorites').delete().eq('user_id', state.user.id).eq('artwork_id', id);
      if (error) throw error;
      await loadFavorites();
    } else {
      const { error } = await state.client.from('favorites').insert({ user_id: state.user.id, artwork_id: id, price_at_save: price });
      if (error) throw error;
      await loadFavorites();
    }
    return [...state.favorites];
  }

  function getPriceWatch(id, currentPriceLabel) {
    if (!state.favorites.includes(id)) return null;
    const saved = Number(state.snapshots[id] || 0);
    const current = parsePrice(currentPriceLabel);
    if (!saved || saved === current) return { changed: false, text: 'Fiyat takibinde' };
    const difference = current - saved;
    return { changed: true, text: difference < 0 ? `${formatPrice(Math.abs(difference))} düştü` : `${formatPrice(difference)} arttı` };
  }

  async function updateProfile(values) {
    if (!state.user) return;
    const next = { ...state.profile, id: state.user.id, display_name: values.displayName.trim(), city: values.city.trim() };
    if (state.mode === 'demo') write(demoKeys.profile(state.user.id), next);
    else {
      const { error } = await state.client.from('profiles').update({ display_name: next.display_name, city: next.city, updated_at: new Date().toISOString() }).eq('id', state.user.id);
      if (error) throw error;
    }
    state.profile = next;
    renderIdentity();
  }

  async function signOut() {
    if (state.mode === 'demo') localStorage.removeItem(demoKeys.session);
    else await state.client.auth.signOut();
    state.user = null;
    state.profile = null;
    applyFavorites([]);
    renderIdentity();
    window.closePanel?.('userPanel');
    notify('Oturum güvenle kapatıldı.');
  }

  async function saveWork(work) {
    if (!isAdmin() || state.mode === 'demo') return false;
    const { error } = await state.client.from('artworks').upsert(workToRow(work));
    if (error) throw error;
    return true;
  }

  async function deleteWork(id) {
    if (!isAdmin() || state.mode === 'demo') return false;
    const { error } = await state.client.from('artworks').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  async function uploadArtwork(file, workId) {
    if (!isAdmin() || state.mode === 'demo' || !file) return null;
    const extension = (file.name.split('.').pop() || 'jpg').toLocaleLowerCase('en-US').replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = `${workId}/${Date.now()}.${extension}`;
    const { error } = await state.client.storage.from('artworks').upload(path, file, { cacheControl: '31536000', upsert: false });
    if (error) throw error;
    const { data } = state.client.storage.from('artworks').getPublicUrl(path);
    return data.publicUrl;
  }

  function bindUI() {
    $$('.auth-tabs [data-auth-tab]').forEach(button => button.addEventListener('click', () => {
      selectAuthTab(button.dataset.authTab);
      setMessage('');
    }));
    $('#headerLogin')?.addEventListener('click', () => openAuth('', 'login'));
    $('#headerRegister')?.addEventListener('click', () => openAuth('', 'register'));
    $('#mobileLogin')?.addEventListener('click', () => { window.lilyumCloseMobileMenu?.(); openAuth('', 'login'); });
    $('#mobileRegister')?.addEventListener('click', () => { window.lilyumCloseMobileMenu?.(); openAuth('', 'register'); });
    $('#accountAdmin')?.addEventListener('click', () => { window.closePanel?.('userPanel'); openAdmin(); });
    $('#closeAuth')?.addEventListener('click', closeAuth);
    $('#authDialog')?.addEventListener('click', event => { if (event.target === $('#authDialog')) closeAuth(); });

    $('#loginForm')?.addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      setBusy(form, true); setMessage('');
      try {
        if (state.mode === 'demo') await demoSignIn(data.get('email'), data.get('password'));
        else {
          const result = await state.client.auth.signInWithPassword({ email: String(data.get('email')).trim(), password: String(data.get('password')) });
          if (result.error) throw result.error;
          state.user = result.data.user;
        }
        await refreshAccount();
        closeAuth();
        window.openPanel?.('userPanel');
        notify('Koleksiyonuna hoş geldin.');
      } catch (error) { setMessage(error?.message || 'Giriş yapılamadı. Bilgilerini kontrol et.'); }
      finally { setBusy(form, false); }
    });

    $('#registerForm')?.addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      setBusy(form, true); setMessage('');
      try {
        if (state.mode === 'demo') await demoSignUp(data.get('name'), data.get('email'), data.get('password'));
        else {
          const result = await state.client.auth.signUp({ email: String(data.get('email')).trim(), password: String(data.get('password')), options: { data: { display_name: String(data.get('name')).trim() }, emailRedirectTo: `${config.siteUrl || location.origin}/` } });
          if (result.error) throw result.error;
          state.user = result.data.user;
          if (!result.data.session) { setMessage('Hesabın oluşturuldu. E-postana gelen doğrulama bağlantısını aç.', true); return; }
        }
        await refreshAccount();
        closeAuth();
        window.openPanel?.('userPanel');
        notify('Kişisel koleksiyon hesabın oluşturuldu.');
      } catch (error) { setMessage(error?.message || 'Hesap oluşturulamadı.'); }
      finally { setBusy(form, false); }
    });

    $('#profileForm')?.addEventListener('submit', async event => {
      event.preventDefault();
      try {
        await updateProfile({ displayName: $('#profileName')?.value || '', city: $('#profileCity')?.value || '' });
        notify('Profilin güncellendi.');
      } catch { notify('Profil şu anda güncellenemedi.'); }
    });
    $('#accountLogout')?.addEventListener('click', signOut);
  }

  async function init() {
    bindUI();
    const remoteReady = Boolean(config.supabaseUrl && config.supabasePublishableKey && window.supabase?.createClient);
    if (remoteReady) {
      state.mode = 'supabase';
      state.client = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
      const { data } = await state.client.auth.getSession();
      state.user = data.session?.user || null;
      state.client.auth.onAuthStateChange((_event, session) => {
        state.user = session?.user || null;
        setTimeout(() => refreshAccount().catch(() => {}), 0);
      });
      await loadRemoteWorks();
    } else restoreDemoSession();
    await refreshAccount();
  }

  window.LilyumAccount = { init, isSignedIn, isAdmin, openAuth, openAccount, openAdmin, toggleFavorite, getPriceWatch, saveWork, deleteWork, uploadArtwork, signOut, get mode() { return state.mode; } };
  init().catch(() => { state.mode = 'demo'; restoreDemoSession(); refreshAccount(); });
})();
