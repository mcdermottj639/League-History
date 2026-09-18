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

/* ══ 🏈 THE TICKER'S SCOREBOARD (v113) — PREPARED AND OFF ═════════════════
   Fixtures only. The point of most of these is that shipping this code cannot
   start traffic or store anything anywhere. */
const BOARD=(over={})=>({week:3,games:[
 {away:{teamId:'1',team:'Aarogant Fraudgers',score:96.4,yetToPlay:4,starters:9,onBye:0},
  home:{teamId:'7',team:'Death Dont Hurts Very Long',score:88.2,yetToPlay:3,starters:9,onBye:0},state:'live'},
 {away:{teamId:'3',team:'Slob on my Cobb',score:118.6,yetToPlay:0,starters:9,onBye:0},
  home:{teamId:'6',team:'Jared Goff Hits Women',score:102.3,yetToPlay:0,starters:9,onBye:0},state:'final'},
],...over});
const FINAL_BOARD=()=>BOARD({games:BOARD().games.map(g=>({...g,state:'final'}))});
/* 🚨 THE REAL BROWSER VALIDATOR, LOADED THE WAY THE EDGE FUNCTION LOADS IT.
   If ticker.js ever touches `document` or `localStorage` at module scope this
   throws here, which is the only place that failure can be caught before Deno
   hits it in production. */
async function browserValidator(){
 const fake={};globalThis.window=fake;
 const {readFileSync}=await import('node:fs');
 /* ⚠️ INDIRECT EVAL, so the source runs in GLOBAL scope and its bare `window`
    resolves to `globalThis.window` — which is the actual contract the edge
    function relies on. Passing `window` as a function parameter would shadow
    it and pass even if ticker.js only ever worked with an injected one. */
 (0,eval)(readFileSync('./ticker.js','utf8'));
 return board=>fake.LeagueTicker._t.valid(board);
}
const withBoard=async url=>{const b=await backend();b.config.scoreboard_url=url;return b;};
const boardOf=b=>b.store.read().seasons[2026].scoreboard;
const ask=b=>b.request('api/parlay/scoreboard');

test('Scoreboard collection is OFF with no url: nothing fetched, nothing stored, the route says so',async()=>{
 const b=await backend();const urls=[];
 await collect(b.rpc,b.config,{clock:()=>T,validBoard:()=>true,
  fetchJSON:async url=>{urls.push(url);throw Error('offline');}});
 assert.ok(!urls.some(u=>u.includes('scoreboard')&&!u.includes('espn.com')));
 assert.equal(boardOf(b),undefined);
 const r=await ask(b);assert.equal(r.status,503);
 assert.match((await r.json()).error,/No scoreboard has been collected/);
});

test('Scoreboard collection FAILS CLOSED without a validator, even with a url and a good payload',async()=>{
 const b=await withBoard('https://feed.test/board');
 await collect(b.rpc,b.config,{clock:()=>T,fetchJSON:async u=>u.includes('feed.test')?BOARD():{events:[]}});
 assert.equal(boardOf(b),undefined,'a collector with no validator must store nothing');
 assert.match(b.store.read().seasons[2026].collector.lastScoreboardError,/Unrecognised/);
});

test('A valid board is stored with its observation time and served publicly',async()=>{
 const b=await withBoard('https://feed.test/board');const validBoard=await browserValidator();
 await collect(b.rpc,b.config,{clock:()=>T,validBoard,
  fetchJSON:async u=>u.includes('feed.test')?BOARD():{events:[]}});
 assert.equal(boardOf(b).games.length,2);
 assert.equal(boardOf(b).observedAt,T);
 const r=await ask(b);assert.equal(r.status,200);
 const j=await r.json();
 assert.equal(j.week,3);assert.equal(j.games[0].home.score,88.2);assert.equal(j.observedAt,T);
 /* Public: scores, no picks, no session. It must answer with no token at all. */
 assert.ok(!JSON.stringify(j).includes('picks'));
});

test('An error page is refused and the board already stored stays readable',async()=>{
 const b=await withBoard('https://feed.test/board');const validBoard=await browserValidator();
 await collect(b.rpc,b.config,{clock:()=>T,validBoard,fetchJSON:async u=>u.includes('feed.test')?BOARD():{events:[]}});
 assert.equal(boardOf(b).games.length,2);
 for(const junk of [{error:'gateway'},{week:3},{week:3,games:[{away:{teamId:'1'},state:'live'}]},
                    {week:3,games:[{...BOARD().games[0],state:'halftime'}]}]){
  await collect(b.rpc,b.config,{clock:()=>T+3600000,validBoard,
   fetchJSON:async u=>u.includes('feed.test')?junk:{events:[]}});
  assert.equal(boardOf(b).games.length,2,'the last good board must survive a bad poll');
  assert.ok(b.store.read().seasons[2026].collector.lastScoreboardError);
 }
});

test('Cadence comes from the board: 60s while live, 15 minutes once everything is final',async()=>{
 const validBoard=await browserValidator();
 const b=await withBoard('https://feed.test/board');let hits=0;
 const run=async at=>collect(b.rpc,b.config,{clock:()=>at,validBoard,
  fetchJSON:async u=>{if(!u.includes('feed.test'))return {events:[]};hits++;return BOARD();}});
 await run(T);assert.equal(hits,1);
 await run(T+30000);assert.equal(hits,1,'30s after a live board is too soon');
 await run(T+61000);assert.equal(hits,2,'60s after a live board is due');

 const c=await withBoard('https://feed.test/board');let cHits=0;
 const runFinal=async at=>collect(c.rpc,c.config,{clock:()=>at,validBoard,
  fetchJSON:async u=>{if(!u.includes('feed.test'))return {events:[]};cHits++;return FINAL_BOARD();}});
 await runFinal(T);assert.equal(cHits,1);
 await runFinal(T+120000);assert.equal(cHits,1,'two minutes after an all-final board is too soon');
 await runFinal(T+901000);assert.equal(cHits,2,'fifteen minutes on, poll again');
});

test('A scoreboard outage never changes the parlay run it rides along with',async()=>{
 /* ⚠️ ISOLATED, NOT ASSERTED ABSOLUTELY. The first cut asserted `ok === true`
    with a stub ESPN payload that was already failing the run for parlay
    reasons, so it was testing the stub, not the change. What matters is that
    configuring a board CANNOT move the result either way, so the two runs are
    identical except for the one variable. */
 const validBoard=await browserValidator();
 const espn=async u=>{if(u.includes('feed.test'))throw Error('Source HTTP 502');return {events:[]};};
 const plain=await backend();
 const base=await collect(plain.rpc,plain.config,{clock:()=>T,validBoard,fetchJSON:espn});
 const b=await withBoard('https://feed.test/board');
 const withFeed=await collect(b.rpc,b.config,{clock:()=>T,validBoard,fetchJSON:espn});
 assert.deepEqual(withFeed,base,'the parlay collector owns the run; the board is a courtesy on top');
 assert.match(b.store.read().seasons[2026].collector.lastScoreboardError,/502/);
 assert.equal(plain.store.read().seasons[2026].collector.lastScoreboardError,undefined);
});
