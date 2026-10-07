/* Offline writing voices for the Rankings Lab. Facts come from takeFacts;
   this module changes commentary only, never rank order or publication. */
(function () {
  'use strict';
  const styles = [
    {id:'league', label:'League roast', description:'The familiar league voice: personal, sarcastic, and competitive.'},
    {id:'jameis', label:'Jameis-inspired comedy', description:'Over-the-top locker-room optimism, food metaphors, and chaotic confidence. Original parody commentary.'},
    {id:'analyst', label:'Straight analyst', description:'Clear, concise commentary built around results and scoring.'},
    {id:'radio', label:'Sports-radio hot takes', description:'Big opinions, rhetorical questions, and exaggerated sports arguments.'},
    {id:'narrator', label:'Dramatic narrator', description:'Treat the weekly rankings like a championship documentary.'},
  ];
  const pools = {
    jameis: {
      top: ['Somebody pass the victory plate. This team brought enough confidence to feed the whole locker room.', 'The scoreboard is the menu, and this team ordered first.', 'This team walks into the huddle like the trophy already owes it rent.'],
      middle: ['The confidence is undefeated. The actual team still has some paperwork to finish.', 'Sometimes the football finds the receiver. Sometimes it finds a life lesson. We keep throwing.', 'We are stirring the victory soup. Somebody still needs to turn the stove on.'],
      bottom: ['The record is a pothole, not the destination. Unfortunately, we have hit several potholes.', 'We came hungry for wins and left with character development.', 'The motivational speech is playoff quality. The scoreboard has requested a different speaker.'],
      close: ['Bring a fork next week. We are still trying to eat.', 'Keep the belief. Maybe bring a calculator too.', 'The huddle believes. Now somebody tell the scoreboard.', 'There is always another drive. Preferably toward some points.'],
    },
    radio: {
      top: ['Are we watching the team to beat? Put the rest of the league on notice.', 'Stop the segment. This team deserves the microphone.', 'The ranking says contender. The debate starts with who can catch it.'],
      middle: ['Contender or pretender? That is the entire phone-in segment.', 'I need to see more before I start booking the championship parade.', 'Good enough to start an argument. Not high enough to end one.'],
      bottom: ['Somebody call the emergency meeting. This ranking needs a response.', 'The excuses have had plenty of airtime. Now show us something.', 'You cannot win a championship on vibes. We have checked.'],
      close: ['Next week is the rebuttal. Bring evidence.', 'The phone lines are open. The scoreboard gets the final word.', 'Prove this ranking wrong on the field.', 'That is the take. Now give us the response.'],
    },
    narrator: {
      top: ['At the summit, every challenger begins to look upward.', 'The crown is within sight. Holding this position is the next chapter.', 'For now, the path to the top runs through this team.'],
      middle: ['Between promise and proof, the season waits for its next chapter.', 'The middle of the table is where a season chooses its direction.', 'The story remains unfinished, with the next result ready to change the tone.'],
      bottom: ['From the bottom of the table, the climb begins one week at a time.', 'The season has become a recovery story. The ending is still unwritten.', 'The spotlight has moved elsewhere. A response could bring it back.'],
      close: ['The next chapter arrives next week.', 'The numbers set the scene. The response will write the ending.', 'There is still room for a turn in the story.', 'A ranking captures this moment. The season keeps moving.'],
    },
  };
  function normalize(id) { return styles.some(s => s.id === id) ? id : 'league'; }
  function random(seed) {
    let h = 2166136261;
    for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return () => { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
  }
  function evidence(d) {
    const bits = [`${d.rec} record`, `${d.ppg} points per game`];
    if (d.score != null) bits.push(`${d.score} in the latest completed week${d.topScore && d.lowScore ? '' : d.topScore ? ' (league high)' : d.lowScore ? ' (league low)' : ''}`);
    return bits.join('; ') + '.';
  }
  function context(d) {
    const lines = [];
    if (d.prevRank != null && d.prevRank !== d.rank) lines.push(`Moved ${d.prevRank > d.rank ? 'up' : 'down'} from No. ${d.prevRank} to No. ${d.rank}.`);
    if (d.streakN >= 2 && ['W','L','T'].includes(d.streakC)) lines.push(`${d.streakN} straight ${d.streakC === 'W' ? 'wins' : d.streakC === 'L' ? 'losses' : 'ties'}.`);
    if (d.apW + d.apL > 0) lines.push(`Against the whole league: ${d.apW}-${d.apL}.`);
    return lines;
  }
  function write(facts, options) {
    const o = options || {}, style = normalize(o.style), result = {};
    if (style === 'league') throw new Error('Use the existing league writer for League roast.');
    const used = new Set();
    for (const d of facts) {
      const r = random(`${style}:${d.week}:${d.id}:${o.salt || ''}`);
      const extra = context(d);
      if(o.length==='short' && style==='analyst') { result[d.id]=[`No. ${d.rank}: ${d.rec}, ${d.ppg} PPG.`,extra[0] || (d.score!=null ? `${d.score} in the latest completed week.` : '')].filter(Boolean).join(' '); continue; }
      if (style === 'analyst') {
        result[d.id] = [`No. ${d.rank}.`, evidence(d), ...extra].join(' ').slice(0,420);
        continue;
      }
      const band = d.rank <= Math.max(2, Math.round(d.n / 6)) ? 'top' : d.rank > d.n - Math.max(2, Math.round(d.n / 4)) ? 'bottom' : 'middle';
      const pool = pools[style];
      const pick = (choices) => {
        const unused = choices.filter(s => !used.has(s));
        const available = unused.length ? unused : choices;
        const value = available[Math.floor(r() * available.length)]; used.add(value); return value;
      };
      if(o.length==='short') {result[d.id]=[pick(pool[band]),`${d.rec}. ${d.ppg} PPG.`].join(' ');continue;}
      result[d.id] = [pick(pool[band]), evidence(d), extra.length ? extra[Math.floor(r() * extra.length)] : '', pick(pool.close)].filter(Boolean).join(' ').slice(0,420);
    }
    return result;
  }
  const api = {styles, normalize, write};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.RankingStyles = api;
})();
