/* Shared ranking snapshots. Firebase rules, not the local Lab gate, authorize writes. */
(function () {
  'use strict';
  let config, session = null;
  async function request(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const r = await fetch(url, { cache: 'no-store', ...options, signal: controller.signal });
      if (!r.ok) throw new Error(r.status === 412 ? 'This week changed on another device. Refresh and try again.' :
        r.status === 401 || r.status === 403 ? 'Publishing access is not enabled. Check your sign-in and Firebase rules.' : 'The rankings service could not complete the request. Try again.');
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
  async function url(key = '') { const c = await settings(); return `${c.base}/rankings/${c.year}${key === '' ? '' : '/' + key}.json`; }
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
    session = { token: data.idToken, refresh: data.refreshToken, apiKey, until: Date.now() + Number(data.expiresIn) * 1000 };
    return data.localId;
  }
  async function token() {
    if (!session) throw new Error('Sign in to publish.');
    if (Date.now() > session.until - 60000) {
      const { data } = await request(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(session.apiKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: session.refresh }).toString() });
      session.token = data.id_token; session.refresh = data.refresh_token; session.until = Date.now() + Number(data.expires_in) * 1000;
    }
    return session.token;
  }
  async function write(key, p, etag) {
    if (!Number.isInteger(key) || key < 0 || key > 25 || (p !== null && (!valid(p) || p.k !== key))) throw new Error('All twelve teams are required before publishing.');
    if (!etag) throw new Error('Could not check the current version. Refresh and try again.');
    const endpoint = await url(key);
    const { data } = await request(endpoint + '?auth=' + encodeURIComponent(await token()), { method: 'PUT', headers: { 'Content-Type': 'application/json', 'if-match': etag }, body: JSON.stringify(p) });
    if (JSON.stringify(data) !== JSON.stringify(p)) {
      // Firebase may reorder object keys; compare semantic content instead.
      if (p === null ? data !== null : !valid(data) || data.k !== p.k || JSON.stringify(data.o) !== JSON.stringify(p.o)) throw new Error('The save could not be confirmed. Refresh before retrying.');
    }
    return data;
  }
  window.RankingStore = { list, valid, signIn, signedIn: () => !!session, signOut: () => { session = null; },
    current: async key => request(await url(key), { headers: { 'X-Firebase-ETag': 'true' } }), write };
})();
