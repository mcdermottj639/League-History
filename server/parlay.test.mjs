import test from 'node:test';
import assert from 'node:assert/strict';
import {Store} from './store.mjs';
import {parseScoreboard,ticket,result,ROSTER} from './domain.mjs';
import {ensure,ingest,savePick,resetParlay,importLegacy,payerFromFantasy,payerFromScores,publicWeek,activateRelease} from './engine.mjs';
import {createApp,hash} from './app.mjs';
import {Collector} from './collector.mjs';
const T=Date.UTC(2026,8,20,16,0),K=T+3600000;
function event(id='g1',kick=K,change={}){return {id,date:new Date(kick).toISOString(),competitions:[{competitors:[{homeAway:'home',team:{abbreviation:'PHI'},score:'24'},{homeAway:'away',team:{abbreviation:'DAL'},score:'20'}],status:{type:{state:'pre',completed:false,name:'STATUS_SCHEDULED'},shortDetail:'Sun 1:00 PM'},odds:[{provider:{name:'DraftKings'},pointSpread:{home:{close:{line:'-3.5',odds:'-110'}},away:{close:{line:'+3.5',odds:'-110'}}},moneyline:{home:{close:{odds:'-160'}},away:{close:{odds:'+140'}}},total:{over:{close:{line:'o47.5',odds:'-110'}},under:{close:{line:'u47.5',odds:'-110'}}}}],...change}]};}
const payload=(events=[event()])=>({season:{year:2026,type:2},week:{number:2},events});
const newStore=()=>new Store(':memory:');
function setup(){const s=newStore();ingest(s,2026,2,payload(),T);return s;}
const member=m=>({member:m,role:'member'}),pick=(m='McD',extra={})=>({member:m,gameId:'g1',market:'spread',side:'PHI',revision:0,...extra});
test('exact six DK markets; unknown bookmaker, opening-only, missing prices never fabricated',()=>{assert.equal(parseScoreboard(payload(),T)[0].markets.length,6);const p=payload();p.events[0].competitions[0].odds[0].provider.name='Other';assert.equal(parseScoreboard(p,T)[0].markets.length,0);p.events[0].competitions[0].odds[0].provider.name='DraftKings';delete p.events[0].competitions[0].odds[0].total.over.close.odds;assert.equal(parseScoreboard(p,T)[0].markets.length,5);assert.equal(parseScoreboard(payload(),K+1)[0].markets.length,0);});
test('reservations are game-wide; replacement preserves old until transaction succeeds; revision conflicts',()=>{const s=setup();savePick(s,2026,2,member('McD'),pick(),T);assert.throws(()=>savePick(s,2026,2,member('Hurd'),pick('Hurd',{market:'total',side:'under'}),T),/just picked/);assert.throws(()=>savePick(s,2026,2,member('McD'),pick('McD',{revision:1,gameId:'unknown'}),T),/closed/);assert.equal(s.read().seasons[2026].weeks[2].picks.McD.gameId,'g1');assert.throws(()=>savePick(s,2026,2,member('McD'),pick(),T),/changed/);savePick(s,2026,2,member('McD'),pick('McD',{revision:1,clear:true}),T);savePick(s,2026,2,member('Hurd'),pick('Hurd'),T);s.close();});
test('organizer attribution, member boundary, kickoff denies edits and clears even with stale feed',()=>{const s=setup();assert.throws(()=>savePick(s,2026,2,member('McD'),pick('Hurd'),T),/own pick/);savePick(s,2026,2,{role:'organizer',member:'Zach'},pick('Hurd'),T);assert.equal(s.read().seasons[2026].weeks[2].picks.Hurd.addedBy,'organizer');assert.throws(()=>savePick(s,2026,2,member('Hurd'),pick('Hurd',{revision:1,clear:true}),K),/locked/);s.close();});
test('first kickoff locks the whole ticket; only an organizer can reset after a final Thursday miss',()=>{
 const s=newStore(),thu=Date.UTC(2026,8,18,0,15),before=thu-60000,after=thu+10800000,organizer={role:'organizer',member:'Zach'};
 try{
  const sunday=thu+259200000;ingest(s,2026,2,payload([event('thu',thu),event('sun',sunday)]),before);savePick(s,2026,2,member('McD'),{...pick('McD'),gameId:'thu'},before);
  const final=payload([event('thu',thu),event('sun',sunday)]),c=final.events[0].competitions[0];c.status.type={state:'post',completed:true,name:'STATUS_FINAL'};c.competitors.find(x=>x.homeAway==='home').score='20';c.competitors.find(x=>x.homeAway==='away').score='24';ingest(s,2026,2,final,after);
  const w=publicWeek(s.read().seasons[2026].weeks[2],after);assert.equal(w.ticket.locked,true);assert.equal(w.ticket.resetEligible,true);
  assert.throws(()=>savePick(s,2026,2,member('Hurd'),{...pick('Hurd'),gameId:'sun'},after),/parlay is locked/);
  assert.throws(()=>resetParlay(s,2026,2,member('McD'),after),/Organizer/);
  resetParlay(s,2026,2,organizer,after);const reset=s.read().seasons[2026].weeks[2];assert.deepEqual(reset.picks,{});assert.equal(reset.resets.length,1);assert.equal(reset.audit.at(-1).action,'reset-parlay');
  const history=publicWeek(reset,after).priorTickets;assert.equal(history.length,1);assert.equal(history[0].ticket.legs[0].member,'McD');assert.equal(history[0].ticket.miss,1);
  assert.equal(publicWeek(reset,after).ticket.locked,false);savePick(s,2026,2,member('Hurd'),{...pick('Hurd'),gameId:'sun'},after);
 }finally{s.close();}
});
test('a non-Thursday loss never opens the reset route',()=>{
 const s=newStore(),sun=Date.UTC(2026,8,20,17,0),before=sun-60000,after=sun+10800000,organizer={role:'organizer',member:'Zach'};
 try{
  ingest(s,2026,2,payload([event('sun',sun)]),before);savePick(s,2026,2,member('McD'),{...pick('McD'),gameId:'sun'},before);
  const final=payload([event('sun',sun)]),c=final.events[0].competitions[0];c.status.type={state:'post',completed:true,name:'STATUS_FINAL'};c.competitors.find(x=>x.homeAway==='home').score='20';c.competitors.find(x=>x.homeAway==='away').score='24';ingest(s,2026,2,final,after);
  assert.equal(publicWeek(s.read().seasons[2026].weeks[2],after).ticket.resetEligible,false);
  assert.throws(()=>resetParlay(s,2026,2,organizer,after),/Thursday leg misses/);
 }finally{s.close();}
});
test('pregame prices move; kickoff captures prior observation, never an in-game quote; locks immutable',()=>{const s=setup();savePick(s,2026,2,member('McD'),pick(),T);const p=payload();p.events[0].competitions[0].odds[0].pointSpread.home.close={line:'-4.5',odds:'-120'};ingest(s,2026,2,p,K-10000);assert.equal(s.read().seasons[2026].weeks[2].picks.McD.quote.line,-4.5);p.events[0].competitions[0].status.type.state='in';p.events[0].competitions[0].odds[0].pointSpread.home.close.line='-9.5';ingest(s,2026,2,p,K+1000);let x=s.read().seasons[2026].weeks[2].picks.McD;assert.equal(x.quote.line,-4.5);assert.equal(x.original.line,-3.5);assert.equal(x.missingQuote,false);ingest(s,2026,2,p,K+60000);assert.equal(s.read().seasons[2026].weeks[2].picks.McD.quote.odds,-120);s.close();});
test('live lead is not a win; final spreads, totals and tie pushes grade saved quote',()=>{const g={home:'PHI',away:'DAL',homeScore:24,awayScore:20,state:'in',completed:false,status:'STATUS_IN_PROGRESS'},p={side:'PHI',market:'spread',quote:{line:-3.5},lockedAt:K};assert.equal(result(p,g),'live');g.completed=true;g.status='STATUS_FINAL';assert.equal(result(p,g),'hit');p.quote.line=-4;assert.equal(result(p,g),'push');p.quote.line=-4.5;assert.equal(result(p,g),'miss');assert.equal(result({...p,market:'total',side:'over',quote:{line:44.5}},g),'miss');assert.equal(result({...p,market:'total',side:'under',quote:{line:44.5}},g),'hit');assert.equal(result({...p,missingQuote:true},g),'pending');});
test('partial tickets cannot become wins; pushes remove price; full all-push refunds',()=>{const make=(m,r)=>({member:m,manualResult:r,quote:{odds:100},lockedAt:K});assert.equal(ticket([make('McD','hit')],[]).status,'incomplete');const legs=ROSTER.map(m=>make(m,'push'));let t=ticket(legs,[]);assert.equal(t.status,'refunded');assert.equal(t.returned,10);legs[0]=make('McD','hit');t=ticket(legs,[]);assert.equal(t.returned,20);legs[1]=make('Hurd','miss');t=ticket(legs,[]);assert.equal(t.status,'lost');assert.equal(t.returned,0);});
test('legacy picks imported once; ambiguous and duplicate rows retained; no invented closing quotes',()=>{const s=setup();importLegacy(s,2026,2,{McD:{p:'PHI -3.5 vs DAL',o:-110},Hurd:{p:'DAL ML vs PHI',o:140},Zach:{p:'Player points over 5',o:110}},K+1000);let w=s.read().seasons[2026].weeks[2];assert.equal(w.unmapped.length,2);assert.equal(w.picks.McD.missingQuote,true);importLegacy(s,2026,2,{McD:{p:'PHI ML',o:100}},K+2000);assert.equal(s.read().seasons[2026].weeks[2].picks.McD.market,'spread');s.close();});
test('payer uses full precision including zero; ties explicit; incomplete samples pending',()=>{const a=ROSTER.map((m,i)=>({member:m,score:i?100:0}));assert.equal(payerFromScores(a,1).members[0],'McD');a[1].score=0;assert.equal(payerFromScores(a,1).status,'tie');assert.equal(payerFromScores(a.slice(1),1).status,'pending');a[1].score=null;assert.equal(payerFromScores(a,1).status,'pending');});
test('background collector works with no browser and locks after source failure',async()=>{const s=newStore();let now=T;const c=new Collector(s,{clock:()=>now,fetchJSON:async url=>{if(url.includes('football/season'))throw Error('offline');if(now>=K)throw Error('offline');return payload();}});await c.cycle(now);savePick(s,2026,2,member('McD'),pick(),T);now=K+1;await c.cycle(now);assert.ok(s.read().seasons[2026].weeks[2].picks.McD.lockedAt);assert.ok(s.read().seasons[2026].weeks[2].feedError);s.close();});
test('HTTP organizer link, persistent session, ordinary Zach is not admin, wrong origins and traversal denied',async()=>{const s=setup(),key='a'.repeat(43),app=createApp({store:s,organizerHash:hash(key),preview:true,clock:()=>T});await new Promise(r=>app.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${app.address().port}`;
 const req=async(path,body,token,headers={})=>fetch(base+'/api/parlay/'+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})});
 try{assert.equal((await req('session',{key:'wrong'})).status,403);const regular=await(await req('session',{member:'Zach'})).json();assert.equal(regular.role,'member');assert.equal((await req('pick',{year:2026,week:2,...pick('Hurd')},regular.token)).status,403);const admin=await(await req('session',{key})).json();assert.equal(admin.role,'organizer');assert.equal((await req('me',null,admin.token)).status,200);assert.equal((await req('pick',{year:2026,week:2,...pick('Hurd')},admin.token)).status,200);assert.equal((await req('session',{member:'McD'},null,{Origin:'https://evil.example'})).status,403);assert.equal((await fetch(base+'/server/app.mjs')).status,404);
 const raw=JSON.stringify(await(await req('state')).json());assert.ok(!raw.includes(key));assert.ok(!raw.includes(admin.token));
 }finally{await new Promise(r=>app.close(r));s.close();}});

test('disk restart preserves picks and hashed organizer sessions; capability rotation rejects previous session',async()=>{
 const {mkdtempSync,rmSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const dir=mkdtempSync(join(tmpdir(),'parlay-test-')),path=join(dir,'state.sqlite');
 let s=new Store(path),app;try{ingest(s,2026,2,payload(),T);savePick(s,2026,2,member('McD'),pick(),T);s.addSession(hash('session-token'),'organizer','Zach',K,hash('first-key').slice(0,16));s.close();s=new Store(path);assert.equal(s.read().seasons[2026].weeks[2].picks.McD.gameId,'g1');assert.equal(s.session(hash('session-token')).role,'organizer');
 app=createApp({store:s,organizerHash:hash('rotated-key'),clock:()=>T});await new Promise(r=>app.listen(0,'127.0.0.1',r));const response=await fetch(`http://127.0.0.1:${app.address().port}/api/parlay/me`,{headers:{Authorization:'Bearer session-token'}});assert.equal(response.status,401);
 }finally{if(app)await new Promise(r=>app.close(r));s.close();rmSync(dir,{recursive:true,force:true});}
});
test('production blocks picks before offline migration; competing requests reserve one game only',async()=>{
 const s=setup(),app=createApp({store:s,organizerHash:hash('key'),clock:()=>T});await new Promise(r=>app.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${app.address().port}/api/parlay/`;
 const post=(path,b,token)=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(b)});
 try{const a=await(await post('session',{member:'McD'})).json(),b=await(await post('session',{member:'Hurd'})).json();assert.equal((await post('pick',{year:2026,week:2,...pick()},a.token)).status,503);importLegacy(s,2026,2,{},T);activateRelease(s,2026,2,{legacyWritesFrozen:true,migrationReconciled:true,backupVerified:true},T);
 const results=await Promise.all([post('pick',{year:2026,week:2,...pick()},a.token),post('pick',{year:2026,week:2,...pick('Hurd')},b.token)]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);assert.equal(Object.keys(s.read().seasons[2026].weeks[2].picks).length,1);assert.equal((await post('demo',{stage:'won'})).status,404);
 }finally{await new Promise(r=>app.close(r));s.close();}
});

test('clearing and re-adding does not allow stale edits to reuse an old revision',()=>{
 const s=setup();savePick(s,2026,2,member('McD'),pick(),T);savePick(s,2026,2,member('McD'),pick('McD',{clear:true,revision:1}),T);
 assert.throws(()=>savePick(s,2026,2,member('McD'),pick(),T),/changed/);savePick(s,2026,2,member('McD'),pick('McD',{revision:2}),T);assert.throws(()=>savePick(s,2026,2,member('McD'),pick('McD',{clear:true,revision:1}),T),/changed/);assert.equal(s.read().seasons[2026].weeks[2].picks.McD.revision,3);s.close();
});
test('missing game in a fresh board cannot use its stale price',()=>{
 const s=setup();const p=payload([event('g2',K+3600000)]);ingest(s,2026,2,p,T+300001);assert.throws(()=>savePick(s,2026,2,member('McD'),pick(),T+300002),/stale/);s.close();
});
test('legacy props are never classified as game totals; unknown original rows retained',()=>{
 const s=setup();importLegacy(s,2026,2,{McD:{p:'PHI Hurts over 60.5 rushing yards',o:-110},Unknown:{p:'Keep original',o:100}},T);const w=s.read().seasons[2026].weeks[2];assert.equal(w.picks.McD.market,'prop');assert.equal(w.legacyExport.Unknown.p,'Keep original');assert.equal(w.unmapped.length,1);assert.throws(()=>activateRelease(s,2026,2,{legacyWritesFrozen:true,migrationReconciled:true,backupVerified:true},T),/Resolve/);s.close();
});
test('delayed launch cannot activate using an imported earlier week',()=>{
 const s=setup();importLegacy(s,2026,2,{},T);s.transact(state=>{ensure(state,2026,3);state.seasons[2026].current=3;});assert.throws(()=>activateRelease(s,2026,2,{legacyWritesFrozen:true,migrationReconciled:true,backupVerified:true},T),/current week/);assert.throws(()=>activateRelease(s,2026,3,{},T),/Import/);s.close();
});

test('authorized cutover command verifies a SQLite backup before enabling writes',async()=>{
 const {mkdtempSync,rmSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {execFileSync}=await import('node:child_process');const {seedPreview}=await import('./preview.mjs');
 const dir=mkdtempSync(join(tmpdir(),'parlay-cutover-')),db=join(dir,'state.sqlite'),backupPath=join(dir,'backup.sqlite');let s=new Store(db);seedPreview(s);s.close();
 try{execFileSync(process.execPath,['scripts/activate-parlay.mjs','--db',db,'--year','2026','--week','2','--backup',backupPath,'--legacy-writes-frozen','--migration-reconciled'],{stdio:'pipe'});s=new Store(db);assert.equal(s.read().seasons[2026].release.cutoverWeek,2);s.close();const backup=new Store(backupPath);assert.equal(Object.keys(backup.read().seasons[2026].weeks[2].picks).length,4);assert.equal(backup.read().seasons[2026].release,undefined);backup.close();}
 finally{rmSync(dir,{recursive:true,force:true});}
});

test('actual ticket odds enforce organizer authority, validation and revision checks independently of kickoff quotes',async()=>{
 const {savePlacedOdds}=await import('./engine.mjs');const s=setup(),organizer={role:'organizer',member:'Zach'};
 try{savePick(s,2026,2,member('McD'),pick(),T);ingest(s,2026,2,payload(),K+1);const quote=JSON.stringify(s.read().seasons[2026].weeks[2].picks.McD);
 assert.throws(()=>savePlacedOdds(s,2026,2,member('Zach'),{odds:12500,revision:0},K+1),/Organizer/);
 for(const value of ['',0,99,'2.5','+12,34','NaN'])assert.throws(()=>savePlacedOdds(s,2026,2,organizer,{odds:value,revision:0},K+1),/odds/);
 const saved=savePlacedOdds(s,2026,2,organizer,{odds:'+12,500',revision:0},K+1);assert.equal(saved.placedTicket.potentialReturn,1260);assert.equal(saved.placedTicket.potentialProfit,1250);
 assert.throws(()=>savePlacedOdds(s,2026,2,organizer,{odds:14000,revision:0},K+2),/changed/);
 const negative=savePlacedOdds(s,2026,2,organizer,{odds:'−110',revision:1},K+2);assert.equal(negative.placedTicket.potentialReturn,19.09);
 savePlacedOdds(s,2026,2,organizer,{clear:true,revision:2},K+3);assert.equal(s.read().seasons[2026].weeks[2].placedTicket,null);assert.throws(()=>savePlacedOdds(s,2026,2,organizer,{odds:12500,revision:0},K+4),/changed/);assert.equal(JSON.stringify(s.read().seasons[2026].weeks[2].picks.McD),quote);
 }finally{s.close();}
});


test('payer accepts the current no-year fantasy feed only with final complete prior-week scores',()=>{
 const p={week:2,teams:ROSTER.map((m,i)=>({team:m,scores:[m==='Zach'?70.9:100+i],outcomes:['L']}))};
 const get=(p,year=2026,week=2,now=T)=>payerFromFantasy(p,year,week,m=>m,now);
 assert.deepEqual(get(p),{status:'ready',members:['Zach'],score:70.9,previousWeek:1});
 assert.throws(()=>get({...p,year:2025}),/season/);
 assert.throws(()=>get(p,2025),/season/);
 assert.throws(()=>get(p,2026,2,Date.UTC(2027,8,20)),/season/);
 assert.equal(get(p,2026,2,Date.UTC(2027,0,2)).status,'ready');
 assert.equal(get({...p,week:1}).status,'pending');
 assert.equal(get(p,2026,1).status,'pending');
 assert.equal(get({...p,teams:p.teams.slice(1)}).status,'pending');
 const unfinished=structuredClone(p);unfinished.teams[0].outcomes[0]='U';assert.equal(get(unfinished).status,'pending');
 const missing=structuredClone(p);missing.teams[0].scores[0]=null;assert.equal(get(missing).status,'pending');
 const zero=structuredClone(p);zero.teams[0].scores[0]=0;assert.equal(get(zero).score,0);
 const tie=structuredClone(p);tie.teams[0].scores[0]=70.9;assert.equal(get(tie).status,'tie');
});
