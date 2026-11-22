import { requireUser } from '../../lib/session.js';
import { userClient } from '../../lib/supabase.js';

const BASE = 'http://13.140.183.160:8000';

export async function POST({ request }) {
  const s = requireUser(request);
  if (!s) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  const form = await request.formData();
  const file = form.get('archivo');
  if (!file) return new Response(JSON.stringify({ error: 'falta archivo' }), { status: 400 });
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `articulos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await userClient(s.access_token).storage.from('noticias-imagenes').upload(path, bytes, {
    contentType: file.type || 'image/jpeg',
    upsert: false
  });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  const url = `${BASE}/storage/v1/object/public/noticias-imagenes/${path}`;
  return new Response(JSON.stringify({ url }), { headers: { 'Content-Type': 'application/json' } });
}
