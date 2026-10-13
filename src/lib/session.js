const COOKIE = 'vb_session';

function valorCookie(payload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export function sessionCookie(payload) {
  return `${COOKIE}=${valorCookie(payload)}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=43200`;
}

export function clearCookie() {
  return `${COOKIE}=; HttpOnly; Secure; Path=/; Max-Age=0`;
}

export function requireUser(request) {
  const raw = request.headers.get('cookie') || '';
  const m = raw.match(new RegExp(COOKIE + '=([^;]+)'));
  if (!m) return null;
  try {
    const data = JSON.parse(Buffer.from(decodeURIComponent(m[1]), 'base64url').toString());
    if (!data.access_token) return null;
    return data;
  } catch (e) {
    return null;
  }
}
