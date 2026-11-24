import { supabase } from '../../../lib/supabase.js';
import { sessionCookie } from '../../../lib/session.js';
import crypto from 'crypto';

const SECRET = process.env.SESSION_SECRET || import.meta.env.SESSION_SECRET;
if (!SECRET || SECRET.length < 32) throw new Error('SESSION_SECRET es obligatorio (mínimo 32 caracteres)');

function hashPassword(password) {
  return crypto.pbkdf2Sync(password, SECRET, 100000, 32, 'sha256').toString('hex');
}

export async function POST({ request }) {
  try {
    let body = {};
    try { body = await request.json(); } catch (e) {}
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!email || !password) {
      return new Response(JSON.stringify({ ok: false, error: 'Completa correo y contraseña' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const admin = supabase();
    const { data: perfil, error } = await admin
      .from('perfiles')
      .select('id, email, password_hash, rol')
      .eq('email', email)
      .maybeSingle();

    if (error || !perfil || !perfil.password_hash) {
      return new Response(JSON.stringify({ ok: false, error: 'Credenciales inválidas' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const hash = hashPassword(password);
    if (hash !== perfil.password_hash) {
      return new Response(JSON.stringify({ ok: false, error: 'Credenciales inválidas' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (String(perfil.rol || '').trim().toLowerCase() !== 'admin') {
      return new Response(JSON.stringify({ ok: false, error: 'No tienes permiso de administrador' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const payload = {
      user: { id: perfil.id, email: perfil.email }
    };
    return new Response(JSON.stringify({ ok: true, user: payload.user }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': sessionCookie(payload)
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message || 'Error de servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
