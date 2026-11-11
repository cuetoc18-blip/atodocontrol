import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

function getIP(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

export async function POST({ request }) {
  try {
    const { reel_id } = await request.json();
    if (!reel_id) {
      return new Response(JSON.stringify({ error: 'Falta reel_id' }), { status: 400 });
    }

    const ip = getIP(request);

    // Verificar si ya dio like
    const { data: existing } = await supabase
      .from('reel_likes')
      .select('id')
      .eq('reel_id', reel_id)
      .eq('ip', ip)
      .maybeSingle();

    if (existing) {
      // Quitar like
      await supabase.from('reel_likes').delete().eq('id', existing.id);
    } else {
      // Agregar like
      await supabase.from('reel_likes').insert({ reel_id, ip });
    }

    // Contar likes
    const { count } = await supabase
      .from('reel_likes')
      .select('*', { count: 'exact', head: true })
      .eq('reel_id', reel_id);

    return new Response(JSON.stringify({ likes: count || 0, liked: !existing }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function GET({ request }) {
  const url = new URL(request.url);
  const reel_id = url.searchParams.get('reel_id');
  if (!reel_id) {
    return new Response(JSON.stringify({ error: 'Falta reel_id' }), { status: 400 });
  }

  const ip = getIP(request);

  const { count } = await supabase
    .from('reel_likes')
    .select('*', { count: 'exact', head: true })
    .eq('reel_id', reel_id);

  const { data: existing } = await supabase
    .from('reel_likes')
    .select('id')
    .eq('reel_id', reel_id)
    .eq('ip', ip)
    .maybeSingle();

  return new Response(JSON.stringify({ likes: count || 0, liked: !!existing }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
