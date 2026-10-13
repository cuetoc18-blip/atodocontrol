import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const SECRET = process.env.SESSION_SECRET || 'cambia-esto';

function hash(password) {
  return crypto.createHash('sha256').update(password + SECRET).digest('hex');
}

function firmar(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export async function POST({ request }) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return new Response(JSON.stringify({ error: 'Faltan datos' }), { status: 400 });

    const { data, error } = await supabase.from('perfiles').select('id, nombre, password_hash').eq('email', email).maybeSingle();
    if (error || !data) return new Response(JSON.stringify({ error: 'Correo o clave incorrectos' }), { status: 401 });

    if (data.password_hash !== hash(password)) {
      return new Response(JSON.stringify({ error: 'Correo o clave incorrectos' }), { status: 401 });
    }

    const token = firmar({ uid: data.id, email, nombre: data.nombre, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 });
    return new Response(JSON.stringify({ ok: true, nombre: data.nombre }), {
      headers: {
        'Set-Cookie': `usuario_session=${token}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${60 * 60 * 24 * 7}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
