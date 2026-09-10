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

  /* ⚠️ NORMALISE BEFORE HASHING, or iOS locks him out of his own tool. Safari
     autocapitalises the first letter of a text field, so "bologna" is typed as
     "Bologna" and a byte-exact hash says no — on the one device this is for.
     Trim, collapse runs of spaces, lowercase: all three are things a phone
     keyboard does to you, none of them are things you meant to type. */
  const norm = (s) => String(s == null ? '' : s).trim().replace(/\s+/g, ' ').toLowerCase();

  const read = () => { try { return localStorage.getItem(KEY) === '1'; } catch (_) { return false; } };
  const write = (on) => { try { on ? localStorage.setItem(KEY, '1') : localStorage.removeItem(KEY); } catch (_) {} };

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
  };
})();
