import { requireUser } from '../../../lib/session.js';
import { supabase } from '../../../lib/supabase.js';

export async function GET({ request }) {
  const s = requireUser(request);
  if (!s || !s.user || !s.user.id) {
    return new Response(JSON.stringify({ ok: false }), { status: 401 });
  }
  try {
    const admin = supabase();
    const { data: perfil } = await admin
      .from('perfiles')
      .select('id, email, rol')
      .eq('id', s.user.id)
      .maybeSingle();

    if (!perfil || perfil.rol !== 'admin') {
      return new Response(JSON.stringify({ ok: false, error: 'No autorizado' }), { status: 403 });
    }

    return new Response(JSON.stringify({
      ok: true,
      user: { id: perfil.id, email: perfil.email }
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false }), { status: 401 });
  }
}
