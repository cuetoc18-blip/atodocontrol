import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://hlqdkosclnmmdhasoupt.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_hw4WsIr-GvZU7PEu_KNNEw_tC-98Nst';

export function supabase() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export function igPermalink(url = '') {
  const m = String(url).match(/instagram\.com\/(reel|p|tv)\/([A-Za-z0-9_-]+)/i);
  if (!m) return '';
  return `https://www.instagram.com/${m[1].toLowerCase()}/${m[2]}/`;
}
