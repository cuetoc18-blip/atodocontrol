import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  import.meta.env.PUBLIC_SUPABASE_URL || 'https://hlqdkosclnmmdhasoupt.supabase.co';
export const SUPABASE_ANON_KEY =
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_hw4WsIr-GvZU7PEu_KNNEw_tC-98Nst';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type Noticia = {
  id: string;
  titulo: string;
  resumen: string | null;
  contenido: string | null;
  categoria: string | null;
  imagen_url: string | null;
  instagram_url?: string | null;
  autor: string | null;
  publicada: boolean | null;
  es_portada: boolean | null;
  fecha_publicacion: string | null;
  created_at: string | null;
  vistas?: number | null;
};

export function igCode(url?: string | null) {
  if (!url) return '';
  const m = String(url).match(/instagram\.com\/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/i);
  return m ? m[1] : '';
}

export function igPermalink(url?: string | null) {
  if (!url) return '';
  const m = String(url).match(/instagram\.com\/(reel|p|tv)\/([A-Za-z0-9_-]+)/i);
  if (!m) return '';
  return `https://www.instagram.com/${m[1].toLowerCase()}/${m[2]}/`;
}

export function esImagenReal(url?: string | null) {
  if (!url) return false;
  return !/instagram\.com/i.test(url);
}

export function fechaEs(iso?: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export const CATS = [
  'Control Político',
  'Política Local',
  'Alcaldía',
  'Seguridad',
  'Comunidad',
  'Opinión',
];
