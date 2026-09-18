import test from 'node:test';
import assert from 'node:assert/strict';
import {oracleEdge,predictions} from './oracle-edge-harness.mjs';

test('actual edge handler saves and publishes decimal scores and 10,000-character write-ups without changing other weeks',async()=>{
 const untouched={week:1,published:true,predictions:[{writeup:'Existing published work'}],draft_predictions:[]};
 const edge=oracleEdge([untouched]),p=predictions();p[0].writeup='x'.repeat(10000);p[1].awayScore=0;p[1].homeScore=300;
 for(const action of ['save','publish']){
  const r=await edge.fetch('/api/oracle/'+action,{body:{week:2,predictions:p}});assert.equal(r.status,200,await r.text());
  assert.deepEqual(edge.rows.get(2).draft_predictions,p);assert.deepEqual(edge.rows.get(1),untouched);
 }
 assert.equal(edge.rows.get(2).published,true);assert.deepEqual(edge.rows.get(2).predictions,p);
 const reader=await (await edge.fetch('/api/oracle/state',{auth:false})).json();assert.deepEqual(reader.weeks.find(w=>w.week===2).predictions,p);
 // Saving a new draft never replaces the version the league is reading.
 p[0].writeup='Private revision';assert.equal((await edge.fetch('/api/oracle/save',{body:{week:2,predictions:p}})).status,200);
 assert.equal(edge.rows.get(2).predictions[0].writeup.length,10000);
});

test('partial drafts save; incomplete or invalid predictions cannot publish',async()=>{
 for(const [field,value] of [['awayScore',null],['homeScore',null],['winner',''],['writeup','  '],['confidence',null]]){
  const edge=oracleEdge(),p=predictions();p[0][field]=value;
  assert.equal((await edge.fetch('/api/oracle/save',{body:{week:2,predictions:p}})).status,200);
  assert.equal((await edge.fetch('/api/oracle/publish',{body:{week:2,predictions:p}})).status,400);
  assert.equal(edge.writes.length,1);
 }
 for(const value of [-0.1,300.01,'125.9',{},true]){
  const edge=oracleEdge(),p=predictions();p[0].homeScore=value;
  const r=await edge.fetch('/api/oracle/save',{body:{week:2,predictions:p}});assert.equal(r.status,400);assert.match((await r.json()).error,/Matchup 1.*home score/);assert.equal(edge.writes.length,0);
 }
 for(const modify of [p=>p.pop(),p=>{p[0].writeup='x'.repeat(10001);},p=>{p[0].confidence=100.1;},p=>{p[1].id=p[0].id;}]){
  const edge=oracleEdge(),p=predictions();modify(p);assert.equal((await edge.fetch('/api/oracle/publish',{body:{week:2,predictions:p}})).status,400);assert.equal(edge.writes.length,0);
 }
});

test('drafts stay private, unauthenticated and foreign-origin writes fail, storage errors leave work unchanged',async()=>{
 const row={week:2,published:false,predictions:[],draft_predictions:predictions()},edge=oracleEdge([row]);
 const r=await edge.fetch('/api/oracle/state',{auth:false});assert.deepEqual((await r.json()).weeks[0].predictions,[]);
 assert.equal((await edge.fetch('/api/oracle/state?editor=1',{auth:false})).status,401);
 for(const action of ['save','publish'])assert.equal((await edge.fetch('/api/oracle/'+action,{auth:false,body:{week:2,predictions:predictions()}})).status,401);
 assert.equal((await edge.fetch('/api/oracle/save',{origin:'https://foreign.test',body:{week:2,predictions:predictions()}})).status,403);
 edge.setStorageError(true);assert.equal((await edge.fetch('/api/oracle/save',{body:{week:2,predictions:predictions()}})).status,503);
 assert.deepEqual(edge.rows.get(2),row);assert.equal(edge.writes.length,0);
});
