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
  const form = await request.formData();
  const titulo = form.get('titulo');
  const descripcion = form.get('descripcion') || '';
  const videoFile = form.get('video');

  if (!titulo || !videoFile) {
    return new Response(JSON.stringify({ error: 'Título y video son obligatorios' }), { status: 400 });
  }

  // Subir video a Storage
  const fileName = `${Date.now()}-${videoFile.name.replace(/\s/g, '_')}`;
  const { error: uploadError } = await supabase.storage
    .from('reels-videos')
    .upload(fileName, videoFile, {
      contentType: videoFile.type,
      upsert: false
    });

  if (uploadError) {
    return new Response(JSON.stringify({ error: 'Error subiendo video: ' + uploadError.message }), { status: 500 });
  }

  const { data: publicUrl } = supabase.storage
    .from('reels-videos')
    .getPublicUrl(fileName);

  // Guardar en tabla
  const { data, error } = await supabase
    .from('reels')
    .insert({
      titulo,
      descripcion,
      video_url: publicUrl.publicUrl,
      publicado: true
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data), { status: 201 });
}
