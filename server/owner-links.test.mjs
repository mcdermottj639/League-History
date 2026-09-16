import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const source=readFileSync(new URL('../owner-links.js',import.meta.url),'utf8');
function setup(owner){const dom=new JSDOM('<div id="host"></div>',{url:'https://league.test/League-History/?secret=bad#private',runScripts:'outside-only'});let unlocked=owner;dom.window.LeagueOwner={is:()=>unlocked};dom.window.eval(source);const host=dom.window.document.querySelector('#host');dom.window.LeagueOwnerLinks.mount(host);return {dom,w:dom.window,host,lock:()=>unlocked=false};}
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
