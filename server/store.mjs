import {DatabaseSync} from 'node:sqlite';
export class Store {
 constructor(path){this.db=new DatabaseSync(path);this.db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY CHECK(id=1), json TEXT NOT NULL); CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY, role TEXT NOT NULL, member TEXT, expires INTEGER NOT NULL, version TEXT);');}
 read(){const r=this.db.prepare('SELECT json FROM state WHERE id=1').get();return r?JSON.parse(r.json):{v:2,seasons:{}};}
 transact(fn){this.db.exec('BEGIN IMMEDIATE');try{const state=this.read(),out=fn(state);this.db.prepare('INSERT INTO state VALUES(1,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json').run(JSON.stringify(state));this.db.exec('COMMIT');return out;}catch(e){this.db.exec('ROLLBACK');throw e;}}
 session(hash){return this.db.prepare('SELECT * FROM sessions WHERE hash=?').get(hash);}
 addSession(hash,role,member,expires,version){this.db.prepare('INSERT INTO sessions VALUES(?,?,?,?,?)').run(hash,role,member,expires,version);}
 close(){this.db.close();}
}
