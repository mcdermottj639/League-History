// Full app integration in jsdom with fixture-only HTTP. No production requests.
import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {readFileSync} from 'node:fs';
import {createApp,hash} from './app.mjs';
import {Store} from './store.mjs';
import {seedPreview} from './preview.mjs';
const root=new URL('../',import.meta.url),key='test-organizer-capability-'.padEnd(43,'x');
async function until(fn){for(let i=0;i<100;i++){if(fn())return;await new Promise(r=>setTimeout(r,10));}throw Error('Timed out: '+fn);}
async function app({invite=false,member='Gotch',storage={},enabled=true,slowConfig=null,backend=null,configFailures=0,inviteFailures=0,shared=null}={}){
 const store=backend?.store||new Store(':memory:');if(!backend)seedPreview(store);const service=backend?.service||createApp({store,organizerHash:hash(key),preview:true,origins:['https://league.test']});if(!backend)await new Promise(r=>service.listen(0,'127.0.0.1',r));const api=`http://127.0.0.1:${service.address().port}`;
 const dom=new JSDOM(readFileSync(new URL('index.html',root),'utf8'),{url:'https://league.test/'+(invite?'#parlay-organizer='+key:shared?'#p='+Buffer.from(JSON.stringify(shared)).toString('base64url'):''),runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window,requests=[];
 w.scrollTo=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){}});w.AbortSignal=AbortSignal;w.AbortController=AbortController;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.confirm=()=>true;
 w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:(_,k)=>k==='measureText'?()=>({width:10}):()=>{}});
 w.localStorage.setItem('lh:skipped','1');if(member)w.localStorage.setItem('lh:me',member);Object.entries(storage).forEach(([k,v])=>w.localStorage.setItem(k,v));
 const reply=j=>Promise.resolve({ok:true,status:200,json:async()=>j});
 w.fetch=async(input,options={})=>{const u=new URL(input,'https://league.test/');requests.push(u.href);
  if(u.pathname==='/parlay/config.json'){if(configFailures-->0)throw Error('Config offline');if(slowConfig)await slowConfig;return reply({enabled,api,year:2026});}
  if(u.href.startsWith(api+'/api/')){if(u.pathname.endsWith('/session')&&inviteFailures-->0)throw Error('Temporary outage');return fetch(u.href,options);}
  if(u.pathname==='/parlay/current.json')return reply({y:2026,weeks:[],open:{k:2,l:'Week 2'},sync:''});
  if(u.pathname==='/season/current.json')return reply(JSON.parse(readFileSync(new URL('season/current.json',root))));
  if(u.pathname==='/rankings/index.json')return reply({weeks:[]});
  if(u.hostname.includes('firebaseio.com'))return reply(null);
  throw Error('Fixture rejects external request '+u.href);
 };
 for(const el of w.document.querySelectorAll('script[src]'))w.eval(readFileSync(new URL(el.getAttribute('src').split('?')[0],root),'utf8'));
 const close=async()=>{if(!backend)await new Promise(r=>service.close(r));await new Promise(r=>setTimeout(r,25));dom.window.close();if(!backend)store.close();};
 return {w,store,service,requests,api,close,$:s=>w.document.querySelector(s)};
}
test('fresh organizer link removes secret, selects Zach, saves for another member and cannot edit rankings',async()=>{
 const h=await app({invite:true,member:null});try{await until(()=>h.$('#pn-target'));assert.equal(h.w.location.hash,'');assert.equal(h.w.LeagueHistory.me(),'Zach');assert.equal(h.w.localStorage.getItem('lh:me'),'Zach');assert.match(h.$('#lg-me').textContent,/Zach/);assert.ok(h.$('[data-pn="manage"]'));assert.equal(h.w.LeagueOwner.is(),false);
 h.$('#pn-target').value='Gotch';h.$('#pn-target').dispatchEvent(new h.w.Event('change',{bubbles:true}));h.$('[data-pn="select"]').click();assert.ok(h.$('.pn-draft'));h.$('[data-pn="save"]').click();await until(()=>h.$('.pn-message')?.textContent.includes('Saved'));
 const p=h.store.read().seasons[2026].weeks[2].picks.Gotch;assert.equal(p.addedBy,'organizer');assert.equal(p.member,'Gotch');assert.equal(Object.keys(h.store.read().seasons[2026].weeks[2].picks).length,5);
 // Leaving and returning preserves server-verified access without an invite.
 h.$('[data-l1="hist"]').click();h.$('[data-l1="parlay"]').click();await until(()=>h.$('[data-pn="manage"]'));assert.equal(h.w.LeagueHistory.me(),'Zach');
 }finally{await h.close();}
});
test('ordinary Zach and all other member names have no organizer controls; member picks remain their own',async()=>{
 const h=await app({member:'Zach'});try{h.$('[data-l1="parlay"]').click();await until(()=>h.$('[data-tab="picks"]'));assert.equal(h.$('[data-pn="manage"]'),null);
 for(const m of ['Gotch','Hurd','McD','CC','Hyman','Christel','Woods','Buley','Wolff','Riz','Slemp']){h.w.LeagueHistory.setMe(m);await h.w.LeagueParlay.paint(h.$('#lg-body'),()=> '');assert.equal(h.$('[data-pn="manage"]'),null,m);}
 h.w.LeagueHistory.setMe('Gotch');await h.w.LeagueParlay.paint(h.$('#lg-body'),()=> '');h.$('[data-pn="select"]').click();h.$('[data-pn="save"]').click();await until(()=>h.$('.pn-message')?.textContent.includes('Saved'));assert.equal(h.store.read().seasons[2026].weeks[2].picks.Gotch.addedBy,'Gotch');
 h.$('[data-tab="ticket"]').click();assert.match(h.$('#lg-body').textContent,/Weekly stake/);h.$('[data-tab="season"]').click();assert.match(h.$('#lg-body').textContent,/Past tickets/);
 }finally{await h.close();}
});
test('delayed parlay configuration never overwrites History after navigating away',async()=>{
 let release;const pending=new Promise(r=>release=r);const h=await app({slowConfig:pending,enabled:false});try{h.$('[data-l1="parlay"]').click();h.$('[data-l1="hist"]').click();const html=h.$('#lg-body').innerHTML;release();await new Promise(r=>setTimeout(r,30));assert.equal(h.$('#lg-body').dataset.view,'hist');assert.equal(h.$('#lg-body').innerHTML,html);
 }finally{release();await h.close();}
});
test('config failure and offline refresh retain v2 read-only; never fall back to old writable list',async()=>{
 const h=await app();try{h.$('[data-l1="parlay"]').click();await until(()=>h.$('[data-tab="picks"]'));const initial=h.w.fetch;h.w.fetch=async()=>{throw Error('offline');};h.$('[data-pn="refresh"]').click();await until(()=>h.$('.pn-error')?.textContent.includes('Could not refresh'));assert.match(h.$('#lg-body').textContent,/read-only/);assert.ok([...h.w.document.querySelectorAll('[data-pn="select"]')].every(b=>b.disabled));assert.equal(h.$('[data-lp="save"]'),null);h.w.fetch=initial;
 }finally{await h.close();}
});

