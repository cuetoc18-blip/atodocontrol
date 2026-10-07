import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import crypto from 'crypto';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';

const PORT = process.env.PORT || 8787;
const ORIGIN = process.env.APP_ORIGIN || 'https://atodocontrol.co';
const SECRET = process.env.SESSION_SECRET || 'cambia-esto';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

function firmar(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}
function leerCookie(token) {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const ok = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  if (ok !== sig) return null;
  const data = JSON.parse(Buffer.from(body, 'base64url').toString());
  if (data.exp < Date.now()) return null;
  return data;
}
function exigirSesion(req, res, next) {
  const sesion = leerCookie(req.cookies.vb_session);
  if (!sesion) return res.status(401).json({ error: 'No autorizado' });
  req.sesion = sesion;
  next();
}

app.post('/api/auth', async (req, res) => {
  const { email, password } = req.body || {};
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return res.status(401).json({ error: 'Correo o clave incorrectos' });
  const token = firmar({ uid: data.user.id, email: data.user.email, exp: Date.now() + 1000 * 60 * 60 * 12 });
  res.cookie('vb_session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 1000 * 60 * 60 * 12
  });
  res.json({ ok: true, email: data.user.email });
});

app.post('/api/logout', (_req, res) => {
  res.clearCookie('vb_session');
  res.json({ ok: true });
});

app.get('/api/noticias', async (req, res) => {
  let q = supabase.from('noticias').select('id,titulo,resumen,categoria,imagen_url,instagram_url,publicada,es_portada,fecha_publicacion,created_at').eq('publicada', true).order('fecha_publicacion', { ascending: false }).limit(16);
  if (req.query.cat) q = q.eq('categoria', req.query.cat);
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.get('/api/noticias/:id', async (req, res) => {
  const { data, error } = await supabase.from('noticias').select('*').eq('id', req.params.id).eq('publicada', true).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'No existe' });
  res.json(data);
});

app.get('/api/admin/noticias', exigirSesion, async (_req, res) => {
  const { data, error } = await supabase.from('noticias').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/noticias', exigirSesion, async (req, res) => {
  const { data, error } = await supabase.from('noticias').insert([req.body]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.put('/api/noticias/:id', exigirSesion, async (req, res) => {
  const { data, error } = await supabase.from('noticias').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/api/noticias/:id', exigirSesion, async (req, res) => {
  const { error } = await supabase.from('noticias').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

app.post('/api/vistas', async (req, res) => {
  const { nid } = req.body || {};
  if (!nid) return res.status(400).json({ error: 'falta id' });
  const { error } = await supabase.rpc('increment_vistas', { nid });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

app.post('/api/upload', exigirSesion, upload.single('archivo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'falta archivo' });
  const ext = (req.file.originalname.split('.').pop() || 'jpg').toLowerCase();
  const path = `articulos/${Date.now()}-${crypto.randomBytes(3).toString('hex')}.${ext}`;
  const { error } = await supabase.storage.from('noticias-imagenes').upload(path, req.file.buffer, {
    contentType: req.file.mimetype,
    upsert: false
  });
  if (error) return res.status(500).json({ error: error.message });
  const { data } = supabase.storage.from('noticias-imagenes').getPublicUrl(path);
  res.json({ url: data.publicUrl });
});

app.listen(PORT, () => console.log('Servidor integrado en ' + PORT));
