import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);
const SECRET = process.env.SESSION_SECRET || 'cambia-esto';

function leerCookie(token) {
  if (!token || !token.includes('.')) return null;
  try {
    const [body, sig] = token.split('.');
    const ok = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
    if (ok !== sig) return null;
    const data = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export async function GET({ params }) {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Faltan variables de entorno' }), { status: 500 });
    }
    const { noticia_id } = params;

    const { data: comentarios, error } = await supabase
      .from('comentarios')
      .select('id, texto, created_at, usuario_id')
      .eq('noticia_id', noticia_id)
      .order('created_at', { ascending: false });

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    if (!comentarios?.length) {
      return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } });
    }

    const ids = [...new Set(comentarios.map(c => c.usuario_id).filter(Boolean))];
    const { data: perfiles } = await supabase
      .from('perfiles')
      .select('id, nombre, avatar_url')
      .in('id', ids);

    const map = {};
    (perfiles || []).forEach(p => { map[p.id] = p; });

    const resultado = comentarios.map(c => ({
      id: c.id,
      texto: c.texto,
      created_at: c.created_at,
      perfiles: map[c.usuario_id] || null
    }));

    return new Response(JSON.stringify(resultado), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function POST({ request, params }) {
  try {
    const cookie = request.headers.get('cookie') || '';
    const match = cookie.match(/usuario_session=([^;]+)/);
    const sesion = match ? leerCookie(match[1]) : null;
    if (!sesion) return new Response(JSON.stringify({ error: 'Debes iniciar sesión' }), { status: 401 });

    const { texto } = await request.json();
    if (!texto) return new Response(JSON.stringify({ error: 'Falta texto' }), { status: 400 });

    const { error } = await supabase.from('comentarios').insert({
      noticia_id: params.noticia_id,
      usuario_id: sesion.uid,
      texto
    });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
