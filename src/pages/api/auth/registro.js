import { supabase } from '../../../lib/supabase.js';
import crypto from 'crypto';

const SECRET = process.env.SESSION_SECRET || import.meta.env.SESSION_SECRET;
if (!SECRET || SECRET.length < 32) throw new Error('SESSION_SECRET es obligatorio (mínimo 32 caracteres)');

function hashPassword(password) {
  return crypto.pbkdf2Sync(password, SECRET, 100000, 32, 'sha256').toString('hex');
}

function firmar(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export async function POST({ request }) {
  const { email, password, nombre, genero, avatar_url } = await request.json();
  if (!email || !password || !nombre) {
    return new Response(JSON.stringify({ error: 'Faltan datos' }), { status: 400 });
  }

  const admin = supabase();
  const { data: existente } = await admin.from('perfiles').select('id').eq('email', email.toLowerCase()).maybeSingle();
  if (existente) {
    return new Response(JSON.stringify({ error: 'El correo ya está registrado' }), { status: 400 });
  }

  const id = crypto.randomUUID();
  const { error } = await admin.from('perfiles').insert({
    id,
    email: email.toLowerCase(),
    nombre,
    genero: genero || 'm',
    avatar_url: avatar_url || null,
    rol: 'usuario',
    password_hash: hashPassword(password)
  });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const token = firmar({
    uid: id,
    email: email.toLowerCase(),
    nombre,
    genero: genero || 'm',
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7
  });

  return new Response(JSON.stringify({ ok: true, nombre }), {
    headers: {
      'Set-Cookie': `usuario_session=${token}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${60 * 60 * 24 * 7}`,
      'Content-Type': 'application/json'
    }
  });
}
