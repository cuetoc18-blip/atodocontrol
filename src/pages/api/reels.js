import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

const SECRET = process.env.SESSION_SECRET || import.meta.env.SESSION_SECRET;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function verificarSesion(request) {
  if (!SECRET) return null;
  const raw = request.headers.get('cookie') || '';
  const m = raw.match(/vb_session=([^;]+)/);
  if (!m) return null;
  try {
    const token = decodeURIComponent(m[1]);
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [body, sig] = parts;
    const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const data = JSON.parse(Buffer.from(body, 'base64url').toString());
    return data && data.user && data.user.id ? data : null;
  } catch (e) {
    return null;
  }
}

async function esAdmin(sesion) {
  if (!sesion || !sesion.user || !sesion.user.id) return false;
  const { data } = await supabase.from('perfiles').select('rol').eq('id', sesion.user.id).maybeSingle();
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
  const sesion = verificarSesion(request);
  if (!await esAdmin(sesion)) return json({ error: 'No autorizado' }, 401);

  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const titulo = form.get('titulo')?.toString()?.trim();
      const descripcion = form.get('descripcion')?.toString()?.trim() || '';
      const files = form.getAll('hls');
      const imagen = form.get('imagen');

      if (!titulo || files.length === 0) return json({ error: 'Faltan datos' }, 400);

      const folder = `reel-${Date.now()}`;
      let hls_path = null;
      let imagen_path = null;

      for (const file of files) {
        if (!(file instanceof File)) continue;
        const path = `${folder}/${file.name}`;
        const buf = Buffer.from(await file.arrayBuffer());
        const { error } = await supabase.storage.from('reels-videos').upload(path, buf, {
          contentType: file.name.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp2t',
          upsert: true
        });
        if (error) return json({ error: 'Storage: ' + error.message }, 500);
        if (file.name.endsWith('.m3u8')) hls_path = path;
      }

      if (imagen instanceof File && imagen.size > 0) {
        imagen_path = `${folder}/portada.jpg`;
        const buf = Buffer.from(await imagen.arrayBuffer());
        const { error } = await supabase.storage.from('reels-videos').upload(imagen_path, buf, {
          contentType: imagen.type || 'image/jpeg',
          upsert: true
        });
        if (error) return json({ error: 'Portada: ' + error.message }, 500);
      }

      if (!hls_path) return json({ error: 'No se encontró index.m3u8' }, 400);

      const video_url = `/media/reels/${hls_path}`;
      const imagen_url = imagen_path ? `/media/reels/${imagen_path}` : null;

      const { data, error } = await supabase
        .from('reels')
        .insert({
          titulo,
          descripcion,
          video_url,
          video_path: hls_path,
          imagen_url,
          hls_path,
          publicado: true
        })
        .select()
        .single();

      if (error) return json({ error: error.message }, 500);
      return json(data, 201);
    }

    return json({ error: 'Usa multipart/form-data' }, 400);
  } catch (e) {
    return json({ error: 'Error: ' + (e.message || String(e)) }, 500);
  }
}
