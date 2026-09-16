// OFFLINE migration: accepts an explicitly authorized export file; never fetches private Firebase.
import {readFileSync} from 'node:fs';
import {Store} from '../server/store.mjs';
import {importLegacy} from '../server/engine.mjs';
const args=Object.fromEntries(process.argv.slice(2).reduce((a,v,i,all)=>v.startsWith('--')?[...a,[v.slice(2),all[i+1]]]:a,[]));
if(!args.db||!args.export||!args.year||!args.week)throw Error('Usage: node scripts/import-parlay.mjs --db /data/parlay.sqlite --export /private/authorized-week-export.json --year 2026 --week 2');
const year=Number(args.year),week=Number(args.week);if(!Number.isInteger(year)||!Number.isInteger(week)||week<1||week>18)throw Error('Invalid season/week');
const rows=JSON.parse(readFileSync(args.export,'utf8'));if(!rows||typeof rows!=='object'||Array.isArray(rows))throw Error('Expected the exported manager-keyed week object');
const store=new Store(args.db);const w=store.read().seasons[year]?.weeks[week];if(!w?.games?.length)throw Error('Collect the matching NFL schedule before importing.');
importLegacy(store,year,week,rows);const after=store.read().seasons[year].weeks[week];
console.log(JSON.stringify({imported:after.imported,picks:Object.keys(after.picks).length,retainedForReview:after.unmapped.length}));store.close();
