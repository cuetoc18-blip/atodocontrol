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
  try {
    const contentType = request.headers.get('content-type') || '';

    // 1. Pedir URL firmada para subir
    if (contentType.includes('application/json')) {
      const body = await request.json();
      
      if (body.action === 'get-upload-url') {
        const fileName = `${Date.now()}-${(body.fileName || 'video.mp4').replace(/\s/g, '_')}`;
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
        const { titulo, descripcion, video_path } = body;
        if (!titulo || !video_path) {
          return new Response(JSON.stringify({ error: 'Faltan datos' }), { status: 400 });
        }
        const { data: publicUrl } = supabase.storage.from('reels-videos').getPublicUrl(video_path);
        const { data, error } = await supabase
          .from('reels')
          .insert({
            titulo,
            descripcion: descripcion || '',
            video_url: publicUrl.publicUrl,
            video_path,
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
