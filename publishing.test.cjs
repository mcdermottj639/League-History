/* Run: NODE_PATH=<directory containing jsdom> node publishing.test.cjs */
const { JSDOM } = require('jsdom');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const season={teams:Array.from({length:12},(_,i)=>({teamId:i+1,team:'Team '+(i+1),scores:[100+i],wins:1,losses:0,ties:0,isMe:i===0})),allPlay:{}};
let weeks={}, version=0, fail=false, conflict=false;
function response(data,status=200,headers={}) {return {ok:status>=200&&status<300,status,headers:new Headers(headers),json:async()=>JSON.parse(JSON.stringify(data))};}
async function fetchMock(input,options={}) {
 const url=new URL(input,'https://league.test');
 if(url.pathname.endsWith('/api/fantasy/football/season'))return response(season);
 if(url.pathname==='/parlay/current.json')return response({y:2026,sync:'https://nectars-bologna-default-rtdb.firebaseio.com'});
 if(url.pathname==='/rankings/index.json')return response({weeks:[]});
 if(url.hostname==='identitytoolkit.googleapis.com')return response({idToken:'token',refreshToken:'refresh',expiresIn:3600});
 if(url.pathname==='/rankings.json')return response({2026:weeks});
 const match=url.pathname.match(/\/rankings\/2026\/(\d+)\.json/);
 if(match) {
  const key=match[1];
  if(options.method==='PUT') {
   if(fail)return response({},403);
   if(conflict){conflict=false;return response({},412);}
   assert.equal(options.headers['if-match'],'"'+version+'"');
   assert.equal(url.searchParams.get('auth'),'token');
   const p=JSON.parse(options.body);if(p===null)delete weeks[key];else weeks[key]=p;version++;
   return response(p);
  }
  return response(weeks[key]||null,200,{etag:'"'+version+'"'});
 }
 throw new Error('Unexpected URL '+url);
}
function app(file) {
 const dom=new JSDOM(fs.readFileSync(file,'utf8'),{url:'https://league.test/'+file,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;
 w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({}, {get:(_,key)=>key==='measureText'?()=>({width:10}):key==='createLinearGradient'||key==='createRadialGradient'?()=>({addColorStop(){}}):()=>{}});
 w.HTMLCanvasElement.prototype.toDataURL=()=>'';
 w.fetch=fetchMock;w.AbortController=AbortController;w.TextEncoder=TextEncoder;w.confirm=()=>true;w.scrollTo=()=>{};
 w.matchMedia=()=>({matches:false,addEventListener(){}});
 w.localStorage.setItem('lh:skipped','1');
 w.localStorage.setItem('lh:owner','1');w.localStorage.setItem('powerlab:season',JSON.stringify({data:season}));
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
 $('#pr-publish').click();$('#pr-api').value='AIzaTest';$('#pr-email').value='test@example.com';$('#pr-password').value='test';
 $('#pr-login').dispatchEvent(new w.Event('submit',{cancelable:true}));
 await until(()=>$('#pr-share-out').textContent.includes('Signed in'));
 fail=true;$('#pr-publish').click();await until(()=>$('#pr-share-out').textContent.includes('Could not confirm'));
 assert.equal(Object.keys(weeks).length,0);assert(!$('#pr-pubstate').textContent.includes('live for everyone'));
 fail=false;$('#pr-publish').click();await until(()=>$('#pr-share-out').textContent.includes('now live'));
 assert.equal(weeks[1].o.length,12);
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
 console.log('PASS: publish, independent reader, denied writes, stale local mark, conflict, unpublish, invalid data and signed-out writes.');
 }finally{w.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
