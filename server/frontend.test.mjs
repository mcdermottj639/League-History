import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {Store} from './store.mjs';
import {seedPreview} from './preview.mjs';
import {publicWeek} from './engine.mjs';
const source=readFileSync(new URL('../parlay-next.js',import.meta.url),'utf8');
function harness(enabled=true,stage='before',dataOverride=null,organizer=false,confirmReset=true,owner=false){
 const store=new Store(':memory:');seedPreview(store,stage);const season=store.read().seasons[2026];store.close();
 const data={supportsPickReset:true,year:2026,current:2,preview:true,roster:['McD','Hurd','Slemp','Zach'],weeks:Object.values(season.weeks).map(w=>publicWeek(w))};
 if(dataOverride)Object.assign(data,dataOverride);
 const events={},requests=[],host={dataset:{view:'parlay'},innerHTML:'',querySelector:()=>null,querySelectorAll:()=>[]};let legacyCalls=0;
 const window={LeagueOwner:{is:()=>owner},LeagueOwnerLinks:{parlayKey:()=> 'A'.repeat(43)},LeagueParlay:{paint(){legacyCalls++;}},LeagueHistory:{name:x=>x,me:()=> 'McD'},scrollY:0,scrollTo(){}};
 const context={window,location:{hash:'',pathname:'/',search:''},history:{replaceState(){}},confirm:()=>confirmReset,localStorage:{getItem:k=>organizer&&k==='lh:parlay-session:v2'?JSON.stringify({token:'test',role:'organizer',member:'Zach'}):null,setItem(){},removeItem(){}},document:{addEventListener:(n,fn)=>events[n]=fn,visibilityState:'visible'},setInterval(){},AbortSignal,Date,fetch:async(url,options)=>{requests.push({url,options});return {ok:true,json:async()=>url==='parlay/config.json'?{enabled,api:'',year:2026}:url.endsWith('/me')||url.endsWith('/session')?{token:'test',role:'organizer',member:'Zach'}:data};}};
 vm.runInNewContext(readFileSync(new URL('../ticket-values.js',import.meta.url),'utf8'),context);
 vm.runInNewContext(source,context);
 return {data,window,host,events,requests,get legacyCalls(){return legacyCalls;},click:async dataset=>events.click({target:{closest:()=>({dataset})}})};
}
test('disabled launch gate renders original parlay and never requests new service',async()=>{const h=harness(false);await h.window.LeagueParlay.paint(h.host);assert.equal(h.legacyCalls,1);assert.equal(h.requests.length,1);});
test('enabled UI renders all six market choices, tab order and ticket/season navigation',async()=>{const h=harness();await h.window.LeagueParlay.paint(h.host);const html=h.host.innerHTML;assert.ok(html.indexOf('data-tab="picks"')<html.indexOf('data-tab="ticket"'));assert.ok(html.indexOf('data-tab="ticket"')<html.indexOf('data-tab="season"'));assert.match(html,/Spread/);assert.match(html,/Moneyline/);assert.match(html,/data-side="over"/);assert.match(html,/data-side="under"/);assert.equal((html.match(/data-pn="select"/g)||[]).length%6,0);assert.doesNotMatch(html,/data-pn="manage"/);
 await h.click({pn:'tab',tab:'ticket'});assert.match(h.host.innerHTML,/Weekly stake/);assert.match(h.host.innerHTML,/partial ticket/);assert.match(h.host.innerHTML,/actual ticket may differ/);
 await h.click({pn:'tab',tab:'season'});assert.match(h.host.innerHTML,/Past tickets/);assert.match(h.host.innerHTML,/No picks settled yet/);
});
test('a started game visibly locks every parlay selection',async()=>{const h=harness(true,'live');await h.window.LeagueParlay.paint(h.host);assert.match(h.host.innerHTML,/This parlay is locked/);assert.match(h.host.innerHTML,/data-pn="edit" disabled/);assert.match(h.host.innerHTML,/data-pn="clear" disabled/);});
test('an unpicked started game leaves saved-pick controls and the remaining game board open',async()=>{
 const store=new Store(':memory:');seedPreview(store,'before');
 const w=store.read().seasons[2026].weeks[2],now=Date.now();
 w.picks.McD={...w.picks.Hurd,member:'McD'};delete w.picks.Hurd;
 Object.assign(w.games.at(-1),{kick:now-3600000,state:'post',completed:true,status:'STATUS_FINAL'});
 const h=harness(true,'before',{weeks:[publicWeek(w,now)]});store.close();
 await h.window.LeagueParlay.paint(h.host);
 assert.doesNotMatch(h.host.innerHTML,/This parlay is locked/);
 assert.doesNotMatch(h.host.innerHTML,/data-pn="(?:edit|clear)" disabled/);
 await h.click({pn:'edit'});assert.match(h.host.innerHTML,/data-pn="select"/);
 assert.doesNotMatch(h.host.innerHTML,/data-game="demo15"/);
});
test('preview scenario refresh repaints even while its select retains focus',async()=>{const h=harness();await h.window.LeagueParlay.paint(h.host);h.host.innerHTML='old';h.host.querySelector=()=>({});await h.events.change({target:{id:'pn-demo',value:'live'}});assert.notEqual(h.host.innerHTML,'old');assert.ok(h.requests.some(r=>r.url.endsWith('/demo')));});

