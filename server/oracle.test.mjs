import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {oracleEdge,predictions as edgePredictions} from './oracle-edge-harness.mjs';

const source=readFileSync(new URL('../oracle.js',import.meta.url),'utf8');
const teams=['Aarogant Fraudgers','Mortal Wombats','Slob on my Cobb','Morning Woods','Gregs Morning Dew Dew','Jared Goff Hits Women','Death Dont Hurts Very Long','Joe Sleepin on Dee TeeTees','Puka Atta Adonai','Thurgood Marshall','Jefferson Airplane','Pepperoni TDs'];
const season={t:teams.map((n,i)=>({id:String(i+1),n,w:0,l:0,s:[],sch:[String(i%2===0?i+2:i)]}))};
const response=(body,status=200)=>({ok:status>=200&&status<300,status,json:async()=>body});
function app(fragment='',calls=[],options={}){
 const dom=new JSDOM('<main id="host"></main>',{url:'https://league.test/League-History/'+fragment,runScripts:'outside-only'}),w=dom.window;
 w.AbortController=globalThis.AbortController;w.LeagueESPN={mgrFor:()=>''};
 w.fetch=async(url,opts={})=>{const u=String(url),body=opts.body?JSON.parse(opts.body):null;calls.push({u,body,auth:opts.headers?.Authorization||''});
  if(u.includes('oracle-config.json'))return response({enabled:true,api:'https://oracle.test',year:2026});
  if(u.includes('season/current.json'))return options.seasonResponse?options.seasonResponse():response(options.season||season);
  if(options.api){const result=await options.api(u,opts);if(result)return result;}
  if(u.endsWith('/session'))return response({token:'a'.repeat(64),role:'oracle_editor'});
  if(u.endsWith('/me'))return response({role:'oracle_editor'});
  if(u.includes('/state'))return response(options.state||{year:2026,current:1,weeks:[{week:1,published:false,publishedAt:null,predictions:[]}]});
  if(u.endsWith('/save'))return response({ok:true,published:false});
  if(u.endsWith('/publish'))return response({ok:true,published:true});
  return response({error:'not found'},404);
 };
 for(const [key,value] of Object.entries(options.storage||{}))w.localStorage.setItem(key,JSON.stringify(value));
 w.eval(source);return {dom,w,host:w.document.querySelector('#host')};
}

const pause=()=>new Promise(resolve=>setTimeout(resolve,0));
test('Oracle opens Week 3 Tuesday at 4 AM Eastern despite an old unpublished Week 1 row',async()=>{
 const rows=[{week:1,published:false,draft_predictions:[],predictions:[]},{week:2,published:true,draft_predictions:[],predictions:[]}];
 const before=oracleEdge(rows,'2026-09-22T07:59:00Z');
 const after=oracleEdge(rows,'2026-09-22T08:00:00Z');
 const a=await(await before.fetch('/api/oracle/state')).json(),b=await(await after.fetch('/api/oracle/state')).json();
 assert.equal(a.current,2);assert.equal(b.current,3);assert.ok(b.weeks.some(w=>w.week===3&&!w.published));
 assert.equal(after.rows.has(3),false,'opening a week leaves published rows and drafts untouched');
});
async function waitFor(check){for(let i=0;i<100;i++){if(check())return;await new Promise(resolve=>setTimeout(resolve,10));}assert.ok(check(),'operation completed');}
function setField(a,card,field,value){const el=card.querySelector(`[data-f="${field}"]`);el.value=value;el.dispatchEvent(new a.w.Event('input',{bubbles:true}));return el;}
function fill(a){for(const card of a.host.querySelectorAll('[data-or-id]')){setField(a,card,'awayScore','134.75');setField(a,card,'homeScore','125.9');setField(a,card,'confidence','100');setField(a,card,'writeup','  His exact words.\n\nA second paragraph.  ');const winner=card.querySelector('[data-f="winner"]');winner.checked=true;winner.dispatchEvent(new a.w.Event('input',{bubbles:true}));}}

