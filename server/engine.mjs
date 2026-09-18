import {ROSTER,STAKE,parseScoreboard,quoteFor,locked,ticket,migratePick,odds,number,decimal} from './domain.mjs';
export const failure=(message,status=400)=>Object.assign(new Error(message),{status});
export function ensure(state,year,week){const s=state.seasons[year]??={weeks:{},current:week};return s.weeks[week]??={year,week,stake:STAKE,games:[],picks:{},revisions:{},unmapped:[],imported:false,audit:[],updatedAt:0,payer:{status:'pending'}};}
export function ingest(store,year,week,payload,now=Date.now()){
 const incoming=parseScoreboard(payload,now);if(!incoming.length)throw failure('Empty scoreboard',502);
 return store.transact(state=>{const w=ensure(state,year,week);
  for(const game of incoming){const old=w.games.find(g=>g.id===game.id);const index=w.games.findIndex(g=>g.id===game.id);if(old&&old.seenAt>game.seenAt)continue;if(index<0)w.games.push(game);else w.games[index]=game;
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
  if(ticket(Object.values(w.picks),w.games,now,w.stake,w.ticketOpenedAt||0).locked)throw failure('The parlay is locked because a game has started.',409);
  const member=actor.role==='organizer'?input.member:actor.member;
  if(!ROSTER.includes(member))throw failure('Choose a league member.');
  if(actor.role!=='organizer'&&input.member!==actor.member)throw failure('You can only edit your own pick.',403);
  const old=w.picks[member];if(old?.lockedAt)throw failure('This pick is locked at kickoff.',409);
  if(Number(input.revision||0)!==Number(w.revisions?.[member]??old?.revision??0))throw failure('This pick changed on another device. Refresh before replacing it.',409);
  w.revisions??={};const revision=Number(w.revisions[member]??old?.revision??0)+1;
  if(input.clear){w.revisions[member]=revision;delete w.picks[member];w.audit.push({at:now,action:'clear',member,by:actor.role==='organizer'?'organizer':member});return {ok:true};}
  const g=w.games.find(g=>g.id===String(input.gameId));if(locked(g,now))throw failure('This game is closed for picks.',409);
  if(now-w.updatedAt>300000||now-g.seenAt>300000)throw failure('The board is stale. Wait for a fresh update before saving.',503);
  if(Object.values(w.picks).some(p=>p.member!==member&&p.gameId===g.id))throw failure('That game was just picked. Choose another matchup.',409);
  const market=input.market,side=input.side,q=market==='prop'?null:quoteFor(g,{market,side});
  if(market!=='prop'&&!q)throw failure('That DraftKings market is unavailable.',409);
  const description=String(input.description||'').trim();
  if(market==='prop'&&(!description||description.length>120||odds(input.odds)===null))throw failure('Enter the prop and its quoted odds.');
  const quote=q?{...q}:{label:description,odds:odds(input.odds),line:null,observedAt:now,provider:'Member-entered prop'};
  const p={member,gameId:g.id,market,side:market==='prop'?'':side,description:market==='prop'?description:'',original:{...quote},quote,createdAt:old?.createdAt||now,updatedAt:now,revision,addedBy:actor.role==='organizer'?'organizer':member};
  w.revisions[member]=revision;w.picks[member]=p;w.unmapped=w.unmapped.filter(p=>p.member!==member);w.audit.push({at:now,action:old?'replace':'save',member,by:p.addedBy});return {ok:true,pick:p};
 });
}
export function resetParlay(store,year,week,actor,now=Date.now()){
 if(actor.role!=='organizer')throw failure('Organizer access required',403);
 return store.transact(state=>{const w=state.seasons[year]?.weeks[week];if(!w)throw failure('Unknown ticket',404);lockDue(w,now);
  const current=ticket(Object.values(w.picks),w.games,now,w.stake,w.ticketOpenedAt||0);
  if(!current.resetEligible)throw failure('Reset is available only after a completed Thursday leg misses.',409);
  w.resets??=[];w.resets.push({at:now,by:'organizer',reason:'thursday-miss',ticket:structuredClone(current),placedTicket:structuredClone(w.placedTicket||null)});
  w.revisions??={};Object.keys(w.picks).forEach(member=>{w.revisions[member]=Number(w.revisions[member]??w.picks[member].revision??0)+1;});
  w.picks={};w.ticketOpenedAt=now;w.placedTicket=null;w.ticketOddsRevision=(w.ticketOddsRevision||0)+1;
  w.audit.push({at:now,action:'reset-parlay',by:'organizer',reason:'thursday-miss'});
  return {ok:true};
 });
}
export function importLegacy(store,year,week,rows,now=Date.now()){
 return store.transact(state=>{const w=ensure(state,year,week);if(w.imported)return;w.legacyExport=structuredClone(rows||{});
  for(const [m,r]of Object.entries(rows||{})){if(!ROSTER.includes(m)||!r||w.picks[m]){w.unmapped.push({member:m,unmapped:true,original:{label:String(r?.p||'')},reason:'Unrecognized or conflicting legacy entry retained for review'});continue;}const p=migratePick(m,r,w.games);
   if(p.unmapped){w.unmapped.push(p);continue;}
   if(Object.values(w.picks).some(x=>x.gameId===p.gameId)){w.unmapped.push({...p,unmapped:true,reason:'Duplicate legacy matchup requires review'});continue;}
   const g=w.games.find(g=>g.id===p.gameId),q=quoteFor(g,p);if(!locked(g,now)&&q)p.quote={...q};w.picks[m]=p;w.revisions??={};w.revisions[m]=p.revision;
  }w.imported=true;lockDue(w,now);w.audit.push({at:now,action:'legacy-import'});
 });
}
export function publicWeek(w,now=Date.now()){
 // Reset attempts are historical tickets, not discarded data. They are safe for
 // the shared Season view and keep a Thursday-loss pivot from erasing records.
 const priorTickets=(w.resets||[]).map(r=>({at:r.at,reason:r.reason,ticket:r.ticket,placedTicket:r.placedTicket||null}));
 return {year:w.year,week:w.week,updatedAt:w.updatedAt,feedError:w.feedError||null,payer:w.payer,placedTicket:w.placedTicket||null,ticketOddsRevision:w.ticketOddsRevision||0,revisions:w.revisions||{},games:w.games,ticket:ticket(Object.values(w.picks),w.games,now,w.stake,w.ticketOpenedAt||0),priorTickets,unmapped:w.unmapped};
}
export function payerFromScores(scores,previousWeek){
 if(scores.length!==ROSTER.length||new Set(scores.map(x=>x.member)).size!==ROSTER.length||scores.some(x=>!ROSTER.includes(x.member)||number(x.score)===null))return {status:'pending'};
 const low=Math.min(...scores.map(x=>Number(x.score))),members=scores.filter(x=>Number(x.score)===low).map(x=>x.member);return {status:members.length===1?'ready':'tie',members,score:low,previousWeek};
}


// The existing current-season fantasy endpoint omits year. Accept that contract
// only during the configured NFL season, with a compatible source week and
// final outcomes for every member; explicit year mismatches always fail closed.
export function payerFromFantasy(payload,year,ticketWeek,managerFor,now=Date.now()){
 const years=[payload.year,payload.season?.year].filter(x=>x!=null);
 const date=new Date(now),month=date.getUTCMonth(),currentYear=date.getUTCFullYear()-(month<2?1:0);
 if(years.some(x=>Number(x)!==year)||(!years.length&&(currentYear!==year||(month>1&&month<8))))throw Error('Wrong or unverified fantasy season');
 if(!Number.isInteger(ticketWeek)||ticketWeek<2||ticketWeek>18||!Number.isInteger(payload.week)||payload.week<ticketWeek||payload.week>18)return {status:'pending'};
 const teams=payload.teams||[],index=ticketWeek-2;
 if(teams.some(t=>!['W','L','T'].includes(t.outcomes?.[index])))return {status:'pending'};
 return payerFromScores(teams.map(t=>({member:managerFor(t.team,teams),score:t.scores?.[index]})),ticketWeek-1);
}

// A successful import alone is never permission to switch the live write store.
export function activateRelease(store,year,week,proof,now=Date.now()){
 return store.transact(s=>{const season=s.seasons[year],w=season?.weeks[week];
  if(!season||season.current!==week||!w?.imported)throw failure('Import the current week before activation.');
  if(w.unmapped.length)throw failure('Resolve retained legacy entries before activation.');
  if(!proof?.legacyWritesFrozen||!proof?.migrationReconciled||!proof?.backupVerified)throw failure('Cutover requires frozen legacy writes, reconciled migration and a verified backup.');
  if(now-w.updatedAt>300000||w.feedError)throw failure('A fresh scoreboard is required.');
  season.release={cutoverWeek:week,at:now,legacyWritesFrozen:true,migrationReconciled:true,backupVerified:true};return season.release;
 });
}
export function writable(season){return !!(season?.release&&season.weeks[season.release.cutoverWeek]?.imported);}

export function savePlacedOdds(store,year,week,actor,input,now=Date.now()){
 if(actor.role!=='organizer')throw failure('Organizer access required',403);
 return store.transact(s=>{const w=s.seasons[year]?.weeks[week];if(!w)throw failure('Unknown ticket',404);
  if(input.revision!==(w.ticketOddsRevision||0))throw failure('The placed odds changed on another device. Refresh before editing.',409);
  const previous=w.placedTicket?.odds??null;let value=null;
  if(!input.clear){const text=String(input.odds??'').trim().replace(/[−–]/g,'-');
   if(!/^[+-]?(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(text))throw failure('Enter American odds, such as +12500 or -110.');
   value=odds(text.replace(/,/g,''));if(value===null||!Number.isSafeInteger(value))throw failure('Enter valid whole-number American odds of +100 or higher, or -100 or lower.');
  }
  w.ticketOddsRevision=(w.ticketOddsRevision||0)+1;
  const potentialReturn=value===null?null:Math.round(w.stake*decimal(value)*100)/100;
  w.placedTicket=value===null?null:{odds:value,stake:w.stake,potentialReturn,potentialProfit:Math.round((potentialReturn-w.stake)*100)/100,updatedAt:now,revision:w.ticketOddsRevision};
  w.audit.push({action:input.clear?'clear-placed-odds':'save-placed-odds',at:now,by:'organizer',previous,odds:value});
  return {ok:true,placedTicket:w.placedTicket,revision:w.ticketOddsRevision};
 });
}
