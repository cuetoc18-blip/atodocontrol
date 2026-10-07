import { createClient } from '@supabase/supabase-js';

function credenciales() {
  const url = import.meta.env.SUPABASE_URL;
  const key = import.meta.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Faltan SUPABASE_URL o SUPABASE_ANON_KEY en Netlify');
  return { url, key };
}

export function anonClient() {
  const { url, key } = credenciales();
  return createClient(url, key, { auth: { persistSession: false } });
}

export function userClient(token) {
  const { url, key } = credenciales();
  return createClient(url, key, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
}
