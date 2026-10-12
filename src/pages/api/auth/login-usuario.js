import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const SECRET = process.env.SESSION_SECRET || 'cambia-esto';

function firmar(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export async function POST({ request }) {
  const { email, password } = await request.json();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return new Response(JSON.stringify({ error: 'Correo o clave incorrectos' }), { status: 401 });

  const { data: perfil } = await supabase.from('perfiles').select('nombre').eq('id', data.user.id).single();
  const token = firmar({ uid: data.user.id, email, nombre: perfil?.nombre || '', exp: Date.now() + 1000 * 60 * 60 * 24 * 7 });

  return new Response(JSON.stringify({ ok: true, nombre: perfil?.nombre || '' }), {
    headers: {
      'Set-Cookie': `usuario_session=${token}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${60 * 60 * 24 * 7}`,
      'Content-Type': 'application/json'
    }
  });
}
