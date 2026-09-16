/* Run: NODE_PATH=<directory containing jsdom> node publishing.test.cjs */
const { JSDOM } = require('jsdom');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const season={teams:Array.from({length:12},(_,i)=>({teamId:i+1,team:'Team '+(i+1),scores:[100+i],wins:1,losses:0,ties:0,isMe:i===0})),allPlay:{}};
const UID = '34sUlXl2ZebtCJfR97Hz4R9N6Jw1';
let weeks={}, oldWeeks={}, refreshGate=null, version=0, fail=false, conflict=false, revoked=false, refreshes=0;
// Firebase serializes dense numeric keys as arrays, with nulls for missing keys.
// Week 1 alone is [null, week1], not {"1": week1}; this is the production failure.
function firebaseWeeks(value) {
 const keys=Object.keys(value).map(Number);
 if(!keys.length) return null;
 const max=Math.max(...keys);
 return keys.length > max/2 ? Array.from({length:max+1},(_,i)=>value[i] || null) : value;
}
function response(data,status=200,headers={}) {return {ok:status>=200&&status<300,status,headers:new Headers(headers),json:async()=>JSON.parse(JSON.stringify(data))};}
async function fetchMock(input,options={}) {
 const url=new URL(input,'https://league.test');
 if(url.pathname.endsWith('/api/fantasy/football/season'))return response(season);
 if(url.pathname==='/parlay/current.json')return response({y:2026,sync:'https://nectars-bologna-default-rtdb.firebaseio.com'});
 if(url.pathname==='/rankings/index.json')return response({weeks:[]});
 if(url.hostname==='identitytoolkit.googleapis.com')return response({idToken:'token',refreshToken:'refresh',expiresIn:3600,localId:UID});
 if(url.hostname==='securetoken.googleapis.com') { refreshes++; if(refreshGate) await refreshGate; return revoked ? response({},400) : response({id_token:'token',refresh_token:'refresh',expires_in:3600,user_id:UID}); }
 if(url.pathname==='/rankings.json')return response({2025:firebaseWeeks(oldWeeks),2026:firebaseWeeks(weeks)});
 const match=url.pathname.match(/\/rankings\/(2025|2026)\/(\d+)\.json/);
 if(match) {
  const key=match[2], target=match[1]==='2025'?oldWeeks:weeks;
  if(options.method==='PUT') {
   if(fail)return response({},403);
   if(conflict){conflict=false;return response({},412);}
   assert.equal(options.headers['if-match'],'"'+version+'"');
   assert.equal(url.searchParams.get('auth'),'token');
   const p=JSON.parse(options.body);if(p===null)delete target[key];else target[key]=p;version++;
   return response(p);
  }
  return response(target[key]||null,200,{etag:'"'+version+'"'});
 }
 throw new Error('Unexpected URL '+url);
}
function app(file, saved = {}, isOwner = true) {
 const dom=new JSDOM(fs.readFileSync(file,'utf8'),{url:'https://league.test/'+file,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;
 w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({}, {get:(_,key)=>key==='measureText'?()=>({width:10}):key==='createLinearGradient'||key==='createRadialGradient'?()=>({addColorStop(){}}):()=>{}});
 w.HTMLCanvasElement.prototype.toDataURL=()=>'';
 w.fetch=fetchMock;w.AbortController=AbortController;w.TextEncoder=TextEncoder;w.confirm=()=>true;w.scrollTo=()=>{};
 w.matchMedia=()=>({matches:false,addEventListener(){}});
 w.localStorage.setItem('lh:skipped','1');
 if (isOwner) w.localStorage.setItem('lh:owner','1');
 Object.entries(saved).forEach(([k,v])=>w.localStorage.setItem(k,v));w.localStorage.setItem('powerlab:season',JSON.stringify({data:season}));
 w.localStorage.setItem('powerlab:pub',JSON.stringify({1:{file:'old.json',label:'False claim',order:[1,2]}}));
 for(const script of w.document.querySelectorAll('script[src]'))w.eval(fs.readFileSync(script.getAttribute('src').split('?')[0],'utf8'));
 return dom;
}
async function until(fn) { for(let i=0;i<100;i++){if(fn())return;await new Promise(r=>setTimeout(r,10));}throw new Error('Timed out: '+fn); }
(async()=>{
 const dom=app('power.html'),w=dom.window,$=s=>w.document.querySelector(s);
 try {
 await until(()=>$('#pr-publish')&&$('#pr-pubstate').textContent.includes('not published'));
 assert(!$('#pr-pubstate').textContent.includes('False claim'));
 $('#pr-publish').click();await until(()=>$('#pr-api'));$('#pr-api').value='AIzaTest';$('#pr-email').value='test@example.com';$('#pr-password').value='test';
 fail=true;$('.pr-publisher-login').dispatchEvent(new w.Event('submit',{cancelable:true}));await until(()=>$('#pr-share-out').textContent.includes('Could not confirm'));
 assert.equal(Object.keys(weeks).length,0);assert(!$('#pr-pubstate').textContent.includes('live for everyone'));
 fail=false;$('#pr-publish').click();await until(()=>$('#pr-share-out').textContent.includes('now live'));
 assert.equal(weeks[1].o.length,12);
 weeks[3]={...JSON.parse(JSON.stringify(weeks[1])),k:3,l:'After Week 3'};
 const gap=await w.RankingStore.list();assert.deepEqual(Array.from(gap,p=>p.k),[3,1]);
 delete weeks[3];
 weeks[0]={broken:true};await assert.rejects(w.RankingStore.list(),/could not be read/);delete weeks[0];
 weeks[0]={...JSON.parse(JSON.stringify(weeks[1])),k:0,l:'Preseason'};
 assert.equal((await w.RankingStore.list()).length,2,'a real preseason snapshot is retained');delete weeks[0];
 const saved = Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)]));
 assert(!saved['lh:publisher-session'].includes('password'));
 const ownerApp=app('index.html',saved), guest=app('index.html',{},false);
 try {
   for(const page of [ownerApp,guest]) { await until(()=>page.window.document.querySelector('[data-l1="rank"]'));page.window.document.querySelector('[data-l1="rank"]').click(); }
   await until(()=>ownerApp.window.document.querySelector('[data-edit]'));
   assert(refreshes>0,'opening app restores the saved login');
   assert.equal(guest.window.document.querySelector('[data-edit]'),null,'members have no publishing controls');
   const doc=ownerApp.window.document;
   doc.querySelector('[data-edit]').click();await until(()=>doc.querySelector('.lg-ranking-edit'));
   const original = JSON.parse(JSON.stringify(weeks[1]));
   const note=doc.querySelector('[data-note="0"]');note.value='Updated on the shared view';note.dispatchEvent(new ownerApp.window.Event('input'));
   doc.querySelector('[data-down="0"]').click();
   doc.querySelector('.lg-ranking-edit').dispatchEvent(new ownerApp.window.Event('submit',{cancelable:true}));
   await until(()=>doc.querySelector('[data-edit]') && !doc.querySelector('.lg-ranking-edit'));
   assert.equal(weeks[1].o[1][3],'Updated on the shared view');
   assert.equal(weeks[1].o[1][0],original.o[0][0]);
   assert.equal(weeks[1].o[1][2],original.o[0][2],'historical PPG remains frozen');
   assert.deepEqual(weeks[1].o[1][8],original.o[0][8],'saved scoring and form remain frozen when editing');
   assert.equal(weeks[1].d,original.d,'date remains frozen');
   // Direct Unpublish uses the selected snapshot; other members see the removal.
   const edited = JSON.parse(JSON.stringify(weeks[1]));
   doc.querySelector('[data-remove]').click();
   await until(()=>Object.keys(weeks).length===0 && doc.querySelector('#lg-body').textContent.includes('No rankings published yet'));
   assert.equal(weeks[1],undefined);
   weeks[1]=edited;version++;
   doc.querySelector('[data-l1="rank"]').click();
   await until(()=>doc.querySelector('[data-signout]'));
   // Same week number in an older season must not alter this season.
   oldWeeks[1]=JSON.parse(JSON.stringify(weeks[1]));
   const old=await ownerApp.window.RankingStore.current(1,2025);
   await ownerApp.window.RankingStore.write(1,null,old.etag,2025);
   assert.equal(oldWeeks[1],undefined);assert(weeks[1]);
   // Revocation clears the persisted token, not a pretend signed-in state.
   revoked=true;const expired=app('index.html',saved);
   await expired.window.RankingStore.restore();
   assert.equal(expired.window.RankingStore.signedIn(),false);
   assert.equal(expired.window.localStorage.getItem('lh:publisher-session'),null);
   expired.window.close();revoked=false;
   let release;refreshGate=new Promise(resolve=>{release=resolve;});
   const racing=app('index.html',saved);
   const pending=racing.window.RankingStore.restore();
   racing.window.RankingStore.signOut();release();await pending;refreshGate=null;
   assert.equal(racing.window.RankingStore.signedIn(),false);
   assert.equal(racing.window.localStorage.getItem('lh:publisher-session'),null);
   racing.window.close();
   doc.querySelector('[data-signout]').click();
   assert.equal(ownerApp.window.localStorage.getItem('lh:publisher-session'),null);
   await until(()=>doc.querySelector('[data-edit]') && !doc.querySelector('[data-signout]'));
 } finally {ownerApp.window.close();guest.window.close();}
 const reader=app('index.html');
 try {
 await until(()=>[...reader.window.document.querySelectorAll('button')].some(b=>b.textContent==='Rankings'));
 const rank=[...reader.window.document.querySelectorAll('button')].find(b=>b.textContent==='Rankings');assert(rank);rank.click();
 await until(()=>reader.window.document.querySelectorAll('#lg-body .pr-list li').length===12);
 conflict=true;$('#pr-publish').click();await until(()=>$('#pr-share-out').textContent.includes('another device'));
 assert.equal(Object.keys(weeks).length,1);
 $('#pr-unpublish').click();await until(()=>$('#pr-share-out').textContent.includes('Removed from'));
 assert.equal(Object.keys(weeks).length,0);
 [...reader.window.document.querySelectorAll('button')].find(b=>b.textContent==='History').click();
 [...reader.window.document.querySelectorAll('button')].find(b=>b.textContent==='Rankings').click();await until(()=>reader.window.document.querySelector('#lg-body').textContent.includes('No rankings published yet'));
 } finally {reader.window.close();}
 // Reject invalid snapshots and absent ETags without writing.
 await assert.rejects(w.RankingStore.write(2,{v:1,k:2,l:'Week 2',d:'2026-09-16',o:[]},'"2"'),/twelve/);
 w.RankingStore.signOut();await assert.rejects(w.RankingStore.write(1,{v:1,k:1,l:'Week 1',d:'2026-09-16',o:Array.from({length:12},(_,i)=>['T'+i,'',1,''])},'"2"'),/Sign in/);
 console.log('PASS: persistent login and refresh, shared-view edit/unpublish, member controls hidden, revoked-session cleanup, sign-out, publishing failures/conflicts and snapshot preservation.');
 }finally{w.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
