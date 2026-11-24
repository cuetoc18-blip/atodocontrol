import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

function toMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith('/media/')) return path;
  const name = path.split('/').pop();
  return `/media/reels/${name}`;
}

export async function GET() {
  const { data, error } = await supabase
    .from('reels')
    .select('*')
    .eq('publicado', true)
    .order('created_at', { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const reels = (data || []).map(r => ({
    ...r,
    video_url: toMediaUrl(r.video_path || r.video_url),
    imagen_url: toMediaUrl(r.imagen_url),
    hls_url: r.hls_path ? `/media/reels/${r.hls_path}` : null
  }));

  return new Response(JSON.stringify(reels), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST({ request }) {
  const cookie = request.headers.get('cookie') || '';
  if (!cookie.includes('vb_session=')) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();

      if (body.action === 'get-upload-url') {
        const raw = (body.fileName || 'file').replace(/[^a-zA-Z0-9._/-]/g, '_');
        const fileName = raw.includes('/') ? raw : `${Date.now()}-${raw}`;
        const { data, error } = await supabase.storage
          .from('reels-videos')
          .createSignedUploadUrl(fileName);

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
        return new Response(JSON.stringify({
          signedUrl: data.signedUrl,
          path: data.path || fileName,
          token: data.token
        }));
      }

      if (body.action === 'create' || body.action === 'save-reel') {
        const { titulo, descripcion, hls_path, imagen_path, video_path } = body;
        const path = hls_path || video_path;
        if (!titulo || !path) {
          return new Response(JSON.stringify({ error: 'Faltan datos' }), { status: 400 });
        }

        const video_url = `/media/reels/${path}`;
        const imagen_url = imagen_path ? `/media/reels/${imagen_path}` : null;

        const { data, error } = await supabase
          .from('reels')
          .insert({
            titulo,
            descripcion: descripcion || '',
            video_url,
            video_path: path,
            imagen_url,
            hls_path: path,
            publicado: true
          })
          .select()
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
        return new Response(JSON.stringify(data), { status: 201 });
      }
    }

    return new Response(JSON.stringify({ error: 'Acción no válida' }), { status: 400 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Error: ' + (e.message || String(e)) }), { status: 500 });
  }
}
