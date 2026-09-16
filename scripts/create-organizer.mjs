// Generates a private capability link without printing its token or committing it.
import {randomBytes,createHash} from 'node:crypto';
import {writeFileSync,mkdirSync,realpathSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
const at=process.argv.indexOf('--out');if(at<0||!process.argv[at+1])throw Error('Use --out /private/path/parlay-organizer-launch.md');
const target=resolve(process.argv[at+1]),key=randomBytes(32).toString('base64url'),digest=createHash('sha256').update(key).digest('hex');
mkdirSync(dirname(target),{recursive:true});
const root=realpathSync(new URL('..',import.meta.url)),parent=realpathSync(dirname(target));
if(parent===root||parent.startsWith(root+'/'))throw Error('Private organizer packets must be outside the public repository.');
const link='https://mcdermottj639.github.io/League-History/#parlay-organizer='+key;
writeFileSync(target,`# Parlay organizer — private launch packet

Status: PREPARED, NOT ACTIVATED. Do not send until launch is verified.

## Link for Zach

[Open the league parlay with organizer access](${link})

This is the existing app. Opening the private link creates a remembered organizer
session. No username/password or separate app. Keep it private. A new device or
cleared browser data needs this link again. Send Zach only this link after launch.

## Private configuration

PARLAY_ORGANIZER_HASH=${digest}
PARLAY_YEAR=2026
SUPABASE_PROJECT=oqrfdhoyyogjmiqmjhnp
PARLAY_API=https://oqrfdhoyyogjmiqmjhnp.supabase.co/functions/v1/league-parlay

Production uses Supabase, not Railway or SQLite. Install only the hash in the
private league_parlay.config row after explicit approval. Never commit the link,
its capability, or this file. Replacing the hash revokes organizer sessions and
requires a new link. The ordinary app never receives a Supabase service key.

## Still required before activation

1. Approve API deployment with gateway JWT checks disabled and app-level session/
   capability checks enabled, plus installing THIS new organizer hash. The existing
   deployment does not automatically authorize or configure a newly generated key.
2. Verify the deployed API and this private organizer link. Separately authorize
   scheduled public-data collection before enabling its inactive job. The frontend
   gate stays disabled until launch.
3. Choose the actual current legacy week, including Week 1. Rehearse with an
   authorized offline export. Reading live private Firebase picks was previously
   blocked; this packet is not permission to bypass that decision.
4. On the future merge instruction, freeze legacy writes, export the final picks,
   preserve every row, reconcile migration and verify private backups. Partial and
   full pick lists are supported. Started games stay locked; never invent missing
   historical kickoff lines. Do not import early and discard later submissions.
5. Follow PARLAY_RELEASE.md: run scripts/supabase-parlay.mjs with the explicit
   actual week, activate only after reconciliation, verify mobile and API flows,
   enable frontend config, merge only when instructed, and verify Pages.

Nothing here places a bet or asks Zach to verify placement. His controls include
adding picks for others and recording the actual DraftKings combined ticket odds.
Those actual odds remain separate from the tracked kickoff lines.
`,{mode:0o600,flag:'wx'});
console.log('Private organizer launch packet created. Token was not printed.');
