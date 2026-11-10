import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

async function asegurarBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const existe = buckets?.some(b => b.name === 'reels-videos');
  if (!existe) {
    await supabase.storage.createBucket('reels-videos', {
      public: true,
      fileSizeLimit: 50 * 1024 * 1024
    });
  }
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
  return new Response(JSON.stringify(data || []), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST({ request }) {
  try {
    await asegurarBucket();

    const form = await request.formData();
    const titulo = form.get('titulo');
    const descripcion = form.get('descripcion') || '';
    const videoFile = form.get('video');

    if (!titulo || !videoFile || !(videoFile instanceof File)) {
      return new Response(JSON.stringify({ error: 'Título y video son obligatorios' }), { status: 400 });
    }

    if (videoFile.size > 45 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'El video es muy grande. Máximo 45 MB' }), { status: 400 });
    }

    const fileName = `${Date.now()}-${videoFile.name.replace(/\s/g, '_')}`;
    const buffer = await videoFile.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('reels-videos')
      .upload(fileName, buffer, {
        contentType: videoFile.type || 'video/mp4',
        upsert: false
      });

    if (uploadError) {
      return new Response(JSON.stringify({ error: 'Error subiendo video: ' + uploadError.message }), { status: 500 });
    }

    const { data: publicUrl } = supabase.storage
      .from('reels-videos')
      .getPublicUrl(fileName);

    const { data, error } = await supabase
      .from('reels')
      .insert({
        titulo,
        descripcion,
        video_url: publicUrl.publicUrl,
        video_path: fileName,
        publicado: true
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: 'Error guardando reel: ' + error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 201 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Error del servidor: ' + (e.message || String(e)) }), { status: 500 });
  }
}
