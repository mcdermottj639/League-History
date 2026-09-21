// Write-in prop grading from ESPN box scores. Unparsed, unmatched or incomplete
// stats stay pending — results are never invented.
const STAT_WORD='(passing|pass|rushing|rush|receiving|rec(?:eiving)?|receptions?|recs?|catches)';
const UNIT='(?:\\s*(?:yards?|yds?|tds?|touchdowns?))?';
const nameTokens=s=>String(s||'').toLowerCase().replace(/[.'’]/g,'').replace(/-/g,' ').split(/\s+/).filter(t=>t&&!['jr','sr','ii','iii','iv','the'].includes(t));
const cleanPlayer=s=>String(s||'').replace(/^(?:[A-Z]{2,3}\s+)/,'').replace(/\s+[A-Z]{2,3}$/,'').replace(/\s+/g,' ').trim();
const num=v=>{const n=Number(String(v??'').split('/')[0].replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:null;};
const groupName=g=>String(g?.name||g?.type||g?.text||'').toLowerCase().replace(/\s+/g,'');
function normStat(word,full){
 if(!word)return null;
 const w=word.toLowerCase(),t=full.toLowerCase(),td=/\btds?\b|touchdowns?/.test(t),yds=/\byards?\b|\byds?\b/.test(t);
 if(/receptions?|recs?|catches/.test(w)&&!yds&&!td)return 'receptions';
 if(/pass/.test(w))return td?'passTd':'passYds';
 if(/rush/.test(w))return td?'rushTd':'rushYds';
 if(/rec/.test(w))return td?'recTd':'recYds';
 return null;
}
export function parseProp(text){
 const raw=String(text||'').replace(/\s+/g,' ').trim();if(!raw)return null;
 let m=/^(.*?)\s+(?:anytime\s+(?:td|touchdown)|a(?:ny)?t(?:ime)?td)$/i.exec(raw);
 if(m&&cleanPlayer(m[1]))return {kind:'attd',player:cleanPlayer(m[1])};
 m=/^(.*?)\s+(?:first\s+(?:td|touchdown)|ftd)$/i.exec(raw);
 if(m&&cleanPlayer(m[1]))return {kind:'first_td',player:cleanPlayer(m[1])};
 m=new RegExp(`^(.*?)\\s+(over|under)\\s+(\\d+(?:\\.\\d+)?)\\s+${STAT_WORD}${UNIT}$`,'i').exec(raw);
 if(m&&cleanPlayer(m[1])){const stat=normStat(m[4],raw);if(stat)return {kind:'ou',player:cleanPlayer(m[1]),side:m[2].toLowerCase(),line:+m[3],stat};}
 m=new RegExp(`^(.*?)\\s+(\\d+(?:\\.\\d+)?)\\+\\s+${STAT_WORD}${UNIT}$`,'i').exec(raw);
 if(m&&cleanPlayer(m[1])){const stat=normStat(m[3],raw);if(stat)return {kind:'threshold',player:cleanPlayer(m[1]),line:+m[2],stat};}
 return null;
}
function blankPlayer(id,displayName,team){return {id:id||'',displayName:displayName||'',team:team||'',passYds:0,passTd:0,rushYds:0,rushTd:0,recYds:0,recTd:0,receptions:0,returnTd:0,defTd:0,completions:0};}
function pickKey(keys,row,patterns){
 for(let i=0;i<keys.length;i++){if(patterns.some(p=>p.test(keys[i]))){const n=num(row[i]);if(n!==null)return n;}}
 return null;
}
function applyGroup(player,group,row,keys){
 const name=groupName(group);
 const yards=pickKey(keys,row,[/yard/i,/^yds?$/i]),td=pickKey(keys,row,[/touchdown/i,/^td$/i]);
 if(name.includes('pass')){const c=pickKey(keys,row,[/completion/i,/^c\//i]);if(c!==null)player.completions=c;if(yards!==null)player.passYds=yards;if(td!==null)player.passTd=td;}
 else if(name.includes('rush')){if(yards!==null)player.rushYds=yards;if(td!==null)player.rushTd=td;}
 else if(name.includes('receiv')){const rec=pickKey(keys,row,[/^rec/i,/reception/i]);if(rec!==null)player.receptions=rec;if(yards!==null)player.recYds=yards;if(td!==null)player.recTd=td;}
 else if(/kickreturn|puntreturn|return/.test(name)){if(td)player.returnTd+=td;}
 else if(name.includes('defens')){if(td)player.defTd+=td;}
}
export function parseBoxscore(payload,at=Date.now(),final=false){
 const players=new Map();
 const upsert=(id,name,team)=>{const k=String(id||name);if(!players.has(k))players.set(k,blankPlayer(id,name,team));const p=players.get(k);if(name)p.displayName=name;if(team)p.team=team;return p;};
 for(const team of payload?.boxscore?.players||[]){
  const abbr=team.team?.abbreviation||'';
  for(const group of team.statistics||[]){
   const keys=group.keys?.length?group.keys:(group.names||group.labels||[]);
   for(const row of group.athletes||[]){
    const a=row.athlete||{};const p=upsert(a.id,a.displayName||a.shortName||'',abbr);
    applyGroup(p,group,row.stats||[],keys);
   }
  }
 }
 const scoringPlays=(payload?.scoringPlays||[]).map(play=>{
  const type=String(play.type?.text||play.text||'');
  const involved=play.athletesInvolved||[];
  const passing=/passing/i.test(type);
  const scorer=passing&&involved[1]?involved[1]:involved[0];
  const td=/touchdown|\btd\b/i.test(type)||/touchdown/i.test(play.scoringType?.name||'');
  return {td,passing,type,scorer:scorer?.displayName||scorer?.shortName||'',scorerId:scorer?.id||''};
 }).filter(p=>p.td);
 return {observedAt:at,final:!!final,players:[...players.values()],scoringPlays};
}
export function findPlayer(query,players){
 const q=nameTokens(query);if(!q.length||!players?.length)return null;
 const matched=players.filter(p=>{
  const n=nameTokens(p.displayName);if(!n.length)return false;
  if(q.length===1)return n.at(-1)===q[0];
  return q.every(t=>n.includes(t));
 });
 const uniq=[...new Map(matched.map(p=>[p.id||p.displayName,p])).values()];
 return uniq.length===1?uniq[0]:null;
}
function actual(player,stat){
 if(stat==='passYds')return player.passYds;
 if(stat==='passTd')return player.passTd;
 if(stat==='rushYds')return player.rushYds;
 if(stat==='rushTd')return player.rushTd;
 if(stat==='recYds')return player.recYds;
 if(stat==='recTd')return player.recTd;
 if(stat==='receptions')return player.receptions;
 return null;
}
function statLabel(stat,n){
 if(stat==='passYds')return `${n} pass yards`;
 if(stat==='rushYds')return `${n} rush yards`;
 if(stat==='recYds')return `${n} rec yards`;
 if(stat==='passTd')return `${n} pass TD${n===1?'':'s'}`;
 if(stat==='rushTd')return `${n} rush TD${n===1?'':'s'}`;
 if(stat==='recTd')return `${n} rec TD${n===1?'':'s'}`;
 if(stat==='receptions')return `${n} reception${n===1?'':'s'}`;
 return String(n);
}
function shortName(player){return player.displayName||'Player';}
function finished(g){return !!(g&&g.completed&&g.status==='STATUS_FINAL');}
export function gradeProp(parsed,box,game={}){
 if(!parsed)return {result:'pending',progress:'Result requires review',irreversible:false};
 const final=finished(game);
 if(parsed.kind==='first_td'){
  const plays=box?.scoringPlays||[];
  if(!plays.length)return {result:final?'miss':'pending',progress:final?'No touchdowns scored':'Waiting for first TD',irreversible:final};
  const first=plays[0],hit=findPlayer(parsed.player,[{id:first.scorerId,displayName:first.scorer}]);
  if(!first.scorer)return {result:'pending',progress:'First TD scorer unavailable',irreversible:false};
  if(hit)return {result:'hit',progress:`First TD: ${first.scorer}`,irreversible:true};
  const known=findPlayer(parsed.player,box.players||[]);
  if(!known&&!final)return {result:'pending',progress:`First TD: ${first.scorer}`,irreversible:false};
  return {result:'miss',progress:`First TD: ${first.scorer}`,irreversible:true};
 }
 const player=findPlayer(parsed.player,box?.players||[]);
 if(!player)return {result:'pending',progress:`${parsed.player} not in box score`,irreversible:false};
 if(parsed.kind==='attd'){
  const tds=(player.rushTd||0)+(player.recTd||0)+(player.returnTd||0)+(player.defTd||0);
  return {result:tds>0?'hit':final?'miss':'pending',progress:`${shortName(player)} ${tds} TD${tds===1?'':'s'}`,irreversible:tds>0||final,actual:tds};
 }
 const n=actual(player,parsed.stat);
 if(n===null)return {result:'pending',progress:`${shortName(player)} · no matching stat`,irreversible:false};
 const label=`${shortName(player)} ${statLabel(parsed.stat,n)}`;
 if(parsed.kind==='threshold'){
  const hit=n>=parsed.line;
  return {result:hit?'hit':final?'miss':'pending',progress:label,irreversible:hit||final,actual:n};
 }
 const margin=n-parsed.line;
 if(margin===0)return {result:final?'push':'pending',progress:`${label} · at the line`,irreversible:final,actual:n};
 if(parsed.side==='over'){
  if(margin>0)return {result:'hit',progress:label,irreversible:true,actual:n};
  return {result:final?'miss':'pending',progress:`${label} · needs ${Math.floor(parsed.line-n)+1} more`,irreversible:final,actual:n};
 }
 if(margin>0)return {result:'miss',progress:label,irreversible:true,actual:n};
 return {result:final?'hit':'pending',progress:label,irreversible:final,actual:n};
}
export function propText(p){return p.description||p.quote?.label||p.original?.label||'';}
export function gradePick(p,g){
 const parsed=parseProp(propText(p));
 if(!parsed)return {result:'pending',progress:'Result requires review',irreversible:false};
 if(!g?.boxscore)return {result:finished(g)?'pending':g?.state==='in'?'live':'pending',progress:finished(g)?'Waiting for box score':'Waiting for player stats',irreversible:false};
 const graded=gradeProp(parsed,g.boxscore,g);
 if(graded.result==='hit'||graded.result==='miss'||graded.result==='push'){
  if(!finished(g)&&!graded.irreversible)return {...graded,result:g.state==='in'?'live':'pending'};
  return graded;
 }
 return {...graded,result:finished(g)?'pending':g?.state==='in'?'live':'pending'};
}
export function gamesNeedingBoxscore(w,now=Date.now()){
 const props=Object.values(w.picks||{}).filter(p=>p.market==='prop');
 return (w.games||[]).filter(g=>{
  const mine=props.filter(p=>p.gameId===g.id);if(!mine.length)return false;
  if(g.state==='in')return true;
  if(!finished(g))return false;
  if(!g.boxscore||!g.boxscore.final)return true;
  const waiting=mine.some(p=>{if(p.manualResult&&p.manualResult!=='pending')return false;return gradePick(p,g).result==='pending'&&!!parseProp(propText(p));});
  return waiting&&now-(g.boxscore.observedAt||0)<10800000;
 });
}
export const boxscoreURL=id=>`https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${id}`;
