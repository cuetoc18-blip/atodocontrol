import { createClient } from '@supabase/supabase-js';

function credenciales() {
  const url = import.meta.env.SUPABASE_URL || 'https://hlqdkosclnmmdhasoupt.supabase.co';
  const key = import.meta.env.SUPABASE_ANON_KEY || 'sb_publishable_hw4WsIr-GvZU7PEu_KNNEw_tC-98Nst';
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

export function supabase() {
  return anonClient();
}

export function igPermalink(url = '') {
  const m = String(url).match(/instagram\.com\/(reel|p|tv)\/([A-Za-z0-9_-]+)/i);
  if (!m) return '';
  return `https://www.instagram.com/${m[1].toLowerCase()}/${m[2]}/`;
}

export function xStatusId(url = '') {
  const m = String(url).match(/(?:twitter|x)\.com\/(?:[^/\s]+\/)?(?:status|i\/web\/status|i\/status)\/(\d+)/i)
    || String(url).match(/\/status\/(\d+)/i);
  return m ? m[1] : '';
}

export function fbPermalink(url = '') {
  const u = String(url).trim();
  if (!/facebook\.com|fb\.watch/i.test(u)) return '';
  return u.split('?')[0];
}
