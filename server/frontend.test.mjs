import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {Store} from './store.mjs';
import {seedPreview} from './preview.mjs';
import {publicWeek} from './engine.mjs';
const source=readFileSync(new URL('../parlay-next.js',import.meta.url),'utf8');
function harness(enabled=true,stage='before',dataOverride=null){
 const store=new Store(':memory:');seedPreview(store,stage);const season=store.read().seasons[2026];store.close();
 const data={year:2026,current:2,preview:true,roster:['McD','Hurd','Slemp','Zach'],weeks:Object.values(season.weeks).map(w=>publicWeek(w))};
 if(dataOverride)Object.assign(data,dataOverride);
 const events={},requests=[],host={dataset:{view:'parlay'},innerHTML:'',querySelector:()=>null,querySelectorAll:()=>[]};let legacyCalls=0;
 const window={LeagueParlay:{paint(){legacyCalls++;}},LeagueHistory:{name:x=>x,me:()=> 'McD'},scrollY:0,scrollTo(){}};
 const context={window,location:{hash:'',pathname:'/',search:''},history:{replaceState(){}},localStorage:{getItem:()=>null,setItem(){},removeItem(){}},document:{addEventListener:(n,fn)=>events[n]=fn,visibilityState:'visible'},setInterval(){},AbortSignal,Date,fetch:async(url,options)=>{requests.push({url,options});return {ok:true,json:async()=>url==='parlay/config.json'?{enabled,api:'',year:2026}:data};}};
 vm.runInNewContext(source,context);
 return {window,host,events,requests,get legacyCalls(){return legacyCalls;},click:async dataset=>events.click({target:{closest:()=>({dataset})}})};
}
test('disabled launch gate renders original parlay and never requests new service',async()=>{const h=harness(false);await h.window.LeagueParlay.paint(h.host);assert.equal(h.legacyCalls,1);assert.equal(h.requests.length,1);});
test('enabled UI renders all six market choices, tab order and ticket/season navigation',async()=>{const h=harness();await h.window.LeagueParlay.paint(h.host);const html=h.host.innerHTML;assert.ok(html.indexOf('data-tab="picks"')<html.indexOf('data-tab="ticket"'));assert.ok(html.indexOf('data-tab="ticket"')<html.indexOf('data-tab="season"'));assert.match(html,/Spread/);assert.match(html,/Moneyline/);assert.match(html,/data-side="over"/);assert.match(html,/data-side="under"/);assert.equal((html.match(/data-pn="select"/g)||[]).length%6,0);assert.doesNotMatch(html,/data-pn="manage"/);
 await h.click({pn:'tab',tab:'ticket'});assert.match(h.host.innerHTML,/Weekly stake/);assert.match(h.host.innerHTML,/partial ticket/);assert.match(h.host.innerHTML,/actual ticket may differ/);
 await h.click({pn:'tab',tab:'season'});assert.match(h.host.innerHTML,/Past tickets/);assert.match(h.host.innerHTML,/No picks settled yet/);
});
test('a started game visibly locks every parlay selection',async()=>{const h=harness(true,'live');await h.window.LeagueParlay.paint(h.host);assert.match(h.host.innerHTML,/This parlay is locked/);assert.match(h.host.innerHTML,/data-pn="edit" disabled/);assert.match(h.host.innerHTML,/data-pn="clear" disabled/);});
test('preview scenario refresh repaints even while its select retains focus',async()=>{const h=harness();await h.window.LeagueParlay.paint(h.host);h.host.innerHTML='old';h.host.querySelector=()=>({});await h.events.change({target:{id:'pn-demo',value:'live'}});assert.notEqual(h.host.innerHTML,'old');assert.ok(h.requests.some(r=>r.url.endsWith('/demo')));});

/* Season odds tracking (v112). The league wanted a record of the PRICES it has
   been taking, which is a running plus/minus tally of American odds and is
   deliberately NOT parlay math: a week at +100 and a week at -150 reads -50,
   where the same two legs multiplied as a real parlay would pay +233. These
   fixtures fix every price by hand so the arithmetic is checked against
   numbers this file states, not against whatever the preview seed happens to
   produce. */
const leg=(member,odds,result='hit',extra={})=>({member,result,lockedAt:1,missingQuote:false,quote:{odds},...extra});
const tk=(legs,combinedOdds)=>({legs,hit:legs.filter(l=>l.result==='hit').length,miss:legs.filter(l=>l.result==='miss').length,push:0,settled:true,full:legs.length===4,status:'lost',stake:10,combinedOdds,returned:0,net:-10,locked:true,resetEligible:false});
const oddsSeason=()=>({year:2026,current:2,preview:true,roster:['McD','Hurd','Slemp','Zach'],weeks:[
 {year:2026,week:1,updatedAt:1,feedError:null,payer:{status:'pending'},placedTicket:{odds:650},ticketOddsRevision:0,revisions:{},priorTickets:[],games:[],unmapped:[],ticket:tk([leg('McD',-150),leg('Hurd',100),leg('Slemp',200,'miss'),leg('Zach',-110)],500)},
 {year:2026,week:2,updatedAt:1,feedError:null,payer:{status:'pending'},placedTicket:null,ticketOddsRevision:0,revisions:{},priorTickets:[],games:[],unmapped:[],ticket:tk([leg('McD',-150),leg('Hurd',-120,'miss'),leg('Slemp',150),leg('Zach',-105)],400)}
]});
async function seasonView(dataOverride){const h=harness(true,'before',dataOverride);await h.window.LeagueParlay.paint(h.host);await h.click({pn:'tab',tab:'season'});return h.host.innerHTML;}

test('season odds add each locked price per member and never multiply them as a parlay',async()=>{
 const html=await seasonView(oddsSeason());
 // McD took -150 twice: the tally is the sum and its own average, not +233-style parlay math.
 assert.match(html,/McD<\/b><span>2–0 · 100%<small class="pn-block">-150 avg<\/small>/);
 // Hurd's +100 and -120 is the owner's own example shape: added, it reads -20.
 assert.match(html,/Hurd<\/b><span>1–1 · 50%<small class="pn-block">-10 avg<\/small>/);
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
