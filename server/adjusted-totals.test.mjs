import test from 'node:test';
import assert from 'node:assert/strict';
import '../spread-pricing.js';
import {MemoryStore} from './supabase-store.mjs';
import {ingest,savePick,lockDue,publicWeek,resetParlay} from './engine.mjs';
import {decimal} from './domain.mjs';
const pricing=globalThis.LeagueSpreadPricing,T=Date.UTC(2026,8,17,23,15),K=T+3600000;
const actor={member:'McD',role:'member'},input={member:'McD',gameId:'g1',market:'total',side:'over',revision:0};
function board(line=45.5,price=-110,final=false){return {events:[{id:'g1',date:new Date(K).toISOString(),competitions:[{
 competitors:[{homeAway:'home',team:{abbreviation:'PHI'},score:'24'},{homeAway:'away',team:{abbreviation:'DAL'},score:'21'}],
 status:{type:{state:final?'post':'pre',completed:final,name:final?'STATUS_FINAL':'STATUS_SCHEDULED'}},
 odds:[{provider:{name:'DraftKings'},total:{over:{close:{line:'o'+line,odds:String(price)}},under:{close:{line:'u'+line,odds:String(price)}}}}]
 }]}]};}
function setup(){const s=new MemoryStore();ingest(s,2026,2,board(),T);return s;}
const week=s=>s.read().seasons[2026].weeks[2];
const save=(s,line,extra={},now=T)=>savePick(s,2026,2,actor,{...input,adjustedLine:line,...extra},now).pick;