/* Season prices use equal-stake decimal averages, never a parlay product. */
const leg=(member,odds,result='hit',extra={})=>({member,result,lockedAt:1,missingQuote:false,quote:{odds},...extra});
const tk=(legs,combinedOdds)=>({legs,hit:legs.filter(l=>l.result==='hit').length,miss:legs.filter(l=>l.result==='miss').length,push:0,settled:true,full:legs.length===4,status:'lost',stake:10,combinedOdds,returned:0,net:-10,locked:true,resetEligible:false});
const oddsSeason=()=>({year:2026,current:2,preview:true,roster:['McD','Hurd','Slemp','Zach'],weeks:[
 {year:2026,week:1,updatedAt:1,feedError:null,payer:{status:'pending'},placedTicket:{odds:650},ticketOddsRevision:0,revisions:{},priorTickets:[],games:[],unmapped:[],ticket:tk([leg('McD',-150),leg('Hurd',100),leg('Slemp',200,'miss'),leg('Zach',-110)],500)},
 {year:2026,week:2,updatedAt:1,feedError:null,payer:{status:'pending'},placedTicket:null,ticketOddsRevision:0,revisions:{},priorTickets:[],games:[],unmapped:[],ticket:tk([leg('McD',-150),leg('Hurd',-120,'miss'),leg('Slemp',150),leg('Zach',-105)],400)}
]});
async function seasonView(dataOverride){const h=harness(true,'before',dataOverride);await h.window.LeagueParlay.paint(h.host);await h.click({pn:'tab',tab:'season'});return h.host.innerHTML;}

test('season odds average decimal prices per member without multiplying',async()=>{
 const html=await seasonView(oddsSeason());
 // Identical favorite prices remain unchanged.
 assert.match(html,/McD<\/b><span>2–0 · 100%<small class="pn-block">-150 avg<\/small>/);
 // +100 and -120 average to decimal 1.9167, or -109 American.
 assert.match(html,/Hurd<\/b><span>1–1 · 50%<small class="pn-block">-109 avg<\/small>/);
 assert.match(html,/odds they have been taking/);
});

test('season weekly odds prefer the placed ticket and name how many weeks each source covered',async()=>{
 const html=await seasonView(oddsSeason());
 // Week 1 counts Zach's placed +650 over the tracked +500; week 2 falls back to tracked +400.
 assert.match(html,/<strong>\+525<\/strong><small>Avg weekly odds<\/small>/);
 assert.doesNotMatch(html,/Season odds total/);
 assert.match(html,/2 of 2 tickets · 1 from the placed ticket, 1 tracked at kickoff\. Averaged, not parlay math\./);
});

test('unlocked, unpriced and flagged legs are excluded from the odds tally and the shortfall is visible',async()=>{
 const data=oddsSeason();
 data.weeks[1].ticket.legs=[leg('McD',-150),leg('Hurd',-120,'miss',{missingQuote:true}),leg('Slemp',150,'upcoming',{lockedAt:null}),leg('Zach',null)];
 const html=await seasonView(data);
 // Hurd keeps only his week 1 price; Slemp's unlocked leg and Zach's missing price never enter a total.
 assert.match(html,/Hurd<\/b><span>1–1 · 50%<small class="pn-block">\+100 avg<\/small>/);
 assert.match(html,/Slemp<\/b><span>0–1 · 0%<small class="pn-block">\+200 avg<\/small>/);
 assert.match(html,/Zach<\/b><span>2–0 · 100%<small class="pn-block">-110 avg<\/small>/);
 // With the per-row count gone, the caption is the only thing naming the shortfall.
 assert.match(html,/3 legs had no locked price and are left out\./);
});

