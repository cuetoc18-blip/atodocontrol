import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = import.meta.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

export function supabase() {
  if (!url || !serviceKey) throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export function anonClient() {
  if (!url || !anonKey) throw new Error('Faltan SUPABASE_URL o SUPABASE_ANON_KEY');
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

export function igPermalink(text) {
  const m = String(text || '').match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/i);
  return m ? `https://www.instagram.com/p/${m[1]}/` : null;
}

export function xStatusId(text) {
  const m = String(text || '').match(/(?:twitter|x)\.com\/[^/]+\/status\/(\d+)/i);
  return m ? m[1] : null;
}

export function fbPermalink(text) {
  const m = String(text || '').match(/facebook\.com\/(?:[^/]+\/)?(?:posts|videos|reel|share)\/[^?\s]+/i);
  return m ? (m[0].startsWith('http') ? m[0] : `https://www.facebook.com/${m[0]}`) : null;
}
