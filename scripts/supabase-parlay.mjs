// Operator-only release tooling. No keys in arguments, output, frontend or repo.
// Reads only an explicitly supplied offline export, never Firebase itself.
import {readFileSync,writeFileSync,realpathSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {rpcClient,transaction,MemoryStore,digest} from '../server/supabase-store.mjs';
import {ensure,ingest,importLegacy,activateRelease,writable} from '../server/engine.mjs';
import {getJSON} from '../server/supabase-collector.mjs';
const argv=process.argv.slice(2),command=argv.shift(),args={};
for(let i=0;i<argv.length;i++){if(!argv[i].startsWith('--'))throw Error('Unexpected argument');const key=argv[i].slice(2);args[key]=argv[i+1]&&!argv[i+1].startsWith('--')?argv[++i]:true;}
if(!['status','prepare','rehearse','import','activate','backup'].includes(command))throw Error('Usage: node scripts/supabase-parlay.mjs status|prepare|rehearse|import|activate|backup --year 2026 --week <1..18> [--export /private/authorized-picks.json] [--backup /private/new-backup.json]');
const url=process.env.PARLAY_SUPABASE_URL||'https://oqrfdhoyyogjmiqmjhnp.supabase.co',key=process.env.PARLAY_SUPABASE_SERVICE_KEY;
if(!key)throw Error('Set PARLAY_SUPABASE_SERVICE_KEY privately in the operator environment. Never use a browser key or print this value.');
const rpc=rpcClient(url,key),year=Number(args.year||2026),week=Number(args.week);
if(command!=='status'&&(!Number.isInteger(week)||week<1||week>18))throw Error('Choose the actual legacy week explicitly (1..18).');
const config=await rpc('config');if(config.year!==year)throw Error('The configured season does not match.');
async function backup(){
 if(typeof args.backup!=='string')throw Error('Provide --backup with a NEW private path outside this repository.');
 const root=realpathSync(new URL('..',import.meta.url)),target=resolve(args.backup),parent=realpathSync(dirname(target));
 if(parent===root||parent.startsWith(root+'/'))throw Error('Backups must be outside the public repository.');
 const name='operator-'+Date.now()+'-'+crypto.randomUUID();
 const saved=await rpc('backup',{name}),verified=await rpc('get_backup',{name});
 if(await digest(JSON.stringify(saved))!==await digest(JSON.stringify(verified)))throw Error('Remote backup verification failed.');
 writeFileSync(target,JSON.stringify(saved,null,2)+'\n',{mode:0o600,flag:'wx'});
 if(await digest(readFileSync(target,'utf8'))!==await digest(JSON.stringify(saved,null,2)+'\n'))throw Error('Local backup verification failed.');
 return name;
}
if(command==='status'){
 const s=(await rpc('read')).state.seasons[year];
 console.log(JSON.stringify({year,current:s?.current??null,writable:writable(s),collectionEnabled:config.collection_enabled,weeks:Object.values(s?.weeks||{}).map(w=>({week:w.week,picks:Object.keys(w.picks).length,unresolved:w.unmapped.length,imported:w.imported,updatedAt:w.updatedAt}))},null,2));
}else if(command==='backup'){
 console.log('Verified private backup saved: '+await backup());
}else if(command==='prepare'){
 const payload=await getJSON(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${year}&seasontype=2&week=${week}`);
 if(payload.season?.year!==year||Number(payload.week?.number)!==week)throw Error('Wrong scoreboard year or week.');
 await transaction(rpc,store=>{const s=store.read().seasons[year];if(writable(s)||Object.values(s?.weeks||{}).some(w=>w.imported||Object.keys(w.picks).length))throw Error('Cannot change launch week after migration or activation.');store.transact(state=>{ensure(state,year,week);state.seasons[year].current=week;});ingest(store,year,week,payload);});
 console.log('Prepared current week '+week+'. No picks imported or writes activated.');
}else if(command==='rehearse'||command==='import'){
 if(typeof args.export!=='string')throw Error('Provide --export /private/authorized-week-export.json.');
 const rows=JSON.parse(readFileSync(resolve(args.export),'utf8'));
 if(!rows||Array.isArray(rows)||typeof rows!=='object')throw Error('Export must be a member-keyed object (use {} for no picks).');
 const apply=store=>{const season=store.read().seasons[year];if(writable(season)||season?.current!==week)throw Error('Prepare the matching current week before migration.');if(season.weeks[week].imported)throw Error('Already imported. Do not replace with an older export.');importLegacy(store,year,week,rows);const w=store.read().seasons[year].weeks[week];return {week,sourceRows:Object.keys(rows).length,mapped:Object.keys(w.picks).length,unresolved:w.unmapped.length,locked:Object.values(w.picks).filter(p=>p.lockedAt).length};};
 if(command==='rehearse'){const store=new MemoryStore((await rpc('read')).state);console.log(JSON.stringify(apply(store),null,2));}
 else{
  if(!args['legacy-writes-frozen'])throw Error('Freeze and verify legacy writes first, then pass --legacy-writes-frozen.');
  await backup();console.log(JSON.stringify(await transaction(rpc,apply),null,2));
 }
}else if(command==='activate'){
 if(!args['legacy-writes-frozen']||!args['migration-reconciled'])throw Error('Explicit --legacy-writes-frozen and --migration-reconciled are required.');
 if(!config.collection_enabled)throw Error('Enable and verify the background collector before activation.');
 const name=await backup();
 await transaction(rpc,store=>{const season=store.read().seasons[year];if(writable(season))throw Error('Already activated.');if(!season?.collector?.lastSuccess||Date.now()-season.collector.lastSuccess>300000)throw Error('Verify a recent successful background collection before activation.');if(!/^[a-f0-9]{64}$/.test(config.organizer_hash||''))throw Error('Organizer access is not configured.');return activateRelease(store,year,week,{legacyWritesFrozen:true,migrationReconciled:true,backupVerified:true});});
 console.log('Backend activated with verified backup '+name+'. Frontend config and merge are separate release steps.');
}
