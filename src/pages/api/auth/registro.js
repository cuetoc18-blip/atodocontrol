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
    const { email, password, nombre, genero, avatar_url } = await request.json();
    if (!email || !password || !nombre) {
      return new Response(JSON.stringify({ error: 'Faltan datos' }), { status: 400 });
    }

    const { data: existe } = await supabase.from('perfiles').select('id').eq('email', email).maybeSingle();
    if (existe) return new Response(JSON.stringify({ error: 'El correo ya está registrado' }), { status: 400 });

    const password_hash = hash(password);
    const { data, error } = await supabase.from('perfiles').insert({
      email,
      nombre,
      password_hash,
      genero: genero || 'm',
      avatar_url: avatar_url || null
    }).select('id, nombre').single();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    const token = firmar({
      uid: data.id,
      email,
      nombre: data.nombre,
      genero: genero || 'm',
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7
    });

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
