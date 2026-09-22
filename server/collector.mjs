import {ensure,ingest,lockDue,payerFromFantasy,collectBoxscores} from './engine.mjs';
import {nflBettingWeek} from './domain.mjs';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const sandbox={window:{},localStorage:{getItem:()=>null,setItem:()=>{}}};
vm.runInNewContext(readFileSync(new URL('../espn.js',import.meta.url),'utf8'),sandbox);
const E=sandbox.window.LeagueESPN;
export async function getJSON(url){const r=await fetch(url,{signal:AbortSignal.timeout(20000),headers:{'User-Agent':'League-History/Parlay'}});if(!r.ok)throw Error(`Source HTTP ${r.status}`);return r.json();}
export class Collector {
 constructor(store,options={}){this.store=store;this.clock=options.clock||Date.now;this.year=options.year||2026;this.startWeek=options.startWeek||2;this.fetchJSON=options.fetchJSON||getJSON;this.running=false;this.timer=null;this.lastFantasy=0;this.lastDiscovery=0;this.lastSource=0;}
 async cycle(now=this.clock()){
  if(this.running)return;this.running=true;
  try {
   this.store.transact(s=>{const season=s.seasons[this.year]??={current:this.startWeek,weeks:{}};ensure(s,this.year,season.current);Object.values(season.weeks).forEach(w=>lockDue(w,now));});
   if(now-this.lastDiscovery>900000||nflBettingWeek(now,this.year)>this.store.read().seasons[this.year].current){try{const p=await this.fetchJSON('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');const k=Number(p.week?.number);if(p.season?.year===this.year&&p.season?.type===2&&k>=this.startWeek&&k<=18)this.store.transact(s=>{s.seasons[this.year].current=Math.max(s.seasons[this.year].current,k);});this.lastDiscovery=now;}catch{}
    this.store.transact(s=>{s.seasons[this.year].current=Math.max(s.seasons[this.year].current,nflBettingWeek(now,this.year));ensure(s,this.year,s.seasons[this.year].current);});}
   const s=this.store.read().seasons[this.year],week=s.current;
   const recent=Object.values(s.weeks).filter(w=>w.week===week||w.week===week-1||Object.values(w.picks).some(p=>!p.lockedAt)||w.games.some(g=>!g.completed));
   const active=recent.some(w=>w.games.some(g=>g.state==='in'||(g.kick-now<1800000&&g.kick-now>-3600000)));
   const interval=active?15000:300000;
   if(now-this.lastSource>=interval){
    const ks=[...new Set([...recent.map(w=>w.week),week-1])].filter(k=>k>=1);
    for(const k of ks){try{
     const payload=await this.fetchJSON(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${this.year}&seasontype=2&week=${k}`);
     if(payload.season?.year&&payload.season.year!==this.year)throw Error('Wrong season');
     if(payload.week?.number&&payload.week.number!==k)throw Error('Wrong week');
     ingest(this.store,this.year,k,payload,this.clock());
    }catch(e){this.store.transact(s=>{ensure(s,this.year,k).feedError=String(e.message).slice(0,140);});}}
    this.lastSource=now;
   }
   await collectBoxscores(this.store,this.year,this.fetchJSON,now);
   if(now-this.lastFantasy>3600000){
    try{const payload=await this.fetchJSON(E.SEASON_URL);const season=this.store.read().seasons[this.year];
     for(const w of Object.values(season.weeks)){const prev=season.weeks[w.week-1];if(!prev?.games.length||!prev.games.every(g=>g.completed&&g.status==='STATUS_FINAL'))continue;
      const payer=payerFromFantasy(payload,this.year,w.week,E.mgrFor,now);if(payer.status!=='pending')this.store.transact(s=>{ensure(s,this.year,w.week).payer={...payer,observedAt:now};});
     }this.lastFantasy=now;
    }catch{}
   }
  }finally{this.running=false;}
 }
 start(){this.cycle().catch(()=>{});this.timer=setInterval(()=>this.cycle().catch(()=>{}),10000);}
 stop(){clearInterval(this.timer);}
}
