const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
const Media=require('./rankings-media.js');
const Visuals=require('./rankings-view.js');
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jIuQAAAAASUVORK5CYII=';
const season={year:2026,teams:Array.from({length:12},(_,i)=>({teamId:i+1,team:'Team '+(i+1),scores:[100+i,110+i],wins:1,losses:1,ties:0,outcomes:['W','L']})),allPlay:{}};
async function settle(){await new Promise(r=>setTimeout(r,30));}
function lab(saved={},hash='',snapshot=null) {
  const dom=new JSDOM(fs.readFileSync('power.html','utf8'),{url:'https://league.test/power.html'+hash,runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window; let published=snapshot;
  w.fetch=async()=>({ok:true,json:async()=>season});w.AbortController=AbortController;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;
  w.confirm=()=>true;w.scrollTo=()=>{};
  w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({}, {get:(_,key)=>key==='measureText'?()=>({width:10}):key==='createLinearGradient'||key==='createRadialGradient'?()=>({addColorStop(){}}):()=>{}});
  w.HTMLCanvasElement.prototype.toDataURL=()=>PNG;
  w.LeagueOwner={mayLab:()=>!hash,is:()=>true,guest:()=>null};
  w.RankingStore={restore:async()=>{},list:async()=>published?[published]:[],current:async()=>({data:published,etag:'test'}),valid:p=>!!p?.o?.length,signedIn:()=>true,write:async(k,p)=>{published=p;}};
  w.localStorage.setItem('powerlab:season',JSON.stringify({data:season}));
  Object.entries(saved).forEach(([k,v])=>w.localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v)));
  for(const f of ['espn.js','rankings-media.js','rankings-view.js','rankings-styles.js','power.js'])w.eval(fs.readFileSync(f,'utf8'));
  return {dom,w,$:s=>w.document.querySelector(s),snapshot:()=>published,draft:()=>JSON.parse(w.localStorage.getItem('powerlab:draft'))};
}

test('media validation rejects active content and preserves saved ranking facts',()=>{
  for(const src of ['javascript:alert(1)','data:image/svg+xml;base64,PHN2Zz4=','https://u:pw@example.com/a.gif','https://127.0.0.1/a.gif','https://localhost/a.gif','http://example.com/a.png'])assert.equal(Media.normalize({kind:'image',src}),null);
  assert.ok(Media.normalize({kind:'image',src:PNG}));
  assert.equal(Media.normalize({kind:'reaction',id:'unknown'}),null);
  const html=Media.render({kind:'image',src:'https://example.com/test.gif',alt:'"><script>alert(1)</script>'});
  assert.doesNotMatch(html,/<script>/);assert.match(html,/referrerpolicy="no-referrer"/);
  const row=['A','1-1',120,'Words',1,null,'','A',{scores:[120],allPlay:[5,6,0]}];
  Media.setRow(row,{kind:'reaction',id:'crown'});assert.deepEqual(row[8].scores,[120]);
  Media.setRow(row,null);assert.deepEqual(row[8],{scores:[120],allPlay:[5,6,0]});
  assert.equal(Media.totalOK({src:'x'.repeat(1800001)}),false);
});

test('no-word generation, fill, undo, reordering, preview, and reload preserve the written draft',async()=>{
  const a=lab();try{
    await settle();a.$('.pr-take').value='Keep my own writing';a.$('.pr-take').dispatchEvent(new a.w.Event('input'));
    const original=a.draft();
    a.$('[data-format="visual"]').click();assert.equal(a.draft().comments[original.order[0]],'Keep my own writing');
    a.$('#pr-generate-style').click();assert.equal(Object.keys(a.draft().media).length,12);
    const first=a.draft().order[0];a.$('[data-reaction="popcorn"]').click();await settle();
    a.$('#pr-fill-empty').click();assert.equal(a.draft().media[first].id,'popcorn');
    a.$('[data-down]').click();assert.equal(a.draft().order[1],first,'numeric IDs reorder correctly');
    assert.equal(a.draft().media[first].id,'popcorn');
    a.$('#pr-preview').open=true;await settle();assert.equal(a.w.document.querySelectorAll('#pr-preview-body .rk-reaction').length,12);
    assert.equal(a.w.document.querySelectorAll('#pr-preview-body .rk-writeup').length,0);
    a.$('[data-format="words"]').click();assert.match(a.$('.pr-take').value,/./);a.$('#pr-undo').click();assert.equal(a.draft().format,'visual');
    const b=lab({'powerlab:draft':a.draft()});try{await settle();assert.equal(b.draft().format,'visual');assert.equal(b.w.document.querySelectorAll('[data-media-editor] .rk-reaction').length,12);assert.equal(b.draft().comments[first],'Keep my own writing');}finally{b.dom.window.close();}
  }finally{a.dom.window.close();}
});

