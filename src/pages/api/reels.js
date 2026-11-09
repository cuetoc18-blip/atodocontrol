import { createClient } from '@supabase/supabase-js';

export const prerender = false;

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('reels')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return new Response(JSON.stringify(data || []), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST({ request }) {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    const { titulo, url, imagen_url } = body;

    if (!titulo || !url) {
      return new Response(JSON.stringify({ error: 'Faltan datos' }), { status: 400 });
    }

    const { data, error } = await supabase
      .from('reels')
      .insert({ titulo, url, imagen_url: imagen_url || null })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function DELETE({ params }) {
  try {
    const supabase = getSupabase();
    const id = params.id;
    const { error } = await supabase.from('reels').delete().eq('id', id);
    if (error) throw error;
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
