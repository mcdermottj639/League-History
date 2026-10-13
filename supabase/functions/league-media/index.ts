// League ranking media: stores an uploaded GIF/image ORIGINAL, byte for byte,
// in the public `league-media` bucket and returns its URL. The week then holds
// only that short URL, so GIFs never need compressing to fit a week (v132).
// Only the league publisher can upload: the Lab's Firebase ID token is verified
// against Google's keys, pinned to the league's Firebase project and the
// publisher uid that ranking-store.js already enforces for publishing.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { createRemoteJWKSet, jwtVerify } from 'npm:jose@5.9.6';

const ORIGIN = 'https://mcdermottj639.github.io';
const PROJECT = Deno.env.get('LEAGUE_FIREBASE_PROJECT') || 'nectars-bologna';
const PUBLISHER_UID = '34sUlXl2ZebtCJfR97Hz4R9N6Jw1';
const MAX_BYTES = 8 * 1024 * 1024;
const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));
const fail = (m: string, n = 400) => Object.assign(new Error(m), { status: n });

function sniff(b: Uint8Array): [string, string] | null {
  const s = (a: number, z: number) => String.fromCharCode(...b.subarray(a, z));
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return ['image/jpeg', 'jpg'];
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => b[i] === v)) return ['image/png', 'png'];
  if (['GIF87a', 'GIF89a'].includes(s(0, 6))) return ['image/gif', 'gif'];
  if (s(0, 4) === 'RIFF' && s(8, 12) === 'WEBP') return ['image/webp', 'webp'];
  return null;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    ...(origin === ORIGIN ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}),
  };
  const json = (x: unknown, status = 200) => new Response(JSON.stringify(x), { status, headers });
  try {
    if (origin && origin !== ORIGIN) throw fail('Origin not allowed', 403);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    const path = new URL(req.url).pathname.replace(/^.*\/league-media(?=\/|$)/, '');
    if (path === '/health') return json({ ok: true, release: 'v132', project: PROJECT });
    if (path !== '/upload' || req.method !== 'POST') throw fail('Not found', 404);

    const token = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
    if (!token) throw fail('Sign in to publishing to upload GIFs.', 401);
    let sub = '';
    try {
      const { payload } = await jwtVerify(token, JWKS, { issuer: 'https://securetoken.google.com/' + PROJECT, audience: PROJECT });
      sub = String(payload.sub || '');
    } catch (e) {
      console.warn('[league-media] token rejected', (e as Error).message);
      throw fail('Your sign-in has expired. Sign in to publishing again.', 401);
    }
    if (sub !== PUBLISHER_UID) throw fail('Only the league publisher can upload.', 403);

    const declared = Number(req.headers.get('content-length') || 0);
    if (declared > MAX_BYTES) throw fail('Choose an image smaller than 8 MB.', 413);
    const bytes = new Uint8Array(await req.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_BYTES) throw fail('Choose an image smaller than 8 MB.', 413);
    const kind = sniff(bytes);
    if (!kind) throw fail('Choose a JPG, PNG, WebP, or GIF file.', 415);

    // Content-addressed: the same file uploaded twice is stored once.
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map((x) => x.toString(16).padStart(2, '0')).join('');
    const name = `ranking/${hash}.${kind[1]}`;
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { error } = await db.storage.from('league-media').upload(name, bytes, { contentType: kind[0], upsert: true, cacheControl: '31536000' });
    if (error) { console.error('[league-media] upload failed', error.message); throw fail('The upload could not be saved. Try again.', 502); }
    const { data } = db.storage.from('league-media').getPublicUrl(name);
    return json({ url: data.publicUrl, bytes: bytes.length, type: kind[0] });
  } catch (e) {
    return json({ error: (e as any).message || 'Upload failed.' }, (e as any).status || 500);
  }
});
