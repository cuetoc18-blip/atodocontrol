import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function getUserFromCookie(request) {
  const raw = request.headers.get('cookie') || '';
  const m = raw.match(/vb_session=([^;]+)/);
  if (!m) return null;
  try {
    const token = decodeURIComponent(m[1]);
    const body = token.split('.')[0];
    if (!body) return null;
    const data = JSON.parse(Buffer.from(body, 'base64url').toString());
    return data && data.user && data.user.id ? data.user : null;
  } catch (e) {
    return null;
  }
}

async function esAdmin(user) {
  if (!user || !user.id) return false;
  const { data } = await supabase.from('perfiles').select('rol').eq('id', user.id).maybeSingle();
  return data && data.rol === 'admin';
}

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

  if (error) return json({ error: error.message }, 500);

  const reels = (data || []).map(r => ({
    ...r,
    video_url: toMediaUrl(r.video_path || r.video_url),
    imagen_url: toMediaUrl(r.imagen_url),
    hls_url: r.hls_path ? `/media/reels/${r.hls_path}` : null
  }));

  return json(reels);
}

export async function POST({ request }) {
  const user = getUserFromCookie(request);
  if (!await esAdmin(user)) return json({ error: 'No autorizado' }, 401);

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

        if (error) return json({ error: error.message }, 500);
        return json({
          signedUrl: data.signedUrl,
          path: data.path || fileName,
          token: data.token
        });
      }

      if (body.action === 'create' || body.action === 'save-reel') {
        const { titulo, descripcion, hls_path, imagen_path, video_path } = body;
        const path = hls_path || video_path;
        if (!titulo || !path) return json({ error: 'Faltan datos' }, 400);

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

        if (error) return json({ error: error.message }, 500);
        return json(data, 201);
      }
    }

    return json({ error: 'Acción no válida' }, 400);
  } catch (e) {
    return json({ error: 'Error: ' + (e.message || String(e)) }, 500);
  }
}
