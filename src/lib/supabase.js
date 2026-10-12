import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL;
const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

export function supabase() {
  if (!url || !key) throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false } });
}

// Helpers that the article page uses
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
  return m ? m[0].startsWith('http') ? m[0] : `https://www.facebook.com/${m[0]}` : null;
}
