import test from 'node:test';
import assert from 'node:assert/strict';
import {MemoryStore,digest,transaction} from './supabase-store.mjs';
import {edgeApp} from './supabase-runtime.mjs';
import {collect} from './supabase-collector.mjs';
import {seedPreview} from './preview.mjs';
import {ROSTER} from './domain.mjs';
import {importLegacy,activateRelease,savePick} from './engine.mjs';
const T=Date.parse('2026-09-10T16:00:00Z'),proof={legacyWritesFrozen:true,migrationReconciled:true,backupVerified:true};
function fixture(){const s=new MemoryStore();seedPreview(s,'before',T);const w=s.state.seasons[2026].weeks[2];w.week=1;w.imported=false;w.picks={};w.payer={status:'pending'};s.state.seasons[2026]={current:1,weeks:{1:w}};return s;}
async function backend(store=fixture()){
 let revision=0;const sessions=new Map(),config={year:2026,launch_week:1,organizer_hash:await digest('test-private-key'),collection_enabled:true,collector_secret:'collector-test-key'};
 let lease=null;
 const rpc=async(op,args={})=>{
  if(op==='config')return structuredClone(config);
  if(op==='read')return {revision,state:store.read()};
  if(op==='commit'){if(revision!==args.revision)return false;store.state=structuredClone(args.state);revision++;return true;}
  if(op==='limit')return true;
  if(op==='add_session'){sessions.set(args.hash,args);return true;}
  if(op==='session')return sessions.get(args.hash)||null;
  if(op==='lease'){if(lease)return false;lease=args.owner;return true;}
  if(op==='release_lease'){if(lease===args.owner)lease=null;return true;}
  throw Error(op);
 };
 const app=edgeApp(rpc,{clock:()=>T});
 async function request(path,body,token,other={}){return app(new Request('https://example.test/functions/v1/league-parlay/'+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...other},...(body?{body:JSON.stringify(body)}:{})}));}
 const session=async member=>(await request('api/parlay/session',{member})).json();
 return {rpc,store,config,request,session,app};
}
const pick=(member,i=0)=>({year:2026,week:1,member,gameId:'demo'+i,market:'ml',side:fixture().state.seasons[2026].weeks[1].games[i].home,revision:0});
function activate(s){importLegacy(s,2026,1,{},T);activateRelease(s,2026,1,proof,T);}

