import test from 'node:test';
import assert from 'node:assert/strict';
import {Store} from './store.mjs';
import {parseScoreboard,ticket,result,progress,ROSTER,nflBettingWeek} from './domain.mjs';
import {ensure,ingest,savePick,resetParlay,importLegacy,payerFromFantasy,payerFromScores,publicWeek,activateRelease,collectBoxscores,attachBoxscore} from './engine.mjs';
import {parseProp,parseBoxscore,gradeProp,boxscoreURL} from './props.mjs';
import {createApp,hash} from './app.mjs';
import {Collector} from './collector.mjs';
const T=Date.UTC(2026,8,20,16,0),K=T+3600000;
function event(id='g1',kick=K,change={}){return {id,date:new Date(kick).toISOString(),competitions:[{competitors:[{homeAway:'home',team:{abbreviation:'PHI'},score:'24'},{homeAway:'away',team:{abbreviation:'DAL'},score:'20'}],status:{type:{state:'pre',completed:false,name:'STATUS_SCHEDULED'},shortDetail:'Sun 1:00 PM'},odds:[{provider:{name:'DraftKings'},pointSpread:{home:{close:{line:'-3.5',odds:'-110'}},away:{close:{line:'+3.5',odds:'-110'}}},moneyline:{home:{close:{odds:'-160'}},away:{close:{odds:'+140'}}},total:{over:{close:{line:'o47.5',odds:'-110'}},under:{close:{line:'u47.5',odds:'-110'}}}}],...change}]};}
const payload=(events=[event()])=>({season:{year:2026,type:2},week:{number:2},events});
const newStore=()=>new Store(':memory:');
function setup(){const s=newStore();ingest(s,2026,2,payload(),T);return s;}
const member=m=>({member:m,role:'member'}),pick=(m='McD',extra={})=>({member:m,gameId:'g1',market:'spread',side:'PHI',revision:0,...extra});
test('exact six DK markets; unknown bookmaker, opening-only, missing prices never fabricated',()=>{assert.equal(parseScoreboard(payload(),T)[0].markets.length,6);const p=payload();p.events[0].competitions[0].odds[0].provider.name='Other';assert.equal(parseScoreboard(p,T)[0].markets.length,0);p.events[0].competitions[0].odds[0].provider.name='DraftKings';delete p.events[0].competitions[0].odds[0].total.over.close.odds;assert.equal(parseScoreboard(p,T)[0].markets.length,5);assert.equal(parseScoreboard(payload(),K+1)[0].markets.length,0);});
test('NFL betting week opens Tuesday 4 AM ET even when ESPN is still on the completed week',()=>{
 assert.equal(nflBettingWeek(Date.parse('2026-09-08T08:00:00Z')),1);
 assert.equal(nflBettingWeek(Date.parse('2026-09-10T16:00:00Z')),1);
 assert.equal(nflBettingWeek(Date.parse('2026-09-22T07:59:00Z')),2);
 assert.equal(nflBettingWeek(Date.parse('2026-09-22T08:00:00Z')),3);
 assert.equal(nflBettingWeek(Date.parse('2026-09-23T16:00:00Z')),3);
});
test('background collector opens the Tuesday-4AM week without waiting for ESPN to flip',async()=>{
 const s=newStore();let now=Date.parse('2026-09-22T07:59:00Z');const c=new Collector(s,{clock:()=>now,startWeek:1,fetchJSON:async url=>{if(url.includes('week=3'))return {season:{year:2026,type:2},week:{number:3},events:[]};if(url.includes('football/season'))throw Error('offline');return payload();}});
 await c.cycle(now);assert.equal(s.read().seasons[2026].current,2);
 now=Date.parse('2026-09-22T08:00:00Z');await c.cycle(now);assert.equal(s.read().seasons[2026].current,3);assert.ok(s.read().seasons[2026].weeks[3]);s.close();
});
test('reservations are game-wide; replacement preserves old until transaction succeeds; revision conflicts',()=>{const s=setup();savePick(s,2026,2,member('McD'),pick(),T);assert.throws(()=>savePick(s,2026,2,member('Hurd'),pick('Hurd',{market:'total',side:'under'}),T),/just picked/);assert.throws(()=>savePick(s,2026,2,member('McD'),pick('McD',{revision:1,gameId:'unknown'}),T),/closed/);assert.equal(s.read().seasons[2026].weeks[2].picks.McD.gameId,'g1');assert.throws(()=>savePick(s,2026,2,member('McD'),pick(),T),/changed/);savePick(s,2026,2,member('McD'),pick('McD',{revision:1,clear:true}),T);savePick(s,2026,2,member('Hurd'),pick('Hurd'),T);s.close();});
test('organizer attribution, member boundary, kickoff denies edits and clears even with stale feed',()=>{const s=setup();assert.throws(()=>savePick(s,2026,2,member('McD'),pick('Hurd'),T),/own pick/);savePick(s,2026,2,{role:'organizer',member:'Zach'},pick('Hurd'),T);assert.equal(s.read().seasons[2026].weeks[2].picks.Hurd.addedBy,'organizer');assert.throws(()=>savePick(s,2026,2,member('Hurd'),pick('Hurd',{revision:1,clear:true}),K),/locked/);s.close();});
test('unpicked Thursday games leave empty and Sunday tickets open for saves, changes and clears',()=>{
 const thu=Date.UTC(2026,8,18,0,15),sun=Date.UTC(2026,8,20,17),before=thu-60000;
 for(const state of ['pre','in','post']){
  const s=newStore(),now=thu+3600000,board=payload([event('thu',thu),event('sun',sun),event('late',sun+10800000)]);
  try{
   ingest(s,2026,2,board,before);
   savePick(s,2026,2,member('McD'),pick('McD',{gameId:'sun'}),before);
   board.events[0].competitions[0].status.type={state,completed:state==='post',name:state==='post'?'STATUS_FINAL':state==='in'?'STATUS_IN_PROGRESS':'STATUS_SCHEDULED'};
   ingest(s,2026,2,board,now);
   const w=s.read().seasons[2026].weeks[2];
   assert.equal(publicWeek(w,now).ticket.locked,false,state);
   assert.equal(ticket([],w.games,now).locked,false,state);
   assert.throws(()=>savePick(s,2026,2,member('Hurd'),pick('Hurd',{gameId:'thu'}),now),/game is closed/);
   savePick(s,2026,2,member('McD'),pick('McD',{gameId:'sun',side:'DAL',revision:1}),now);
   savePick(s,2026,2,member('McD'),pick('McD',{clear:true,revision:2}),now);
   savePick(s,2026,2,member('Hurd'),pick('Hurd',{gameId:'sun'}),now);
   savePick(s,2026,2,{role:'organizer',member:'Zach'},pick('McD',{gameId:'late',revision:3}),now);
   assert.equal(publicWeek(s.read().seasons[2026].weeks[2],now).ticket.locked,false);
  }finally{s.close();}
 }
});
test('first selected kickoff locks every pick even with a stale pregame feed',()=>{
 const s=newStore();
 try{
  ingest(s,2026,2,payload([event('g1',K),event('late',K+10800000)]),T);
  savePick(s,2026,2,member('McD'),pick(),T);
  savePick(s,2026,2,member('Hurd'),pick('Hurd',{gameId:'late'}),T);
  assert.equal(publicWeek(s.read().seasons[2026].weeks[2],K-1).ticket.locked,false);
  assert.equal(publicWeek(s.read().seasons[2026].weeks[2],K).ticket.locked,true);
  for(const actor of [member('Hurd'),{role:'organizer',member:'Zach'}]){
   for(const clear of [false,true])assert.throws(()=>savePick(s,2026,2,actor,pick('Hurd',{gameId:'late',revision:1,clear}),K),/parlay is locked/);
  }
 }finally{s.close();}
});
test('a frozen selected leg keeps the ticket locked if its game disappears or changes kickoff',()=>{
 const p={member:'McD',gameId:'g1',market:'ml',side:'PHI',lockedAt:K,quote:{odds:-110}};
 assert.equal(ticket([p],[],K+1).locked,true);
 assert.equal(ticket([p],[{id:'g1',state:'pre',kick:K+3600000}],K+1).locked,true);
 assert.equal(ticket([{...p,lockedAt:null}],[{id:'g1',state:'in',kick:K+3600000}],K).locked,true);
});
test('first selected kickoff locks the whole ticket; only an organizer can reset after a final Thursday miss',()=>{
 const s=newStore(),thu=Date.UTC(2026,8,18,0,15),before=thu-60000,after=thu+10800000,organizer={role:'organizer',member:'Zach'};
 try{
  const sunday=thu+259200000;ingest(s,2026,2,payload([event('thu',thu),event('sun',sunday),event('early',sunday-3600000)]),before);savePick(s,2026,2,member('McD'),{...pick('McD'),gameId:'thu'},before);
  const final=payload([event('thu',thu),event('sun',sunday),event('early',sunday-3600000)]),c=final.events[0].competitions[0];c.status.type={state:'post',completed:true,name:'STATUS_FINAL'};c.competitors.find(x=>x.homeAway==='home').score='20';c.competitors.find(x=>x.homeAway==='away').score='24';ingest(s,2026,2,final,after);
  const w=publicWeek(s.read().seasons[2026].weeks[2],after);assert.equal(w.ticket.locked,true);assert.equal(w.ticket.resetEligible,true);
  assert.throws(()=>savePick(s,2026,2,member('Hurd'),{...pick('Hurd'),gameId:'sun'},after),/parlay is locked/);
  assert.throws(()=>resetParlay(s,2026,2,member('McD'),after),/Organizer/);
  resetParlay(s,2026,2,organizer,after);const reset=s.read().seasons[2026].weeks[2];assert.deepEqual(reset.picks,{});assert.equal(reset.resets.length,1);assert.equal(reset.audit.at(-1).action,'reset-parlay');
  const history=publicWeek(reset,after).priorTickets;assert.equal(history.length,1);assert.equal(history[0].ticket.legs[0].member,'McD');assert.equal(history[0].ticket.miss,1);
  assert.equal(publicWeek(reset,after).ticket.locked,false);savePick(s,2026,2,member('Hurd'),{...pick('Hurd'),gameId:'sun'},after);
  ingest(s,2026,2,final,sunday-1800000);
  assert.equal(publicWeek(s.read().seasons[2026].weeks[2],sunday-1800000).ticket.locked,false,'unpicked kickoff after reset stays open');
  savePick(s,2026,2,member('Hurd'),pick('Hurd',{gameId:'sun',side:'DAL',revision:1}),sunday-1800000);
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

function boxPayload({td=0,rushTd=0,passTd=0,recYds=52,first}={}){
 return {boxscore:{players:[
  {team:{abbreviation:'CHI'},statistics:[
   {name:'receiving',keys:['receptions','receivingYards','yardsPerReception','receivingTouchdowns','longReception','receivingTargets'],athletes:[{athlete:{id:'1',displayName:'Jalen Loveland',shortName:'J. Loveland'},stats:['4',String(recYds),'13.0',String(td),'22','7']}]},
   {name:'rushing',keys:['rushingAttempts','rushingYards','yardsPerRushAttempt','rushingTouchdowns','longRushing'],athletes:[{athlete:{id:'2',displayName:"D'Andre Swift",shortName:'D. Swift'},stats:['12','41','3.4',String(rushTd),'9']}]}
  ]},
  {team:{abbreviation:'MIN'},statistics:[
   {name:'passing',keys:['completions/passingAttempts','passingYards','yardsPerPassAttempt','passingTouchdowns','interceptions'],athletes:[{athlete:{id:'3',displayName:'J.J. McCarthy',shortName:'J. McCarthy'},stats:['13/21','140','6.7',String(passTd),'1']}]}
  ]}
 ]},scoringPlays:first?[{type:{text:first.type},athletesInvolved:first.athletes}]:[]};
}
const finalGame=(box,extra={})=>({home:'CHI',away:'MIN',homeScore:3,awayScore:9,state:'post',completed:true,status:'STATUS_FINAL',boxscore:box,...extra});

test('write-in props parse ATTD, first TD, over/under and N+; junk stays unparsed',()=>{
 assert.deepEqual(parseProp('Loveland ATTD'),{kind:'attd',player:'Loveland'});
 assert.deepEqual(parseProp('CHI Loveland anytime touchdown'),{kind:'attd',player:'Loveland'});
 assert.equal(parseProp('Hurts over 60.5 rushing yards').stat,'rushYds');
 assert.equal(parseProp('Jefferson 80+ rec yards').kind,'threshold');
 assert.equal(parseProp('St. Brown over 6.5 receptions').stat,'receptions');
 assert.equal(parseProp('Mahomes over 1.5 passing TDs').stat,'passTd');
 assert.equal(parseProp('Player points over 5'),null);
});

test('ATTD grades from rush/rec/return TDs, never from passing TDs; unknown names stay pending',()=>{
 const miss=parseBoxscore(boxPayload(),K,true),hit=parseBoxscore(boxPayload({td:1}),K,true),qb=parseBoxscore(boxPayload({passTd:2}),K,true);
 const g=finalGame(miss);
 assert.equal(result({market:'prop',description:'Loveland ATTD',lockedAt:K},g),'miss');
 assert.match(progress({market:'prop',description:'Loveland ATTD',lockedAt:K},g),/0 TDs/);
 assert.equal(result({market:'prop',description:'Loveland ATTD',lockedAt:K},finalGame(hit)),'hit');
 assert.equal(result({market:'prop',description:'McCarthy ATTD',lockedAt:K},finalGame(qb)),'miss');
 assert.equal(result({market:'prop',description:'Nobody ATTD',lockedAt:K},g),'pending');
 assert.equal(result({market:'prop',description:'Player points over 5',lockedAt:K},g),'pending');
});

test('over/under and N+ grade from box score; live hits lock in, live misses wait for final',()=>{
 const box=parseBoxscore(boxPayload({recYds:102}),K,false);
 const live={home:'CHI',away:'MIN',homeScore:3,awayScore:9,state:'in',completed:false,status:'STATUS_IN_PROGRESS',boxscore:box};
 const over={market:'prop',description:'Loveland over 89.5 rec yards',lockedAt:K};
 assert.equal(result(over,live),'hit');
 assert.equal(result({...over,description:'Loveland under 89.5 rec yards'},live),'miss');
 assert.equal(result({market:'prop',description:'Loveland 80+ rec yards',lockedAt:K},live),'hit');
 const short=parseBoxscore(boxPayload({recYds:40}),K,false);
 assert.equal(result(over,{...live,boxscore:short}),'live');
 assert.equal(result(over,finalGame(parseBoxscore(boxPayload({recYds:40}),K,true))),'miss');
});

test('first TD uses scoring plays; passing TD credits the receiver',()=>{
 const box=parseBoxscore(boxPayload({first:{type:'Passing Touchdown',athletes:[{displayName:'Caleb Williams'},{displayName:'Jalen Loveland'}]}}),K,true);
 const g=finalGame(box);
 assert.equal(result({market:'prop',description:'Loveland first TD',lockedAt:K},g),'hit');
 assert.equal(result({market:'prop',description:'Williams first TD',lockedAt:K},g),'miss');
});

test('organizer review still overrides an automatic prop grade',()=>{
 const g=finalGame(parseBoxscore(boxPayload({td:0}),K,true));
 assert.equal(result({market:'prop',description:'Loveland ATTD',lockedAt:K,manualResult:'hit'},g),'hit');
});

test('scoreboard ingest keeps a stored box score; collector fetches summaries only for games with props',async()=>{
 const s=setup();
 savePick(s,2026,2,member('Gotch'),{member:'Gotch',gameId:'g1',market:'prop',description:'Loveland ATTD',odds:155,revision:0},T);
 const final=payload();final.events[0].competitions[0].status.type={state:'post',completed:true,name:'STATUS_FINAL'};
 ingest(s,2026,2,final,K+1000);
 attachBoxscore(s,2026,2,'g1',parseBoxscore(boxPayload({td:0}),K+1000,true));
 ingest(s,2026,2,final,K+2000);
 assert.equal(s.read().seasons[2026].weeks[2].games[0].boxscore.players[0].displayName,'Jalen Loveland');
 assert.equal(publicWeek(s.read().seasons[2026].weeks[2],K+2000).ticket.legs.find(l=>l.member==='Gotch').result,'miss');
 const urls=[];
 await collectBoxscores(s,2026,async url=>{urls.push(url);return boxPayload({td:1});},K+3000);
 assert.ok(!urls.includes(boxscoreURL('g1')));
 const s2=setup();
 savePick(s2,2026,2,member('Gotch'),{member:'Gotch',gameId:'g1',market:'prop',description:'Loveland ATTD',odds:155,revision:0},T);
 ingest(s2,2026,2,final,K+1000);
 await collectBoxscores(s2,2026,async url=>{assert.equal(url,boxscoreURL('g1'));return boxPayload({td:1});},K+1000);
 assert.equal(result(s2.read().seasons[2026].weeks[2].picks.Gotch,s2.read().seasons[2026].weeks[2].games[0]),'hit');
 s.close();s2.close();
});



test('new and legacy reset attempts keep grading and freezing quotes without changing the reset snapshot',()=>{
 for(const legacy of [false,true]){
 const s=newStore(),thu=Date.parse('2026-09-18T00:15:00Z'),sun=Date.parse('2026-09-20T17:00:00Z'),before=thu-60000,after=thu+10800000;
 try{
  ingest(s,2026,2,payload([event('thu',thu),event('sun',sun)]),before);
  savePick(s,2026,2,member('McD'),{...pick(),gameId:'thu'},before);
  savePick(s,2026,2,member('Hurd'),{...pick('Hurd'),gameId:'sun'},before);
  const final=payload([event('thu',thu),event('sun',sun)]),c=final.events[0].competitions[0];c.status.type={state:'post',completed:true,name:'STATUS_FINAL'};c.competitors.find(x=>x.homeAway==='home').score='20';c.competitors.find(x=>x.homeAway==='away').score='24';
  ingest(s,2026,2,final,after);resetParlay(s,2026,2,{role:'organizer',member:'Zach'},after);
  if(legacy)s.transact(state=>{delete state.seasons[2026].weeks[2].resets[0].picks;});
  const original=s.read().seasons[2026].weeks[2].resets[0].ticket;
  ingest(s,2026,2,final,sun-60000);
  const sunday=final.events[1].competitions[0];sunday.status.type={state:'post',completed:true,name:'STATUS_FINAL'};
  ingest(s,2026,2,final,sun+14400000);
  const w=s.read().seasons[2026].weeks[2],prior=publicWeek(w,sun+14400000).priorTickets[0].ticket;
  assert.equal(prior.legs.find(p=>p.member==='Hurd').result,'hit');assert.equal(prior.settled,true);
  assert.equal(prior.legs.find(p=>p.member==='Hurd').quote.observedAt,sun-60000);
  assert.deepEqual(w.resets[0].ticket,original);assert.deepEqual(w.picks,{});
 }finally{s.close();}
 }
});

test('archived prop selections still request their final box scores',async()=>{
 const s=setup();
 try{
  savePick(s,2026,2,member('McD'),pick('McD',{market:'prop',description:'Jalen Loveland ATTD',odds:150}),T);
  s.transact(state=>{const w=state.seasons[2026].weeks[2];w.resets=[{at:K,reason:'thursday-miss',ticket:{legs:Object.values(w.picks),stake:10}}];w.picks={};const g=w.games[0];g.state='post';g.status='STATUS_FINAL';g.completed=true;});
  const urls=[];await collectBoxscores(s,2026,async url=>{urls.push(url);return boxPayload({td:1});},K+1000);
  assert.deepEqual(urls,[boxscoreURL('g1')]);
  assert.equal(publicWeek(s.read().seasons[2026].weeks[2],K+1000).priorTickets[0].ticket.legs[0].result,'hit');
 }finally{s.close();}
});
