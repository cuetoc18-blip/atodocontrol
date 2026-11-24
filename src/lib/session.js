import crypto from 'crypto';

const COOKIE = 'vb_session';
const SECRET = process.env.SESSION_SECRET || import.meta.env.SESSION_SECRET;

function firmar(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verificar(token) {
  if (!token || !SECRET) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  const a = Buffer.from(sig || ''), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (!data.user || !data.user.id) return null;
    return data;
  } catch (e) {
    return null;
  }
}

export function sessionCookie(payload) {
  return `${COOKIE}=${firmar(payload)}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=43200`;
}

export function clearCookie() {
  return `${COOKIE}=; HttpOnly; Secure; Path=/; Max-Age=0`;
}

export function requireUser(request) {
  const raw = request.headers.get('cookie') || '';
  const m = raw.match(new RegExp(COOKIE + '=([^;]+)'));
  if (!m) return null;
  return verificar(decodeURIComponent(m[1]));
}
