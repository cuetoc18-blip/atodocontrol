import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ url }) => {
  const id = url.searchParams.get('id');
  if (!id) return new Response(null, { status: 302, headers: { Location: '/' } });
  return new Response(null, {
    status: 301,
    headers: { Location: `/articulo/${id}` },
  });
};
