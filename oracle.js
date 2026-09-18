/* Hurdstradamus — public prophecies and Hurd's separately-authorized editor. */
(() => {'use strict';
  const KEY='lh:oracle-session:v1', DRAFT_KEY='lh:oracle-drafts:2026:v1', WEEK_KEY='lh:oracle-week:2026:v1', FILE='season/current.json', WRITEUP_MAX=10000;
  const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  let invite=null;
  try { const h=new URLSearchParams(location.hash.slice(1)); if(h.has('oracle-editor')){invite=h.get('oracle-editor');h.delete('oracle-editor');history.replaceState(null,'',location.pathname+location.search+(h.size?'#'+h:''));} }catch{}
  const S={config:null,data:null,season:null,session:read(KEY),week:null,editor:false,message:'',busy:false,host:null,crest:null,preview:null,working:read(DRAFT_KEY)||{}};
  let paintToken=0, renderToken=0;
  const owns=token=>token===paintToken&&(!S.host?.dataset.view||S.host.dataset.view==='oracle');
  function read(k){try{return JSON.parse(localStorage.getItem(k)||'null');}catch{return null;}}
  const put=(k,v)=>{try{v?localStorage.setItem(k,JSON.stringify(v)):localStorage.removeItem(k);}catch{}};
  async function config(){if(S.config)return S.config;const r=await fetch('oracle-config.json',{cache:'no-store'});if(!r.ok)throw Error('Oracle configuration is unavailable.');const c=await r.json();if(!c.enabled||typeof c.api!=='string'||!c.api)return null;S.config=c;return c;}
  async function api(path,body,auth=false){const c=await config();if(!c)throw Error('Hurdstradamus is not live yet.');const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),15000);try{const r=await fetch(c.api+'/api/oracle/'+path,{method:body?'POST':'GET',cache:'no-store',signal:ctl.signal,headers:{Accept:'application/json',...(body?{'Content-Type':'application/json'}:{}),...(auth&&S.session?{Authorization:'Bearer '+S.session.token}:{})},...(body?{body:JSON.stringify(body)}:{})});const j=await r.json().catch(()=>({}));if(!r.ok){if(r.status===401){S.editor=false;S.session=null;put(KEY,null);}throw Error(j.error||'The Oracle could not complete that request.');}return j;}finally{clearTimeout(timer);}}
  async function loadSeason(){if(S.season)return S.season;let d;try{if(window.LeagueESPN?.SEASON_URL){const live=await fetch(window.LeagueESPN.SEASON_URL,{cache:'no-store',signal:AbortSignal.timeout(12000)});if(live.ok){const p=await live.json();if(p.teams?.length)d=window.LeagueESPN.toSnapshot(p);}}}catch{}const r=d?{ok:true,json:async()=>d}:await fetch(FILE,{cache:'no-store'});if(!r.ok)throw Error('The league schedule is unavailable.');d=await r.json();if(!Array.isArray(d.t)||!d.t.length)throw Error('The league schedule is unavailable.');S.season=d;return d;}
  function recordAt(team,week){let w=0,l=0,t=0;for(let i=0;i<week-1;i++){const opp=S.season.t.find(x=>String(x.id)===String(team.sch?.[i])),a=Number(team.s?.[i]),b=Number(opp?.s?.[i]);if(i>=Number(S.season.k||0)||!Number.isFinite(a)||!Number.isFinite(b)||team.s?.[i]==null||opp?.s?.[i]==null)continue;if(a>b)w++;else if(a<b)l++;else t++;}return `${w}-${l}${t?`-${t}`:''}`;}
  function projectedRecord(record,won){const m=String(record).match(/^(\d+)-(\d+)(?:-(\d+))?$/);if(!m)return record;return `${Number(m[1])+(won?1:0)}-${Number(m[2])+(won?0:1)}${Number(m[3])?`-${m[3]}`:''}`;}
  function matchupsFor(week){const t=S.season.t,at=week-1,seen=new Set(),out=[];for(const away of t){const home=t.find(x=>String(x.id)===String(away.sch?.[at]));if(!home)continue;const ids=[String(away.id),String(home.id)].sort(),id=`${week}:${ids.join('-')}`;if(seen.has(id))continue;seen.add(id);out.push({id,away:{id:String(away.id),name:String(away.n),record:recordAt(away,week)},home:{id:String(home.id),name:String(home.n),record:recordAt(home,week)}});}return out;}
  async function boot(){const c=await config();if(!c)return false;if(invite){const s=await api('session',{key:invite});S.session=s;put(KEY,s);invite=null;S.editor=true;window.dispatchEvent(new CustomEvent('oracle-editor-ready'));}else if(S.session){try{await api('me',null,true);S.editor=true;}catch(err){if(S.session)throw err;S.editor=false;}}return true;}
  function resultFor(p){const byId=Object.fromEntries((S.season?.t||[]).map(t=>[String(t.id),t]));const a=byId[p.matchup?.away?.id],h=byId[p.matchup?.home?.id],i=(p.week||S.week)-1;if(!a||!h||!Number.isFinite(a.s?.[i])||!Number.isFinite(h.s?.[i])||a.s[i]<=0||h.s[i]<=0||a.s[i]===h.s[i])return null;const actual=a.s[i]>h.s[i]?a.n:h.n;return p.winner===actual?'right':'wrong';}
  function records(w){const all=(S.data?.weeks||[]).filter(x=>x.published).flatMap(x=>(x.predictions||[]).map(p=>({...p,week:x.week})));const count=a=>a.reduce((o,p)=>{const r=resultFor(p);if(r)o[r]++;return o;},{right:0,wrong:0});return {week:count((w?.predictions||[]).map(p=>({...p,week:w.week}))),all:count(all)};}
  const logo=(m,size)=>S.crest?S.crest(m,size):'';
  function teamHTML(t,recordLabel=''){const manager=window.LeagueESPN?.mgrFor?.(t.name,[])||'';return `<div class="or-team">${manager?logo(manager,34):''}<span>${esc(t.name)}<small>${recordLabel?esc(recordLabel)+' ':''}${esc(t.record||'')}</small></span></div>`;}
  function displayPrediction(p,week){
    const scheduled=matchupsFor(week).find(m=>m.id===p.id),saved=p.matchup?.away?.id&&p.matchup?.home?.id?p.matchup:scheduled;
    if(!saved)return p;
    const byId=Object.fromEntries((S.season?.t||[]).map(t=>[String(t.id),t]));
    const side=(stored,key)=>{const live=byId[String(stored.id)],name=String(live?.n||stored.name),entering=live?recordAt(live,week):String(stored.record||'');return {...stored,name,record:p.winner?projectedRecord(entering,p.winner===name):entering||p[key]||''};};
    const away=side(saved.away,'awayRecord'),home=side(saved.home,'homeRecord');
    return {...p,matchup:{...saved,away,home},awayRecord:away.record,homeRecord:home.record};
  }
  function publicHTML(w,preview=false){if(w?.predictions)w={...w,predictions:w.predictions.map(p=>displayPrediction(p,w.week))};if(!w?.published&&!preview)return `<section class="or-empty"><b>The next Hurdstradamus is waiting to be published.</b><p>Hurd’s prophecies will appear here for everyone once he releases the week.</p></section>`;const r=records(w),notice=preview?'<p class="or-status"><b>Private preview</b> · Only Hurd can see this draft. <button data-or="edit">Back to editor</button></p>':'';return `${notice}<section class="or-head"><p class="or-kicker">Week ${w.week} · Hurdstradamus</p><h2>The Commish Has Spoken</h2><p>${preview?'Draft preview — not published':`Published ${esc(new Date(w.publishedAt).toLocaleString())}`}</p><div class="or-head-stats"><b>${r.week.right}–${r.week.wrong}<small>This week</small></b><b>${r.all.right}–${r.all.wrong}<small>All-time</small></b></div></section>${w.predictions.map((p,i)=>`<article class="or-card"><div class="or-card-kicker">🔮 The Prophecy · Game ${i+1}${p.upset?'<b class="or-upset">Upset Watch</b>':''}</div><section class="or-matchup" aria-label="Projected matchup"><div class="or-versus"><div class="or-side">${teamHTML(p.matchup.away,'Projected record')}<strong>${p.awayScore??'—'}<small>Projected score</small></strong></div><b class="or-vs">VS</b><div class="or-side or-side-home">${teamHTML(p.matchup.home,'Projected record')}<strong>${p.homeScore??'—'}<small>Projected score</small></strong></div></div><div class="or-call"><span>Hurd’s pick</span><b>${esc(p.winner||'Not selected')}</b></div></section><section class="or-analysis"><b>Hurd’s breakdown</b><p>${esc(p.writeup||'No write-up yet.')}</p></section><footer><b>${p.confidence??'—'}% confidence</b></footer></article>`).join('')}`;}
  function editorHTML(w){const all=matchupsFor(S.week),draft=Object.fromEntries((w?.predictions||[]).map(p=>[p.id,p])),complete=all.filter(m=>completePrediction(draft[m.id])).length;return `<section class="or-head"><p class="or-kicker">Commissioner mode · Week ${S.week}</p><h2>Craft the Prophecy</h2><p>${complete} of ${all.length} complete · drafts are private until published.</p><div class="or-progress"><i style="width:${all.length?complete/all.length*100:0}%"></i></div></section><p class="or-status" role="status">${esc(S.message)}</p>${all.map((m,i)=>{const p={matchup:m,...draft[m.id]};return `<article class="or-edit" data-or-id="${esc(m.id)}"><p class="or-edit-kicker">Matchup ${i+1} of ${all.length}</p><div class="or-edit-teams">${teamHTML(m.away)}<label>Projected score<input data-f="awayScore" type="number" step="any" inputmode="decimal" min="0" max="300" value="${esc(p.awayScore??'')}"></label>${teamHTML(m.home)}<label>Projected score<input data-f="homeScore" type="number" step="any" inputmode="decimal" min="0" max="300" value="${esc(p.homeScore??'')}"></label></div><div class="or-fields"><label>${esc(m.away.name)} projected record<input data-f="awayRecord" readonly aria-readonly="true" value="${esc(p.winner?projectedRecord(m.away.record,p.winner===m.away.name):m.away.record)}"></label><label>${esc(m.home.name)} projected record<input data-f="homeRecord" readonly aria-readonly="true" value="${esc(p.winner?projectedRecord(m.home.record,p.winner===m.home.name):m.home.record)}"></label></div><fieldset><legend>Predicted winner</legend>${[m.away.name,m.home.name].map(n=>`<label class="or-winner"><input data-f="winner" type="radio" name="${esc(m.id)}" value="${esc(n)}" ${p.winner===n?'checked':''}> ${esc(n)}</label>`).join('')}</fieldset><label>Hurd’s write-up<textarea data-f="writeup" maxlength="${WRITEUP_MAX}" placeholder="The crystal ball sees…">${esc(p.writeup??'')}</textarea><small data-count>0 / ${WRITEUP_MAX.toLocaleString()}</small></label><div class="or-fields"><label>Confidence<input data-f="confidence" type="number" step="1" inputmode="numeric" min="0" max="100" value="${esc(p.confidence??'')}">%</label><label class="or-check"><input data-f="upset" type="checkbox" ${p.upset?'checked':''}> Upset Watch</label></div><p class="or-errors" hidden></p></article>`;}).join('')}<div class="or-actions"><button data-or="preview" ${S.busy?'disabled':''}>Preview</button><button data-or="save" ${S.busy?'disabled':''}>${S.busy?'Saving…':'Save draft'}</button><button data-or="publish" ${S.busy||all.length!==6||complete!==all.length?'disabled':''}>Publish Week ${S.week}</button></div><p class="or-lock" aria-live="polite"></p>`;}
  function predictionProblems(p){
    const problems=[],score=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=300;
    if(!p?.winner||![p.matchup?.away?.name,p.matchup?.home?.name].includes(p.winner))problems.push('choose a winner');
    if(!score(p?.awayScore))problems.push('away score (0–300; decimals allowed)');
    if(!score(p?.homeScore))problems.push('home score (0–300; decimals allowed)');
    if(!p?.writeup?.trim())problems.push('write-up');
    else if(p.writeup.length>WRITEUP_MAX)problems.push('write-up under 10,001 characters');
    if(!Number.isInteger(p?.confidence)||p.confidence<0||p.confidence>100)problems.push('confidence (whole number, 0–100)');
    return problems;
  }
  function completePrediction(p){return predictionProblems(p).length===0;}
  function readEditor(){return [...S.host.querySelectorAll('[data-or-id]')].map(el=>{const m=matchupsFor(S.week).find(x=>x.id===el.dataset.orId),v=f=>el.querySelector(`[data-f="${f}"]`)?.value.trim()||'',n=f=>{const x=v(f);return x===''?null:Number(x);},winner=el.querySelector('[data-f="winner"]:checked')?.value||'';return {id:m.id,matchup:m,winner,awayScore:n('awayScore'),homeScore:n('homeScore'),awayRecord:v('awayRecord'),homeRecord:v('homeRecord'),writeup:el.querySelector('[data-f="writeup"]').value,confidence:n('confidence'),upset:el.querySelector('[data-f="upset"]').checked};});}
  function backupEditor(){
    if(S.preview||!S.host?.querySelector('[data-or-id]'))return;
    S.working[S.week]=readEditor();put(WEEK_KEY,S.week);
    try{localStorage.setItem(DRAFT_KEY,JSON.stringify(S.working));setStatus('Backed up on this device · Save draft to sync online.');}
    catch{setStatus('Device backup unavailable — use Save draft before leaving.');}
  }
  function setStatus(message){S.message=message;const status=S.host?.querySelector('.or-status');if(status)status.textContent=message;}
  function syncEditorControls(){
    if(!S.host?.querySelector('[data-or-id]'))return;
    const all=matchupsFor(S.week);
    for(const el of S.host.querySelectorAll('[data-or-id]')){
      const m=all.find(x=>x.id===el.dataset.orId),winner=el.querySelector('[data-f="winner"]:checked')?.value||'';
      el.querySelector('[data-f="awayRecord"]').value=winner?projectedRecord(m.away.record,winner===m.away.name):m.away.record;
      el.querySelector('[data-f="homeRecord"]').value=winner?projectedRecord(m.home.record,winner===m.home.name):m.home.record;
    }
    const predictions=readEditor(),total=all.length,complete=predictions.filter(completePrediction).length,missing=[];
    [...S.host.querySelectorAll('[data-or-id]')].forEach((el,i)=>{
      const problems=predictionProblems(predictions[i]),notice=el.querySelector('.or-errors');
      if(notice){notice.hidden=!problems.length;notice.textContent=problems.length?'Needs: '+problems.join('; ')+'.':'';}
      if(problems.length)missing.push(i+1);
    });
    const publish=S.host.querySelector('[data-or="publish"]'),lock=S.host.querySelector('.or-lock'),bar=S.host.querySelector('.or-progress i'),head=S.host.querySelector('.or-head>p:not(.or-kicker)');
    S.host.querySelectorAll('[data-or], [data-or-week]').forEach(el=>el.disabled=S.busy);
    if(publish)publish.disabled=S.busy||total!==6||complete!==total;
    if(lock)lock.textContent=total!==6?'The full six-matchup schedule must load before publishing.':missing.length?'Finish matchup'+(missing.length===1?' ':'s ')+missing.join(', ')+'. Each card lists exactly what is missing. Records fill in automatically.':'All six matchups are ready. Publish makes this week visible to the league.';
    if(bar)bar.style.width=(total?complete/total*100:0)+'%';
    if(head)head.textContent=`${complete} of ${total} complete · drafts are private until published.`;
  }
  async function render(token,refresh=false){
    const turn=++renderToken;await loadSeason();if(!owns(token)||turn!==renderToken)return false;
    if(refresh||!S.data){const data=await api('state'+(S.editor?'?editor=1':''),null,S.editor);if(!owns(token)||turn!==renderToken)return false;S.data=data;}
    if(!S.week){
      const remembered=S.editor?read(WEEK_KEY):null;
      const draftWeeks=S.editor?S.data.weeks.filter(w=>(S.working[w.week]||w.predictions||[]).some(p=>p.writeup?.trim()||p.winner)).map(w=>w.week):[];
      S.week=S.data.weeks.some(w=>w.week===remembered)?remembered:(draftWeeks.at(-1)||(!S.editor&&S.data.weeks.filter(w=>w.published).at(-1)?.week)||S.data.current||1);
    }
    const saved=S.data.weeks.find(x=>x.week===S.week)||{week:S.week,predictions:[]};
    const current={...saved,predictions:(S.editor&&S.working[S.week])||saved.predictions};
    const w=S.preview?{...saved,published:true,predictions:S.preview}:current;
    S.host.innerHTML=`<div class="oracle"><nav class="or-nav"><label>Week <select data-or-week>${S.data.weeks.map(x=>`<option value="${x.week}" ${x.week===S.week?'selected':''}>${x.week}</option>`).join('')}</select></label>${S.editor?'<b>Hurd editor</b>':''}</nav>${S.preview?publicHTML(w,true):(S.editor?editorHTML(w):publicHTML(w))}</div>`;
    S.host.querySelectorAll('textarea[data-f="writeup"]').forEach(t=>{const c=t.parentElement.querySelector('[data-count]'),sync=()=>c.textContent=`${t.value.length.toLocaleString()} / ${WRITEUP_MAX.toLocaleString()}`;t.addEventListener('input',sync);sync();});
    if(S.editor&&!S.preview){S.host.querySelectorAll('[data-or-id] input,[data-or-id] textarea').forEach(el=>{el.addEventListener('input',()=>{syncEditorControls();backupEditor();});el.addEventListener('change',()=>{syncEditorControls();backupEditor();});});syncEditorControls();}
    return true;
  }
  async function paint(host,crest){
    const token=++paintToken;
    try{
      S.host=host;S.crest=crest;S.preview=null;
      host.innerHTML='<div class="oracle"><section class="or-empty"><b>Opening Hurdstradamus…</b><p>Loading this week’s prophecies.</p></section></div>';
      if(!await boot()||!owns(token))return;
      if(!await render(token,true)||!owns(token))return;
      host.onclick=async e=>{
        const b=e.target.closest('[data-or]');if(!b||b.disabled||S.busy||!owns(token))return;
        const action=b.dataset.or;
        if(action==='preview'){backupEditor();S.preview=S.working[S.week];await render(token);return;}
        if(action==='edit'){S.preview=null;await render(token);return;}
        if(!['save','publish'].includes(action))return;
        syncEditorControls();const week=S.week,predictions=readEditor();
        if(action==='publish'&&(predictions.length!==6||!predictions.every(completePrediction)))return;
        backupEditor();S.busy=true;syncEditorControls();setStatus(action==='publish'?'Publishing…':'Saving private draft…');
        let message;
        try{
          await api(action,{week,predictions},true);
          const saved=S.data.weeks.find(w=>w.week===week);
          if(saved){saved.predictions=predictions;if(action==='publish'){saved.published=true;saved.publishedAt=new Date().toISOString();}}
          message=action==='publish'?'Week published to the league.':'Private draft saved online.';
          if(owns(token)&&S.week===week&&JSON.stringify(readEditor())!==JSON.stringify(predictions))message+=' Newer edits remain on this device — save again to sync them.';
        }catch(err){message=err.message+' Your writing is still here. Keep this page open and try again.';}
        finally{S.busy=false;if(owns(token)&&S.week===week){setStatus(message);syncEditorControls();}}
      };
      host.onchange=e=>{
        if(!e.target.matches('[data-or-week]')||S.busy||!owns(token))return;
        if(S.editor&&!S.preview)backupEditor();
        S.week=Number(e.target.value);if(S.editor)put(WEEK_KEY,S.week);S.preview=null;S.message='';
        render(token).catch(err=>{if(owns(token))setStatus(err.message);});
      };
    }catch(e){if(owns(token))host.innerHTML=`<section class="or-empty"><b>The Oracle cannot open right now.</b><p>${esc(e.message)}</p><p>Your saved device backups have not been removed.</p></section>`;}
  }
  window.LeagueOracle={paint,get entry(){return !!invite;},get available(){return true;}};
})();
