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
    const form = await request.formData();
    const titulo = form.get('titulo') || '';
    const file = form.get('video');

    if (!titulo || !file || !file.name) {
      return new Response(JSON.stringify({ error: 'Faltan el título o el video' }), { status: 400 });
    }

    const ext = file.name.split('.').pop().toLowerCase();
    const path = `reels/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('noticias-imagenes')
      .upload(path, file, { contentType: file.type || 'video/mp4', upsert: true });

    if (upErr) throw upErr;

    const { data: pub } = supabase.storage.from('noticias-imagenes').getPublicUrl(path);
    const video_url = pub.publicUrl;

    const { data, error } = await supabase
      .from('reels')
      .insert({ titulo, video_url })
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