test('a season with no locked prices says so instead of printing a zero total',async()=>{
 const data=oddsSeason();
 data.current=1;data.weeks=[{...data.weeks[0],placedTicket:null,ticket:tk([leg('McD',-150,'upcoming',{lockedAt:null})],null)}];
 const html=await seasonView(data);
 assert.match(html,/<strong>—<\/strong><small>Avg weekly odds<\/small>/);
 assert.match(html,/Weekly odds appear once a ticket locks at kickoff with its prices known\./);
 assert.match(html,/McD<\/b><span><span aria-label="No settled picks or locked prices">—<\/span>/);
});

test('tied records sort by average odds, better American number first',async()=>{
 const namesOf=html=>[...html.split('Who carries the ticket')[1].split('Past tickets')[0].matchAll(/<div class="pn-row pn-record"><b>([^<]*)<\/b>/g)].map(m=>m[1]);
 const data={supportsPickReset:true,year:2026,current:2,preview:true,roster:['McD','CC','Hyman','Christel','Zach','Gotch','Wolff','Riz'],weeks:[
  {year:2026,week:2,updatedAt:1,feedError:null,payer:{status:'pending'},placedTicket:null,ticketOddsRevision:0,revisions:{},priorTickets:[],games:[],unmapped:[],ticket:tk([
   leg('CC',-110),leg('Hyman',-120),leg('Zach',-142),leg('Christel',-225),leg('McD',-238),leg('Gotch',155,'miss'),leg('Wolff',-105,'miss')
  ],100)}
 ]};
 const names=namesOf(await seasonView(data));
 assert.deepEqual(names.filter(n=>['CC','Hyman','Zach','Christel','McD'].includes(n)),['CC','Hyman','Zach','Christel','McD']);
 assert.deepEqual(names.filter(n=>['Gotch','Wolff'].includes(n)),['Gotch','Wolff']);
 assert.ok(names.indexOf('Gotch')>names.indexOf('McD'));
 assert.equal(names.at(-1),'Riz');
});


test('Parlay follows rollover on refresh and reopening while respecting a manual history selection',async()=>{
 const h=harness();await h.window.LeagueParlay.paint(h.host);
 const next=structuredClone(h.data.weeks[0]);next.week=3;next.ticket.legs=[];
 h.data.current=3;h.data.weeks.unshift(next);await h.click({pn:'refresh'});
 assert.match(h.host.innerHTML,/<option value="3" selected>/);
 await h.events.change({target:{id:'pn-week',value:'2'}});await h.click({pn:'refresh'});
 assert.match(h.host.innerHTML,/<option value="2" selected>/);
 await h.window.LeagueParlay.paint(h.host);assert.match(h.host.innerHTML,/<option value="3" selected>/);
});

// Real saved-price examples from the September 27 report.
test('reported member prices produce valid American averages including heavy favorites',async()=>{
 const data=oddsSeason();
 data.roster=['Zach','Gotch','Christel','McD'];
 data.weeks[0].ticket=tk([leg('Zach',-142),leg('Gotch',155),leg('Christel',-225),leg('McD',-238)],-225);
 data.weeks[0].placedTicket={odds:-225};
 data.weeks[1].ticket=tk([leg('Zach',180),leg('Gotch',-115),leg('Christel',-600),leg('McD',-170)],-600);
 const html=await seasonView(data);
 for(const [member,avg] of [['Zach','+125'],['Gotch','+121'],['Christel','-327'],['McD','-198']])
  assert.ok(html.includes(member+'</b><span>2–0 · 100%<small class="pn-block">'+avg+' avg</small>'));
 assert.match(html,/<strong>-327<\/strong><small>Avg weekly odds<\/small>/);
});
test('evens normalize to +100 and invalid prices are excluded',async()=>{
 const data=oddsSeason();data.roster=['McD','Hurd'];
 data.weeks[0].ticket=tk([leg('McD',-100),leg('Hurd',20)],100);
 data.weeks[1].ticket=tk([leg('McD',100),leg('Hurd',Infinity)],100);
 const html=await seasonView(data);
 assert.match(html,/McD<\/b><span>2–0 · 100%<small class="pn-block">\+100 avg/);
 assert.match(html,/Hurd<\/b><span>2–0 · 100%<small class="pn-block">No locked prices/);
});

 test('missed-bet reset is organizer-only and confirms a revision-bound individual request',async()=>{
  const h=harness(true,'live',null,true);await h.window.LeagueParlay.paint(h.host);await h.click({pn:'manage'});
  assert.match(h.host.innerHTML,/data-pn="reset-pick"/);await h.click({pn:'reset-pick'});
  const req=h.requests.find(r=>r.url.endsWith('/reset-pick'));assert.ok(req);const body=JSON.parse(req.options.body);
  assert.equal(body.member,'McD');assert.equal(body.reason,'bet-not-placed');assert.equal(body.revision,h.data.weeks.find(w=>w.week===2).ticket.legs.find(p=>p.member==='McD').revision);assert.equal(req.options.headers.Authorization,'Bearer test');
  const cancelled=harness(true,'live',null,true,false);await cancelled.window.LeagueParlay.paint(cancelled.host);await cancelled.click({pn:'manage'});await cancelled.click({pn:'reset-pick'});assert.ok(!cancelled.requests.some(r=>r.url.endsWith('/reset-pick')));
  const regular=harness(true,'live');await regular.window.LeagueParlay.paint(regular.host);assert.doesNotMatch(regular.host.innerHTML,/data-pn="reset-pick"/);
 });
 test('reset member can select an upcoming replacement while other legs keep the ticket locked',async()=>{
  const h=harness(true,'live');const w=h.data.weeks.find(w=>w.week===2);w.ticket.legs=w.ticket.legs.filter(p=>p.member!=='McD');w.replacementSlots={McD:true};
  await h.window.LeagueParlay.paint(h.host);assert.match(h.host.innerHTML,/Your pick was reset/);assert.doesNotMatch(h.host.innerHTML,/This parlay is locked/);assert.doesNotMatch(h.host.innerHTML,/data-pn="select"[^>]*disabled/);assert.match(h.host.innerHTML,/data-pn="prop"/);
 });

