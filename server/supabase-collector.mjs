import {ensure,ingest,lockDue,payerFromFantasy,writable,attachBoxscore,parseBoxscore} from './engine.mjs';
import {transaction,randomToken} from './supabase-store.mjs';
import {parseScoreboard} from './domain.mjs';
import {gamesNeedingBoxscore,boxscoreURL} from './props.mjs';
export async function getJSON(url,fetcher=fetch){const r=await fetcher(url,{signal:AbortSignal.timeout(10000),headers:{Accept:'application/json','User-Agent':'League-History/Parlay'}});if(!r.ok)throw Error('Source HTTP '+r.status);return r.json();}
export async function collect(rpc,config,{clock=Date.now,fetchJSON=getJSON,managerFor=()=>''}={}){
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
  snapshot=(await rpc('read')).state.seasons[year];
  const wanted=[];
  for(const w of Object.values(snapshot.weeks||{})){for(const g of gamesNeedingBoxscore(w,clock()))wanted.push({week:w.week,id:g.id,final:g.status==='STATUS_FINAL'&&g.completed});}
  const unique=[...new Map(wanted.map(x=>[x.id,x])).values()];
  const boxes=await Promise.all(unique.map(async item=>{try{return {...item,boxscore:parseBoxscore(await fetchJSON(boxscoreURL(item.id)),clock(),item.final)};}catch(e){return {...item,error:String(e.message).slice(0,140)};}}));
  if(boxes.length)await transaction(rpc,store=>{for(const b of boxes){if(b.boxscore)attachBoxscore(store,year,b.week,b.id,b.boxscore);else store.transact(s=>{const g=s.seasons[year]?.weeks[b.week]?.games.find(g=>g.id===b.id);if(g&&!g.boxscore)g.boxError=b.error;});}});
  if(now-(snapshot.collector?.lastFantasy||0)>=3600000&&snapshot.current>1){
   try{
    const p=await fetchJSON('https://sports-hub-fantasy-api.onrender.com/api/fantasy/football/season');
    await transaction(rpc,store=>store.transact(s=>{const season=s.seasons[year];for(const w of Object.values(season.weeks)){const prev=season.weeks[w.week-1];if(!prev?.games.length||!prev.games.every(g=>g.completed&&g.status==='STATUS_FINAL'))continue;const payer=payerFromFantasy(p,year,w.week,managerFor,now);if(payer.status!=='pending')w.payer={...payer,observedAt:now};}season.collector.lastFantasy=now;delete season.collector.lastFantasyError;}));
   }catch(e){await transaction(rpc,store=>store.transact(s=>{s.seasons[year].collector.lastFantasyError=String(e.message).slice(0,140);}));}
  }
  const final=(await rpc('read')).state.seasons[year],current=final.weeks[final.current];
  return {ok:!current.feedError&&current.updatedAt>0&&clock()-current.updatedAt<300000,weeks:weeks.length,...(current.feedError?{error:current.feedError}:{})};
 }finally{await rpc('release_lease',{owner:lease});}
}