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

export function xStatusId(url = '') {
  const m = String(url).match(/(?:twitter|x)\.com\/[^/]+\/status\/(\d+)/i);
  return m ? m[1] : '';
}

export function fbPermalink(url = '') {
  const u = String(url).trim();
  if (!/facebook\.com|fb\.watch/i.test(u)) return '';
  return u.split('?')[0];
}
