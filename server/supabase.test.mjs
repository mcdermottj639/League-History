import test from 'node:test';
import assert from 'node:assert/strict';
import {MemoryStore,digest,transaction} from './supabase-store.mjs';
import {edgeApp} from './supabase-runtime.mjs';
import {collect,getJSON} from './supabase-collector.mjs';
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
 b.store.transact(state=>{const w=state.seasons[2026].weeks[1],p=w.picks.Hurd,g=w.games.find(x=>x.id===p.gameId);g.kick=Date.UTC(2026,8,18,0,15);g.state='post';g.completed=true;g.status='STATUS_FINAL';g.homeScore=20;g.awayScore=24;p.lockedAt=g.kick;});
 assert.equal((await b.request('api/parlay/reset',{year:2026,week:1},regular.token)).status,403);
 assert.equal((await b.request('api/parlay/reset',{year:2026,week:1},admin.token)).status,200);
 assert.equal(Object.keys(b.store.read().seasons[2026].weeks[1].picks).length,0);
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
test('live collector opens the next week at Tuesday 4 AM ET while ESPN is still on the completed board',async()=>{
 const b=await backend();activate(b.store);
 b.store.transact(s=>{s.seasons[2026].current=2;s.seasons[2026].weeks[2]=structuredClone(s.seasons[2026].weeks[1]);s.seasons[2026].weeks[2].week=2;});
 const tue=Date.parse('2026-09-22T08:00:00Z'),urls=[];
 await collect(b.rpc,b.config,{clock:()=>tue,fetchJSON:async url=>{urls.push(url);const week=Number(new URL(url).searchParams.get('week')||2);return {season:{year:2026,type:2},week:{number:week},events:[]};}});
 assert.equal(b.store.read().seasons[2026].current,3);assert.ok(b.store.read().seasons[2026].weeks[3]);assert.ok(urls.some(u=>u.includes('week=3')));
});
test('Collector uses honest identifying headers and reports source failure instead of a false success',async()=>{
 await getJSON('https://source.example',async(url,options)=>{assert.equal(options.headers.Accept,'application/json');assert.equal(options.headers['User-Agent'],'League-History/Parlay');return Response.json({ok:true});});
 const b=await backend();const result=await collect(b.rpc,b.config,{clock:()=>T,fetchJSON:async()=>{throw Error('Source HTTP 403');}});
 assert.equal(result.ok,false);assert.equal(result.error,'Source HTTP 403');assert.equal(b.store.read().seasons[2026].collector.lastSuccess,undefined);
 const handler=edgeApp(b.rpc,{clock:()=>T,fetchJSON:async()=>{throw Error('Source HTTP 403');}});
 const response=await handler(new Request('https://example.test/functions/v1/league-parlay/collect',{method:'POST',headers:{Authorization:'Bearer collector-test-key'}}));
 assert.equal(response.status,502);assert.equal((await response.json()).ok,false);
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
test('Collector fetches ESPN box scores for final write-in props without failing the board when the summary is down',async()=>{
 const b=await backend();activate(b.store);
 const g=b.store.read().seasons[2026].weeks[1].games[0];
 savePick(b.store,2026,1,{role:'member',member:'Gotch'},{member:'Gotch',gameId:g.id,market:'prop',description:'Loveland ATTD',odds:155,revision:0},T);
 const scoreboard={season:{year:2026,type:2},week:{number:1},events:[{id:g.id,date:new Date(T-1000).toISOString(),competitions:[{competitors:[{homeAway:'home',team:{abbreviation:g.home},score:'3'},{homeAway:'away',team:{abbreviation:g.away},score:'9'}],status:{type:{state:'post',completed:true,name:'STATUS_FINAL'}}}]}]};
 const summary={boxscore:{players:[{team:{abbreviation:g.home},statistics:[{name:'receiving',keys:['receptions','receivingYards','receivingTouchdowns'],athletes:[{athlete:{id:'1',displayName:'Jalen Loveland'},stats:['4','52','0']}]}]}]}};
 const urls=[];
 const result=await collect(b.rpc,b.config,{clock:()=>T+1000,fetchJSON:async url=>{urls.push(url);if(url.includes('/summary'))return summary;if(url.includes('scoreboard'))return scoreboard;throw Error('unexpected '+url);}});
 assert.equal(result.ok,true);assert.ok(urls.some(u=>u.includes('/summary?event='+g.id)));
 assert.equal(b.store.read().seasons[2026].weeks[1].games.find(x=>x.id===g.id).boxscore.players[0].displayName,'Jalen Loveland');
 const down=await backend();activate(down.store);
 const g2=down.store.read().seasons[2026].weeks[1].games[0];
 savePick(down.store,2026,1,{role:'member',member:'Gotch'},{member:'Gotch',gameId:g2.id,market:'prop',description:'Loveland ATTD',odds:155,revision:0},T);
 const failed=await collect(down.rpc,down.config,{clock:()=>T+1000,fetchJSON:async url=>{if(url.includes('/summary'))throw Error('Source HTTP 403');if(url.includes('scoreboard'))return scoreboard;throw Error('unexpected');}});
 assert.equal(failed.ok,true);assert.ok(down.store.read().seasons[2026].weeks[1].games.find(x=>x.id===g2.id).boxError);
});

