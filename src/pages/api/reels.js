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
    const titulo = String(form.get('titulo') || '').trim();
    const file = form.get('video');

    if (!titulo || !file || !file.name) {
      return new Response(JSON.stringify({ error: 'Faltan título o video' }), { status: 400 });
    }

    const ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
    const path = `reels/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('noticias-imagenes')
      .upload(path, file, { contentType: file.type || 'video/mp4', upsert: true });

    if (upErr) {
      return new Response(JSON.stringify({ error: 'Storage: ' + upErr.message }), { status: 500 });
    }

    // Guardamos solo el path. La URL pública pasa por nuestro servidor.
    const { data, error } = await supabase
      .from('reels')
      .insert({ titulo, video_path: path })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: 'Tabla: ' + error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