test('ordinary readers see a rankings-style waiting state and never editor controls',async()=>{
 const a=app();await a.w.LeagueOracle.paint(a.host,()=> '');
 assert.match(a.host.textContent,/waiting to be published/i);assert.doesNotMatch(a.host.textContent,/Hurd editor|Save draft|Publish Week/);a.dom.window.close();
});

test('private Hurd link is stripped, drafts save incomplete, and publish unlocks only after all six matchups complete',async()=>{
 const calls=[],a=app('#oracle-editor='+'x'.repeat(43),calls);await a.w.LeagueOracle.paint(a.host,()=> '');
 assert.equal(a.w.location.hash,'');assert.match(a.host.textContent,/Hurd editor/);assert.equal(a.host.querySelectorAll('[data-or-id]').length,6);assert.equal(a.host.querySelector('[data-or="publish"]').disabled,true);
 a.host.querySelector('[data-or="save"]').click();await new Promise(r=>setTimeout(r,0));
 const partial=calls.find(x=>x.u.endsWith('/save'));assert.equal(partial.body.predictions.length,6);assert.equal(partial.body.predictions[0].awayScore,null);
 for(const card of a.host.querySelectorAll('[data-or-id]')){
  const set=(f,v)=>{const el=card.querySelector(`[data-f="${f}"]`);el.value=v;el.dispatchEvent(new a.w.Event('input',{bubbles:true}));};
  set('awayScore','111');set('homeScore','108');set('writeup','The crystal ball sees this one clearly.');set('confidence','72');
  const winner=card.querySelector('[data-f="winner"]');winner.checked=true;winner.dispatchEvent(new a.w.Event('input',{bubbles:true}));
  assert.equal(card.querySelector('[data-f="awayRecord"]').readOnly,true);assert.equal(card.querySelector('[data-f="homeRecord"]').readOnly,true);
  assert.equal(card.querySelector('[data-f="awayRecord"]').value,'1-0');assert.equal(card.querySelector('[data-f="homeRecord"]').value,'0-1');
 }
 assert.equal(a.host.querySelector('[data-or="publish"]').disabled,false);a.dom.window.close();
});

test('saved draft sends the automatically projected records',async()=>{
 const calls=[],a=app('#oracle-editor='+'x'.repeat(43),calls);await a.w.LeagueOracle.paint(a.host,()=> '');
 const card=a.host.querySelector('[data-or-id]'),winner=card.querySelector('[data-f="winner"]');winner.checked=true;winner.dispatchEvent(new a.w.Event('change',{bubbles:true}));
 a.host.querySelector('[data-or="save"]').click();await new Promise(r=>setTimeout(r,0));
 const saved=calls.find(x=>x.u.endsWith('/save'));assert.equal(saved.body.predictions[0].awayRecord,'1-0');assert.equal(saved.body.predictions[0].homeRecord,'0-1');a.dom.window.close();
});

test('Hurd has room for long-form matchup write-ups',async()=>{
 const a=app('#oracle-editor='+'x'.repeat(43));await a.w.LeagueOracle.paint(a.host,()=> '');
 const writeup=a.host.querySelector('textarea[data-f="writeup"]');
 assert.equal(writeup.maxLength,10000);assert.match(writeup.parentElement.textContent,/0 \/ 10,000/);
 writeup.value='x'.repeat(7500);writeup.dispatchEvent(new a.w.Event('input',{bubbles:true}));
 assert.match(writeup.parentElement.textContent,/7,500 \/ 10,000/);a.dom.window.close();
});