test('older backend never offers or sends an unsupported pick reset',async()=>{
 const h=harness(true,'live',{supportsPickReset:undefined},true);await h.window.LeagueParlay.paint(h.host);await h.click({pn:'manage'});assert.doesNotMatch(h.host.innerHTML,/data-pn="reset-pick"/);await h.click({pn:'reset-pick'});assert.ok(!h.requests.some(r=>r.url.endsWith('/reset-pick')));
});

test('owner automatically verifies saved organizer capability without opening a special link',async()=>{
 const h=harness(true,'live',null,false,true,true);await h.window.LeagueParlay.paint(h.host);
 assert.match(h.host.innerHTML,/data-pn="manage"/);
 const request=h.requests.find(r=>r.url.endsWith('/session'));assert.equal(JSON.parse(request.options.body).key,'A'.repeat(43));
 await h.click({pn:'manage'});assert.match(h.host.innerHTML,/Reset this person’s pick/);
 const ordinary=harness(true,'live');await ordinary.window.LeagueParlay.paint(ordinary.host);assert.ok(!ordinary.requests.some(r=>r.url.endsWith('/session')));assert.doesNotMatch(ordinary.host.innerHTML,/data-pn="manage"/);
});

test('ticket headline uses entered odds instead of calculated odds and warns about missing legs',async()=>{
 const h=harness(true,'before');const w=h.data.weeks.find(w=>w.week===2);
 w.ticket.combinedOdds=37530;w.placedTicket={odds:59655,stake:10,potentialReturn:5975.57,potentialProfit:5965.57,legCount:11,legsConfirmed:false,source:'screenshot',exactReturn:true};
 await h.window.LeagueParlay.paint(h.host);await h.click({pn:'tab',tab:'ticket'});
 assert.match(h.host.innerHTML,/<strong>\+59,655<\/strong><small>Placed odds/);assert.doesNotMatch(h.host.innerHTML,/37,530/);assert.match(h.host.innerHTML,/\$5,975\.57/);assert.match(h.host.innerHTML,/11 picks on ticket/);assert.match(h.host.innerHTML,/not tracking the complete placed ticket/);
});
test('photo import control requires organizer and deployed receipt capability',async()=>{
 for(const [organizer,capability,visible] of [[true,true,true],[false,true,false],[true,false,false]]){
  const h=harness(true,'before',{supportsTicketReceipt:capability},organizer);await h.window.LeagueParlay.paint(h.host);await h.click({pn:'tab',tab:'ticket'});
  assert.equal(h.host.innerHTML.includes('pn-receipt-file'),visible);
 }
});

test('late tracking form is available only to verified organizers with deployed support and an empty slot',async()=>{
 for(const [organizer,capability,visible] of [[true,true,true],[false,true,false],[true,false,false]]){
  const h=harness(true,'live',{supportsTrackingEntry:capability},organizer);
  const w=h.data.weeks.find(w=>w.week===2);w.ticket.legs=w.ticket.legs.filter(p=>p.member!=='Slemp');
  await h.window.LeagueParlay.paint(h.host);await h.click({pn:'manage'});
  await h.events.change({target:{id:'pn-target',value:'Slemp'}});
  assert.equal(h.host.innerHTML.includes('data-pn="tracking"'),visible);
  if(visible){assert.match(h.host.innerHTML,/Original American odds/);assert.match(h.host.innerHTML,/includes started games/);}
 }
});
