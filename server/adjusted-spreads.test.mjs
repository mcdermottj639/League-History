import test from 'node:test';
import assert from 'node:assert/strict';
import '../spread-pricing.js';
import '../ticket-values.js';
import {MemoryStore} from './supabase-store.mjs';
import {ingest,savePick,lockDue,publicWeek,resetParlay} from './engine.mjs';
import {decimal,ROSTER,ticket} from './domain.mjs';
const pricing=globalThis.LeagueSpreadPricing,T=Date.UTC(2026,8,17,23,15),K=T+3600000;
const actor={member:'McD',role:'member'};
const input={member:'McD',gameId:'g1',market:'spread',side:'PHI',revision:0};
function board(line=-3.5,price=-110,final=false){return {events:[{id:'g1',date:new Date(K).toISOString(),competitions:[{
 competitors:[{homeAway:'home',team:{abbreviation:'PHI'},score:'24'},{homeAway:'away',team:{abbreviation:'DAL'},score:'21'}],
 status:{type:{state:final?'post':'pre',completed:final,name:final?'STATUS_FINAL':'STATUS_SCHEDULED'}},
 odds:[{provider:{name:'DraftKings'},pointSpread:{home:{close:{line:String(line),odds:String(price)}},away:{close:{line:String(-line),odds:String(price)}}},moneyline:{home:{close:{odds:'-160'}}}}]
 }]}]};}
function setup(){const s=new MemoryStore();ingest(s,2026,2,board(),T);return s;}
const week=s=>s.read().seasons[2026].weeks[2];
const save=(s,line,extra={},now=T)=>savePick(s,2026,2,actor,{...input,adjustedLine:line,...extra},now).pick;

