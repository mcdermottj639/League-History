// Runs the deployed handler against an isolated in-memory database. No network.
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {runInNewContext} from 'node:vm';

const source=stripTypeScriptTypes(readFileSync(new URL('../supabase/functions/league-oracle/index.ts',import.meta.url),'utf8').replace(/^import[^\n]+\n/,''));
export function oracleEdge(initial=[],now='2026-09-08T09:00:00Z'){
 const rows=new Map(initial.map(row=>[row.week,structuredClone(row)])),writes=[];
 let handler,storageError=false;
 const db={from(table){
  const q={select:()=>q,eq:()=>q,gt:()=>q,
   maybeSingle:async()=>({data:table==='oracle_editor_sessions'?{id:'test-session'}:{id:'test-capability'}}),
   insert:async()=>({error:null}),
   order:async()=>({data:[...rows.values()],error:storageError?{}:null}),
   upsert:async row=>{if(storageError)return {error:{}};writes.push(structuredClone(row));rows.set(row.week,{...rows.get(row.week),...structuredClone(row)});return {error:null};}
  };return q;
 }};
 const Clock=class extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return new Date(now).getTime();}};
 runInNewContext(source,{createClient:()=>db,Deno:{env:{get:()=>''},serve:fn=>{handler=fn;}},TextEncoder,Uint8Array,crypto:globalThis.crypto,Response,URL,Date:Clock,Intl});
 return {rows,writes,setStorageError(value){storageError=value;},fetch:async(path,{body,auth=true,method,origin='https://mcdermottj639.github.io'}={})=>handler(new Request('https://oracle.test/functions/v1/league-oracle'+path,{method:method||(body?'POST':'GET'),headers:{'Content-Type':'application/json',...(origin?{Origin:origin}:{}),...(auth?{Authorization:'Bearer '+'a'.repeat(64)}:{})},...(body?{body:JSON.stringify(body)}:{})}))};
}
export function predictions(){return Array.from({length:6},(_,i)=>({id:`2:${i*2+1}-${i*2+2}`,matchup:{away:{id:String(i*2+1),name:`Away ${i}`},home:{id:String(i*2+2),name:`Home ${i}`}},winner:`Away ${i}`,awayScore:134.75,homeScore:125.9,awayRecord:'2-0',homeRecord:'0-2',writeup:'A complete prediction.\nWith a second paragraph.',confidence:100,upset:false}));}
