// Read-only release check; does not activate config or deploy anything.
import {readFileSync} from 'node:fs';
const config=JSON.parse(readFileSync(new URL('../parlay/config.json',import.meta.url),'utf8'));
config.api=process.argv[2]||config.api;
if(!config.api||!/^https:\/\//.test(config.api))throw Error('Launch blocked: configure the verified HTTPS service origin.');
const get=async p=>{const r=await fetch(config.api+p,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Service check failed: '+r.status);return r.json();};
const health=await get('/health'),state=await get('/api/parlay/state');
if(health.preview||state.preview)throw Error('Launch blocked: preview service cannot be production.');
const current=state.weeks.find(w=>w.week===state.current);
if(!current||Date.now()-current.updatedAt>300000||current.feedError)throw Error('Launch blocked: no fresh live board.');
const ready=await get('/api/parlay/readiness');if(!ready.imported||!ready.writable||ready.unresolved||!ready.collectorEnabled||!ready.durableStorage)throw Error('Launch blocked: migration, background collector or durable storage not ready.');
if(health.storage==='supabase'&&(!ready.organizerConfigured||!ready.lastCollection||Date.now()-ready.lastCollection>300000))throw Error('Launch blocked: organizer configuration or verified background collection missing.');
console.log('Service readiness checks passed. Organizer access, persistence, authorized migration reconciliation and cutover rules still require release verification. No merge performed.');
