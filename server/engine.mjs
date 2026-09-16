import {ROSTER,STAKE,parseScoreboard,quoteFor,locked,ticket,migratePick,odds,number} from './domain.mjs';
export const failure=(message,status=400)=>Object.assign(new Error(message),{status});
export function ensure(state,year,week){const s=state.seasons[year]??={weeks:{},current:week};return s.weeks[week]??={year,week,stake:STAKE,games:[],picks:{},unmapped:[],imported:false,audit:[],updatedAt:0,payer:{status:'pending'}};}
export function ingest(store,year,week,payload,now=Date.now()){
 const incoming=parseScoreboard(payload,now);if(!incoming.length)throw failure('Empty scoreboard',502);
 return store.transact(state=>{const w=ensure(state,year,week);
  for(const game of incoming){const old=w.games.find(g=>g.id===game.id);const index=w.games.findIndex(g=>g.id===game.id);if(index<0)w.games.push(game);else w.games[index]=game;
   for(const p of Object.values(w.picks).filter(p=>p.gameId===game.id)){
    if(p.lockedAt)continue;
    if(locked(game,now)||(old&&locked(old,now))){p.lockedAt=now;p.scheduledKick=old?.kick||game.kick;p.missingQuote=p.market!=='prop'&&(!p.quote||p.quote.provider!=='DraftKings via ESPN'||p.quote.observedAt>=p.scheduledKick);p.staleQuote=!!p.quote?.observedAt&&p.scheduledKick-p.quote.observedAt>120000;}
    else {const q=quoteFor(game,p);if(q)p.quote={...q};}
   }
  }
  lockDue(w,now);w.updatedAt=now;w.feedError=null;return w;
 });
}
export function lockDue(w,now=Date.now()){
 for(const p of Object.values(w.picks)){const g=w.games.find(g=>g.id===p.gameId);if(!p.lockedAt&&g&&locked(g,now)){p.lockedAt=now;p.scheduledKick=g.kick;p.missingQuote=p.market!=='prop'&&(!p.quote||p.quote.provider!=='DraftKings via ESPN'||p.quote.observedAt>=g.kick);p.staleQuote=!!p.quote?.observedAt&&g.kick-p.quote.observedAt>120000;}}
}
export function savePick(store,year,week,actor,input,now=Date.now()){
 return store.transact(state=>{const w=ensure(state,year,week);lockDue(w,now);
  const member=actor.role==='organizer'?input.member:actor.member;
  if(!ROSTER.includes(member))throw failure('Choose a league member.');
  if(actor.role!=='organizer'&&input.member!==actor.member)throw failure('You can only edit your own pick.',403);
  const old=w.picks[member];if(old?.lockedAt)throw failure('This pick is locked at kickoff.',409);
  if(Number(input.revision||0)!==Number(old?.revision||0))throw failure('This pick changed on another device. Refresh before replacing it.',409);
  if(input.clear){delete w.picks[member];w.audit.push({at:now,action:'clear',member,by:actor.role==='organizer'?'organizer':member});return {ok:true};}
  const g=w.games.find(g=>g.id===String(input.gameId));if(locked(g,now))throw failure('This game is closed for picks.',409);
  if(now-w.updatedAt>300000)throw failure('The board is stale. Wait for a fresh update before saving.',503);
  if(Object.values(w.picks).some(p=>p.member!==member&&p.gameId===g.id))throw failure('That game was just picked. Choose another matchup.',409);
  const market=input.market,side=input.side,q=market==='prop'?null:quoteFor(g,{market,side});
  if(market!=='prop'&&!q)throw failure('That DraftKings market is unavailable.',409);
  const description=String(input.description||'').trim();
  if(market==='prop'&&(!description||description.length>120||odds(input.odds)===null))throw failure('Enter the prop and its quoted odds.');
  const quote=q?{...q}:{label:description,odds:odds(input.odds),line:null,observedAt:now,provider:'Member-entered prop'};
  const p={member,gameId:g.id,market,side:market==='prop'?'':side,description:market==='prop'?description:'',original:{...quote},quote,createdAt:old?.createdAt||now,updatedAt:now,revision:(old?.revision||0)+1,addedBy:actor.role==='organizer'?'organizer':member};
  w.picks[member]=p;w.unmapped=w.unmapped.filter(p=>p.member!==member);w.audit.push({at:now,action:old?'replace':'save',member,by:p.addedBy});return {ok:true,pick:p};
 });
}
export function importLegacy(store,year,week,rows,now=Date.now()){
 return store.transact(state=>{const w=ensure(state,year,week);if(w.imported)return;
  for(const [m,r]of Object.entries(rows||{})){if(!ROSTER.includes(m)||!r||w.picks[m])continue;const p=migratePick(m,r,w.games);
   if(p.unmapped){w.unmapped.push(p);continue;}
   if(Object.values(w.picks).some(x=>x.gameId===p.gameId)){w.unmapped.push({...p,unmapped:true,reason:'Duplicate legacy matchup requires review'});continue;}
   const g=w.games.find(g=>g.id===p.gameId),q=quoteFor(g,p);if(!locked(g,now)&&q)p.quote={...q};w.picks[m]=p;
  }w.imported=true;lockDue(w,now);w.audit.push({at:now,action:'legacy-import'});
 });
}
export function publicWeek(w,now=Date.now()){
 return {year:w.year,week:w.week,updatedAt:w.updatedAt,feedError:w.feedError||null,payer:w.payer,games:w.games,ticket:ticket(Object.values(w.picks),w.games,now,w.stake),unmapped:w.unmapped};
}
export function payerFromScores(scores,previousWeek){
 if(scores.length!==ROSTER.length||new Set(scores.map(x=>x.member)).size!==ROSTER.length||scores.some(x=>!ROSTER.includes(x.member)||number(x.score)===null))return {status:'pending'};
 const low=Math.min(...scores.map(x=>Number(x.score))),members=scores.filter(x=>Number(x.score)===low).map(x=>x.member);return {status:members.length===1?'ready':'tie',members,score:low,previousWeek};
}
