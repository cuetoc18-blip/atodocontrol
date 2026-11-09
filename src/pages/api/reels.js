import { createClient } from '@supabase/supabase-js';

export const prerender = false;

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, key);
}

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('reels')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return new Response(JSON.stringify({ error: 'Tabla reels: ' + error.message }), { status: 500 });
    }
    return new Response(JSON.stringify(data || []), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

export async function POST({ request }) {
  try {
    const supabase = getSupabase();
    const form = await request.formData();
    const titulo = String(form.get('titulo') || '').trim();
    const file = form.get('video');

    if (!titulo) {
      return new Response(JSON.stringify({ error: 'Falta el título' }), { status: 400 });
    }
    if (!file || !file.name) {
      return new Response(JSON.stringify({ error: 'No llegó el archivo de video' }), { status: 400 });
    }

    const ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
    const path = `reels/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('noticias-imagenes')
      .upload(path, file, { contentType: file.type || 'video/mp4', upsert: true });

    if (upErr) {
      return new Response(JSON.stringify({ error: 'Storage: ' + upErr.message }), { status: 500 });
    }

    const { data, error } = await supabase
      .from('reels')
      .insert({ titulo, video_path: path })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: 'Insert: ' + error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Excepción: ' + e.message }), { status: 500 });
  }
}
