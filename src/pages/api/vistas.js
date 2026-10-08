import { anonClient } from '../../lib/supabase.js';

export async function POST({ request }) {
  const { nid } = await request.json().catch(() => ({}));
  if (!nid) return new Response(JSON.stringify({ error: 'falta id' }), { status: 400 });
  const { error } = await anonClient().rpc('increment_vistas', { nid });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
}
