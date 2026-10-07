/* Optional media in row[8].media. Old ranking rows continue to render as text. */
(function (root) {
  'use strict';
  const MAX_DATA = 900000, MAX_TOTAL = 1800000;
  const reactions = [
    ['crown','👑','King of the hill','#d9a94b'], ['fire','🔥','On fire','#e6683b'],
    ['rocket','🚀','Taking off','#6a8ded'], ['ice','🧊','Ice cold','#65b8d1'],
    ['roller','🎢','Wild ride','#a280d1'], ['sweat','😅','Survived it','#d4ab55'],
    ['luck','🍀','Living lucky','#64a17e'], ['robbed','😭','Robbed by the schedule','#7389ba'],
    ['popcorn','🍿','Here for the drama','#c39970'], ['sleep','😴','Wake up','#8e8dbe'],
    ['alarm','🚨','Panic time','#cd6666'], ['trash','🗑️','In the basement','#8d958f'],
    ['shrug','🤷','Still figuring it out','#a69c89'], ['clap','👏','Respect','#8bae94'],
    ['eyes','👀','Keep watching','#89aaba'], ['skull','💀','Rough week','#92939d'],
  ].map(([id,emoji,label,color])=>({id,emoji,label,color}));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function safeSource(src) {
    if (typeof src !== 'string') return '';
    if (src.length <= MAX_DATA && /^data:image\/(?:png|jpeg|webp|gif);base64,[a-zA-Z0-9+/]+={0,2}$/.test(src)) return src;
    if (src.length > 2048 || /[\s\\]/.test(src)) return '';
    try {
      const u = new URL(src);
      if (u.protocol !== 'https:' || u.username || u.password || u.port || /[:\[\]]/.test(u.hostname) || !u.hostname.includes('.') || /^(?:localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(u.hostname) || /\.(?:local|localhost)$/.test(u.hostname)) return '';
      return u.href;
    } catch (_) { return ''; }
  }
  function normalize(m) {
    if (!m || typeof m !== 'object') return null;
    if (m.kind === 'reaction' && reactions.some(r=>r.id===m.id)) return {kind:'reaction',id:m.id};
    const src = m.kind === 'image' && safeSource(m.src);
    return src ? {kind:'image',src,alt:String(m.alt || 'Ranking reaction').slice(0,120)} : null;
  }
  function fromRow(row) { return normalize(row && row[8] && row[8].media); }
  function setRow(row, media) {
    const extra = {...(row[8] || {})}; delete extra.media;
    const m=normalize(media); if(m) extra.media=m;
    if(Object.keys(extra).length) row[8]=extra; else row.splice(8,1);
  }
  function render(media) {
    const m=normalize(media); if(!m)return '';
    if(m.kind==='reaction') {
      const r=reactions.find(r=>r.id===m.id);
      return `<div class="rk-reaction rk-reaction-${r.id}" style="--reaction-color:${r.color}" role="img" aria-label="${esc(r.label)}"><span aria-hidden="true">${r.emoji}</span><i aria-hidden="true"></i></div>`;
    }
    return `<figure class="rk-media"><img src="${esc(m.src)}" alt="${esc(m.alt)}" loading="lazy" decoding="async" referrerpolicy="no-referrer"><figcaption hidden>Image unavailable. Choose another image in the editor.</figcaption></figure>`;
  }
  function hydrate(host) {
    host.querySelectorAll('.rk-media img').forEach(img=>{
      img.onerror=()=>{img.hidden=true;img.nextElementSibling.hidden=false;};
    });
  }
  function suggest(d, variant=0) {
    let pool = ['eyes','popcorn','shrug'];
    if(d.rank===1)pool=['crown','fire','clap'];
    else if(d.topScore || (d.streakC==='W' && d.streakN>=3))pool=['fire','rocket','clap'];
    else if(d.lowScore)pool=['skull','ice','sleep'];
    else if(d.prevRank && d.prevRank-d.rank>=2)pool=['rocket','clap','eyes'];
    else if(d.prevRank && d.rank-d.prevRank>=2)pool=['alarm','roller','ice'];
    else if(d.lucky>0.25)pool=['luck','sweat','eyes'];
    else if(d.lucky< -0.25)pool=['robbed','roller','shrug'];
    else if(d.rank===d.n)pool=['trash','alarm','skull'];
    else if(d.rank<=3)pool=['clap','eyes','fire'];
    else if(d.streakC==='L' && d.streakN>=2)pool=['ice','alarm','sleep'];
    return {kind:'reaction',id:pool[(Math.max(0,Number(variant)||0)+Number(d.week||0)+Number(d.rank||0))%pool.length]};
  }
  function totalOK(media) { return JSON.stringify(media).length<=MAX_TOTAL; }
  function loadImage(src, cors=false) {
    return new Promise((resolve,reject)=>{
      const img=new Image(); const timer=setTimeout(()=>reject(new Error('Image did not load. Try another file or direct image link.')),10000);
      if(cors && !src.startsWith('data:'))img.crossOrigin='anonymous';
      img.referrerPolicy='no-referrer';
      img.onload=()=>{clearTimeout(timer);resolve(img);};
      img.onerror=()=>{clearTimeout(timer);reject(new Error('Image did not load. Use a direct GIF, JPG, PNG, or WebP link.'));};
      img.src=src;
    });
  }
  async function readFile(file) {
    if(!file || !['image/jpeg','image/png','image/webp','image/gif'].includes(file.type))throw new Error('Choose a JPG, PNG, WebP, or GIF file.');
    if(file.size>8*1024*1024)throw new Error('Choose an image smaller than 8 MB.');
    const src=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(new Error('Could not read that file.'));r.readAsDataURL(file);});
    if(file.type==='image/gif') {
      if(src.length>MAX_DATA)throw new Error('This GIF is too large to save in a week. Paste its direct image link instead to keep it animated.');
      await loadImage(src); return {kind:'image',src,alt:'Animated ranking reaction'};
    }
    const img=await loadImage(src), canvas=document.createElement('canvas');
    let edge=640, result='';
    for(let attempt=0;attempt<4;attempt++) {
      const scale=Math.min(1,edge/Math.max(img.naturalWidth,img.naturalHeight));
      canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
      const ctx=canvas.getContext('2d');ctx.fillStyle='#f3f1ec';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
      result=canvas.toDataURL('image/jpeg',0.8-attempt*0.1);
      if(result.length<=140000)break; edge*=0.75;
    }
    if(result.length>140000)throw new Error('Could not shrink this image. Choose a smaller file.');
    return {kind:'image',src:result,alt:'Ranking reaction'};
  }
  function editor(host, value, onChange, team='team') {
    let current=normalize(value);
    host.innerHTML=`<div class="rk-media-current">${render(current)}</div><details class="rk-media-picker"><summary>${current?'Change':'Add'} reaction, GIF, or image</summary><div class="rk-reaction-grid">${reactions.map(r=>`<button type="button" data-reaction="${r.id}" title="${esc(r.label)}" aria-label="${esc(r.label)} for ${esc(team)}" aria-pressed="${current?.id===r.id}">${r.emoji}<small>${esc(r.label)}</small></button>`).join('')}</div><label class="pr-by"><span>Upload image or GIF</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" data-media-file aria-label="Upload image or GIF for ${esc(team)}"></label><label class="pr-by"><span>Or paste a direct GIF / image link</span><input type="url" placeholder="https://…" data-media-url aria-label="Image link for ${esc(team)}"></label><button type="button" class="pr-btn" data-media-use>Use image link</button><button type="button" class="pr-btn ghost" data-media-remove>Remove visual</button><p class="pr-note" data-media-status role="status"></p></details>`;
    const status=host.querySelector('[data-media-status]');
    const apply=async m=>{
      if(!host.isConnected)return;
      await onChange(m); current=m;
      host.querySelector('.rk-media-current').innerHTML=render(m);hydrate(host);
      host.querySelector('summary').textContent=`${m?'Change':'Add'} reaction, GIF, or image`;
      host.querySelectorAll('[data-reaction]').forEach(b=>b.setAttribute('aria-pressed',String(m?.id===b.dataset.reaction)));
      status.textContent=m?'Visual added to this draft.':'Visual removed.';
    };
    async function run(work) {
      const controls=[...host.querySelectorAll('button,input')];controls.forEach(b=>b.disabled=true);status.textContent='Preparing image…';
      try {await work();}catch(e){status.textContent=e.message;}finally{controls.forEach(b=>b.disabled=false);}
    }
    host.querySelectorAll('[data-reaction]').forEach(b=>b.onclick=()=>run(()=>apply({kind:'reaction',id:b.dataset.reaction})));
    host.querySelector('[data-media-remove]').onclick=()=>run(()=>apply(null));
    host.querySelector('[data-media-file]').onchange=e=>run(async()=>apply(await readFile(e.target.files[0])));
    host.querySelector('[data-media-use]').onclick=()=>run(async()=>{
      const src=safeSource(host.querySelector('[data-media-url]').value.trim());
      if(!src || src.startsWith('data:'))throw new Error('Use a public HTTPS image link. You can upload a file above.');
      await loadImage(src);await apply({kind:'image',src,alt:`Reaction for ${team}`});
    });hydrate(host);
  }
  if(root && root.document) root.document.addEventListener('error',e=>{const img=e.target;if(img.matches?.('.rk-media img')){img.hidden=true;if(img.nextElementSibling)img.nextElementSibling.hidden=false;}},true);
  const api={reactions,normalize,fromRow,setRow,render,hydrate,suggest,totalOK,loadImage,readFile,editor};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.RankingMedia=api;
})(typeof window!=='undefined'?window:null);
