import { requireUser } from '../../lib/session.js';
import { anonClient, supabase } from '../../lib/supabase.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function esAdmin(s) {
  if (!s || !s.user || !s.user.id) return false;
  const { data } = await supabase().from('perfiles').select('rol').eq('id', s.user.id).maybeSingle();
  return data && data.rol === 'admin';
}

export async function GET({ request }) {
  const url = new URL(request.url);
  const admin = url.searchParams.get('admin') === '1';
  if (admin) {
    const s = requireUser(request);
    if (!await esAdmin(s)) return json({ ok: false, error: 'No autorizado' }, 401);
    const { data, error } = await supabase().from('noticias').select('*').order('created_at', { ascending: false });
    if (error) return json({ error: error.message }, 500);
    return json(data || []);
  }
  let q = anonClient().from('noticias').select('id,titulo,resumen,categoria,imagen_url,instagram_url,publicada,es_portada,fecha_publicacion,created_at').eq('publicada', true).order('fecha_publicacion', { ascending: false }).limit(16);
  const cat = url.searchParams.get('cat');
  if (cat) q = q.eq('categoria', cat);
  const { data, error } = await q;
  if (error) return json({ error: error.message }, 500);
  return json(data || []);
}

export async function POST({ request }) {
  const s = requireUser(request);
  if (!await esAdmin(s)) return json({ error: 'No autorizado' }, 401);
  const body = await request.json();
  const { data, error } = await supabase().from('noticias').insert([body]).select().single();
  if (error) return json({ error: error.message }, 500);
  return json(data);
}
