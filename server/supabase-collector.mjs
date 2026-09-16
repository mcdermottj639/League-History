import {ensure,ingest,lockDue,payerFromScores,writable} from './engine.mjs';
import {transaction,randomToken} from './supabase-store.mjs';
export async function getJSON(url){const r=await fetch(url,{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Source HTTP '+r.status);return r.json();}
export async function collect(rpc,config,{clock=Date.now,fetchJSON=getJSON,managerFor=()=>''}={}){
 const lease=randomToken();if(!await rpc('lease',{owner:lease}))return {ok:true,busy:true};
 const baseRPC=rpc;rpc=(op,args={})=>baseRPC(op,op==='commit'?{...args,lease}:args);
 const year=config.year,now=clock();
 try{
  await transaction(rpc,store=>store.transact(s=>{ensure(s,year,config.launch_week);Object.values(s.seasons[year].weeks).forEach(w=>lockDue(w,now));}));
  let snapshot=(await rpc('read')).state.seasons[year];
  let discovery=null;
  if(now-(snapshot.collector?.lastDiscovery||0)>=900000){try{discovery=await fetchJSON('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');}catch{}}
  await transaction(rpc,store=>store.transact(s=>{
   const season=s.seasons[year],k=Number(discovery?.week?.number);
   // Before launch the selected legacy week wins; discovery must not skip Week 1.
   if(discovery?.season?.year===year&&discovery?.season?.type===2&&k>=1&&k<=18){season.collector??={};season.collector.lastDiscovery=now;season.collector.discoveredWeek=k;if(writable(season)){season.current=Math.max(season.current,k);ensure(s,year,season.current);}}
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
    if(Number(p.year??p.season?.year)!==year)throw Error('Wrong fantasy season');
    await transaction(rpc,store=>store.transact(s=>{const season=s.seasons[year];for(const w of Object.values(season.weeks)){const prev=season.weeks[w.week-1];if(!prev?.games.length||!prev.games.every(g=>g.completed&&g.status==='STATUS_FINAL'))continue;const payer=payerFromScores((p.teams||[]).map(t=>({member:managerFor(t.team,p.teams),score:t.scores?.[w.week-2]})),w.week-1);if(payer.status!=='pending')w.payer={...payer,observedAt:now};}season.collector.lastFantasy=now;}));
   }catch{}
  }
  return {ok:true,weeks:weeks.length};
 }finally{await rpc('release_lease',{owner:lease});}
}