test('Hurd can privately preview unsaved work and return to the editor',async()=>{
 const a=app('#oracle-editor='+'x'.repeat(43));await a.w.LeagueOracle.paint(a.host,()=> '');
 const field=a.host.querySelector('textarea');field.value='Keep this prophecy safe';field.dispatchEvent(new a.w.Event('input',{bubbles:true}));
 assert.match(a.w.localStorage.getItem('lh:oracle-drafts:2026:v1'),/Keep this prophecy safe/);
 a.host.querySelector('[data-or="preview"]').click();await new Promise(r=>setTimeout(r,0));
 assert.match(a.host.textContent,/Private preview/i);assert.match(a.host.textContent,/Only Hurd can see this draft/i);assert.doesNotMatch(a.host.textContent,/Save draft/);
 a.host.querySelector('[data-or="edit"]').click();await new Promise(r=>setTimeout(r,0));
 assert.match(a.host.textContent,/Hurd editor/);assert.match(a.host.textContent,/Save draft/);
 assert.equal(a.host.querySelector('textarea').value,'Keep this prophecy safe');
 a.w.eval(source);await a.w.LeagueOracle.paint(a.host,()=> '');
 assert.equal(a.host.querySelector('textarea').value,'Keep this prophecy safe');a.dom.window.close();
});

test('decimal-score editor saves, reloads, previews, and publishes through the actual edge handler',async()=>{
 const edge=oracleEdge([{week:1,published:false,draft_predictions:[],predictions:[]}]),calls=[];
 const a=app('#oracle-editor='+'x'.repeat(43),calls,{api:(u,opts)=>edge.fetch(new URL(u).pathname,{body:opts.body?JSON.parse(opts.body):undefined,auth:!!opts.headers?.Authorization})});
 await a.w.LeagueOracle.paint(a.host,()=> '');fill(a);
 const score=a.host.querySelector('[data-f="homeScore"]');assert.equal(score.step,'any');assert.equal(score.checkValidity(),true);
 assert.equal(a.host.querySelector('[data-or="publish"]').disabled,false);assert.match(a.host.querySelector('.or-lock').textContent,/All six matchups are ready/);
 assert.equal(a.host.querySelectorAll('.or-errors:not([hidden])').length,0);
 a.host.querySelector('[data-or="save"]').click();await waitFor(()=>a.host.querySelector('.or-status').textContent==='Private draft saved online.');
 assert.equal(edge.rows.get(1).draft_predictions[0].homeScore,125.9);
 const words='  His exact words.\n\nA second paragraph.  ';assert.equal(edge.rows.get(1).draft_predictions[0].writeup,words);
 a.w.eval(source);await a.w.LeagueOracle.paint(a.host,()=> '');assert.equal(a.host.querySelector('textarea').value,words);
 a.host.querySelector('[data-or="preview"]').click();await pause();assert.match(a.host.textContent,/125.9/);
 a.host.querySelector('[data-or="edit"]').click();await pause();
 a.host.querySelector('[data-or="publish"]').click();await waitFor(()=>a.host.querySelector('.or-status').textContent==='Week published to the league.');
 assert.equal(edge.rows.get(1).published,true);assert.equal(edge.rows.get(1).predictions[0].writeup,words);
 const reader=await (await edge.fetch('/api/oracle/state',{auth:false})).json();assert.equal(reader.weeks[0].predictions[0].homeScore,125.9);
 a.dom.window.close();
});

test('validation pinpoints missing and out-of-range fields while accepting zero scores and 100% confidence',async()=>{
 const a=app('#oracle-editor='+'x'.repeat(43));await a.w.LeagueOracle.paint(a.host,()=> '');fill(a);
 const card=a.host.querySelector('[data-or-id]');
 for(const value of ['', '-1', '300.01']){setField(a,card,'homeScore',value);assert.equal(a.host.querySelector('[data-or="publish"]').disabled,true);assert.match(card.querySelector('.or-errors').textContent,/home score/);}
 setField(a,card,'homeScore','0');assert.equal(a.host.querySelector('[data-or="publish"]').disabled,false);
 for(const value of ['', '100.5', '101']){setField(a,card,'confidence',value);assert.equal(a.host.querySelector('[data-or="publish"]').disabled,true);assert.match(card.querySelector('.or-errors').textContent,/confidence/);}
 setField(a,card,'confidence','100');assert.equal(a.host.querySelector('[data-or="publish"]').disabled,false);
 setField(a,card,'writeup','   ');assert.equal(a.host.querySelector('[data-or="publish"]').disabled,true);assert.match(card.querySelector('.or-errors').textContent,/write-up/);a.dom.window.close();
});

