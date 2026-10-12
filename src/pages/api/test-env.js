export async function GET() {
  return new Response(JSON.stringify({
    tiene_url: !!process.env.SUPABASE_URL,
    tiene_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    tiene_secret: !!process.env.SESSION_SECRET,
    url_preview: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.slice(0, 30) + '...' : null
  }, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  });
}
