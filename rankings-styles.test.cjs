const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {JSDOM} = require('jsdom');
const voices = require('./rankings-styles.js');
const facts = Array.from({length:12}, (_,i) => ({id:i+1,rank:i+1,n:12,week:4,rec:'2-2',ppg:110.5,score:i===11?0:105.7,prevRank:null,apW:20,apL:24,streakN:1,streakC:'W'}));

test('each extra voice uses real evidence, handles zero/missing scores, and fits publishing limits', () => {
  for (const style of voices.styles.filter(s => s.id !== 'league')) {
    for (let salt=0;salt<20;salt++) {
      const rows=voices.write(facts,{style:style.id,salt:String(salt)});
      assert.equal(Object.keys(rows).length,12);
      for (const row of Object.values(rows)) {
        assert.ok(row.length<=420);
        assert.match(row,/2-2 record/);
        assert.match(row,/110.5 points per game/);
      }
      assert.match(rows[12],/0 in the latest completed week/);
    }
    const missing=voices.write([{...facts[0],score:null}],{style:style.id})[1];
    assert.doesNotMatch(missing,/latest completed week/);
  }
  assert.equal(voices.normalize('bad'),'league');
});

test('voices are distinct, deterministic, and only report supported movement/streaks', () => {
  const d={...facts[0],prevRank:4,streakN:3,streakC:'L'};
  const lines=voices.styles.filter(s=>s.id!=='league').map(s=>voices.write([d],{style:s.id})[1]);
  assert.equal(new Set(lines).size,4);
  assert.deepEqual(voices.write(facts,{style:'jameis'}),voices.write(facts,{style:'jameis'}));
  const analyst=voices.write([d],{style:'analyst'})[1];
  assert.match(analyst,/Moved up from No. 4 to No. 1/);
  assert.match(analyst,/3 straight losses/);
});

test('Lab preserves text on style selection/cancel, generates explicitly, saves and restores drafts', async () => {
  const season={teams:facts.map((d,i)=>({teamId:d.id,team:'Team '+d.id,scores:[100+i,110+i],wins:1,losses:1,ties:0,outcomes:['W','L']})),allPlay:{}};
  function open(saved={}) {
    const dom=new JSDOM(fs.readFileSync('power.html','utf8'),{url:'https://league.test/power.html',runScripts:'outside-only',pretendToBeVisual:true});
    const w=dom.window;
    w.fetch=async()=>({ok:true,json:async()=>season}); w.AbortController=AbortController;
    w.confirm=()=>true; w.scrollTo=()=>{};
    w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({}, {get:(_,key)=>key==='measureText'?()=>({width:10}):key==='createLinearGradient'||key==='createRadialGradient'?()=>({addColorStop(){}}):()=>{}});
    w.HTMLCanvasElement.prototype.toDataURL=()=>'';
    w.LeagueOwner={mayLab:()=>true,is:()=>true,guest:()=>null};
    w.RankingStore={restore:async()=>{},list:async()=>[],signedIn:()=>false};
    w.localStorage.setItem('powerlab:season',JSON.stringify({data:season}));
    Object.entries(saved).forEach(([k,v])=>w.localStorage.setItem(k,v));
    for (const name of ['espn.js','rankings-styles.js','power.js']) w.eval(fs.readFileSync(name,'utf8'));
    return dom;
  }
  const dom=open(), w=dom.window;
  await new Promise(resolve=>setTimeout(resolve,20));
  const field=w.document.querySelector('.pr-take');
  field.value='My own words'; field.dispatchEvent(new w.Event('input'));
  const before=JSON.parse(w.localStorage.getItem('powerlab:draft'));
  const select=w.document.querySelector('#pr-writing-style');
  assert.equal(select.options.length,5);
  select.value='jameis';select.dispatchEvent(new w.Event('change'));
  assert.equal(field.value,'My own words');
  w.confirm=()=>false;w.document.querySelector('#pr-generate-style').click();
  assert.deepEqual(JSON.parse(w.localStorage.getItem('powerlab:draft')),before);
  w.confirm=()=>true;w.document.querySelector('#pr-generate-style').click();
  const after=JSON.parse(w.localStorage.getItem('powerlab:draft'));
  assert.deepEqual(after.order,before.order);
  assert.equal(after.byline,before.byline);
  assert.notEqual(after.comments[after.order[0]],'My own words');
  for (const row of Object.values(after.comments)) assert.match(row,/points per game/);
  w.document.querySelector('[data-re]').click();
  const one=JSON.parse(w.localStorage.getItem('powerlab:draft'));
  for (const id of after.order.slice(1)) assert.equal(one.comments[id],after.comments[id]);
  const second=open({'powerlab:draft':JSON.stringify(one),'powerlab:style':w.localStorage.getItem('powerlab:style')});
  await new Promise(resolve=>setTimeout(resolve,20));
  assert.equal(second.window.document.querySelector('#pr-writing-style').value,'jameis');
  assert.equal(second.window.document.querySelector('.pr-take').value,one.comments[one.order[0]]);
  dom.window.close();second.window.close();
});
