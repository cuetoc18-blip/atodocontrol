import { requireUser } from '../../lib/session.js';
import { supabase } from '../../lib/supabase.js';

async function esAdmin(s) {
  if (!s || !s.user || !s.user.id) return false;
  const { data } = await supabase().from('perfiles').select('rol').eq('id', s.user.id).maybeSingle();
  return data && data.rol === 'admin';
}

export async function POST({ request }) {
  const s = requireUser(request);
  if (!await esAdmin(s)) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  const form = await request.formData();
  const file = form.get('archivo');
  if (!file) return new Response(JSON.stringify({ error: 'falta archivo' }), { status: 400 });
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `articulos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const sb = supabase();
  const { error } = await sb.storage.from('noticias-imagenes').upload(path, bytes, {
    contentType: file.type || 'image/jpeg',
    upsert: false
  });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  const { data } = sb.storage.from('noticias-imagenes').getPublicUrl(path);
  return new Response(JSON.stringify({ url: data.publicUrl }), { headers: { 'Content-Type': 'application/json' } });
}
