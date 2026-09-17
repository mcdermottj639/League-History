import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

const source=readFileSync(new URL('../oracle.js',import.meta.url),'utf8');
const teams=['Aarogant Fraudgers','Mortal Wombats','Slob on my Cobb','Morning Woods','Gregs Morning Dew Dew','Jared Goff Hits Women','Death Dont Hurts Very Long','Joe Sleepin on Dee TeeTees','Puka Atta Adonai','Thurgood Marshall','Jefferson Airplane','Pepperoni TDs'];
const season={t:teams.map((n,i)=>({id:String(i+1),n,w:0,l:0,s:[],sch:[String(i%2===0?i+2:i)]}))};
const response=(body,status=200)=>({ok:status>=200&&status<300,status,json:async()=>body});
function app(fragment='',calls=[]){
 const dom=new JSDOM('<main id="host"></main>',{url:'https://league.test/League-History/'+fragment,runScripts:'outside-only'}),w=dom.window;
 w.AbortController=globalThis.AbortController;w.LeagueESPN={mgrFor:()=>''};
 w.fetch=async(url,opts={})=>{const u=String(url),body=opts.body?JSON.parse(opts.body):null;calls.push({u,body,auth:opts.headers?.Authorization||''});
  if(u.includes('oracle-config.json'))return response({enabled:true,api:'https://oracle.test',year:2026});
  if(u.includes('season/current.json'))return response(season);
  if(u.endsWith('/session'))return response({token:'a'.repeat(64),role:'oracle_editor'});
  if(u.endsWith('/me'))return response({role:'oracle_editor'});
  if(u.includes('/state'))return response({year:2026,current:1,weeks:[{week:1,published:false,publishedAt:null,predictions:[]}]});
  if(u.endsWith('/save'))return response({ok:true,published:false});
  if(u.endsWith('/publish'))return response({ok:true,published:true});
  return response({error:'not found'},404);
 };
 w.eval(source);return {dom,w,host:w.document.querySelector('#host')};
}

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
  set('awayScore','111');set('homeScore','108');set('awayRecord','1-0');set('homeRecord','0-1');set('writeup','The crystal ball sees this one clearly.');set('confidence','72');
  const winner=card.querySelector('[data-f="winner"]');winner.checked=true;winner.dispatchEvent(new a.w.Event('input',{bubbles:true}));
 }
 assert.equal(a.host.querySelector('[data-or="publish"]').disabled,false);a.dom.window.close();
});
