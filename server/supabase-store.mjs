// Postgres compare-and-swap keeps the existing synchronous domain operations atomic
// across independent Edge workers. No read/modify/write without a revision check.
import {failure} from './engine.mjs';
export class MemoryStore {
 constructor(state={v:2,seasons:{}}){this.state=structuredClone(state);}
 read(){return structuredClone(this.state);}
 transact(fn){const next=this.read(),out=fn(next);this.state=next;return out;}
}
export function rpcClient(url,key,fetcher=fetch){
 return async(op,args={})=>{
  const r=await fetcher(url+'/rest/v1/rpc/league_parlay_rpc',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({op,args}),signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw failure('The parlay service is temporarily unavailable.',503);
  return r.json();
 };
}
export async function transaction(rpc,fn){
 for(let i=0;i<6;i++){
  const snapshot=await rpc('read'),store=new MemoryStore(snapshot.state);
  const value=fn(store);
  if(JSON.stringify(store.state)===JSON.stringify(snapshot.state))return value;
  if(await rpc('commit',{revision:snapshot.revision,state:store.state}))return value;
 }
 throw failure('The board changed while saving. Refresh and try again.',409);
}
export const digest=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(s))))).map(x=>x.toString(16).padStart(2,'0')).join('');
export function randomToken(){return Array.from(crypto.getRandomValues(new Uint8Array(32))).map(x=>x.toString(16).padStart(2,'0')).join('');}
export function constantEqual(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let mismatch=0;for(let i=0;i<a.length;i++)mismatch|=a.charCodeAt(i)^b.charCodeAt(i);return mismatch===0;}
