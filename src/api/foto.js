export const prerender = false;

export async function GET({ url }) {
  const path = url.searchParams.get('p') || '';
  if (!path || path.includes('..')) return new Response('No', { status: 400 });
  const base = import.meta.env.SUPABASE_URL || 'https://hlqdkosclnmmdhasoupt.supabase.co';
  const origen = `${base}/storage/v1/object/public/noticias-imagenes/${path}`;
  const res = await fetch(origen);
  if (!res.ok) return new Response('No encontrada', { status: 404 });
  return new Response(res.body, {
    headers: {
      'Content-Type': res.headers.get('content-type') || 'image/jpeg',
      'Cache-Control': 'public, max-age=86400'
    }
  });
}
