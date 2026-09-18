import http from 'node:http';
import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
import {readFileSync,existsSync,mkdirSync} from 'node:fs';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Store} from './store.mjs';
import {seedPreview} from './preview.mjs';
import {Collector} from './collector.mjs';
import {ROSTER} from './domain.mjs';
import {ensure,publicWeek,savePick,resetParlay,failure,lockDue,writable,savePlacedOdds} from './engine.mjs';
export const hash=s=>createHash('sha256').update(String(s)).digest('hex');
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export function createApp({store,organizerHash,year=2026,startWeek=2,origins=[],preview=false,clock=Date.now,apiURL='',collectorEnabled=false,durableStorage=false}){
 if(!/^[a-f0-9]{64}$/.test(organizerHash||''))throw Error('Set PARLAY_ORGANIZER_HASH to a SHA-256 hash; never put the private link in the repo.');
 const version=organizerHash.slice(0,16),limits=new Map();
 store.transact(s=>ensure(s,year,startWeek));
 const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 async function body(req){let s='';for await(const b of req){s+=b;if(Buffer.byteLength(s)>16384)throw failure('Request too large',413);}try{return JSON.parse(s||'{}');}catch{throw failure('Invalid JSON');}}
 function session(req){const token=(req.headers.authorization||'').replace(/^Bearer /,'');const s=store.session(hash(token));if(!s||s.expires<clock()||(s.role==='organizer'&&s.version!==version))throw failure('Open your private organizer link again, or select your member name.',401);return s;}
 return http.createServer(async(req,res)=>{
  res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');
  const origin=req.headers.origin;const own=`${req.headers['x-forwarded-proto']==='https'?'https':'http'}://${req.headers.host}`;
  if(origin&&origin!==own&&!origins.includes(origin))return json(res,403,{error:'Origin not allowed'});
  if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
  if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
  try{
   const u=new URL(req.url,'http://local'),path=u.pathname;
   if(path==='/health')return json(res,200,{ok:true,preview,year});
   if(path==='/api/parlay/readiness'){const s=store.read().seasons[year];return json(res,200,{preview,collectorEnabled,durableStorage,imported:!!s?.weeks[s?.release?.cutoverWeek??s?.current]?.imported,writable:writable(s),cutoverWeek:s?.release?.cutoverWeek??null,unresolved:(s?.weeks[s?.current]?.unmapped||[]).length});}
   if(path==='/parlay/config.json')return json(res,200,{enabled:true,api:apiURL,year,preview});
   if(path==='/api/parlay/session'&&req.method==='POST'){
    const ip=req.socket.remoteAddress,now=clock(),lim=limits.get(ip)||{n:0,at:now};if(now-lim.at>60000){lim.n=0;lim.at=now;}lim.n++;limits.set(ip,lim);if(lim.n>40)throw failure('Too many attempts. Try again in a minute.',429);
    const b=await body(req);let role='member',member=b.member;
    if(b.key){const digest=Buffer.from(hash(b.key),'hex');if(!timingSafeEqual(digest,Buffer.from(organizerHash,'hex')))throw failure('Organizer link is invalid or has been replaced.',403);role='organizer';member='Zach';}
    else if(!ROSTER.includes(member))throw failure('Choose your name in the app.');
    const token=randomBytes(32).toString('base64url'),expires=clock()+365*86400000;store.addSession(hash(token),role,member,expires,version);return json(res,200,{token,role,member,expires});
   }
   if(path==='/api/parlay/me') {const s=session(req);return json(res,200,{role:s.role,member:s.member,expires:s.expires});}
   if(path==='/api/parlay/state'&&req.method==='GET'){
    store.transact(s=>{const season=s.seasons[year];for(const w of Object.values(season.weeks))lockDue(w,clock());});
    const s=store.read().seasons[year];return json(res,200,{v:2,year,current:s.current,roster:ROSTER,preview,writable:preview||writable(s),weeks:Object.values(s.weeks).filter(w=>w.week>=startWeek).sort((a,b)=>b.week-a.week).map(w=>publicWeek(w,clock()))});
   }
   if(path==='/api/parlay/demo'&&preview&&req.method==='POST'){const b=await body(req);if(!['before','live','lost','won'].includes(b.stage))throw failure('Unknown scenario');seedPreview(store,b.stage,clock());return json(res,200,{ok:true});}
   if(path==='/api/parlay/pick'&&req.method==='POST'){
    const actor=session(req),b=await body(req);if(b.year!==year||!Number.isInteger(b.week)||b.week<startWeek||b.week>18)throw failure('Invalid season or week');
    const season=store.read().seasons[year],current=season?.current;if(!preview&&!writable(season))throw failure('Launch migration is not complete. Picking remains on the current app.',503);if(b.week!==current)throw failure('Only the current week is open for picks.',409);
    return json(res,200,savePick(store,year,b.week,actor,b,clock()));
   }
   if(path==='/api/parlay/placed-odds'&&req.method==='POST'){
    const actor=session(req);if(actor.role!=='organizer')throw failure('Organizer access required',403);
    if(!preview&&!writable(store.read().seasons[year]))throw failure('The parlay is read-only until cutover is complete.',503);
    const b=await body(req);if(b.year!==year||!Number.isInteger(b.week)||b.week<startWeek||b.week>store.read().seasons[year].current)throw failure('Invalid season or week');
    return json(res,200,savePlacedOdds(store,year,b.week,actor,b,clock()));
   }
   if(path==='/api/parlay/reset'&&req.method==='POST'){
    const actor=session(req);if(actor.role!=='organizer')throw failure('Organizer access required',403);
    if(!preview&&!writable(store.read().seasons[year]))throw failure('The parlay is read-only until cutover is complete.',503);
    const b=await body(req),current=store.read().seasons[year].current;
    if(b.year!==year||b.week!==current)throw failure('Only the current parlay can be reset.',409);
    return json(res,200,resetParlay(store,year,b.week,actor,clock()));
   }
   if(path==='/api/parlay/review'&&req.method==='POST'){
    if(!preview&&!writable(store.read().seasons[year]))throw failure('The parlay is read-only until cutover is complete.',503);const actor=session(req);if(actor.role!=='organizer')throw failure('Organizer access required',403);const b=await body(req);
    if(b.year!==year||!Number.isInteger(b.week)||!ROSTER.includes(b.member)||!['hit','miss','push','pending'].includes(b.result))throw failure('Invalid review');
    const note=String(b.note||'').trim();if(note.length<5||note.length>300)throw failure('Include a short reason for this result.');
    store.transact(s=>{const w=s.seasons[year]?.weeks[b.week],p=w?.picks[b.member];if(!p?.lockedAt)throw failure('Only locked selections can be settled manually.');const g=w.games.find(g=>g.id===p.gameId);if(g?.state==='in'||(g?.state==='pre'&&clock()<g.kick))throw failure('Wait until the game finishes.');if(p.market!=='prop'&&!p.missingQuote&&g?.status==='STATUS_FINAL')throw failure('Standard final results are calculated automatically.');p.manualResult=b.result;p.reviewNote=note;w.audit.push({at:clock(),action:'review',member:b.member,result:b.result,note,by:'organizer'});});return json(res,200,{ok:true});
   }
   if(path.startsWith('/api/'))return json(res,404,{error:'Not found'});
   if(req.method!=='GET')throw failure('Method not allowed',405);
   // Explicit public asset allowlist. Never expose the DB, environment, server source or launch keys.
   const relative=decodeURIComponent(path).replace(/^\//,'')||'index.html';
   if(!/^(?:[a-zA-Z0-9_-]+\.(?:html|js|css|png|webmanifest)|logos\/[a-zA-Z0-9_-]+\.png|(?:parlay|season|rankings)\/[a-zA-Z0-9_-]+\.json)$/.test(relative))throw failure('Not found',404);
   const file=resolve(ROOT,relative);if(!existsSync(file))throw failure('Not found',404);
   const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webmanifest':'application/manifest+json'};
   res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(readFileSync(file));
  }catch(e){json(res,e.status||500,{error:e.status?e.message:'The parlay service could not complete that request.'});}
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const preview=process.env.PARLAY_PREVIEW==='1',dbPath=process.env.PARLAY_DB;
 if(!dbPath)throw Error('PARLAY_DB must point to durable storage (or an explicit preview file).');
 if(!preview&&process.env.PARLAY_DURABLE_STORAGE!=='1')throw Error('Confirm mounted persistent storage with PARLAY_DURABLE_STORAGE=1 before launch.');
 mkdirSync(dirname(resolve(dbPath)),{recursive:true});const store=new Store(dbPath),year=Number(process.env.PARLAY_YEAR||2026),startWeek=Number(process.env.PARLAY_START_WEEK||2);
 const app=createApp({store,organizerHash:process.env.PARLAY_ORGANIZER_HASH,year,startWeek,origins:(process.env.PARLAY_ORIGINS||'https://mcdermottj639.github.io').split(','),preview,apiURL:process.env.PARLAY_API_URL||'',collectorEnabled:process.env.PARLAY_COLLECT==='1',durableStorage:process.env.PARLAY_DURABLE_STORAGE==='1'});
 if(preview)seedPreview(store);
 const collector=new Collector(store,{year,startWeek});
 if(process.env.PARLAY_COLLECT==='1')collector.start();
 app.listen(Number(process.env.PORT||8787),'0.0.0.0',()=>console.log(`Parlay service ready; preview=${preview}; collector=${process.env.PARLAY_COLLECT==='1'}`));
 process.on('SIGTERM',()=>{collector.stop();app.close(()=>{store.close();process.exit(0);});});
}
