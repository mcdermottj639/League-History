import test from 'node:test';
import assert from 'node:assert/strict';
import '../ticket-values.js';
import {MemoryStore} from './supabase-store.mjs';
import {ensure,savePlacedOdds,publicWeek} from './engine.mjs';
const {apply,parse}=globalThis.LeagueTicketValues;
const organizer={role:'organizer',member:'Zach'};
const base=(extra={})=>({legs:Array.from({length:10},(_,i)=>({member:String(i)})),stake:10,combinedOdds:37530,estimatedReturn:3762.99,returned:null,net:null,status:'live',full:false,settled:false,hit:0,miss:0,push:0,...extra});
const placed={odds:59655,stake:10,potentialReturn:5975.57,legCount:11,legsConfirmed:false};
test('receipt reads stated odds and To Pay, never the Cash Out value or bet ID',()=>{
 const r=parse('SGPx 11 Pick Parlay | +59655 Open\nWager: $10.00 | To Pay: $5,975.57\nCash Out $9.72\nBet ID: DK639267183300578646');
 assert.deepEqual(r,{odds:59655,stake:10,potentialReturn:5975.57,legCount:11});
 assert.equal(parse('Cash Out $9.72\nBet ID: DK639267183300578646').potentialReturn,null);
 assert.equal(parse('ARI Cardinals -110\nWager: $10.00').odds,null);
});
test('placed odds override all headline money and preserve calculated odds only as metadata',()=>{
 const t=apply(base(),placed);assert.equal(t.combinedOdds,59655);assert.equal(t.estimatedReturn,5975.57);assert.equal(t.calculatedOdds,37530);assert.equal(t.ticketMismatch,true);assert.equal(t.returned,null);assert.deepEqual(apply(t,placed),t);
 assert.equal(apply(base(),null).combinedOdds,37530);
});
test('confirmed winners and season net use exact placed payout; pushes and mismatches do not invent payouts',()=>{
 const t=base({settled:true,full:true,status:'won',hit:10});
 const match={...placed,legCount:10,legsConfirmed:true};
 assert.equal(apply(t,match).returned,5975.57);assert.equal(apply(t,match).net,5965.57);
 assert.equal(apply({...t,miss:1,status:'lost'},match).returned,0);
 assert.equal(apply(t,placed).returned,null);assert.equal(apply(t,placed).status,'pending');
 assert.equal(apply(t,{...match,legsConfirmed:false}).returned,null);
 assert.equal(apply({...t,push:1},match).returned,null);
 assert.equal(apply({...t,push:10,hit:0},match).returned,10);
});
test('receipt saving validates exact values, role, revisions and reconciliation',()=>{
 const s=new MemoryStore();s.transact(state=>{const w=ensure(state,2026,4);w.picks=Object.fromEntries(Array.from({length:10},(_,i)=>['m'+i,{member:'m'+i}]));});
 const request={odds:59655,stake:10,potentialReturn:5975.57,legCount:11,legsConfirmed:false,source:'screenshot',revision:0};
 assert.throws(()=>savePlacedOdds(s,2026,4,{role:'member'},request),/Organizer/);
 assert.throws(()=>savePlacedOdds(s,2026,4,organizer,{...request,legsConfirmed:true}),/count differs/);
 assert.throws(()=>savePlacedOdds(s,2026,4,organizer,{...request,potentialReturn:9.72}),/To Pay/);
 assert.throws(()=>savePlacedOdds(s,2026,4,organizer,{...request,stake:-10}),/stake/);
 assert.throws(()=>savePlacedOdds(s,2026,4,organizer,{...request,legCount:0}),/number of picks/);
 const r=savePlacedOdds(s,2026,4,organizer,request);assert.equal(r.placedTicket.potentialReturn,5975.57);assert.equal(r.placedTicket.potentialProfit,5965.57);assert.equal(r.placedTicket.source,'screenshot');
 const w=publicWeek(s.read().seasons[2026].weeks[4]);assert.equal(w.ticket.combinedOdds,59655);assert.equal(w.ticket.ticketMismatch,true);
 assert.throws(()=>savePlacedOdds(s,2026,4,organizer,request),/changed/);
});
