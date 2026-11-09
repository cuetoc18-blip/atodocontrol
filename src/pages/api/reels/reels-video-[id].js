import { createClient } from '@supabase/supabase-js';

export const prerender = false;

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function GET({ params }) {
  try {
    const supabase = getSupabase();
    const { data: reel, error } = await supabase
      .from('reels')
      .select('video_path')
      .eq('id', params.id)
      .single();

    if (error || !reel?.video_path) {
      return new Response('No encontrado', { status: 404 });
    }

    const { data: file, error: dlErr } = await supabase.storage
      .from('noticias-imagenes')
      .download(reel.video_path);

    if (dlErr || !file) {
      return new Response('Error al obtener video', { status: 500 });
    }

    const buffer = await file.arrayBuffer();
    return new Response(buffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch (e) {
    return new Response('Error', { status: 500 });
  }
}