test('a delayed save preserves newer typing and does not refetch state or replace the form',async()=>{
 let finish;const calls=[],a=app('#oracle-editor='+'x'.repeat(43),calls,{api:u=>u.endsWith('/save')?new Promise(resolve=>{finish=()=>resolve(response({ok:true}));}):null});
 await a.w.LeagueOracle.paint(a.host,()=> '');fill(a);
 const card=a.host.querySelector('[data-or-id]'),field=setField(a,card,'writeup','Snapshot being saved');
 a.host.querySelector('[data-or="save"]').click();await pause();assert.equal(a.host.querySelector('[data-or-week]').disabled,true);
 setField(a,card,'writeup','Newer words typed while saving');finish();await pause();
 assert.equal(a.host.querySelector('textarea'),field);assert.equal(field.value,'Newer words typed while saving');
 assert.match(a.host.querySelector('.or-status').textContent,/Newer edits remain/);assert.match(a.w.localStorage.getItem('lh:oracle-drafts:2026:v1'),/Newer words/);
 assert.equal(calls.filter(x=>x.u.includes('/state')).length,1);a.dom.window.close();
});

test('failed saves and offline previews retain the form and device backup',async()=>{
 const calls=[],a=app('#oracle-editor='+'x'.repeat(43),calls,{api:u=>u.endsWith('/save')?response({error:'Storage temporarily unavailable'},503):null});
 await a.w.LeagueOracle.paint(a.host,()=> '');const card=a.host.querySelector('[data-or-id]'),field=setField(a,card,'writeup','Keep every word');
 a.host.querySelector('[data-or="save"]').click();await pause();assert.equal(a.host.querySelector('textarea'),field);
 assert.match(a.host.querySelector('.or-status').textContent,/Storage temporarily unavailable.*writing is still here/);
 a.w.fetch=async()=>{throw Error('Offline');};a.host.querySelector('[data-or="preview"]').click();await pause();
 assert.match(a.host.textContent,/Keep every word/);a.host.querySelector('[data-or="edit"]').click();await pause();assert.equal(a.host.querySelector('textarea').value,'Keep every word');
 assert.match(a.w.localStorage.getItem('lh:oracle-drafts:2026:v1'),/Keep every word/);a.dom.window.close();
});

test('week selection and device drafts survive reopening; prior results automate projected records',async()=>{
 const nextSeason={k:1,t:season.t.map((t,i)=>({...t,s:[i%2?100:110.5],sch:[t.sch[0],t.sch[0]]}))};
 const a=app('#oracle-editor='+'x'.repeat(43),[],{season:nextSeason,state:{current:1,weeks:[{week:1,published:false,predictions:[]},{week:2,published:false,predictions:[]}]}});
 await a.w.LeagueOracle.paint(a.host,()=> '');setField(a,a.host.querySelector('[data-or-id]'),'writeup','Week one words');
 const select=a.host.querySelector('[data-or-week]');select.value='2';select.dispatchEvent(new a.w.Event('change',{bubbles:true}));await pause();fill(a);
 assert.equal(a.host.querySelector('[data-f="awayRecord"]').value,'2-0');assert.equal(a.host.querySelector('[data-f="homeRecord"]').value,'0-2');
 a.w.eval(source);await a.w.LeagueOracle.paint(a.host,()=> '');assert.equal(a.host.querySelector('[data-or-week]').value,'2');assert.match(a.host.querySelector('textarea').value,/His exact words/);
 const back=a.host.querySelector('[data-or-week]');back.value='1';back.dispatchEvent(new a.w.Event('change',{bubbles:true}));await pause();assert.equal(a.host.querySelector('textarea').value,'Week one words');a.dom.window.close();
});

test('public readers never receive a device-only draft in place of published predictions',async()=>{
 const published=edgePredictions();published[0].writeup='Published words';const privateDraft=structuredClone(published);privateDraft[0].writeup='PRIVATE UNSAVED WORDS';
 const a=app('',[],{storage:{'lh:oracle-drafts:2026:v1':{1:privateDraft}},state:{current:1,weeks:[{week:1,published:true,publishedAt:new Date().toISOString(),predictions:published}]}});
 await a.w.LeagueOracle.paint(a.host,()=> '');assert.match(a.host.textContent,/Published words/);assert.doesNotMatch(a.host.textContent,/PRIVATE UNSAVED WORDS/);a.dom.window.close();
});

