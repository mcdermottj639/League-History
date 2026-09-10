/* ══════════════════════════════════════════════════════════════════════════
   🔒 IS THIS THE COMMISSIONER'S DEVICE?

   The archive is for all twelve. The Power Rankings Lab is for one — it talks
   to the owner's own backend, and a half-written week sitting in a draft is
   not something the league should be able to read before it is published.

   🚨 THIS REPO IS PUBLIC, SO THE PASSPHRASE IS NOT IN IT. Only its SHA-256 is.
   A token compared with `===` would have been the passphrase, written out in
   a file anybody can open on github.com — which is not a lock, it is a lock
   drawn on a door. The phrase itself lives in the owner's head and in his
   phone's localStorage, and nowhere in this repo.

   ⚠️ AND BE HONEST ABOUT WHAT THIS IS. It stops eleven relatives with the
   link — which is the whole threat. It does NOT stop somebody who reads this
   file and runs a wordlist at that hash, because a static site has no server
   to rate-limit them and never will. If the phrase ever needs to be strong
   against that, it needs to be long, not clever.

   🚨 ONE FILE, BOTH APPS. `league.js` asks so it knows whether to offer the
   commissioner's name and his link; `power.js` asks so it knows whether to
   open at all. A second copy of this hash would be a second source of truth
   for the same fact, and the day one is changed is the day the other is wrong.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* SHA-256 of the normalised passphrase. Changing the phrase means replacing
     this line — there is no build step and nothing else to regenerate. */
  const HASH = '329ddcddd7a377f02fb9a05dea972e2f5d3cc64c9d128892e7a95f2182d650e7';
  const KEY = 'lh:owner';
  const GUEST = 'lh:guest';

  /* 🚨 THE REVOKE-EVERYTHING SWITCH. Every invite records the day it was
     issued, and one older than this is refused no matter what its own expiry
     says. It is the only take-back that exists: an invite lives on somebody
     else's phone and nothing here can reach it, so the one lever the owner
     has is to move this line forward and let every outstanding pass die at
     once. Moving it costs a commit and a deploy — which is the point; it is
     a fire alarm, not a control. */
  const INVITES_FROM = '2026-01-01';

  const today = () => new Date().toISOString().slice(0, 10);

  /* ⚠️ NORMALISE BEFORE HASHING, or iOS locks him out of his own tool. Safari
     autocapitalises the first letter of a text field, so "bologna" is typed as
     "Bologna" and a byte-exact hash says no — on the one device this is for.
     Trim, collapse runs of spaces, lowercase: all three are things a phone
     keyboard does to you, none of them are things you meant to type. */
  const norm = (s) => String(s == null ? '' : s).trim().replace(/\s+/g, ' ').toLowerCase();

  const read = () => { try { return localStorage.getItem(KEY) === '1'; } catch (_) { return false; } };
  const write = (on) => { try { on ? localStorage.setItem(KEY, '1') : localStorage.removeItem(KEY); } catch (_) {} };

  /* base64url, because an invite rides in a URL hash and `+` and `/` do not.
     The payload is a manager code and two dates, so it is ASCII by
     construction — but `btoa` throws on anything else, and an invite that
     throws on the recipient's phone is indistinguishable from a broken link,
     so it is escaped rather than trusted. */
  const enc = (o) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const dec = (t) => JSON.parse(decodeURIComponent(escape(atob(String(t).replace(/-/g, '+').replace(/_/g, '/')))));

  function readGuest() {
    let g;
    try { g = JSON.parse(localStorage.getItem(GUEST) || 'null'); } catch (_) { return null; }
    if (!g || !g.w || !g.u) return null;
    /* ⚠️ EXPIRY IS CHECKED ON EVERY READ, NOT ON A TIMER. A pass that ran out
       overnight has to be dead the next time it is asked about, and a page
       left open for three days must not still be inside. */
    if (g.u < today() || (g.i || '') < INVITES_FROM) { try { localStorage.removeItem(GUEST); } catch (_) {} return null; }
    return { who: g.w, until: g.u, since: g.i || '' };
  }

  async function sha256(s) {
    /* WebCrypto is https-only. GitHub Pages is https and localhost counts as
       secure, so this is only ever missing when the page is opened off the
       filesystem — in which case say so, rather than failing as "wrong
       passphrase" and sending him hunting for a typo that isn't there. */
    const c = window.crypto && window.crypto.subtle;
    if (!c) throw new Error('insecure-context');
    const buf = await c.digest('SHA-256', new TextEncoder().encode(s));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  window.LeagueOwner = {
    /* Is this device unlocked? Synchronous, because every caller asks it while
       building HTML and none of them can await. */
    is: read,

    /* Returns 'ok' | 'no' | 'insecure'. Three outcomes, not a boolean: "wrong
       phrase" and "this browser can't check" are opposite problems and the
       message shown has to say which. */
    async unlock(phrase) {
      let h;
      try { h = await sha256(norm(phrase)); } catch (_) { return 'insecure'; }
      if (h !== HASH) return 'no';
      write(true);
      return 'ok';
    },

    lock() { write(false); },

    /* ══ 👥 GUEST PASSES ═══════════════════════════════════════════════════
       The owner can hand the Lab to another manager for a week or a season.

       🚨 A GUEST IS NOT THE OWNER, AND THE TWO ARE DELIBERATELY DIFFERENT
       KEYS. `is()` stays false for a guest, which is what keeps his name off
       their name picker — anyone in this league may read the archive as
       anyone else, but nobody gets to put the app into HIS voice (v21), and
       lending somebody the rankings tool is not lending them that. It also
       stops a guest minting further invites: only `is()` opens that.

       ⚠️ AND BE HONEST ABOUT WHAT AN INVITE IS, exactly as this file is about
       the passphrase above. It is a door key, not a proof: anybody who reads
       this file could craft one, because a static site has nothing to sign
       against and no server to ask. That is the SAME bar the passphrase
       already sets — the hash is published too — and the threat is the same
       eleven relatives. What it genuinely gives is a pass that runs out on
       its own and never puts the passphrase itself into somebody else's
       hands, which is the thing that could never be taken back.
       ⚠️ The expiry runs on the GUEST'S OWN CLOCK. Someone who wants to keep
       access can set their phone back a week; "until Saturday" is a courtesy
       to an honest person, not a lock on a determined one. `INVITES_FROM` is
       the answer to a determined one. */

    /* The pass this device is holding, or null. Self-expiring. */
    guest: readGuest,

    /* The question `power.html` asks: may this device open the Lab at all? */
    mayLab() { return read() || !!readGuest(); },

    /* Mint one. `who` is a manager code, `until` an ISO date (inclusive). */
    invite(who, until) {
      return enc({ w: String(who || ''), u: String(until || ''), i: today() });
    },

    /* Returns 'ok' | 'bad' | 'expired' | 'revoked'. Four outcomes rather than
       a boolean, for the reason `unlock` has three: "this link ran out" and
       "this link is gibberish" send a person to two different places, and a
       guest holding a dead pass has nobody to ask but the screen. */
    accept(token) {
      let p;
      try { p = dec(token); } catch (_) { return 'bad'; }
      if (!p || !p.w || !p.u || !/^\d{4}-\d{2}-\d{2}$/.test(p.u)) return 'bad';
      if ((p.i || '') < INVITES_FROM) return 'revoked';
      if (p.u < today()) return 'expired';
      try { localStorage.setItem(GUEST, JSON.stringify({ w: p.w, u: p.u, i: p.i || today() })); } catch (_) { return 'bad'; }
      return 'ok';
    },

    /* A guest's own way out, and the mirror of `lock()`. "Access until
       Saturday" is only safe on a shared or borrowed phone if it can be
       ended before Saturday. */
    endGuest() { try { localStorage.removeItem(GUEST); } catch (_) {} },
  };
})();
