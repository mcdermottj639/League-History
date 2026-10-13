/* Optional media in row[8].media. Old ranking rows continue to render as text. */
(function (root) {
  'use strict';
  const MAX_DATA = 900000, MAX_TOTAL = 1800000;
  const reactions = [
    ['crown','👑','King of the hill','#d9a94b'], ['fire','🔥','On fire','#e6683b'],
    ['rocket','🚀','Taking off','#6a8ded'], ['ice','🧊','Ice cold','#65b8d1'],
    ['roller','🎢','Wild ride','#a280d1'], ['sweat','😅','Survived it','#d4ab55'],
    ['luck','🍀','Living lucky','#64a17e'], ['robbed','😭','Robbed by the schedule','#7389ba'],
    ['popcorn','🍿','Here for the drama','#c39970'], ['sleep','😴','Wake up','#8e8dbe'],
    ['alarm','🚨','Panic time','#cd6666'], ['trash','🗑️','In the basement','#8d958f'],
    ['shrug','🤷','Still figuring it out','#a69c89'], ['clap','👏','Respect','#8bae94'],
    ['eyes','👀','Keep watching','#89aaba'], ['skull','💀','Rough week','#92939d'],
  ].map(([id,emoji,label,color])=>({id,emoji,label,color}));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function safeSource(src) {
    if (typeof src !== 'string') return '';
    if (src.length <= MAX_DATA && /^data:image\/(?:png|jpeg|webp|gif);base64,[a-zA-Z0-9+/]+={0,2}$/.test(src)) return src;
    if (src.length > 2048 || /[\s\\]/.test(src)) return '';
    try {
      const u = new URL(src);
      if (u.protocol !== 'https:' || u.username || u.password || u.port || /[:\[\]]/.test(u.hostname) || !u.hostname.includes('.') || /^(?:localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(u.hostname) || /\.(?:local|localhost)$/.test(u.hostname)) return '';
      return u.href;
    } catch (_) { return ''; }
  }
  function normalize(m) {
    if (!m || typeof m !== 'object') return null;
    if (m.kind === 'reaction' && reactions.some(r=>r.id===m.id)) return {kind:'reaction',id:m.id};
    const src = m.kind === 'image' && safeSource(m.src);
    return src ? {kind:'image',src,alt:String(m.alt || 'Ranking reaction').slice(0,120)} : null;
  }
  function fromRow(row) { return normalize(row && row[8] && row[8].media); }
  function setRow(row, media) {
    const extra = {...(row[8] || {})}; delete extra.media;
    const m=normalize(media); if(m) extra.media=m;
    if(Object.keys(extra).length) row[8]=extra; else row.splice(8,1);
  }
  function render(media) {
    const m=normalize(media); if(!m)return '';
    if(m.kind==='reaction') {
      const r=reactions.find(r=>r.id===m.id);
      return `<div class="rk-reaction rk-reaction-${r.id}" style="--reaction-color:${r.color}" role="img" aria-label="${esc(r.label)}"><span aria-hidden="true">${r.emoji}</span><i aria-hidden="true"></i></div>`;
    }
    return `<figure class="rk-media"><img src="${esc(m.src)}" alt="${esc(m.alt)}" loading="lazy" decoding="async" referrerpolicy="no-referrer"><figcaption hidden>Image unavailable. Choose another image in the editor.</figcaption></figure>`;
  }
  function hydrate(host) {
    host.querySelectorAll('.rk-media img').forEach(img=>{
      img.onerror=()=>{img.hidden=true;img.nextElementSibling.hidden=false;};
    });
  }
  function suggest(d, variant=0) {
    let pool = ['eyes','popcorn','shrug'];
    if(d.rank===1)pool=['crown','fire','clap'];
    else if(d.topScore || (d.streakC==='W' && d.streakN>=3))pool=['fire','rocket','clap'];
    else if(d.lowScore)pool=['skull','ice','sleep'];
    else if(d.prevRank && d.prevRank-d.rank>=2)pool=['rocket','clap','eyes'];
    else if(d.prevRank && d.rank-d.prevRank>=2)pool=['alarm','roller','ice'];
    else if(d.lucky>0.25)pool=['luck','sweat','eyes'];
    else if(d.lucky< -0.25)pool=['robbed','roller','shrug'];
    else if(d.rank===d.n)pool=['trash','alarm','skull'];
    else if(d.rank<=3)pool=['clap','eyes','fire'];
    else if(d.streakC==='L' && d.streakN>=2)pool=['ice','alarm','sleep'];
    return {kind:'reaction',id:pool[(Math.max(0,Number(variant)||0)+Number(d.week||0)+Number(d.rank||0))%pool.length]};
  }
  function totalOK(media) { return JSON.stringify(media).length<=MAX_TOTAL; }
  function loadImage(src, cors=false) {
    return new Promise((resolve,reject)=>{
      const img=new Image(); const timer=setTimeout(()=>reject(new Error('Image did not load. Try another file or direct image link.')),10000);
      if(cors && !src.startsWith('data:'))img.crossOrigin='anonymous';
      img.referrerPolicy='no-referrer';
      img.onload=()=>{clearTimeout(timer);resolve(img);};
      img.onerror=()=>{clearTimeout(timer);reject(new Error('Image did not load. Use a direct GIF, JPG, PNG, or WebP link.'));};
      img.src=src;
    });
  }
  /* ---- GIF shrinking (v130) ------------------------------------------------
     An uploaded GIF is stored inside the week itself, so it has to fit
     MAX_DATA. Browsers can decode a GIF but cannot ENCODE one, so this is a
     small self-contained GIF89a decoder + encoder: no library, no build step.
     A GIF that is too large is re-encoded with progressively stronger settings
     (fewer frames, smaller size, fewer colours, skipped near-identical pixels)
     until it fits. Animation and loop timing are kept. */
  const GIF = (() => {
    function lzwDecode(minSize, data, count) {
      const out = new Uint8Array(count), clear = 1 << minSize, eoi = clear + 1;
      const prefix = new Int16Array(4096), suffix = new Uint8Array(4096), stack = new Uint8Array(4097);
      for (let c = 0; c < clear; c++) suffix[c] = c;
      let size = minSize + 1, mask = (1 << size) - 1, avail = clear + 2, old = -1, first = 0, bits = 0, datum = 0, i = 0, op = 0;
      while (op < count) {
        while (bits < size) { if (i >= data.length) return out; datum |= data[i++] << bits; bits += 8; }
        let code = datum & mask; datum >>>= size; bits -= size;
        if (code === clear) { size = minSize + 1; mask = (1 << size) - 1; avail = clear + 2; old = -1; continue; }
        if (code === eoi) break;
        if (old === -1) { if (code >= clear) break; out[op++] = suffix[code]; old = first = code; continue; }
        if (code > avail) break; // corrupt stream: keep what decoded
        const incoming = code; let top = 0;
        if (code === avail) { stack[top++] = first; code = old; }
        while (code >= clear) { stack[top++] = suffix[code]; code = prefix[code]; }
        first = suffix[code]; stack[top++] = first;
        if (avail < 4096) {
          prefix[avail] = old; suffix[avail] = first; avail++;
          if ((avail & mask) === 0 && avail < 4096) { size++; mask += avail; }
        }
        old = incoming;
        while (top > 0 && op < count) out[op++] = stack[--top];
      }
      return out;
    }

    // Parse to raw frames. Throws on anything that is not a GIF.
    function parse(bytes) {
      let p = 0;
      const u8 = () => bytes[p++], u16 = () => { const v = bytes[p] | (bytes[p + 1] << 8); p += 2; return v; };
      const sig = String.fromCharCode(...bytes.subarray(0, 6));
      if (!/^GIF8[79]a$/.test(sig)) throw new Error('Not a GIF.');
      p = 6;
      const width = u16(), height = u16(), flags = u8(); p += 2;
      let gct = null;
      if (flags & 0x80) { const n = 2 << (flags & 7); gct = bytes.subarray(p, p + 3 * n); p += 3 * n; }
      const skip = () => { let n; while (p < bytes.length && (n = u8())) p += n; };
      const frames = []; let gce = { delay: 0, trans: -1, disposal: 0 };
      while (p < bytes.length) {
        const b = u8();
        if (b === 0x3b) break;
        if (b === 0x21) {
          const label = u8();
          if (label === 0xf9) {
            const size = u8(), start = p, f = u8(), delay = u16(), t = u8();
            gce = { disposal: (f >> 2) & 7, trans: f & 1 ? t : -1, delay: delay * 10 };
            p = start + size; skip();
          } else skip();
        } else if (b === 0x2c) {
          const x = u16(), y = u16(), w = u16(), h = u16(), f = u8();
          let pal = gct;
          if (f & 0x80) { const n = 2 << (f & 7); pal = bytes.subarray(p, p + 3 * n); p += 3 * n; }
          const minSize = u8(), chunks = []; let len = 0, n;
          while (p < bytes.length && (n = u8())) { chunks.push(bytes.subarray(p, p + n)); len += n; p += n; }
          const data = new Uint8Array(len); let o = 0; for (const c of chunks) { data.set(c, o); o += c.length; }
          if (w && h && pal && minSize >= 1 && minSize <= 11) {
            let idx = lzwDecode(minSize, data, w * h);
            if (f & 0x40) { // de-interlace
              const rows = new Uint8Array(w * h); let r = 0;
              for (const [s, st] of [[0, 8], [4, 8], [2, 4], [1, 2]]) for (let yy = s; yy < h; yy += st) { rows.set(idx.subarray(r * w, r * w + w), yy * w); r++; }
              idx = rows;
            }
            frames.push({ x, y, w, h, pal, idx, ...gce });
          }
          gce = { delay: 0, trans: -1, disposal: 0 };
        } else break; // unknown block: stop rather than misread
      }
      if (!frames.length || !width || !height) throw new Error('This GIF has no frames.');
      return { width, height, frames };
    }

    // Composite every frame onto a full canvas (RGBA), honouring disposal.
    // `visit(rgba, frameIndex)` sees each finished frame; the buffer is reused.
    function composite(gif, visit) {
      const { width: W, height: H } = gif, canvas = new Uint8Array(W * H * 4);
      gif.frames.forEach((f, n) => {
        const saved = f.disposal === 3 ? canvas.slice() : null;
        for (let yy = 0; yy < f.h; yy++) {
          const cy = f.y + yy; if (cy >= H) break;
          for (let xx = 0; xx < f.w; xx++) {
            const cx = f.x + xx; if (cx >= W) break;
            const c = f.idx[yy * f.w + xx]; if (c === f.trans || c * 3 + 2 >= f.pal.length) continue;
            const o = (cy * W + cx) * 4;
            canvas[o] = f.pal[c * 3]; canvas[o + 1] = f.pal[c * 3 + 1]; canvas[o + 2] = f.pal[c * 3 + 2]; canvas[o + 3] = 255;
          }
        }
        visit(canvas, n);
        if (f.disposal === 2) for (let yy = f.y; yy < Math.min(H, f.y + f.h); yy++) canvas.fill(0, (yy * W + f.x) * 4, (yy * W + Math.min(W, f.x + f.w)) * 4);
        else if (saved) canvas.set(saved);
      });
    }

    // Box-filter downscale. A pixel is transparent when most of its block is.
    function scale(src, W, H, w, h) {
      if (w === W && h === H) return src.slice();
      const out = new Uint8Array(w * h * 4);
      for (let y = 0; y < h; y++) {
        const y0 = Math.floor(y * H / h), y1 = Math.max(y0 + 1, Math.floor((y + 1) * H / h));
        for (let x = 0; x < w; x++) {
          const x0 = Math.floor(x * W / w), x1 = Math.max(x0 + 1, Math.floor((x + 1) * W / w));
          let r = 0, g = 0, b = 0, n = 0, t = 0;
          for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) {
            const o = (yy * W + xx) * 4;
            if (src[o + 3] < 128) { t++; continue; }
            r += src[o]; g += src[o + 1]; b += src[o + 2]; n++;
          }
          const o = (y * w + x) * 4;
          if (n && n >= t) { out[o] = r / n; out[o + 1] = g / n; out[o + 2] = b / n; out[o + 3] = 255; }
        }
      }
      return out;
    }

    // Median cut over a 15-bit colour histogram of every kept frame.
    function palette(frames, k) {
      const hist = new Uint32Array(32768);
      for (const f of frames) for (let o = 0; o < f.length; o += 4) if (f[o + 3]) hist[((f[o] >> 3) << 10) | ((f[o + 1] >> 3) << 5) | (f[o + 2] >> 3)]++;
      const bins = []; for (let i = 0; i < 32768; i++) if (hist[i]) bins.push(i);
      const ch = (bin, c) => (bin >> (10 - c * 5)) & 31;
      const boxes = [bins];
      while (boxes.length < k) {
        let best = -1, bestScore = 0, bestAxis = 0;
        boxes.forEach((box, i) => {
          if (box.length < 2) return;
          let count = 0; const lo = [31, 31, 31], hi = [0, 0, 0];
          for (const bin of box) { count += hist[bin]; for (let c = 0; c < 3; c++) { const v = ch(bin, c); if (v < lo[c]) lo[c] = v; if (v > hi[c]) hi[c] = v; } }
          const axis = [0, 1, 2].reduce((a, c) => hi[c] - lo[c] > hi[a] - lo[a] ? c : a, 0), score = (hi[axis] - lo[axis] + 1) * count;
          if (score > bestScore) { best = i; bestScore = score; bestAxis = axis; }
        });
        if (best < 0) break;
        const box = boxes[best].sort((a, b) => ch(a, bestAxis) - ch(b, bestAxis));
        let total = 0; for (const bin of box) total += hist[bin];
        let acc = 0, cut = 1;
        for (let i = 0; i < box.length - 1; i++) { acc += hist[box[i]]; if (acc * 2 >= total) { cut = i + 1; break; } cut = i + 1; }
        boxes.splice(best, 1, box.slice(0, cut), box.slice(cut));
      }
      return boxes.filter(b => b.length).map(box => {
        let n = 0, r = 0, g = 0, b = 0;
        for (const bin of box) { const c = hist[bin]; n += c; r += c * (ch(bin, 0) * 8 + 4); g += c * (ch(bin, 1) * 8 + 4); b += c * (ch(bin, 2) * 8 + 4); }
        return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
      });
    }

    function lzwEncode(minSize, idx) {
      const clear = 1 << minSize, eoi = clear + 1, out = []; const dict = new Map();
      let size = minSize + 1, next = eoi + 1, acc = 0, n = 0;
      const emit = c => { acc |= c << n; n += size; while (n >= 8) { out.push(acc & 255); acc >>>= 8; n -= 8; } };
      const data = c => { emit(c); if (next >= (1 << size) && size < 12) size++; };
      emit(clear);
      let prefix = idx[0];
      for (let i = 1; i < idx.length; i++) {
        const k = idx[i], key = prefix * 256 + k, hit = dict.get(key);
        if (hit !== undefined) { prefix = hit; continue; }
        data(prefix);
        if (next < 4096) dict.set(key, next++);
        else { emit(clear); dict.clear(); size = minSize + 1; next = eoi + 1; }
        prefix = k;
      }
      data(prefix); emit(eoi);
      if (n > 0) out.push(acc & 255);
      return out;
    }

    // Index 0 is always transparent; colours start at 1.
    function encode(width, height, frames, delays, pal, tolerance) {
      const depth = Math.max(1, Math.ceil(Math.log2(pal.length + 1))), size = 1 << depth, out = [];
      const push16 = v => out.push(v & 255, (v >> 8) & 255);
      const blocks = bytes => { for (let i = 0; i < bytes.length; i += 255) { const c = bytes.slice(i, i + 255); out.push(c.length, ...c); } out.push(0); };
      out.push(...[71, 73, 70, 56, 57, 97]); push16(width); push16(height); out.push(0x80 | ((depth - 1) << 4) | (depth - 1), 0, 0);
      for (let i = 0; i < size; i++) { const c = i && pal[i - 1] || [0, 0, 0]; out.push(c[0], c[1], c[2]); }
      out.push(0x21, 0xff, 11, ...[...'NETSCAPE2.0'].map(c => c.charCodeAt(0)), 3, 1, 0, 0, 0);
      const cache = new Int16Array(32768).fill(-1);
      const nearest = (r, g, b) => {
        const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
        if (cache[key] >= 0) return cache[key];
        let best = 1, bd = Infinity;
        for (let i = 0; i < pal.length; i++) { const c = pal[i], d = (c[0] - r) ** 2 + (c[1] - g) ** 2 + (c[2] - b) ** 2; if (d < bd) { bd = d; best = i + 1; } }
        return (cache[key] = best);
      };
      const hasAlpha = frames.some(f => { for (let o = 3; o < f.length; o += 4) if (!f[o]) return true; return false; });
      const shown = new Uint8Array(width * height), tol = tolerance * tolerance;
      frames.forEach((f, n) => {
        const cur = new Uint8Array(width * height);
        for (let i = 0, o = 0; i < cur.length; i++, o += 4) cur[i] = f[o + 3] ? nearest(f[o], f[o + 1], f[o + 2]) : 0;
        // Transparency in the source means every frame is drawn whole on a
        // cleared canvas; an opaque GIF only redraws the pixels that changed.
        let x0 = 0, y0 = 0, x1 = width - 1, y1 = height - 1, idx = cur;
        if (!hasAlpha && n > 0) {
          x0 = width; y0 = height; x1 = -1; y1 = -1;
          const diff = new Uint8Array(width * height);
          for (let i = 0; i < cur.length; i++) {
            const a = pal[cur[i] - 1], b = pal[shown[i] - 1];
            if (cur[i] === shown[i] || (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2 <= tol) continue;
            diff[i] = cur[i]; shown[i] = cur[i];
            const x = i % width, y = (i - x) / width;
            if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
          }
          if (x1 < 0) { x0 = y0 = x1 = y1 = 0; }
          const w = x1 - x0 + 1, h = y1 - y0 + 1; idx = new Uint8Array(w * h);
          for (let y = 0; y < h; y++) idx.set(diff.subarray((y0 + y) * width + x0, (y0 + y) * width + x0 + w), y * w);
        } else shown.set(cur);
        const w = x1 - x0 + 1, h = y1 - y0 + 1;
        out.push(0x21, 0xf9, 4, ((hasAlpha ? 2 : 1) << 2) | 1); push16(Math.round(delays[n] / 10)); out.push(0, 0);
        out.push(0x2c); push16(x0); push16(y0); push16(w); push16(h); out.push(0);
        const minSize = Math.max(2, depth); out.push(minSize); blocks(lzwEncode(minSize, idx));
      });
      out.push(0x3b);
      return new Uint8Array(out);
    }

    // Strongest last. Each level must fit before the next is tried.
    const LEVELS = [
      { edge: 360, step: 1, colors: 255, tol: 0 },
      { edge: 360, step: 1, colors: 128, tol: 8 },
      { edge: 320, step: 2, colors: 128, tol: 12 },
      { edge: 280, step: 2, colors: 96, tol: 16 },
      { edge: 240, step: 2, colors: 64, tol: 20 },
      { edge: 200, step: 3, colors: 64, tol: 24 },
      { edge: 160, step: 3, colors: 48, tol: 28 },
      { edge: 120, step: 4, colors: 32, tol: 32 },
    ];
    const MAX_PIXELS = 60e6; // decoded work cap, so a huge GIF fails fast instead of freezing a phone

    function shrink(bytes, maxBytes, levels = LEVELS) {
      const gif = parse(bytes), W = gif.width, H = gif.height;
      if (W * H * gif.frames.length > MAX_PIXELS) throw new Error('This GIF is too long or too large to shrink. Paste its direct image link instead.');
      const timing = gif.frames.map(f => f.delay < 20 ? 100 : f.delay); // browsers show <20ms as 100ms
      for (const level of levels) {
        const s = Math.min(1, level.edge / Math.max(W, H)), w = Math.max(1, Math.round(W * s)), h = Math.max(1, Math.round(H * s));
        const frames = [], delays = [];
        composite(gif, (rgba, n) => {
          if (n % level.step === 0) { frames.push(scale(rgba, W, H, w, h)); delays.push(timing[n]); }
          else delays[delays.length - 1] += timing[n];
        });
        const pal = palette(frames, level.colors);
        if (!pal.length) pal.push([0, 0, 0]);
        const out = encode(w, h, frames, delays, pal, level.tol);
        if (out.length <= maxBytes) return { bytes: out, width: w, height: h, frames: frames.length, from: { width: W, height: H, frames: gif.frames.length } };
      }
      throw new Error('This GIF is too large to shrink enough for a week. Paste its direct image link instead.');
    }
    return { parse, composite, shrink, encode, palette, LEVELS };
  })();
  // Base64 grows bytes by 4/3; leave room for the "data:image/gif;base64," prefix.
  const bytesFor = chars => Math.floor((chars - 32) * 3 / 4);
  // Aim well under MAX_DATA so a week still has room for other uploads.
  const GIF_TARGET = 600000;

  async function readFile(file) { return (await readFileInfo(file)).media; }
  async function readFileInfo(file) {
    const types=['image/jpeg','image/png','image/webp','image/gif'];
    if(!file || (file.type && !types.includes(file.type)))throw new Error('Choose a JPG, PNG, WebP, or GIF file.');
    if(file.size>8*1024*1024)throw new Error('Choose an image smaller than 8 MB.');
    // Mobile pickers may omit MIME metadata. Identify bytes, never trust a filename.
    const header=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(new Uint8Array(r.result));r.onerror=()=>rej(new Error('Could not read that file.'));r.readAsArrayBuffer(file.slice(0,12));});
    const starts=bytes=>bytes.every((b,i)=>header[i]===b);
    const text=(start,end)=>String.fromCharCode(...header.slice(start,end));
    const type=starts([0xff,0xd8,0xff])?'image/jpeg':
      starts([137,80,78,71,13,10,26,10])?'image/png':
      ['GIF87a','GIF89a'].includes(text(0,6))?'image/gif':
      text(0,4)==='RIFF' && text(8,12)==='WEBP'?'image/webp':'';
    if(!type || (file.type && file.type!==type))throw new Error('Choose a valid JPG, PNG, WebP, or GIF file.');
    const src=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(new Error('Could not read that file.'));r.readAsDataURL(file.slice(0,file.size,type));});
    if(type==='image/gif') {
      if(src.length<=MAX_DATA){await loadImage(src); return {media:{kind:'image',src,alt:'Animated ranking reaction'}};}
      // Too big to store: re-encode smaller instead of refusing it.
      const bytes=new Uint8Array(await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(new Error('Could not read that file.'));r.readAsArrayBuffer(file);}));
      await new Promise(r=>setTimeout(r,0)); // let "Preparing image…" paint before the work
      let small;
      try { small=GIF.shrink(bytes,bytesFor(GIF_TARGET)); }
      catch(e){ throw new Error(/link instead/.test(e.message)?e.message:'Could not shrink this GIF. Paste its direct image link instead.'); }
      const out=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(new Error('Could not prepare that GIF.'));r.readAsDataURL(new Blob([small.bytes],{type:'image/gif'}));});
      if(out.length>MAX_DATA)throw new Error('This GIF is too large to save in a week. Paste its direct image link instead to keep it animated.');
      await loadImage(out);
      const kb=n=>Math.max(1,Math.round(n/1024))+' KB';
      return {media:{kind:'image',src:out,alt:'Animated ranking reaction'},note:`GIF compressed to fit (${kb(file.size)} → ${kb(small.bytes.length)}) and added to this draft.`};
    }
    const img=await loadImage(src), canvas=document.createElement('canvas');
    let edge=640, result='';
    for(let attempt=0;attempt<4;attempt++) {
      const scale=Math.min(1,edge/Math.max(img.naturalWidth,img.naturalHeight));
      canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
      const ctx=canvas.getContext('2d');ctx.fillStyle='#f3f1ec';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
      result=canvas.toDataURL('image/jpeg',0.8-attempt*0.1);
      if(result.length<=140000)break; edge*=0.75;
    }
    if(result.length>140000)throw new Error('Could not shrink this image. Choose a smaller file.');
    return {media:{kind:'image',src:result,alt:'Ranking reaction'}};
  }
  function editor(host, value, onChange, team='team') {
    let current=normalize(value);
    host.innerHTML=`<div class="rk-media-current">${render(current)}</div><details class="rk-media-picker"><summary>${current?'Change':'Add'} reaction, GIF, or image</summary><div class="rk-reaction-grid">${reactions.map(r=>`<button type="button" data-reaction="${r.id}" title="${esc(r.label)}" aria-label="${esc(r.label)} for ${esc(team)}" aria-pressed="${current?.id===r.id}">${r.emoji}<small>${esc(r.label)}</small></button>`).join('')}</div><label class="pr-by"><span>Upload image or GIF</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" data-media-file aria-label="Upload image or GIF for ${esc(team)}"></label><label class="pr-by"><span>Or paste a direct GIF / image link</span><input type="url" placeholder="https://…" data-media-url aria-label="Image link for ${esc(team)}"></label><button type="button" class="pr-btn" data-media-use>Use image link</button><button type="button" class="pr-btn ghost" data-media-remove>Remove visual</button><p class="pr-note" data-media-status role="status"></p></details>`;
    const status=host.querySelector('[data-media-status]');
    const apply=async (m,note)=>{
      if(!host.isConnected)return;
      await onChange(m); current=m;
      host.querySelector('.rk-media-current').innerHTML=render(m);hydrate(host);
      host.querySelector('summary').textContent=`${m?'Change':'Add'} reaction, GIF, or image`;
      host.querySelectorAll('[data-reaction]').forEach(b=>b.setAttribute('aria-pressed',String(m?.id===b.dataset.reaction)));
      status.textContent=note||(m?'Visual added to this draft.':'Visual removed.');
    };
    async function run(work) {
      const controls=[...host.querySelectorAll('button,input')];controls.forEach(b=>b.disabled=true);status.textContent='Preparing image…';
      try {await work();}catch(e){status.textContent=e.message;}finally{controls.forEach(b=>b.disabled=false);}
    }
    host.querySelectorAll('[data-reaction]').forEach(b=>b.onclick=()=>run(()=>apply({kind:'reaction',id:b.dataset.reaction})));
    host.querySelector('[data-media-remove]').onclick=()=>run(()=>apply(null));
    host.querySelector('[data-media-file]').onchange=e=>{
      const input=e.target, file=input.files[0];
      if(!file)return; // Dismissing the picker leaves the current visual untouched.
      return run(async()=>{try{const got=await readFileInfo(file);await apply(got.media,got.note);}finally{input.value='';}});
    };
    host.querySelector('[data-media-use]').onclick=()=>run(async()=>{
      const src=safeSource(host.querySelector('[data-media-url]').value.trim());
      if(!src || src.startsWith('data:'))throw new Error('Use a public HTTPS image link. You can upload a file above.');
      await loadImage(src);await apply({kind:'image',src,alt:`Reaction for ${team}`});
    });hydrate(host);
  }
  if(root && root.document) root.document.addEventListener('error',e=>{const img=e.target;if(img.matches?.('.rk-media img')){img.hidden=true;if(img.nextElementSibling)img.nextElementSibling.hidden=false;}},true);
  const api={reactions,normalize,fromRow,setRow,render,hydrate,suggest,totalOK,loadImage,readFile,editor,gif:GIF,MAX_DATA,GIF_TARGET};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.RankingMedia=api;
})(typeof window!=='undefined'?window:null);
