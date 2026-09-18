import {spawnSync} from 'node:child_process';
import {readdirSync} from 'node:fs';
const files=readdirSync('server').filter(f=>f.endsWith('.test.mjs')).map(f=>'server/'+f);
for(const args of [['--test',...files],['checks.js'],['storylines.test.cjs'],['rankings-view.test.cjs'],['ticker.test.cjs'],['publishing.test.cjs']]){
 const run=spawnSync(process.execPath,args,{stdio:'inherit'});if(run.error)throw run.error;if(run.status!==0)process.exit(run.status||1);
}
