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
    const path = params.path;

    if (!path) {
      return new Response('Falta path', { status: 400 });
    }

    const { data, error } = await supabase.storage
      .from('noticias-imagenes')
      .download(path);

    if (error || !data) {
      return new Response('No encontrado', { status: 404 });
    }

    const buffer = await data.arrayBuffer();
    const total = buffer.byteLength;
    const contentType = path.endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream';

    const range = request.headers.get('range');
    if (range && contentType.startsWith('video/')) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 1024 * 1024, total - 1);
      const chunk = buffer.slice(start, end + 1);

      return new Response(chunk, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${total}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunk.byteLength),
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400'
        }
      });
    }

    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(total),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch (e) {
    return new Response('Error: ' + e.message, { status: 500 });
  }
}