test('published no-word weeks render media for members and public links without author access',async()=>{
  const a=lab();try{
    await settle();a.$('[data-format="visual"]').click();a.$('#pr-publish').click();await settle();assert.equal(a.snapshot(),null,'empty visual week is not silently published');
    a.$('#pr-generate-style').click();a.$('#pr-publish').click();await settle();const p=a.snapshot();assert.equal(p.o.length,12);
    assert.ok(p.o.every(row=>row[3]==='' && Media.fromRow(row)));
    const html=Visuals.rowsHTML(Visuals.facts(p),{crest:()=>'',me:null});assert.equal((html.match(/class="rk-reaction rk-reaction-/g)||[]).length,12);
    const b=lab({},'#published=2026:2',p);try{await settle();assert.equal(b.w.document.querySelectorAll('#pr-shared .rk-reaction').length,12);assert.equal(b.$('#pr-generate-style'),null);}finally{b.dom.window.close();}
  }finally{a.dom.window.close();}
});

test('large image drafts require publication for share links, then copy a short published link',async()=>{
  const media={1:{kind:'image',src:'data:image/gif;base64,'+'AAAA'.repeat(3000),alt:'GIF'}};
  const a=lab({'powerlab:draft':{year:2026,key:2,order:season.teams.map(t=>t.teamId),comments:{1:'Retained'},media,format:'mixed'}});
  try{
    await settle();let shared; a.w.navigator.share=async data=>{shared=data;};
    a.$('#pr-share').click();await settle();assert.equal(shared,undefined);assert.match(a.$('#pr-toast').textContent,/Publish this week first/);
    a.$('#pr-publish').click();await settle();a.$('#pr-share').click();await settle();assert.match(shared.url,/#published=2026:2$/);
    assert.deepEqual(Media.fromRow(a.snapshot().o[0]),media[1]);
  }finally{a.dom.window.close();}
});

test('writing facts retain zeroes/ties and never substitute an older score for a missing week',async()=>{
 const a=lab();try{
   await settle();const source=JSON.parse(JSON.stringify(season));source.teams[0].scores=[100,0];source.teams[0].ties=1;source.teams[0].outcomes=['W','T'];source.teams[1].scores=[130];
   const rows=a.w.takeFacts(source,source.teams.map(t=>t.teamId),2,null);
   assert.equal(rows[0].score,0);assert.equal(rows[0].ppg,50);assert.equal(rows[0].rec,'1-1-1');assert.equal(rows[1].score,null);assert.ok(rows.every(r=>!r.topScore&&!r.lowScore));
 }finally{a.dom.window.close();}
});

test('GIF uploads retain their original data and image failures expose a useful fallback',async()=>{
 const a=lab();try{
   await settle();a.w.Image=class{set src(value){this.value=value;queueMicrotask(()=>this.onload());}};
   const bytes=Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7','base64');
   const file=new a.w.File([bytes],'reaction.gif',{type:'image/gif'});
   const m=await a.w.RankingMedia.readFile(file);assert.equal(m.src,'data:image/gif;base64,'+bytes.toString('base64'));
   await assert.rejects(a.w.RankingMedia.readFile(new a.w.File(['<svg/>'],'a.svg',{type:'image/svg+xml'})),/Choose a JPG/);
   a.w.document.body.insertAdjacentHTML('beforeend',a.w.RankingMedia.render({kind:'image',src:'https://example.com/broken.gif'}));
   const img=a.w.document.querySelector('.rk-media img');img.dispatchEvent(new a.w.Event('error'));assert.equal(img.hidden,true);assert.equal(img.nextElementSibling.hidden,false);
 }finally{a.dom.window.close();}
});

test('mobile files are identified by bytes, with typed spoofing and size limits rejected',async()=>{
 const a=lab();try{
   await settle();a.w.Image=class{set src(value){queueMicrotask(()=>this.onload());}};
   const gif=Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7','base64');
   for(const name of ['reaction.gif','mobile-download','wrong.png']){
     const m=await a.w.RankingMedia.readFile(new a.w.File([gif],name));
     assert.equal(m.src,'data:image/gif;base64,'+gif.toString('base64'));
   }
   for(const [bytes,name,type] of [[gif,'wrong.png','image/png'],['<svg/>','fake.gif',''],['bad','fake.gif','image/gif'],['','empty.gif','']]){
     await assert.rejects(a.w.RankingMedia.readFile(new a.w.File([bytes],name,{type})),/valid JPG/);
   }
   await assert.rejects(a.w.RankingMedia.readFile(new a.w.File([new Uint8Array(8*1024*1024+1)],'large.gif')),/smaller than 8 MB/);
   await assert.rejects(a.w.RankingMedia.readFile(new a.w.File([gif,new Uint8Array(700000)],'large.gif')),/Sign in to publishing/);
   // Decoding is stubbed here; these fixtures exercise signature routing only.
   for(const [bytes,name] of [[Buffer.from(PNG.split(',')[1],'base64'),'image'],[Buffer.from([255,216,255,224]),'photo'],[Buffer.from('RIFF0000WEBP'),'picture']]){
     const m=await a.w.RankingMedia.readFile(new a.w.File([bytes],name));assert.ok(m.src.startsWith('data:image/'));
   }
   a.w.Image=class{set src(value){queueMicrotask(()=>this.onerror());}};
   await assert.rejects(a.w.RankingMedia.readFile(new a.w.File(['GIF89a'],'truncated.gif')),/Image did not load/);
 }finally{a.dom.window.close();}
});

test('upload cancellation and repeat selections preserve selected and week previews',async()=>{
 const a=lab();try{
   await settle();a.w.Image=class{set src(value){queueMicrotask(()=>this.onload());}};
   a.$('[data-format="mixed"]').click();
   const input=a.$('[data-media-file]'), host=input.closest('[data-media-editor]');
   const file=new a.w.File([Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7','base64')],'mobile.gif');
   Object.defineProperty(input,'files',{configurable:true,value:[file]});await input.onchange({target:input});
   assert.ok(host.querySelector('.rk-media-current img'));assert.match(host.querySelector('[data-media-status]').textContent,/Visual added/);
   a.$('#pr-preview').open=true;await settle();assert.ok(a.$('#pr-preview-body .rk-media img'));
   Object.defineProperty(input,'files',{configurable:true,value:[]});await input.onchange({target:input});
   assert.match(host.querySelector('[data-media-status]').textContent,/Visual added/);
   Object.defineProperty(input,'files',{configurable:true,value:[file]});await input.onchange({target:input});assert.equal(input.value,'');
   Object.defineProperty(input,'files',{configurable:true,value:[new a.w.File([file,new Uint8Array(700000)],'large.gif')]});await input.onchange({target:input});
   assert.match(host.querySelector('[data-media-status]').textContent,/Sign in to publishing/);assert.ok(host.querySelector('.rk-media-current img'));assert.equal(input.disabled,false);
 }finally{a.dom.window.close();}
});

/* ---- v130 / v132 ------------------------------------------------------ */
test('moving a team keeps that row where it was on screen and keeps focus on the arrow',async()=>{
  const a=lab();try{
    await settle();
    const scrolls=[];a.w.scrollBy=(x,y)=>scrolls.push(y);
    a.w.HTMLElement.prototype.getBoundingClientRect=function(){const rows=[...this.ownerDocument.querySelectorAll('#pr-rank > .pr-list > .pr-row')];const i=rows.indexOf(this);return {top:i<0?0:i*300,bottom:0,left:0,right:0,width:0,height:0};};
    const first=a.$('#pr-rank > .pr-list > .pr-row'), id=first.dataset.id;
    first.querySelector('[data-down]').focus();first.querySelector('[data-down]').click();
    const moved=[...a.w.document.querySelectorAll('#pr-rank > .pr-list > .pr-row')].findIndex(li=>li.dataset.id===id);
    assert.equal(moved,1);
    assert.equal(scrolls[0],300,'page follows the moved row instead of jumping');
    assert.equal(a.w.document.activeElement,a.w.document.querySelectorAll('#pr-rank > .pr-list > .pr-row')[1].querySelector('[data-down]'));
  }finally{a.dom.window.close();}
});

test('No words keeps stats, highlights, trends and the model note in the preview and for members',async()=>{
  const a=lab({'powerlab:draft':{key:2,year:2026,order:[],comments:{},media:{},format:'visual'}});try{
    await settle();a.$('[data-format="visual"]').click();await settle();
    a.$('#pr-preview').open=true;await settle();
    const preview=a.$('#pr-preview');
    assert.ok(preview.querySelector('.rk-highlights'),'week highlights');
    assert.equal(preview.querySelectorAll('#pr-preview-body .rk-stats').length,12);
    assert.equal(preview.querySelectorAll('#pr-preview-body .rk-details').length,12,'trends & stats');
    assert.equal(preview.querySelectorAll('.rk-writeup').length,0,'no words');
  }finally{a.dom.window.close();}
  const p={v:1,k:2,l:'After Week 2',b:'',d:'2026-10-13',r:1,o:Array.from({length:12},(_,i)=>['Team '+(i+1),'1-1',100+i,'',i===0?3:i+1,0,'Own','C'+i,{scores:[100,100+i],outcomes:['W','L']}])};
  const html=Visuals.rowsHTML(Visuals.facts(p,[]),{crest:()=>'',me:null});
  assert.match(html,/The numbers had them 3rd/);
});

test('signed in: a GIF of any size is uploaded byte-for-byte and the week stores only its link',async()=>{
  const a=lab();try{
    await settle();a.w.Image=class{set src(v){this.value=v;queueMicrotask(()=>this.onload());}};
    const sent=[];a.w.RankingStore.hasSession=()=>true;a.w.RankingStore.idToken=async()=>'id-token';
    a.w.fetch=async(url,opt)=>{if(String(url).includes('league-media')){sent.push({url,opt,bytes:Buffer.from(await opt.body.arrayBuffer())});return {ok:true,status:200,json:async()=>({url:'https://oqrfdhoyyogjmiqmjhnp.supabase.co/storage/v1/object/public/league-media/ranking/abc.gif'})};}return {ok:true,json:async()=>season};};
    const gif=Buffer.concat([Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7','base64'),Buffer.alloc(2_000_000,1)]);
    const m=await a.w.RankingMedia.readFile(new a.w.File([gif],'big.gif'));
    assert.equal(m.src,'https://oqrfdhoyyogjmiqmjhnp.supabase.co/storage/v1/object/public/league-media/ranking/abc.gif');
    assert.equal(sent.length,1);assert.equal(sent[0].opt.headers.Authorization,'Bearer id-token');
    assert.ok(sent[0].bytes.equals(gif),'original bytes sent untouched');
    assert.ok(Media.totalOK({a:m,b:m,c:m,d:m,e:m,f:m,g:m,h:m,i:m,j:m,k:m,l:m}),'twelve hosted GIFs fit a week easily');
    a.w.fetch=async()=>({ok:false,status:401,json:async()=>({error:'Your sign-in has expired. Sign in to publishing again.'})});
    await assert.rejects(a.w.RankingMedia.readFile(new a.w.File([gif],'big.gif')),/sign-in has expired/);
  }finally{a.dom.window.close();}
});
