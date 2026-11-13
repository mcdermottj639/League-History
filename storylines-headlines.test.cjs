/* Personal headings omit the redundant subject, not the story or opponents. */
const assert = require('node:assert/strict');
global.window = {};
require('./history.js');
const H = window.LeagueHistory;
const roster = H.roster();
const esc = (s) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const heads = (html) => Array.from(html.matchAll(/<b class="fh-story-h">([^<]*)/g), m => m[1]);
let renders = 0;
for (const reader of [null, ...roster.map(a => a.m)]) {
  H.setMe(reader);
  const overview = H.view('lore');
  assert.deepEqual(heads(overview), H._cardStories().map(s => esc(s.head)), 'overview keeps attribution, including the first card');
  for (const a of roster) {
    const own = H._stories().filter(s => s.m === a.m);
    for (const html of [H.profile(a.m), ...(reader === a.m ? [H.view('you')] : [])]) {
      const headings = heads(html);
      assert.equal(headings.length, own.length, 'no story lost');
      for (const head of headings) {
        assert.ok(!/^You(?:\b|:)/.test(head), head);
        assert.ok(!head.startsWith(esc(a.name) + ': ') && !head.startsWith(esc(a.name) + ' '), head);
        assert.ok(head.length && head[0] === head[0].toUpperCase(), head);
        assert.ok(!/^(?:Have|Has|Went)\b/.test(head), 'trimmed headings remain natural');
      }
      for (const story of own) {
        const id = `data-story-id="${esc(story.m + '/' + story.id)}"`;
        assert.equal(html.split(id).length - 1, 1, 'each story appears exactly once');
        assert.ok(html.includes(`<span class="fh-story-p">${esc(story.body)}</span>`), 'body stays intact');
      }
      renders++;
    }
  }
}
H.setMe('Buley');
assert.deepEqual(heads(H.view('you')), [
  'The six-seed heist.',
  '11-2. This was not a drill.',
  'The Cum Bowl has a regular.'
]);
assert.deepEqual(heads(H.profile('Buley')), heads(H.view('you')));
H.setMe(null);
assert.deepEqual(heads(H.profile('Buley')), [
  'The six-seed heist.', '11-2. This was not a drill.', 'The Cum Bowl has a regular.'
]);
H.setMe('Gotch');
assert.ok(heads(H.view('you')).includes('5 final fours from 6 playoff trips.'));
H.setMe('Zach');
assert.ok(heads(H.profile('Hyman')).includes('193.48. You were also there.'), 'opponent second person remains');
assert.ok(heads(H.view('lore')).includes('Hyman: 193.48. You were also there.'), 'overview keeps named subject');
H.setMe(null);
assert.equal(H._stories().length, 31);
assert.equal(H._stories().filter(s => s.tone === 'roast').length, 4);
console.log(`Personal headline checks passed: ${renders} renders, all 13 reader states, overview attribution, body copy and opponent voice.`);
