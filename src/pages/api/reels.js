import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  const { data, error } = await supabase
    .from('reels')
    .select('*')
    .eq('publicado', true)
    .order('created_at', { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify(data || []), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST({ request }) {
  // Verificar sesión
  const cookie = request.headers.get('cookie') || '';
  if (!cookie.includes('vb_session=')) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';

    // 1. Pedir URL firmada para subir
    if (contentType.includes('application/json')) {
      const body = await request.json();
      
      if (body.action === 'get-upload-url') {
        const raw = (body.fileName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileName = `${Date.now()}-${raw}`;
        const { data, error } = await supabase.storage
          .from('reels-videos')
          .createSignedUploadUrl(fileName);
        
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
        return new Response(JSON.stringify({ 
          signedUrl: data.signedUrl, 
          path: data.path,
          token: data.token 
        }));
      }

      // 2. Registrar el reel después de subir
      if (body.action === 'save-reel') {
        const { titulo, descripcion, video_path, imagen_path } = body;
        if (!titulo || !video_path) {
          return new Response(JSON.stringify({ error: 'Faltan datos' }), { status: 400 });
        }
        const { data: videoUrl } = supabase.storage.from('reels-videos').getPublicUrl(video_path);
        let imagen_url = null;
        if (imagen_path) {
          const { data: imgUrl } = supabase.storage.from('reels-videos').getPublicUrl(imagen_path);
          imagen_url = imgUrl.publicUrl;
        }
        const { data, error } = await supabase
          .from('reels')
          .insert({
            titulo,
            descripcion: descripcion || '',
            video_url: videoUrl.publicUrl,
            video_path,
            imagen_url,
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
