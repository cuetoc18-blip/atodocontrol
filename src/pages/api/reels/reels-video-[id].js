import { createClient } from '@supabase/supabase-js';

export const prerender = false;

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function GET({ params, request }) {
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
    const total = buffer.byteLength;

    const range = request.headers.get('range');
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
      const chunk = buffer.slice(start, end + 1);

      return new Response(chunk, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${total}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunk.byteLength),
          'Content-Type': 'video/mp4',
          'Cache-Control': 'public, max-age=86400'
        }
      });
    }

    return new Response(buffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': String(total),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch (e) {
    return new Response('Error: ' + e.message, { status: 500 });
  }
}
