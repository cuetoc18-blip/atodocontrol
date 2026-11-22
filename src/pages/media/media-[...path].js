export const prerender = false;

const BASE = process.env.SUPABASE_URL || '';

export async function GET({ params, request }) {
  try {
    const path = params.path;
    if (!path) {
      return new Response('Falta path', { status: 400 });
    }

    const base = BASE.replace(/\/$/, '');
    const target = `${base}/storage/v1/object/public/noticias-imagenes/${path}`;

    const upstream = await fetch(target);
    if (!upstream.ok) {
      return new Response('No encontrado', { status: upstream.status });
    }

    const buffer = await upstream.arrayBuffer();
    const total = buffer.byteLength;
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';

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
