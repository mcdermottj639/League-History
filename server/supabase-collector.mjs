import {ensure,ingest,lockDue,payerFromFantasy,writable} from './engine.mjs';
import {transaction,randomToken} from './supabase-store.mjs';
import {parseScoreboard} from './domain.mjs';
export async function getJSON(url,fetcher=fetch){const r=await fetcher(url,{signal:AbortSignal.timeout(10000),headers:{Accept:'application/json','User-Agent':'League-History/Parlay'}});if(!r.ok)throw Error('Source HTTP '+r.status);return r.json();}
/* 🏈 THE LEAGUE SCOREBOARD, FOR THE TICKER (v113) — OFF UNLESS CONFIGURED.
   The step below runs only when `config.scoreboard_url` is set. The column is
   nullable with no default, so every existing deployment reads `undefined`
   and this does nothing at all: shipping it cannot start traffic anywhere.

   🚨 WHY THE COLLECTOR HOLDS IT INSTEAD OF TWELVE PHONES ASKING DIRECTLY.
   The source is the Sports-Hub FastAPI app on Render's free tier, which sleeps
   after ~15 minutes idle and then cold-starts for 30-60s. On a member's phone
   that is a minute of nothing on the one element that is on every screen. Here
   it is one server polling on a schedule, the members read a stored row, and
   the cold start — if it happens at all — happens to nobody.

   ⚠️ CADENCE IS DERIVED FROM THE BOARD, NOT A CLOCK. `dispatch()` fires every
   30 seconds, which is far more often than this needs: 60s while a game is
   actually live, 15 minutes otherwise, read off the last board's own states.
   A day-and-hour table here would be a third copy of the NFL calendar. */
const SCOREBOARD_LIVE_MS=60000, SCOREBOARD_IDLE_MS=900000;
function scoreboardDue(season,now){
 const last=season.collector?.lastScoreboard||0;
 const live=(season.scoreboard?.games||[]).some(g=>g.state==='live');
 return now-last>=(live?SCOREBOARD_LIVE_MS:SCOREBOARD_IDLE_MS);
}

