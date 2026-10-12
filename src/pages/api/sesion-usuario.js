import crypto from 'crypto';

const SECRET = process.env.SESSION_SECRET || 'cambia-esto';

function leerCookie(token) {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const ok = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  if (ok !== sig) return null;
  const data = JSON.parse(Buffer.from(body, 'base64url').toString());
  if (data.exp < Date.now()) return null;
  return data;
}

export async function GET({ request }) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/usuario_session=([^;]+)/);
  const sesion = match ? leerCookie(match[1]) : null;
  if (!sesion) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  return new Response(JSON.stringify({ nombre: sesion.nombre }), { headers: { 'Content-Type': 'application/json' } });
}
