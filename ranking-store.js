/* Shared ranking snapshots. Firebase rules, not the local Lab gate, authorize writes. */
(function () {
  'use strict';
  const SESSION_KEY = 'lh:publisher-session';
  const PUBLISHER_UID = '34sUlXl2ZebtCJfR97Hz4R9N6Jw1';
  let config, session = null, refreshing = null, generation = 0;
  const readSession = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(SESSION_KEY));
      return saved && saved.uid === PUBLISHER_UID && typeof saved.refresh === 'string' && /^AIza[\w-]+$/.test(saved.apiKey) ? { ...saved, token: null, until: 0 } : null;
    } catch (_) { return null; }
  };
  function remember() {
    try {
      if (session) localStorage.setItem(SESSION_KEY, JSON.stringify({ uid: session.uid, refresh: session.refresh, apiKey: session.apiKey }));
      else localStorage.removeItem(SESSION_KEY);
      return true;
    } catch (_) { return false; }
  }
  function signOut() { generation++; session = null; refreshing = null; remember(); }
  session = readSession();
  async function request(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const r = await fetch(url, { cache: 'no-store', ...options, signal: controller.signal });
      if (!r.ok) { const err = new Error(r.status === 412 ? 'This week changed on another device. Refresh and try again.' :
        r.status === 401 || r.status === 403 ? 'Publishing access is not enabled. Check your sign-in and Firebase rules.' : 'The rankings service could not complete the request. Try again.'); err.status = r.status; throw err; }
      return { data: await r.json(), etag: r.headers.get('etag') };
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('The save could not be confirmed. Check the Rankings tab before retrying.');
      throw e;
    } finally { clearTimeout(timer); }
  }
  async function settings() {
    if (!config) {
      const { data } = await request('parlay/current.json');
      if (!/^https:\/\/[a-z0-9-]+\.(?:firebaseio\.com|[a-z0-9-]+\.firebasedatabase\.app)$/.test(data.sync || '') || !Number.isInteger(data.y)) throw new Error('Shared rankings are not configured.');
      config = { base: data.sync, year: data.y };
    }
    return config;
  }
  function valid(p) {
    return p && p.v === 1 && Number.isInteger(p.k) && p.k >= 0 && p.k <= 25 && typeof p.l === 'string' && typeof p.d === 'string' && Array.isArray(p.o) && p.o.length === 12 && p.o.every(r => Array.isArray(r) && typeof r[0] === 'string' && typeof r[3] === 'string') && new Set(p.o.map(r => r[0])).size === 12;
  }
  async function url(key = '', year) { const c = await settings(); const y = year == null ? c.year : year; if (!Number.isInteger(y) || y < 2000 || y > 2200) throw new Error('Invalid season.'); return `${c.base}/rankings/${y}${key === '' ? '' : '/' + key}.json`; }
  async function list(currentOnly = false) {
    const c = await settings();
    const { data } = await request(`${c.base}/rankings.json`);
    const result = [];
    Object.entries(data || {}).forEach(([year, weeks]) => {
      if (!/^\d{4}$/.test(year) || (currentOnly && Number(year) !== c.year)) return;
      Object.entries(weeks || {}).forEach(([key, p]) => {
        if (!valid(p) || String(p.k) !== key) throw new Error('A published week could not be read.');
        result.push({ ...p, y: Number(year) });
      });
    });
    return result.sort((a,b) => b.y - a.y || b.k - a.k);
  }
  async function signIn(apiKey, email, password) {
    if (!/^AIza[\w-]+$/.test(apiKey)) throw new Error('Enter the Firebase Web API key from Project settings.');
    const { data } = await request(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) });
    if (data.localId !== PUBLISHER_UID) { signOut(); throw new Error('This account is not the league publisher. Use your publisher email.'); }
    generation++;
    session = { uid: data.localId, token: data.idToken, refresh: data.refreshToken, apiKey, until: Date.now() + Number(data.expiresIn) * 1000 };
    const remembered = remember();
    try { localStorage.setItem('lh:publisher-api', apiKey); localStorage.setItem('lh:publisher-email', email); } catch (_) {}
    return { uid: data.localId, remembered };
  }
  async function token() {
    if (!session) throw new Error('Sign in to publish.');
    if (session.token && Date.now() < session.until - 60000) return session.token;
    if (refreshing) return refreshing;
    const active = session, epoch = generation;
    const work = (async () => {
      try {
        const { data } = await request(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(active.apiKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: active.refresh }).toString() });
        if (epoch !== generation || session !== active) throw new Error('Signed out. Sign in to publish.');
        if (data.user_id !== PUBLISHER_UID) { signOut(); throw new Error('Sign in with the league publisher account.'); }
        session = { ...active, token: data.id_token, refresh: data.refresh_token, until: Date.now() + Number(data.expires_in) * 1000 };
        remember();
        return session.token;
      } catch (err) {
        if (epoch === generation && [400,401,403].includes(err.status)) {
          signOut(); throw new Error('Your sign-in has expired. Sign in again to continue.');
        }
        throw err;
      }
    })();
    refreshing = work;
    try { return await work; } finally { if (refreshing === work) refreshing = null; }
  }
  async function restore() {
    if (!session) return false;
    try { await token(); return true; } catch (_) { return false; }
  }
  function signedIn() { return !!(session && session.uid === PUBLISHER_UID && session.token); }
  function signInForm(host, onDone) {
    host.innerHTML = `<form class="pr-publisher-login">
      <b>Sign in once on this device</b>
      <p class="pr-note">You’ll stay signed in for publishing. Your password is never saved.</p>
      <label class="pr-by"><span>Firebase Web API key</span><input name="api" id="pr-api" required autocomplete="off"></label>
      <label class="pr-by"><span>Email</span><input name="email" id="pr-email" type="email" required autocomplete="username"></label>
      <label class="pr-by"><span>Password</span><input name="password" id="pr-password" type="password" required autocomplete="current-password"></label>
      <button class="pr-btn primary" type="submit">Sign in and continue</button><p role="status" class="pr-note"></p>
    </form>`;
    const form = host.querySelector('form');
    try { form.elements.api.value = localStorage.getItem('lh:publisher-api') || ''; form.elements.email.value = localStorage.getItem('lh:publisher-email') || ''; } catch (_) {}
    form.onsubmit = async e => {
      e.preventDefault(); const button = form.querySelector('button'); button.disabled = true;
      try {
        const result = await signIn(form.elements.api.value.trim(), form.elements.email.value.trim(), form.elements.password.value);
        form.elements.password.value = '';
        if (!result.remembered) { form.querySelector('[role=status]').textContent = 'Signed in for this visit. Your browser is blocking saved sign-ins.'; }
        else host.textContent = 'Signed in on this device.';
        await onDone();
      } catch (err) { if (form.isConnected) form.querySelector('[role=status]').textContent = err.message; }
      finally { button.disabled = false; }
    };
  }
  async function write(key, p, etag, year) {
    if (!Number.isInteger(key) || key < 0 || key > 25 || (p !== null && (!valid(p) || p.k !== key))) throw new Error('All twelve teams are required before publishing.');
    if (!etag) throw new Error('Could not check the current version. Refresh and try again.');
    const endpoint = await url(key, year);
    const { data } = await request(endpoint + '?auth=' + encodeURIComponent(await token()), { method: 'PUT', headers: { 'Content-Type': 'application/json', 'if-match': etag }, body: JSON.stringify(p) });
    if (JSON.stringify(data) !== JSON.stringify(p)) {
      // Firebase may reorder object keys; compare semantic content instead.
      if (p === null ? data !== null : !valid(data) || data.k !== p.k || JSON.stringify(data.o) !== JSON.stringify(p.o)) throw new Error('The save could not be confirmed. Refresh before retrying.');
    }
    return data;
  }
  window.addEventListener('storage', event => {
    if (event.key !== SESSION_KEY && event.key !== null) return;
    generation++; refreshing = null; session = readSession();
    window.dispatchEvent(new Event('publisher-session-changed'));
  });
  window.RankingStore = { list, valid, signIn, signedIn, signOut, restore, signInForm, hasSession: () => !!session,
    current: async (key, year) => request(await url(key, year), { headers: { 'X-Firebase-ETag': 'true' } }), write };
})();
