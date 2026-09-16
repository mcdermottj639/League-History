// Run only as part of an explicitly authorized cutover, after reconciling the frozen legacy export.
// This enables service writes; it does not merge GitHub or change the frontend gate.
import {existsSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {Store} from '../server/store.mjs';
import {activateRelease} from '../server/engine.mjs';
const argv=process.argv.slice(2),value=k=>argv[argv.indexOf(k)+1],required=['--db','--year','--week','--backup'];
if(required.some(k=>!argv.includes(k)||!value(k))||!argv.includes('--legacy-writes-frozen')||!argv.includes('--migration-reconciled'))throw Error('Use --db PATH --year YEAR --week WEEK --backup NEW_PATH --legacy-writes-frozen --migration-reconciled only after explicit launch approval.');
const year=Number(value('--year')),week=Number(value('--week')),source=resolve(value('--db')),target=resolve(value('--backup'));
if(!Number.isInteger(year)||!Number.isInteger(week)||week<1||week>18)throw Error('Invalid season/week');
if(!existsSync(source)||existsSync(target)||source===target)throw Error('Source DB must exist and backup path must be new.');
mkdirSync(dirname(target),{recursive:true});const store=new Store(source);
try{
 store.db.prepare('VACUUM INTO ?').run(target);
 const backup=new Store(target);try{const check=backup.db.prepare('PRAGMA integrity_check').get();if(Object.values(check)[0]!=='ok')throw Error('Backup integrity check failed.');if(!backup.read().seasons[year]?.weeks[week]?.imported)throw Error('Backup is missing the reconciled week.');}finally{backup.close();}
 activateRelease(store,year,week,{legacyWritesFrozen:true,migrationReconciled:true,backupVerified:true});
 console.log('Service cutover enabled after verified backup. Frontend config and GitHub remain unchanged.');
}finally{store.close();}
