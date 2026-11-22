export const prerender = false;

export async function GET({ params, request }) {
  try {
    let path = params.path;
    if (Array.isArray(path)) path = path.join('/');
    if (!path) {
      return new Response('Falta path', { status: 400 });
    }

    const base = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
    if (!base) {
      return new Response('Falta SUPABASE_URL', { status: 500 });
    }

    let bucket = 'noticias-imagenes';
    let filePath = path;

    if (path.startsWith('reels/')) {
      bucket = 'reels-videos';
      filePath = path.slice(6);
    }

    const target = `${base}/storage/v1/object/public/${bucket}/${filePath}`;
    const upstream = await fetch(target);

    if (!upstream.ok) {
      return new Response('No encontrado', { status: upstream.status });
    }

    const buffer = await upstream.arrayBuffer();
    const total = buffer.byteLength;
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';

    const range = request.headers.get('range');
    if (range && (contentType.startsWith('video/') || contentType.startsWith('audio/'))) {
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
