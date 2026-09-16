import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {Store} from './store.mjs';
import {seedPreview} from './preview.mjs';
import {publicWeek} from './engine.mjs';
const source=readFileSync(new URL('../parlay-next.js',import.meta.url),'utf8');
function harness(enabled=true){
 const store=new Store(':memory:');seedPreview(store,'before');const season=store.read().seasons[2026];store.close();
 const data={year:2026,current:2,preview:true,roster:['McD','Hurd','Slemp','Zach'],weeks:Object.values(season.weeks).map(w=>publicWeek(w))};
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
test('preview scenario refresh repaints even while its select retains focus',async()=>{const h=harness();await h.window.LeagueParlay.paint(h.host);h.host.innerHTML='old';h.host.querySelector=()=>({});await h.events.change({target:{id:'pn-demo',value:'live'}});assert.notEqual(h.host.innerHTML,'old');assert.ok(h.requests.some(r=>r.url.endsWith('/demo')));});
