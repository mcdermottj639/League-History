import {ROSTER} from './domain.mjs';
import {ensure,publicWeek,savePick,failure,lockDue,writable,savePlacedOdds} from './engine.mjs';
import {transaction,digest,randomToken,constantEqual} from './supabase-store.mjs';
import {collect} from './supabase-collector.mjs';

export function edgeApp(rpc,{clock=Date.now,fetchJSON,managerFor}={}){
 return async req=>{
  const headers={'Content-Type':'application/json','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Allow-Methods':'GET, POST, OPTIONS'};
  const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
  try{
   const origin=req.headers.get('origin');
   if(origin&&origin!=='https://mcdermottj639.github.io')throw failure('Origin not allowed',403);
   if(origin){headers['Access-Control-Allow-Origin']=origin;headers.Vary='Origin';}
   if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
   const path=new URL(req.url).pathname.replace(/^.*\/league-parlay(?=\/|$)/,'');
   if(path==='/health'&&req.method==='GET')return json({ok:true,preview:false,storage:'supabase'});
   const config=await rpc('config'),year=config.year,startWeek=1;
   if(!Number.isInteger(year)||!Number.isInteger(config.launch_week))throw failure('Parlay preparation is incomplete.',503);
   async function body(){
    if(Number(req.headers.get('content-length')||0)>16384)throw failure('Request too large',413);
    const reader=req.body?.getReader();let size=0;const chunks=[];
    if(reader){while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>16384){await reader.cancel();throw failure('Request too large',413);}chunks.push(value);}}
    const bytes=new Uint8Array(size);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}
    try{return JSON.parse(new TextDecoder().decode(bytes)||'{}');}catch{throw failure('Invalid JSON');}
   }
   async function session(){
    const token=(req.headers.get('authorization')||'').replace(/^Bearer /,'');
    if(!token||token.length>200)throw failure('Select your name or reopen your private organizer link.',401);
    const s=await rpc('session',{hash:await digest(token)});
    if(!s||s.expires<clock()||(s.role==='organizer'&&s.version!==config.organizer_hash?.slice(0,16)))throw failure('Open your private organizer link again, or select your member name.',401);
    return s;
   }
   if(path==='/collect'&&req.method==='POST'){
    const token=(req.headers.get('authorization')||'').replace(/^Bearer /,'');
    if(!config.collector_secret||!constantEqual(token,config.collector_secret))throw failure('Not authorized',401);
    if(!config.collection_enabled)return json({ok:true,disabled:true});
    const result=await collect(rpc,config,{clock,fetchJSON,managerFor});
    return json(result,result.ok?200:502);
   }
   if(path==='/api/parlay/session'&&req.method==='POST'){
    // Persisted limit spans workers; no raw IP addresses are saved.
    const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
    if(!await rpc('limit',{hash:await digest(ip)}))throw failure('Too many attempts. Try again in a minute.',429);
    const b=await body();let role='member',member=b.member;
    if(b.key){if(!/^[a-f0-9]{64}$/.test(config.organizer_hash||'')||!constantEqual(await digest(b.key),config.organizer_hash))throw failure('Organizer link is invalid or has been replaced.',403);role='organizer';member='Zach';}
    else if(!ROSTER.includes(member))throw failure('Choose your name in the app.');
    const token=randomToken(),expires=clock()+365*86400000;
    await rpc('add_session',{hash:await digest(token),role,member,expires,version:config.organizer_hash?.slice(0,16)||''});
    return json({token,role,member,expires});
   }
   if(path==='/api/parlay/me'&&req.method==='GET'){const s=await session();return json({role:s.role,member:s.member,expires:s.expires});}
   if((path==='/api/parlay/state'||path==='/api/parlay/readiness')&&req.method==='GET'){
    return json(await transaction(rpc,store=>{
     store.transact(state=>{ensure(state,year,config.launch_week);for(const w of Object.values(state.seasons[year].weeks))lockDue(w,clock());});
     const s=store.read().seasons[year],w=s.weeks[s.current];
     if(path.endsWith('/readiness'))return {preview:false,year,current:s.current,collectorEnabled:config.collection_enabled,organizerConfigured:/^[a-f0-9]{64}$/.test(config.organizer_hash||''),durableStorage:true,imported:!!s.weeks[s.release?.cutoverWeek??s.current]?.imported,writable:writable(s),cutoverWeek:s.release?.cutoverWeek??null,unresolved:w.unmapped.length,lastCollection:s.collector?.lastSuccess||null};
     return {v:2,year,current:s.current,roster:ROSTER,preview:false,writable:writable(s),weeks:Object.values(s.weeks).filter(w=>w.week>=startWeek).sort((a,b)=>b.week-a.week).map(w=>publicWeek(w,clock()))};
    }));
   }
   if(['/api/parlay/pick','/api/parlay/placed-odds','/api/parlay/review'].includes(path)&&req.method==='POST'){
    const actor=await session(),b=await body();
    if(path!=='/api/parlay/pick'&&actor.role!=='organizer')throw failure('Organizer access required',403);
    if(b.year!==year||!Number.isInteger(b.week)||b.week<1||b.week>18)throw failure('Invalid season or week');
    return json(await transaction(rpc,store=>{
     const s=store.read().seasons[year];
     if(!writable(s))throw failure('Launch migration is not complete. Picking remains on the current app.',503);
     if(path==='/api/parlay/pick'){
      if(b.week!==s.current)throw failure('Only the current week is open for picks.',409);
      return savePick(store,year,b.week,actor,b,clock());
     }
     if(b.week>s.current)throw failure('Invalid season or week');
     if(path==='/api/parlay/placed-odds')return savePlacedOdds(store,year,b.week,actor,b,clock());
     if(!ROSTER.includes(b.member)||!['hit','miss','push','pending'].includes(b.result))throw failure('Invalid review');
     const note=String(b.note||'').trim();if(note.length<5||note.length>300)throw failure('Include a short reason for this result.');
     store.transact(state=>{const w=state.seasons[year].weeks[b.week],p=w?.picks[b.member];if(!p?.lockedAt)throw failure('Only locked selections can be settled manually.');const g=w.games.find(g=>g.id===p.gameId);if(g?.state==='in'||(g?.state==='pre'&&clock()<g.kick))throw failure('Wait until the game finishes.');if(p.market!=='prop'&&!p.missingQuote&&g?.status==='STATUS_FINAL')throw failure('Standard final results are calculated automatically.');p.manualResult=b.result;p.reviewNote=note;w.audit.push({at:clock(),action:'review',member:b.member,result:b.result,note,by:'organizer'});});return {ok:true};
    }));
   }
   throw failure('Not found',404);
  }catch(e){return json({error:e.status?e.message:'The parlay service could not complete that request.'},e.status||500);}
 };
}
