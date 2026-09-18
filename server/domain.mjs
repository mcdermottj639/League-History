// Parlay domain logic. Shared calculations never assume a missing price or result.
export const ROSTER = ['McD','CC','Hurd','Hyman','Christel','Woods','Zach','Buley','Wolff','Riz','Slemp','Gotch'];
export const STAKE = 10;
export const number = v => v === null || v === undefined || (typeof v==='string'&&v.trim()==='') ? null : Number.isFinite(Number(v)) ? Number(v) : null;
export const odds = v => { const n=number(String(v ?? '').replace(/[−–]/g,'-')); return n!==null && Math.abs(n)>=100 ? n : null; };
export const decimal = n => n>0?1+n/100:1+100/-n;
export const sign = n => n>0?'+'+n:String(n);
export function label(g, market, side, line) {
  if(market==='prop')return '';
  if(market==='total')return `${g.away}/${g.home} ${side==='over'?'Over':'Under'} ${line}`;
  return `${side} ${market==='ml'?'ML':sign(line)} vs ${side===g.home?g.away:g.home}`;
}
export function parseScoreboard(payload, at=Date.now()) {
  if(!Array.isArray(payload?.events))throw Error('Invalid scoreboard');
  return payload.events.map(e=>{
    const c=e.competitions?.[0], competitors=c?.competitors||[];
    const a=competitors.find(t=>t.homeAway==='away'),h=competitors.find(t=>t.homeAway==='home');
    if(!a?.team?.abbreviation||!h?.team?.abbreviation||!Number.isFinite(Date.parse(e.date)))return null;
    const st=c.status||e.status||{},t=st.type||{};
    const g={id:String(e.id),away:a.team.abbreviation,home:h.team.abbreviation,kick:Date.parse(e.date),state:t.state||'unknown',status:t.name||'',completed:t.completed===true,detail:t.shortDetail||t.detail||'',clock:st.displayClock||'',period:st.period||0,awayScore:number(a.score),homeScore:number(h.score),seenAt:at,markets:[]};
    // Only DraftKings, only current ('close') quotes. Never substitute opening prices or -110.
    const dk=(c.odds||[]).find(o=>/draft\s*kings/i.test(o.provider?.name||''));
    if(dk && g.state==='pre' && at<g.kick){
      for(const [market,key,sides] of [['spread','pointSpread',['away','home']],['total','total',['over','under']],['ml','moneyline',['away','home']]]){
        for(const side of sides){const x=dk[key]?.[side]?.close;if(!x)continue;const price=odds(x.odds),line=market==='ml'?null:number(String(x.line??'').replace(/^[ou]/i,''));if(price===null||(market!=='ml'&&line===null))continue;
          const selection=market==='total'?side:g[side];g.markets.push({market,side:selection,line,odds:price,label:label(g,market,selection,line),observedAt:at,provider:'DraftKings via ESPN'});
        }
      }
    }
    return g;
  }).filter(Boolean);
}
export function quoteFor(g,p){return g?.markets?.find(q=>q.market===p.market&&q.side===p.side)||null;}
export function locked(g,now=Date.now()){return !g||g.state!=='pre'||now>=g.kick;}
export function result(p,g){
  if(p.manualResult)return p.manualResult;
  if(!p.lockedAt)return 'upcoming';
  if(!g)return 'pending';
  if(p.market==='prop'||p.missingQuote)return 'pending';
  if(!g.completed)return g.state==='in'?'live':'pending';
  if(g.status!=='STATUS_FINAL'||g.homeScore===null||g.awayScore===null)return 'pending';
  let margin;
  if(p.market==='total'){margin=(g.homeScore+g.awayScore)-p.quote.line;if(p.side==='under')margin=-margin;}
  else {margin=p.side===g.home?g.homeScore-g.awayScore:g.awayScore-g.homeScore;if(p.market==='spread')margin+=p.quote.line;}
  return margin>0?'hit':margin<0?'miss':'push';
}
export function progress(p,g){
  if(!g||g.homeScore===null||g.awayScore===null||!p.quote)return '';
  if(p.market==='total'){const total=g.homeScore+g.awayScore;return p.side==='over'?`${total} points · ${total>p.quote.line?'over the line':`needs ${Math.floor(p.quote.line-total)+1} more`}`:`${total} points · ${total<p.quote.line?`${p.quote.line-total} below total`:'at or above total'}`;}
  if(p.market==='prop')return 'Result requires review';
  let margin=p.side===g.home?g.homeScore-g.awayScore:g.awayScore-g.homeScore;
  if(p.market==='spread'){margin+=p.quote.line;return margin>0?`Covering by ${+margin.toFixed(2)}`:margin<0?`Outside cover by ${+Math.abs(margin).toFixed(2)}`:'At the spread';}
  return margin>0?`Leading by ${margin}`:margin<0?`Trailing by ${-margin}`:'Tied';
}
export function ticket(picks,games,now=Date.now(),stake=STAKE,openedAt=0){
  const legs=picks.map(p=>{const g=games.find(g=>g.id===p.gameId);return {...p,result:result(p,g),game:g?{away:g.away,home:g.home,awayScore:g.awayScore,homeScore:g.homeScore,kick:g.kick,state:g.state,completed:g.completed,status:g.status,detail:g.detail,seenAt:g.seenAt}:null,progress:progress(p,g)};});
  const hit=legs.filter(l=>l.result==='hit').length,miss=legs.filter(l=>l.result==='miss').length,push=legs.filter(l=>l.result==='push').length;
  /* One ticket means the first kickoff closes the entire collection. The
     reset escape hatch deliberately needs a completed Thursday miss. NFL
     Thursday kickoffs cross midnight UTC, so use the league's Eastern time. */
  const ticketLocked=games.some(g=>g.kick>=openedAt&&locked(g,now));
  const thursdayMiss=legs.some(l=>l.result==='miss'&&l.game?.kick&&new Intl.DateTimeFormat('en-US',{weekday:'long',timeZone:'America/New_York'}).format(new Date(l.game.kick))==='Thursday');
  const settled=legs.length>0&&legs.every(l=>['hit','miss','push'].includes(l.result));
  const priced=legs.filter(l=>l.result!=='push'),known=priced.every(l=>odds(l.quote?.odds)!==null&&!l.missingQuote);
  const mult=known?priced.reduce((n,l)=>n*decimal(l.quote.odds),1):null;
  const full=legs.length===ROSTER.length,status=miss?'lost':!legs.length?'empty':settled?full?(push===legs.length?'refunded':'won'):'incomplete':legs.some(l=>l.lockedAt)?'live':'collecting';
  // Incomplete collections never become a supposedly placed/winning twelve-leg ticket.
  const returned=status==='lost'?0:(status==='won'||status==='refunded')&&mult!==null?stake*mult:null;
  return {legs,hit,miss,push,locked:ticketLocked,resetEligible:ticketLocked&&thursdayMiss,settled,full,status,stake,decimal:mult,combinedOdds:mult===null||mult===1?null:mult>=2?Math.round((mult-1)*100):-Math.round(100/(mult-1)),estimatedReturn:mult===null?null:stake*mult,returned,net:returned===null?null:returned-stake,at:now};
}
export function migratePick(m,row,games){
  const text=String(row.p||''),tokens=text.toUpperCase().split(/[^A-Z0-9]+/),matches=games.filter(g=>tokens.includes(g.away)||tokens.includes(g.home));
  if(matches.length!==1)return {member:m,original:{label:text,odds:odds(row.o)},unmapped:true};
  const g=matches[0];let market='prop',side='',line=null;
  const total=/^[A-Z]{2,3}\/[A-Z]{2,3}\s+(OVER|UNDER)\s+(\d+(?:\.\d+)?)$/i.exec(text.trim()),ml=/^([A-Z]{2,3})\s+(?:ML|MONEYLINE)(?:\s+(?:vs|at)\s+[A-Z]{2,3})?$/i.exec(text.trim()),spread=/^([A-Z]{2,3})\s+([+-]\d+(?:\.\d+)?)(?:\s+(?:vs|at)\s+[A-Z]{2,3})?$/i.exec(text.trim());
  if(total){market='total';side=total[1].toLowerCase();line=+total[2];}else if(ml&&[g.home,g.away].includes(ml[1].toUpperCase())){market='ml';side=ml[1].toUpperCase();}else if(spread&&[g.home,g.away].includes(spread[1].toUpperCase())){market='spread';side=spread[1].toUpperCase();line=+spread[2];}
  return {member:m,gameId:g.id,market,side,description:market==='prop'?text:'',original:{label:text,odds:odds(row.o),line},quote:{label:text,odds:odds(row.o),line,observedAt:Number(row.t)||null,provider:'Legacy saved pick'},createdAt:Number(row.t)||null,imported:true,revision:1};
}