test('total estimates price lower Overs and higher Unders as easier, without spread key-number premiums',()=>{
 for(const side of ['over','under'])for(const price of [-500,-110,100,150,500]){
  assert.equal(pricing.estimate(45.5,price,45.5,'total',side),price);
  let previous=side==='over'?0:Infinity;
  for(let line=35.5;line<=55.5;line+=.5){
   const estimate=pricing.estimate(45.5,price,line,'total',side),profit=decimal(estimate)-1;
   assert.ok(Number.isInteger(estimate)&&Math.abs(estimate)>=100);
   assert.ok(side==='over'?profit>previous:profit<previous,`${side} ${price} ${line}`);previous=profit;
  }
 }
 for(const base of [3.5,7.5,45.5]){
  assert.equal(pricing.estimate(base,-110,base-.5,'total','over'),-121);
  assert.equal(pricing.estimate(base,-110,base+.5,'total','under'),-121);
 }
});
test('total estimates require positive bounded half-points, a valid side and an observed price',()=>{
 for(const line of [null,undefined,'45',false,45.25,NaN,Infinity,0,-.5,56])assert.equal(pricing.estimate(45.5,-110,line,'total','over'),null);
 for(const base of [0,-1,201])assert.equal(pricing.estimate(base,-110,base,'total','over'),null);
 for(const side of [undefined,null,'PHI','Over',''])assert.equal(pricing.estimate(45.5,-110,45,'total',side),null);
 for(const price of [null,undefined,'-110',0,99,Infinity,NaN])assert.equal(pricing.estimate(45.5,price,45,'total','over'),null);
 assert.equal(pricing.valid(.5,.5,'total'),true);assert.equal(pricing.valid(.5,0,'total'),false);
 assert.equal(pricing.valid(200,200.5,'total'),false);assert.equal(pricing.valid(45,45,'ml'),false);
});
test('server estimates totals from its own quote and keeps them fixed through market changes and either kickoff path',()=>{
 for(const side of ['over','under'])for(const feedLocks of [false,true]){
  const s=setup(),line=side==='over'?43.5:47.5,p=save(s,line,{side,odds:99999,quote:{odds:99999},baseQuote:{line:0},estimated:false});
  assert.equal(p.quote.odds,-161);assert.equal(p.quote.line,line);assert.equal(p.adjustedTotal,true);assert.equal(p.adjustedSpread,undefined);
  assert.equal(p.quote.label,`DAL/PHI ${side==='over'?'Over':'Under'} ${line}`);assert.equal(p.quote.estimateModel,pricing.totalModel);
  assert.equal(p.baseQuote.line,45.5);assert.equal(p.baseQuote.odds,-110);assert.deepEqual(p.original,p.quote);
  ingest(s,2026,2,board(49.5,-120),T+60000);assert.deepEqual(week(s).picks.McD.quote,p.quote);
  if(feedLocks)ingest(s,2026,2,board(49.5,-120,true),K+1);
  else s.transact(state=>lockDue(state.seasons[2026].weeks[2],K));
  const locked=week(s).picks.McD;assert.ok(locked.lockedAt);assert.equal(locked.missingQuote,false);assert.equal(locked.staleQuote,false);assert.deepEqual(locked.quote,p.quote);
  const t=publicWeek(week(s),K+1).ticket;assert.equal(t.oddsEstimated,true);assert.equal(t.estimatedReturn,10*decimal(-161));
 }
});
test('both total sides grade the saved half-point or whole-point line as hit, miss or push',()=>{
 for(const [side,line,expected] of [['over',44.5,'hit'],['over',45,'push'],['over',45.5,'miss'],['under',45.5,'hit'],['under',45,'push'],['under',44.5,'miss']]){
  const s=setup();save(s,line,{side});ingest(s,2026,2,board(49.5,-120,true),K+1);
  const t=publicWeek(week(s),K+1).ticket;assert.equal(t.legs[0].result,expected,`${side} ${line}`);
  if(expected==='push'){assert.equal(t.oddsEstimated,false);assert.equal(t.estimatedReturn,10);}
 }
});
test('market reset resumes total updates while an explicitly selected current line remains fixed',()=>{
 const s=setup();save(s,44.5);savePick(s,2026,2,actor,{...input,revision:1},T);
 ingest(s,2026,2,board(47,-115),T+60000);
 const p=week(s).picks.McD;assert.equal(p.adjustedTotal,undefined);assert.equal(p.baseQuote,undefined);assert.equal(p.quote.line,47);assert.equal(p.quote.odds,-115);
 save(s,47,{revision:2},T+60000);ingest(s,2026,2,board(48.5),T+120000);assert.equal(week(s).picks.McD.quote.line,47);
});
test('total adjustments retain membership, freshness, reservation, revision and kickoff restrictions',()=>{
 const s=setup();assert.throws(()=>save(s,45,{member:'Hurd'}),/own pick/);
 for(const line of [null,'45',false,45.25,0,-1,56])assert.throws(()=>save(s,line),/half-point/);
 assert.throws(()=>save(s,45,{side:'PHI'}),/unavailable/);
 assert.throws(()=>save(s,45,{},T+300001),/stale/);
 save(s,45);assert.throws(()=>save(s,44.5),/changed/);
 assert.throws(()=>savePick(s,2026,2,{member:'Hurd',role:'member'},{...input,member:'Hurd',side:'under',adjustedLine:46},T),/just picked/);
 assert.throws(()=>save(s,44.5,{revision:1},K),/locked/);
 assert.equal(week(s).picks.McD.quote.line,45);
 const tracking=setup();assert.throws(()=>savePick(tracking,2026,2,{member:'Zach',role:'organizer'},{...input,trackingEntry:true,line:45,adjustedLine:44.5},T),/half-point/);
});
test('Thursday reset retains the selected total and estimated-price provenance in history',()=>{
 const s=setup(),p=save(s,46.5);ingest(s,2026,2,board(49.5,-120,true),K+1);
 resetParlay(s,2026,2,{member:'Zach',role:'organizer'},K+1);
 const history=publicWeek(week(s),K+1).priorTickets[0].ticket;
 assert.equal(history.legs[0].result,'miss');assert.equal(history.legs[0].adjustedTotal,true);assert.deepEqual(history.legs[0].quote,p.quote);assert.equal(history.oddsEstimated,true);assert.deepEqual(history.legs[0].baseQuote,p.baseQuote);
});
