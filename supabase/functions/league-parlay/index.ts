import {rpcClient} from '../../../server/supabase-store.mjs';
import {edgeApp} from '../../../server/supabase-runtime.mjs';
// Reuse the browser's canonical mapping. espn.js guards localStorage access;
// learned aliases stay in this worker and never read another app's storage.
(globalThis as any).window={};
await import('../../../espn.js');
// 🏈 The ticker's own definition of a valid board, reused rather than rewritten
// (v113). The collector FAILS CLOSED without this, so forgetting it stores
// nothing instead of storing an error page as a 0-0 scoreboard.
await import('../../../ticker.js');
const rpc=rpcClient(Deno.env.get('SUPABASE_URL'),Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
Deno.serve(edgeApp(rpc,{
 managerFor:(name,teams)=>{(globalThis as any).window.LeagueESPN.learnTeams({teams});return (globalThis as any).window.LeagueESPN.mgrFor(name,teams);},
 validBoard:(board:unknown)=>(globalThis as any).window.LeagueTicker._t.valid(board),
}));