test('organizer session survives reopening ordinary app URL; expired authority does not render controls',async()=>{
 const h=await app({invite:true,member:null});let reopened;
 try{await until(()=>h.$('#pn-target'));const storage={};for(let i=0;i<h.w.localStorage.length;i++){const k=h.w.localStorage.key(i);storage[k]=h.w.localStorage.getItem(k);}
  reopened=await app({backend:h,member:'Zach',storage});reopened.$('[data-l1="parlay"]').click();await until(()=>reopened.$('[data-pn="manage"]'));assert.equal(reopened.w.location.hash,'');assert.equal(reopened.w.LeagueHistory.me(),'Zach');await reopened.close();reopened=null;
  h.store.db.exec('DELETE FROM sessions');reopened=await app({backend:h,member:'Zach',storage});reopened.$('[data-l1="parlay"]').click();await until(()=>reopened.$('.pn-error'));assert.equal(reopened.$('[data-pn="manage"]'),null);
 }finally{if(reopened)await reopened.close();await h.close();}
});

test('cached config failure stays read-only and Retry recovers; first-load failure never opens legacy writes',async()=>{
 const h=await app();let reopened;try{h.$('[data-l1="parlay"]').click();await until(()=>h.$('[data-tab="picks"]'));const storage={};for(let i=0;i<h.w.localStorage.length;i++){const k=h.w.localStorage.key(i);storage[k]=h.w.localStorage.getItem(k);}
 reopened=await app({backend:h,storage,configFailures:1});reopened.$('[data-l1="parlay"]').click();await until(()=>reopened.$('.pn-error')?.textContent.includes('read-only'));assert.equal(reopened.$('[data-lp="save"]'),null);assert.ok([...reopened.w.document.querySelectorAll('[data-pn="select"]')].every(b=>b.disabled));reopened.$('[data-pn="refresh"]').click();await until(()=>!reopened.$('.pn-error'));await reopened.close();reopened=null;
 reopened=await app({backend:h,configFailures:1});reopened.$('[data-l1="parlay"]').click();await until(()=>reopened.$('[data-pn="retry"]'));assert.equal(reopened.$('[data-lp="save"]'),null);reopened.$('[data-pn="retry"]').click();await until(()=>reopened.$('[data-tab="picks"]'));
 }finally{if(reopened)await reopened.close();await h.close();}
});
test('temporary invite exchange failure keeps the key in memory for Retry without exposing it',async()=>{
 const h=await app({invite:true,member:null,inviteFailures:1});try{await until(()=>h.$('.pn-error'));assert.equal(h.w.location.hash,'');assert.equal(h.$('[data-pn="manage"]'),null);assert.ok(!h.$('#lg-body').textContent.includes(key));h.$('[data-pn="refresh"]').click();await until(()=>h.$('#pn-target'));assert.equal(h.w.LeagueHistory.me(),'Zach');}finally{await h.close();}
});
test('save captures member and week before awaiting a session; late result cannot overwrite History',async()=>{
 const h=await app();let release;try{h.$('[data-l1="parlay"]').click();await until(()=>h.$('[data-pn="select"]'));const original=h.w.fetch,barrier=new Promise(r=>release=r);h.w.fetch=async(u,o)=>{if(String(u).endsWith('/session'))await barrier;return original(u,o);};
 h.$('[data-pn="select"]').click();h.$('[data-pn="save"]').click();h.w.LeagueHistory.setMe('Hurd');h.$('[data-l1="hist"]').click();const html=h.$('#lg-body').innerHTML;release();await until(()=>h.store.read().seasons[2026].weeks[2].picks.Gotch);assert.equal(h.store.read().seasons[2026].weeks[2].picks.Gotch.addedBy,'Gotch');assert.equal(h.$('#lg-body').innerHTML,html);
 }finally{release?.();await h.close();}
});

test('existing shared-pick links display their original pick without silently changing the shared ticket',async()=>{
 const h=await app({shared:{v:1,k:2,m:'Gotch',p:'BUF ML vs DET',o:-225,t:Date.now()}});try{await until(()=>h.$('[data-tab="picks"]'));assert.equal(h.w.location.hash,'');assert.match(h.$('#lg-body').textContent,/Shared pick · Week 2/);assert.match(h.$('#lg-body').textContent,/BUF ML vs DET/);assert.equal(h.store.read().seasons[2026].weeks[2].picks.Gotch,undefined);assert.equal(h.$('[data-lp="save"]'),null);}finally{await h.close();}
});
