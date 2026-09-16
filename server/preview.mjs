// Synthetic scenarios only. Never used by a production service.
import {ROSTER} from './domain.mjs';
import {ensure} from './engine.mjs';
const pairs=[['DET','BUF'],['CAR','ATL'],['LV','LAC'],['CIN','HOU'],['DAL','PHI'],['GB','CHI'],['SEA','SF'],['MIN','ARI'],['NE','NYJ'],['KC','DEN'],['TEN','JAX'],['MIA','BAL'],['CLE','PIT'],['NYG','WAS'],['NO','TB'],['IND','LAR']];
export function seedPreview(store,stage='before',now=Date.now()){
 store.transact(s=>{s.seasons={};const w=ensure(s,2026,2);w.imported=true;w.updatedAt=now;w.payer={status:'ready',members:['Buley'],score:78.42,previousWeek:1};
  w.games=pairs.map(([away,home],i)=>({id:'demo'+i,away,home,kick:now+(i<10?3600000:14400000),state:'pre',completed:false,status:'STATUS_SCHEDULED',detail:'Scheduled',seenAt:now,awayScore:null,homeScore:null,markets:[{market:'spread',side:away,line:3.5,odds:-110,label:`${away} +3.5 vs ${home}`},{market:'spread',side:home,line:-3.5,odds:-110,label:`${home} -3.5 vs ${away}`},{market:'total',side:'over',line:47.5,odds:-110,label:`${away}/${home} Over 47.5`},{market:'total',side:'under',line:47.5,odds:-110,label:`${away}/${home} Under 47.5`},{market:'ml',side:away,line:null,odds:140,label:`${away} ML vs ${home}`},{market:'ml',side:home,line:null,odds:-160,label:`${home} ML vs ${away}`}].map(q=>({...q,observedAt:now,provider:'DraftKings via ESPN'}))}));
  const members=stage==='before'?['Hurd','Slemp','Zach','Woods']:ROSTER;
  members.forEach((member,i)=>{const g=w.games[i],q=g.markets[1];w.picks[member]={member,gameId:g.id,market:'spread',side:g.home,original:{...q},quote:{...q},revision:1,createdAt:now,addedBy:member};
   if(stage!=='before'&&(stage!=='live'||i<10)){g.kick=now-3600000;g.state=stage==='live'&&i>=7?'in':'post';g.completed=g.state==='post';g.status=g.completed?'STATUS_FINAL':'STATUS_IN_PROGRESS';g.homeScore=24;g.awayScore=stage==='lost'&&i===0?21:20;g.detail=g.completed?'Final':'Q4 · 6:42';w.picks[member].lockedAt=g.kick;w.picks[member].quote.observedAt=g.kick-15000;}
  });
 });
}
