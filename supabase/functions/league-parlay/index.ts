import {rpcClient} from '../../../server/supabase-store.mjs';
import {edgeApp} from '../../../server/supabase-runtime.mjs';
// Reuse the browser's canonical mapping. espn.js guards localStorage access;
// learned aliases stay in this worker and never read another app's storage.
(globalThis as any).window={};
await import('../../../espn.js');
const rpc=rpcClient(Deno.env.get('SUPABASE_URL'),Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
Deno.serve(edgeApp(rpc,{managerFor:(name,teams)=>{(globalThis as any).window.LeagueESPN.learnTeams({teams});return (globalThis as any).window.LeagueESPN.mgrFor(name,teams);}}));