test('Supabase Week 1 handoff retains zero, partial and all twelve existing picks',()=>{
 for(const count of [0,4,12]){
  const s=fixture(),w=s.read().seasons[2026].weeks[1],rows=Object.fromEntries(ROSTER.slice(0,count).map((m,i)=>[m,{p:w.games[i].home+' ML vs '+w.games[i].away,o:-160,t:T-1000}]));
  importLegacy(s,2026,1,rows,T);activateRelease(s,2026,1,proof,T);
  const current=s.read().seasons[2026];assert.equal(current.current,1);assert.equal(Object.keys(current.weeks[1].picks).length,count);assert.deepEqual(current.weeks[1].legacyExport,rows);assert.equal(current.weeks[1].payer.status,'pending');
 }
});
test('Week 1 midgame import preserves original text/price and locks without inventing kickoff odds',()=>{
 const s=fixture();s.state.seasons[2026].weeks[1].games[0].kick=T-1000;s.state.seasons[2026].weeks[1].games[0].state='in';
 importLegacy(s,2026,1,{McD:{p:'BUF ML vs DET',o:-225,t:T-2000}},T);
 const p=s.read().seasons[2026].weeks[1].picks.McD;assert.equal(p.original.odds,-225);assert.equal(p.quote.odds,-225);assert.equal(p.missingQuote,true);assert.ok(p.lockedAt);
 assert.throws(()=>savePick(s,2026,1,{role:'organizer',member:'Zach'},{...pick('McD'),clear:true,revision:1},T),/locked/);
});
test('Ambiguous Week 1 exports block activation and preserve every original row',()=>{
 const s=fixture(),rows={McD:{p:'BUF ML vs DET',o:-160},Hurd:{p:'DET ML vs BUF',o:140},Unknown:{p:'Unmapped player',o:100}};
 importLegacy(s,2026,1,rows,T);assert.deepEqual(s.read().seasons[2026].weeks[1].legacyExport,rows);assert.throws(()=>activateRelease(s,2026,1,proof,T),/Resolve/);
});
test('Edge organizer link, member boundaries, actual odds, revocation and inactive gate',async()=>{
 const b=await backend(),admin=await(await b.request('api/parlay/session',{key:'test-private-key'})).json(),regular=await b.session('Zach');
 assert.equal(admin.role,'organizer');assert.equal(regular.role,'member');assert.equal((await b.request('api/parlay/session',{key:'wrong'})).status,403);
 assert.equal((await b.request('api/parlay/pick',pick('Hurd'),admin.token)).status,503);
 activate(b.store);
 assert.equal((await b.request('api/parlay/pick',pick('Hurd'),regular.token)).status,403);
 assert.equal((await b.request('api/parlay/pick',pick('Hurd'),admin.token)).status,200);
 assert.equal(b.store.read().seasons[2026].weeks[1].picks.Hurd.addedBy,'organizer');
 assert.equal((await b.request('api/parlay/placed-odds',{year:2026,week:1,odds:'+12,500',revision:0},regular.token)).status,403);
 const before=JSON.stringify(b.store.read().seasons[2026].weeks[1].picks);
 assert.equal((await b.request('api/parlay/placed-odds',{year:2026,week:1,odds:'+12,500',revision:0},admin.token)).status,200);
 assert.equal(b.store.read().seasons[2026].weeks[1].placedTicket.potentialReturn,1260);assert.equal(JSON.stringify(b.store.read().seasons[2026].weeks[1].picks),before);
 assert.equal((await b.request('api/parlay/placed-odds',{year:2026,week:1,odds:14000,revision:0},admin.token)).status,409);
 b.config.organizer_hash=await digest('replacement');assert.equal((await b.request('api/parlay/me',null,admin.token)).status,401);
 assert.equal((await b.request('api/parlay/me',null,regular.token)).status,200);
 assert.equal((await b.request('collect',{})).status,401);
 assert.equal((await b.request('api/parlay/session',{member:'McD'},null,{Origin:'https://evil.example'})).status,403);
 assert.equal((await b.request('api/parlay/demo',{stage:'won'})).status,404);
});
test('Separate Edge workers cannot claim the same game; CAS retry preserves winning pick',async()=>{
 const b=await backend();activate(b.store);const m=await b.session('McD'),h=await b.session('Hurd');
 const responses=await Promise.all([b.request('api/parlay/pick',pick('McD'),m.token),b.request('api/parlay/pick',pick('Hurd'),h.token)]);
 assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);assert.equal(Object.keys(b.store.read().seasons[2026].weeks[1].picks).length,1);
});
test('All twelve ordinary identities preserve their own scope; Week 0 rejected',async()=>{
 const b=await backend();activate(b.store);
 for(let i=0;i<ROSTER.length;i++){const member=ROSTER[i],s=await b.session(member);assert.equal(s.role,'member');assert.equal((await b.request('api/parlay/pick',pick(member,i),s.token)).status,200);assert.equal(b.store.read().seasons[2026].weeks[1].picks[member].addedBy,member);}
 const m=await b.session('McD');assert.equal((await b.request('api/parlay/pick',{...pick('McD'),week:0},m.token)).status,400);
});
test('Week 1 collector never fetches Week 0 or advances the selected prelaunch week',async()=>{
 const b=await backend(),urls=[];
 await collect(b.rpc,b.config,{clock:()=>T,fetchJSON:async url=>{urls.push(url);if(!url.includes('?'))return {season:{year:2026,type:2},week:{number:2}};throw Error('offline');}});
 assert.equal(b.store.read().seasons[2026].current,1);assert.ok(!urls.some(u=>u.includes('week=0')||u.includes('football/season')));assert.equal(b.store.read().seasons[2026].weeks[1].feedError,'offline');
});
test('Concurrent collector changes do not overwrite picks saved during fetch; outage locks due picks',async()=>{
 const b=await backend();activate(b.store);let now=T;
 await collect(b.rpc,b.config,{clock:()=>now,fetchJSON:async()=>{
  await transaction(b.rpc,s=>{if(!s.read().seasons[2026].weeks[1].picks.McD)savePick(s,2026,1,{role:'member',member:'McD'},pick('McD'),T);});
  throw Error('offline');
 }});
 assert.ok(b.store.read().seasons[2026].weeks[1].picks.McD);now=T+7200000;
 await collect(b.rpc,b.config,{clock:()=>now,fetchJSON:async()=>{throw Error('offline');}});
 assert.ok(b.store.read().seasons[2026].weeks[1].picks.McD.lockedAt);
});
