/* Private, device-local address book. Never ship organizer capabilities here.
   LeagueOwner is a UI gate, not server authentication or encrypted storage. */
(() => {
  'use strict';
  const KEY = 'lh:owner-links:v1';
  // Private handoff only: never bundle a real capability in public assets.
  let setupToken = null, setupRequested = false;
  try {
    const fragment = new URLSearchParams(location.hash.slice(1));
    if (fragment.has('owner-parlay-link')) {
      setupRequested = true;
      const token = fragment.get('owner-parlay-link');
      if (/^[A-Za-z0-9_-]{43}$/.test(token)) setupToken = token;
      fragment.delete('owner-parlay-link');
      history.replaceState(null, '', location.pathname + location.search + (fragment.size ? '#' + fragment.toString() : ''));
    }
  } catch (_) {}

  const allowed = () => !!window.LeagueOwner?.is();
  const home = () => new URL('./', location.href).href;
  function validate(row) {
    const u = new URL(row.url), base = new URL(home());
    if (u.origin !== base.origin || !u.pathname.startsWith(base.pathname) || u.username || u.password)
      throw Error('Use a link to this league app.');
    const label = String(row.label || '').trim().slice(0, 80);
    if (!label) throw Error('Add a name and purpose for this link.');
    return {label, url:u.href, status:['ready','pending','inactive'].includes(row.status)?row.status:'pending'};
  }
  function read() {
    if (!allowed()) return [];
    const rows = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(rows) || rows.length > 50) throw Error('The saved list could not be read. Restore your private backup.');
    return rows.map(validate);
  }
  function save(rows) {
    if (!allowed()) throw Error('Open this on your unlocked owner device.');
    if (rows.length > 50) throw Error('The list supports up to 50 links.');
    localStorage.setItem(KEY, JSON.stringify(rows.map(validate)));
  }
  function mount(host) {
    if (!host || !allowed()) return;
    host.innerHTML = `<section class="lg-sh"><h3>Links to share · owner only</h3>
      <p>Public links go to the group. Private links go only to the named manager.</p>
      <div data-link-rows></div>
      <details><summary>Add a private link</summary><form data-link-form>
        <label>Name and access<input class="lg-share-u" name="label" required maxlength="80" placeholder="Zach · Parlay organizer"></label>
        <label>Original private link<input class="lg-share-u" name="url" type="url" required autocomplete="off" spellcheck="false"></label>
        <label>Status<select name="status"><option value="pending">Not live yet</option><option value="ready">Ready to send</option><option value="inactive">Inactive — do not send</option></select></label>
        <button class="lg-sheet-go" type="submit">Save link</button></form></details>
      <details><summary>Backup and restore</summary><p>Saved only in this browser. Keep a private backup for a new phone or cleared browser. Import your saved links or the private organizer launch document. Importing does not enable access or launch the parlay.</p>
        <button type="button" class="lg-sheet-go" data-export-links>Download private backup</button>
        <label>Import private file<input type="file" data-import-links accept=".json,.md,application/json,text/plain,text/markdown"></label>
      </details><p role="status" data-links-status></p></section>`;
    const status = message => { host.querySelector('[data-links-status]').textContent = message; };
    const check = () => { if (!allowed()) { host.replaceChildren(); throw Error('Owner access is locked.'); } };
    function render() {
      check();
      const list = host.querySelector('[data-link-rows]'); list.replaceChildren();
      const rows = [{label:'League app · public',url:home(),status:'ready'}, ...read()];
      rows.forEach((row, index) => {
        const card = document.createElement('div'); card.className='lg-link-row';
        const title=document.createElement('b');title.textContent=row.label;card.append(title);
        const note=document.createElement('p');note.textContent=(index?'Private · ':'Public · ')+({ready:'Ready to send',pending:'Not live yet',inactive:'Inactive — do not send'}[row.status]);card.append(note);
        const button=document.createElement('button');button.type='button';button.className='lg-sheet-go';button.textContent='Copy link';button.disabled=row.status!=='ready';
        button.onclick=async()=>{try{check();await navigator.clipboard.writeText(row.url);status('Link copied.');}catch(e){if(allowed()){status('Copy unavailable. Select and copy the link below.');const input=document.createElement('textarea');input.readOnly=true;input.value=row.url;card.append(input);input.select();}}};card.append(button);
        if(index){const select=document.createElement('select');select.setAttribute('aria-label','Status for '+row.label);for(const [value,label] of [['pending','Not live yet'],['ready','Ready to send'],['inactive','Inactive — do not send']]){const option=new Option(label,value);select.add(option);}select.value=row.status;select.onchange=()=>{try{check();const saved=read();saved[index-1].status=select.value;save(saved);render();status('List updated. This label does not activate or revoke access.');}catch(e){if(allowed())status(e.message);}};card.append(select);}
        list.append(card);
      });
      if(rows.length===1){const p=document.createElement('p');p.textContent='Zach’s private link has not been imported on this device yet. Import the private launch document below.';list.append(p);}
    }
    host.querySelector('form').onsubmit=e=>{e.preventDefault();try{check();const data=new FormData(e.target),row=validate(Object.fromEntries(data)),rows=read(),existing=rows.findIndex(r=>r.url===row.url);existing<0?rows.push(row):rows[existing]=row;save(rows);e.target.reset();render();status('Private link saved on this device.');}catch(error){if(allowed())status(error.message);}};
    host.querySelector('[data-export-links]').onclick=()=>{try{check();const blob=new Blob([JSON.stringify({version:1,links:read()},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='league-links-private.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Private backup prepared. Keep it out of the group chat.');}catch(error){if(allowed())status(error.message);}};
    host.querySelector('[data-import-links]').onchange=async e=>{try{check();const file=e.target.files[0];if(!file)return;if(file.size>100000)throw Error('Choose a links backup or organizer launch document.');const text=await file.text();check();let incoming;
      if(file.name.endsWith('.md')){const matches=text.match(/https:\/\/[^\s<>"`]+#parlay-organizer=[A-Za-z0-9_-]{43}/g);if(!matches?.length)throw Error('No organizer link found in this document.');incoming=[{label:'Zach · Parlay organizer',url:matches[0],status:'pending'}];}
      else {const packet=JSON.parse(text);if(packet.version!==1||!Array.isArray(packet.links))throw Error('Choose a valid private links backup.');incoming=packet.links;}
      const rows=read();for(const item of incoming){const row=validate(item);if(!rows.some(r=>r.url===row.url))rows.push(row);}save(rows);render();status('Private links imported. Existing entries were preserved.');
    }catch(error){if(allowed())status(error.message);}finally{e.target.value='';}};
    try {
      if (setupToken) {
        const rows = read(), row = validate({label:'Zach · Parlay organizer',url:home()+'#parlay-organizer='+setupToken,status:'ready'});
        const existing = rows.findIndex(item => item.url === row.url);
        if (existing < 0) rows.push(row); else rows[existing] = {...rows[existing],status:'ready'};
        save(rows); setupToken = null;
        render(); status('Zach’s link is ready. Find it here anytime: ? → Links to share.');
      } else render();
    } catch(error) { status(error.message); }
  }
  window.LeagueOwnerLinks={mount,setupRequested};
})();
