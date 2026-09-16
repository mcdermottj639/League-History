import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const source=readFileSync(new URL('../owner-links.js',import.meta.url),'utf8');
function setup(owner,fragment="?secret=bad#private",saved=null){const dom=new JSDOM('<div id="host"></div>',{url:'https://league.test/League-History/'+fragment,runScripts:'outside-only'});if(saved)dom.window.localStorage.setItem('lh:owner-links:v1',JSON.stringify(saved));let unlocked=owner;dom.window.LeagueOwner={is:()=>unlocked};dom.window.eval(source);const host=dom.window.document.querySelector('#host');dom.window.LeagueOwnerLinks.mount(host);return {dom,w:dom.window,host,lock:()=>unlocked=false};}
test('directory absent for ordinary members; public link strips query and fragment',()=>{
 const regular=setup(false);assert.equal(regular.host.innerHTML,'');regular.dom.window.close();
 const h=setup(true);let copied;Object.defineProperty(h.w.navigator,'clipboard',{value:{writeText:async value=>{copied=value;}}});h.host.querySelector('button').click();assert.equal(copied,'https://league.test/League-History/');h.dom.window.close();
});
test('private rows render safely, persist locally, reject foreign links and recheck owner access',()=>{
 const h=setup(true),form=h.host.querySelector('form');const submit=(label,url)=>{form.elements.label.value=label;form.elements.url.value=url;form.dispatchEvent(new h.w.Event('submit',{cancelable:true}));};
 submit('<img src=x onerror=alert(1)>','https://league.test/League-History/#parlay-organizer='+'a'.repeat(43));
 assert.equal(h.host.querySelector('img'),null);assert.match(h.host.textContent,/<img/);assert.equal(h.host.querySelectorAll('.lg-link-row button')[1].disabled,true);
 assert.equal(JSON.parse(h.w.localStorage.getItem('lh:owner-links:v1')).length,1);
 submit('Bad','https://evil.example/');assert.equal(JSON.parse(h.w.localStorage.getItem('lh:owner-links:v1')).length,1);
 const select=h.host.querySelector('.lg-link-row select');select.value='ready';select.dispatchEvent(new h.w.Event('change'));assert.equal(h.host.querySelectorAll('.lg-link-row button')[1].disabled,false);
 h.lock();h.host.querySelector('button').click();assert.equal(h.host.innerHTML,'');h.dom.window.close();
});


test('private setup saves the original organizer link ready for owner, strips URL and preserves other rows',()=>{
 const token='a'.repeat(43),url='https://league.test/League-History/#parlay-organizer='+token;
 const other={label:'Another private link',url:'https://league.test/League-History/#another',status:'pending'};
 const h=setup(true,'#owner-parlay-link='+token,[other]);
 assert.equal(h.w.location.hash,'');assert.equal(h.w.LeagueOwnerLinks.setupRequested,true);
 const rows=JSON.parse(h.w.localStorage.getItem('lh:owner-links:v1'));
 assert.deepEqual(rows[0],other);assert.equal(rows[1].url,url);assert.equal(rows[1].status,'ready');
 assert.match(h.host.textContent,/Zach’s link is ready/);assert.equal(h.host.querySelectorAll('.lg-link-row button')[2].disabled,false);
 h.dom.window.close();
 const again=setup(true,'#owner-parlay-link='+token,rows);assert.equal(JSON.parse(again.w.localStorage.getItem('lh:owner-links:v1')).length,2);again.dom.window.close();
});
test('private setup cannot grant owner access or expose a link to ordinary members',()=>{
 const h=setup(false,'#owner-parlay-link='+'b'.repeat(43));
 assert.equal(h.w.location.hash,'');assert.equal(h.host.innerHTML,'');assert.equal(h.w.localStorage.getItem('lh:owner-links:v1'),null);assert.equal(h.w.LeagueOwner.is(),false);h.dom.window.close();
 const invalid=setup(true,'#owner-parlay-link=invalid');assert.equal(invalid.w.location.hash,'');assert.equal(invalid.w.localStorage.getItem('lh:owner-links:v1'),null);invalid.dom.window.close();
});
