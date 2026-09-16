/* Owner controls on the same ranking snapshot all members read. */
(function () {
  'use strict';
  const store = window.RankingStore;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let editing = false;
  const owner = () => store.signedIn() || !!(window.LeagueOwner && window.LeagueOwner.is());
  async function mount(host, snapshot, onChanged) {
    await store.restore();
    if (!host.isConnected || !owner()) return;
    editing = false;
    host.innerHTML = `<div class="pr-card pr-actions">
      ${snapshot ? '<button type="button" class="pr-btn primary" data-edit>Edit rankings</button><button type="button" class="pr-btn" data-remove>Unpublish</button>' : ''}
      <a class="pr-btn" href="power.html">Prepare this week</a>
      ${store.signedIn() ? '<button type="button" class="pr-btn ghost" data-signout>Sign out of publishing</button>' : ''}
      <div data-output role="status" class="pr-note"></div><div data-editor></div>
    </div>`;
    const output = host.querySelector('[data-output]'), panel = host.querySelector('[data-editor]');
    const auth = async action => {
      await store.restore();
      if (!store.signedIn()) {
        if (store.hasSession()) { output.textContent = 'Could not reconnect your saved sign-in. Check your connection and try again.'; return; }
        store.signInForm(panel, action); return;
      }
      await action();
    };
    let busy = false;
    function disable(value) { busy = value; host.querySelectorAll('[data-edit],[data-remove],[data-signout]').forEach(b => { b.disabled = value; }); }
    async function remove() {
      if (busy) return;
      disable(true);
      try {
        const current = await store.current(snapshot.k, snapshot.y);
        if (!current.data) { await onChanged(); return; }
        if (!confirm(`Unpublish ${snapshot.y} · ${snapshot.l}? It will be removed for everyone.`)) return;
        await store.write(snapshot.k, null, current.etag, snapshot.y);
        editing = false;
        await onChanged();
      } catch (err) { output.textContent = err.message; }
      finally { disable(false); }
    }
    async function edit() {
      if (busy) return;
      disable(true); output.textContent = 'Opening your saved rankings…';
      try {
        const current = await store.current(snapshot.k, snapshot.y);
        if (!store.valid(current.data)) throw new Error('This week is no longer published. Refresh Rankings.');
        const key = `lh:ranking-edit:${snapshot.y}:${snapshot.k}`;
        let draft = JSON.parse(JSON.stringify(current.data));
        try {
          const saved = JSON.parse(localStorage.getItem(key));
          if (saved && saved.etag === current.etag && store.valid(saved.draft)) draft = saved.draft;
        } catch (_) {}
        const persist = () => { try { localStorage.setItem(key, JSON.stringify({etag:current.etag,draft})); } catch (_) {} };
        const publishedList = host.nextElementSibling;
        if (publishedList && publishedList.matches('.pr-list')) publishedList.style.display = 'none';
        editing = true; output.textContent = 'Only you can see these edits until you save.';
        function render() {
          panel.innerHTML = `<form class="lg-ranking-edit">
            <label class="pr-by"><span>Published by</span><input name="byline" maxlength="40" value="${esc(draft.b || '')}"></label>
            <ol class="pr-list">${draft.o.map((row,i) => `<li class="pr-row"><div class="pr-body">
              <b>${i+1}. ${esc(row[0])}</b>
              <div class="lg-ranking-move"><button type="button" class="pr-btn" data-up="${i}" ${i===0?'disabled':''} aria-label="Move ${esc(row[0])} up">↑ Up</button><button type="button" class="pr-btn" data-down="${i}" ${i===11?'disabled':''} aria-label="Move ${esc(row[0])} down">↓ Down</button></div>
              <label class="pr-by"><span>Write-up for ${esc(row[0])}</span><textarea class="pr-take" rows="4" maxlength="420" data-note="${i}">${esc(row[3])}</textarea></label>
            </div></li>`).join('')}</ol>
            <button type="submit" class="pr-btn primary">Save changes for everyone</button>
            <button type="button" class="pr-btn ghost" data-cancel>Back to published rankings</button>
            <p data-save-status role="status" class="pr-note"></p>
          </form>`;
          const form = panel.querySelector('form');
          form.elements.byline.oninput = e => { draft.b = e.target.value; persist(); };
          form.querySelectorAll('[data-note]').forEach(input => { input.oninput = () => { draft.o[Number(input.dataset.note)][3] = input.value; persist(); }; });
          form.querySelectorAll('[data-up],[data-down]').forEach(button => { button.onclick = () => {
            const i = Number(button.dataset.up ?? button.dataset.down), j = i + (button.dataset.up != null ? -1 : 1);
            [draft.o[i],draft.o[j]]=[draft.o[j],draft.o[i]]; persist(); render();
            const movedButton = panel.querySelector(`[data-${j===0?'down':'up'}="${j}"]`); if(movedButton) movedButton.focus();
          }; });
          form.querySelector('[data-cancel]').onclick = () => { editing = false; onChanged(); };
          form.onsubmit = async e => {
            e.preventDefault();
            const status = form.querySelector('[data-save-status]');
            const controls = [...form.querySelectorAll('button,input,textarea')].map(b => [b, b.disabled]);
            controls.forEach(([b]) => b.disabled = true);
            status.textContent = 'Saving…';
            try {
              const previous = (await store.list()).find(p => p.y===snapshot.y && p.k<snapshot.k);
              const identity = r => r[7] || r[0];
              draft.o.forEach((row,i) => { const was = previous ? previous.o.findIndex(r => identity(r)===identity(row)) : -1; row[5] = was<0 ? null : was-i; });
              await store.write(snapshot.k, draft, current.etag, snapshot.y);
              try { localStorage.removeItem(key); } catch (_) {}
              editing = false; await onChanged();
            } catch (err) { status.textContent = err.message + ' Your edits are saved on this device.'; }
            finally { controls.forEach(([b, was]) => b.disabled = was); }
          };
        }
        render();
      } catch (err) { output.textContent = err.message; disable(false); }
      // Keep destructive actions disabled while editing the draft.
    }
    if(snapshot) {
      host.querySelector('[data-edit]').onclick = () => auth(edit);
      host.querySelector('[data-remove]').onclick = () => auth(remove);
    }
    const signout = host.querySelector('[data-signout]');
    if(signout) signout.onclick = () => { store.signOut(); editing = false; onChanged(); };
  }
  window.RankingsEditor = { mount, editing: () => editing, reset: () => { editing = false; } };
})();