test('published cards preserve Hurd’s saved team-score order and separate matchup, pick, and breakdown',async()=>{
 const stored={id:'1:1-2',matchup:{away:{id:'1',name:'Aarogant Fraudgers'},home:{id:'2',name:'Mortal Wombats'}},awayScore:117.2,homeScore:128.3,winner:'Mortal Wombats',awayRecord:'0-1',homeRecord:'1-0',writeup:'The matchup analysis.',confidence:100,upset:false};
 // Reverse source order to prove a later schedule refresh cannot swap the saved teams while leaving scores behind.
 const reversed={t:[structuredClone(season.t[1]),structuredClone(season.t[0]),...season.t.slice(2)]};
 const a=app('',[],{season:reversed,state:{current:1,weeks:[{week:1,published:true,publishedAt:new Date().toISOString(),predictions:[stored]}]}});
 await a.w.LeagueOracle.paint(a.host,()=> '');const card=a.host.querySelector('.or-card'),sides=card.querySelectorAll('.or-side');
 assert.equal(sides.length,2);assert.match(sides[0].textContent,/Aarogant Fraudgers.*117\.2.*Projected score.*Projected record 0-1/s);assert.match(sides[1].textContent,/Mortal Wombats.*128\.3.*Projected score.*Projected record 1-0/s);
 assert.equal(card.querySelector('.or-matchup .or-call b').textContent,'Mortal Wombats by 11.1');assert.equal(card.querySelector('.or-analysis p').textContent,'The matchup analysis.');assert.equal(card.querySelector('.or-analysis>b').textContent,'Hurd’s breakdown');
 assert.equal(card.querySelector('.or-card>p'),null);a.dom.window.close();
});

test('editorial display preserves published snapshots, formats prose safely, and never writes on navigation',async()=>{
 const p={id:'1:1-2',matchup:{away:{id:'1',name:'Aarogant Fraudgers',record:'1-0'},home:{id:'2',name:'Mortal Wombats',record:'0-1'}},awayScore:117.2,homeScore:128.3,winner:'Mortal Wombats',awayRecord:'1-1',homeRecord:'1-1',writeup:'Fraudgers (1-0) vs. Wombats (0-1)\nHis exact words <script>alert(1)</script>.\n\nAnother paragraph.\nSam wins 128.3 – 117.2',confidence:100};
 const state={current:1,weeks:[{week:1,published:true,publishedAt:'2026-09-17T00:00:00Z',predictions:[p]}]},original=JSON.stringify(state),calls=[],a=app('',calls,{state});
 await a.w.LeagueOracle.paint(a.host,()=> '');
 assert.equal(a.host.querySelector('.or-prose-heading').textContent,'Fraudgers (1-0) vs. Wombats (0-1)');
 assert.equal(a.host.querySelector('.or-verdict').textContent,'Sam wins 128.3 – 117.2');
 assert.match(a.host.querySelector('.or-analysis p').textContent,/His exact words <script>alert\(1\)<\/script>\.\n\nAnother paragraph\./);
 assert.equal(a.host.querySelector('.or-analysis script'),null);
 assert.deepEqual([...a.host.querySelectorAll('.or-record-badge')].map(x=>x.textContent),['1-0','0-1']);
 const card=a.host.querySelector('.or-card');let scrolled=false;card.scrollIntoView=()=>{scrolled=true;};a.host.querySelector('[data-or-jump]').click();
 assert.equal(scrolled,true);assert.equal(a.w.document.activeElement,card);assert.equal(JSON.stringify(state),original);
 assert.equal(calls.some(x=>x.u.endsWith('/save')||x.u.endsWith('/publish')),false);a.dom.window.close();
});