export async function collect(rpc,config,{clock=Date.now,fetchJSON=getJSON,managerFor=()=>'',
 /* 🚨 FAILS CLOSED. A deployment that forgets to wire the validator stores
    NOTHING rather than storing whatever the source returned — an error page
    rendered as a 0-0 board on every screen is the worst outcome this feature
    has, so the default is refusal, not trust. The real validator is the
    BROWSER's own `LeagueTicker._t.valid`, handed in by the edge entry the same
    way `espn.js`'s mgrFor is: one definition of what a board is, not two. */
 validBoard=()=>false}={}){
 const lease=randomToken();if(!await rpc('lease',{owner:lease}))return {ok:true,busy:true};
 const baseRPC=rpc;rpc=(op,args={})=>baseRPC(op,op==='commit'?{...args,lease}:args);
 const year=config.year,now=clock();
 try{
  await transaction(rpc,store=>store.transact(s=>{ensure(s,year,config.launch_week);Object.values(s.seasons[year].weeks).forEach(w=>lockDue(w,now));}));
  let snapshot=(await rpc('read')).state.seasons[year];
  let discovery=null;
  if(now-(snapshot.collector?.lastDiscovery||0)>=900000||!snapshot.collector?.discoveryMarkets){try{discovery=await fetchJSON('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');}catch{}}
  await transaction(rpc,store=>store.transact(s=>{
   const season=s.seasons[year],k=Number(discovery?.week?.number);
   // Before launch the selected legacy week wins; discovery must not skip Week 1.
   if(discovery?.season?.year===year&&discovery?.season?.type===2&&k>=1&&k<=18){season.collector??={};season.collector.lastDiscovery=now;season.collector.discoveredWeek=k;const markets=(Array.isArray(discovery.events)?parseScoreboard(discovery,now):[]).flatMap(g=>g.markets);season.collector.discoveryMarkets=Object.fromEntries(['ml','spread','total'].map(m=>[m,markets.filter(q=>q.market===m).length]));if(writable(season)){season.current=Math.max(season.current,k);ensure(s,year,season.current);}}
  }));
  snapshot=(await rpc('read')).state.seasons[year];
  const recent=Object.values(snapshot.weeks).filter(w=>w.week===snapshot.current||w.week===snapshot.current-1||Object.values(w.picks).some(p=>!p.lockedAt)||w.games.some(g=>!g.completed));
  const weeks=[...new Set([...recent.map(w=>w.week),snapshot.current-1])].filter(k=>k>=1);
  // Fetch in parallel, then commit observations onto the latest revision; never
  // overwrite picks with the snapshot taken before network IO.
  const results=await Promise.all(weeks.map(async week=>{try{const payload=await fetchJSON(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${year}&seasontype=2&week=${week}`);if(payload.season?.year!==year||Number(payload.week?.number)!==week)throw Error('Wrong season or week');return {week,payload,at:clock()};}catch(e){return {week,error:String(e.message).slice(0,140)};}}));
  await transaction(rpc,store=>{
   for(const r of results){try{if(r.error)throw Error(r.error);ingest(store,year,r.week,r.payload,r.at);}catch(e){store.transact(s=>{ensure(s,year,r.week).feedError=String(e.message).slice(0,140);});}}
   store.transact(s=>{const season=s.seasons[year];season.collector??={};season.collector.lastAttempt=now;if(!season.weeks[season.current].feedError)season.collector.lastSuccess=clock();});
  });
  if(now-(snapshot.collector?.lastFantasy||0)>=3600000&&snapshot.current>1){
   try{
    const p=await fetchJSON('https://sports-hub-fantasy-api.onrender.com/api/fantasy/football/season');
    await transaction(rpc,store=>store.transact(s=>{const season=s.seasons[year];for(const w of Object.values(season.weeks)){const prev=season.weeks[w.week-1];if(!prev?.games.length||!prev.games.every(g=>g.completed&&g.status==='STATUS_FINAL'))continue;const payer=payerFromFantasy(p,year,w.week,managerFor,now);if(payer.status!=='pending')w.payer={...payer,observedAt:now};}season.collector.lastFantasy=now;delete season.collector.lastFantasyError;}));
   }catch(e){await transaction(rpc,store=>store.transact(s=>{s.seasons[year].collector.lastFantasyError=String(e.message).slice(0,140);}));}
  }
  /* ── the ticker's board. Last, and never allowed to fail the run: the
     parlay is this collector's job and a scoreboard is a courtesy on top. */
  if(config.scoreboard_url){
   const season=(await rpc('read')).state.seasons[year];
   if(scoreboardDue(season,now)){
    try{
     const board=await fetchJSON(config.scoreboard_url);
     if(!validBoard(board))throw Error('Unrecognised scoreboard payload');
     await transaction(rpc,store=>store.transact(s=>{
      const sn=s.seasons[year];sn.collector??={};
      /* ⚠️ Stored with the time it was OBSERVED, not the time it is read. The
         reader has to be able to say "12 min ago" rather than imply it is
         current — a remembered score presented as live is the one thing worse
         than no ticker (the v29 rule). */
      sn.scoreboard={week:board.week??null,games:board.games,observedAt:clock()};
      sn.collector.lastScoreboard=now;delete sn.collector.lastScoreboardError;
     }));
    }catch(e){
     /* ⚠️ The previous board is deliberately LEFT IN PLACE. It ages out on the
        reader's own staleness rule; deleting it here would turn one failed
        poll into a bar that vanishes mid-Sunday. */
     await transaction(rpc,store=>store.transact(s=>{
      const sn=s.seasons[year];sn.collector??={};
      sn.collector.lastScoreboard=now;
      sn.collector.lastScoreboardError=String(e.message).slice(0,140);
     }));
    }
   }
  }
  const final=(await rpc('read')).state.seasons[year],current=final.weeks[final.current];
  return {ok:!current.feedError&&current.updatedAt>0&&clock()-current.updatedAt<300000,weeks:weeks.length,...(current.feedError?{error:current.feedError}:{})};
 }finally{await rpc('release_lease',{owner:lease});}
}