test('spread estimate preserves its anchor and moves monotonically for favorites, underdogs and across zero',()=>{
 for(const price of [-500,-110,100,150,500])for(const base of [-7.5,-3.5,-.5,.5,3.5,7.5]){
  assert.equal(pricing.estimate(base,price,base),price);
  let previous=Infinity;
  for(let delta=-10;delta<=10;delta+=.5){
   const estimate=pricing.estimate(base,price,base+delta),profit=decimal(estimate)-1;
   assert.ok(Number.isInteger(estimate)&&Math.abs(estimate)>=100);
   assert.ok(profit<previous,`${base} ${price} ${delta}`);previous=profit;
  }
 }
 assert.equal(pricing.estimate(-5.5,-110,-5),-121);
 assert.equal(pricing.estimate(-3.5,-110,-3),-138);
 assert.ok(pricing.estimate(-3.5,-110,-3)<pricing.estimate(-7.5,-110,-7));
 assert.ok(pricing.estimate(-7.5,-110,-7)<pricing.estimate(-5.5,-110,-5));
});
test('spread estimates require a real price, valid half-points and bounded adjustments',()=>{
 for(const price of [null,undefined,'-110',0,-99,Infinity,NaN])assert.equal(pricing.estimate(-3.5,price,-3),null);
 for(const line of [null,undefined,'-3',false,-3.25,NaN,Infinity,7,101])assert.equal(pricing.estimate(-3.5,-110,line),null);
});
test('server computes adjusted odds from its market snapshot, ignoring client prices and metadata',()=>{
 const s=setup(),p=save(s,-2.5,{odds:99999,quote:{odds:99999},baseQuote:{line:0},estimated:false});
 assert.equal(p.quote.odds,-172);assert.equal(p.quote.line,-2.5);assert.equal(p.quote.label,'PHI -2.5 vs DAL');
 assert.equal(p.adjustedSpread,true);assert.equal(p.quote.estimated,true);assert.equal(p.baseQuote.line,-3.5);assert.equal(p.baseQuote.odds,-110);
 assert.deepEqual(p.original,p.quote);assert.equal(p.quote.estimateModel,pricing.model);
 assert.equal(publicWeek(week(s),T).ticket.oddsEstimated,true);
});
test('saved adjusted spread and estimate survive moving markets and both kickoff lock paths',()=>{
 for(const feedLocks of [false,true]){
  const s=setup(),p=save(s,-2.5);
  ingest(s,2026,2,board(-7.5,-120),T+60000);
  assert.deepEqual(week(s).picks.McD.quote,p.quote);
  if(feedLocks)ingest(s,2026,2,board(-7.5,-120,true),K+1);
  else s.transact(state=>lockDue(state.seasons[2026].weeks[2],K));
  const locked=week(s).picks.McD;
  assert.ok(locked.lockedAt);assert.equal(locked.missingQuote,false);assert.equal(locked.staleQuote,false);assert.deepEqual(locked.quote,p.quote);
 }
});
test('grading uses the exact adjusted line for a win, loss or push, including the underdog',()=>{
 for(const [side,line,expected] of [['PHI',-2.5,'hit'],['PHI',-3,'push'],['PHI',-4,'miss'],['DAL',3.5,'hit'],['DAL',3,'push'],['DAL',2.5,'miss']]){
  const s=setup();save(s,line,{side});ingest(s,2026,2,board(-7.5,-120,true),K+1);
  assert.equal(publicWeek(week(s),K+1).ticket.legs[0].result,expected,`${side} ${line}`);
 }
});
test('resetting to the market removes the adjustment and resumes normal quote updates',()=>{
 const s=setup();save(s,-2.5);savePick(s,2026,2,actor,{...input,revision:1},T);
 ingest(s,2026,2,board(-4.5,-115),T+60000);
 const p=week(s).picks.McD;assert.equal(p.adjustedSpread,undefined);assert.equal(p.baseQuote,undefined);assert.equal(p.quote.line,-4.5);assert.equal(p.quote.odds,-115);
 // Explicitly pinning a line equal to a newly moved market still preserves intent.
 save(s,-4.5,{revision:2},T+60000);ingest(s,2026,2,board(-5.5),T+120000);
 assert.equal(week(s).picks.McD.quote.line,-4.5);
});
test('adjustments retain membership, revision, reservation, freshness and kickoff protections',()=>{
 const s=setup();
 assert.throws(()=>save(s,-3,{member:'Hurd'}),/own pick/);
 for(const adjustedLine of [null,'-3',true,-3.25,NaN,Infinity,7])assert.throws(()=>save(s,adjustedLine),/half-point/);
 assert.throws(()=>save(s,-3,{market:'ml'}),/half-point/);
 assert.throws(()=>save(s,-3,{market:'prop',description:'Test prop'}),/half-point/);
 assert.throws(()=>save(s,-3,{},T+300001),/stale/);
 save(s,-3);assert.throws(()=>save(s,-2.5),/changed/);
 assert.throws(()=>savePick(s,2026,2,{member:'Hurd',role:'member'},{...input,member:'Hurd',adjustedLine:-3},T),/just picked/);
 assert.throws(()=>save(s,-2.5,{revision:1},K),/locked/);
 assert.equal(week(s).picks.McD.quote.line,-3);
});
test('ticket estimates drop pushed prices and yield to actual placed odds without changing picks',()=>{
 const s=setup(),p=save(s,-2.5),games=week(s).games;
 const picks=ROSTER.map(member=>({...p,member,lockedAt:K,manualResult:'hit'})),t=ticket(picks,games,K+1);
 assert.equal(t.status,'won');assert.equal(t.oddsEstimated,true);assert.ok(t.estimatedReturn>10);
 const actual=globalThis.LeagueTicketValues.apply(t,{odds:1200});assert.equal(actual.oddsEstimated,false);assert.equal(actual.combinedOdds,1200);assert.equal(actual.returned,130);assert.deepEqual(actual.legs,t.legs);
 const pushed=ticket(picks.map(p=>({...p,manualResult:'push'})),games,K+1);
 assert.equal(pushed.oddsEstimated,false);assert.equal(pushed.returned,10);
});
test('Thursday reset history retains adjusted lines and estimate provenance',()=>{
 const s=setup(),p=save(s,-4);ingest(s,2026,2,board(-7.5,-120,true),K+1);
 resetParlay(s,2026,2,{member:'Zach',role:'organizer'},K+1);
 const history=publicWeek(week(s),K+1).priorTickets[0].ticket;
 assert.equal(history.legs[0].result,'miss');assert.deepEqual(history.legs[0].quote,p.quote);assert.equal(history.oddsEstimated,true);assert.equal(history.legs[0].baseQuote.odds,-110);
});
