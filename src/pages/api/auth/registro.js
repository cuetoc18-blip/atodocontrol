import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);
const SECRET = process.env.SESSION_SECRET || 'cambia-esto';

function firmar(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export async function POST({ request }) {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Faltan variables de entorno en Netlify' }), { status: 500 });
    }

    const { email, password, nombre, avatar_url } = await request.json();
    if (!email || !password || !nombre) {
      return new Response(JSON.stringify({ error: 'Faltan datos' }), { status: 400 });
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) return new Response(JSON.stringify({ error: authError.message }), { status: 400 });

    const { error: perfilError } = await supabase.from('perfiles').insert({
      id: authData.user.id,
      email,
      nombre,
      avatar_url: avatar_url || null
    });
    if (perfilError) return new Response(JSON.stringify({ error: perfilError.message }), { status: 500 });

    const token = firmar({ uid: authData.user.id, email, nombre, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 });

    return new Response(JSON.stringify({ ok: true, nombre }), {
      headers: {
        'Set-Cookie': `usuario_session=${token}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${60 * 60 * 24 * 7}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