test('published writing loads while a slow season feed is still pending',async()=>{
 let release;const state={current:2,weeks:[{week:2,published:true,publishedAt:'2026-09-17T00:00:00Z',predictions:edgePredictions()}]};
 const a=app('',[],{state,seasonResponse:()=>new Promise(resolve=>{release=()=>resolve(response(season));})});
 const painted=a.w.LeagueOracle.paint(a.host,()=> '');
 await waitFor(()=>!!a.host.querySelector('.or-card'));
 assert.match(a.host.textContent,/A complete prediction/);await painted;
 assert.ok(a.w.localStorage.getItem('lh:oracle-public:2026:v1'));
 release();await pause();a.dom.window.close();
});

test('cached public predictions show before a pending refresh and survive an offline refresh',async()=>{
 const state={current:2,weeks:[{week:2,published:true,publishedAt:'2026-09-17T00:00:00Z',predictions:edgePredictions()}]};
 let finish;const a=app('',[],{storage:{'lh:oracle-public:2026:v1':{savedAt:Date.now(),data:state}},api:u=>u.includes('/state')?new Promise(resolve=>{finish=()=>resolve(response({error:'Offline'},503));}):null});
 const painted=a.w.LeagueOracle.paint(a.host,()=> '');
 await waitFor(()=>!!a.host.querySelector('.or-card'));assert.match(a.host.textContent,/Saved copy/);
 await waitFor(()=>!!finish);finish();await painted;
 assert.match(a.host.textContent,/refresh unavailable/);assert.equal(a.host.querySelectorAll('.or-card').length,6);a.dom.window.close();
});

test('fresh public response replaces cached content and delayed responses never repaint another tab',async()=>{
 const old={current:2,weeks:[{week:2,published:true,publishedAt:'2026-09-17T00:00:00Z',predictions:edgePredictions()}]},fresh=structuredClone(old);fresh.weeks[0].predictions[0].writeup='Fresh published words';
 let finish;const a=app('',[],{storage:{'lh:oracle-public:2026:v1':{savedAt:Date.now(),data:old}},api:u=>u.includes('/state')?new Promise(resolve=>{finish=()=>resolve(response(fresh));}):null});
 let painted=a.w.LeagueOracle.paint(a.host,()=> '');await waitFor(()=>!!finish);finish();await painted;assert.match(a.host.textContent,/Fresh published words/);assert.doesNotMatch(a.host.textContent,/checking updates/);
 finish=null;painted=a.w.LeagueOracle.paint(a.host,()=> '');await waitFor(()=>!!finish);
 a.host.dataset.view='history';a.host.innerHTML='<h2>History stays here</h2>';finish();await painted;await pause();assert.equal(a.host.textContent,'History stays here');a.dom.window.close();
});

test('editor responses never enter the public cache',async()=>{
 const a=app('#oracle-editor='+'x'.repeat(43));await a.w.LeagueOracle.paint(a.host,()=> '');
 assert.equal(a.w.localStorage.getItem('lh:oracle-public:2026:v1'),null);a.dom.window.close();
});

test('ordinary prose stays verbatim and a conflicting pick never receives a fabricated winning margin',async()=>{
 const p={id:'1:1-2',matchup:{away:{id:'1',name:'Aarogant Fraudgers'},home:{id:'2',name:'Mortal Wombats'}},awayScore:117.2,homeScore:128.3,winner:'Aarogant Fraudgers',awayRecord:'1-0',homeRecord:'0-1',writeup:'Not a matchup header.\nWins are earned, not promised.\n  ',confidence:75};
 const a=app('',[],{state:{current:1,weeks:[{week:1,published:true,publishedAt:'2026-09-17T00:00:00Z',predictions:[p]}]}});await a.w.LeagueOracle.paint(a.host,()=> '');
 assert.equal(a.host.querySelector('.or-analysis p').textContent,p.writeup);assert.equal(a.host.querySelector('.or-prose-heading'),null);assert.equal(a.host.querySelector('.or-verdict'),null);assert.equal(a.host.querySelector('.or-call>b').textContent,p.winner);a.dom.window.close();
});
