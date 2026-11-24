import { requireUser } from '../../../lib/session.js';
import { anonClient, supabase } from '../../../lib/supabase.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

async function esAdmin(s) {
  if (!s || !s.user || !s.user.id) return false;
  const { data } = await supabase().from('perfiles').select('rol').eq('id', s.user.id).maybeSingle();
  return data && data.rol === 'admin';
}

export async function GET({ params }) {
  const { data, error } = await anonClient().from('noticias').select('*').eq('id', params.id).eq('publicada', true).maybeSingle();
  if (error) return json({ error: error.message }, 500);
  if (!data) return json({ error: 'No existe' }, 404);
  return json(data);
}

export async function PUT({ params, request }) {
  const s = requireUser(request);
  if (!await esAdmin(s)) return json({ error: 'No autorizado' }, 401);
  const body = await request.json();
  const { data, error } = await supabase().from('noticias').update(body).eq('id', params.id).select().single();
  if (error) return json({ error: error.message }, 500);
  return json(data);
}

export async function DELETE({ params, request }) {
  const s = requireUser(request);
  if (!await esAdmin(s)) return json({ error: 'No autorizado' }, 401);
  const { error } = await supabase().from('noticias').delete().eq('id', params.id);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}
